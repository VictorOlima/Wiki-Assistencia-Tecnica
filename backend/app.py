from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import LoginManager
from config import Config
import os
import secrets
import string

# Desabilitar carregamento automático do .env
import sys

if "pytest" not in sys.modules:
    from dotenv import load_dotenv

    load_dotenv(override=True)

app = Flask(__name__)
app.config.from_object(Config)

# Configurar CORS corretamente para permitir cookies e requisições de arquivos
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=True,
    expose_headers=["Content-Disposition", "Content-Type", "Content-Length"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Content-Length",
        "X-Requested-With",
    ],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)

# Importar db de models e inicializar com app
from models import db, User, Problem

db.init_app(app)

# Configurar login manager
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Criar diretório para uploads
def create_upload_folder():
    os.makedirs(os.path.join(app.root_path, Config.UPLOAD_FOLDER), exist_ok=True)


# Verificar se sistema tem um admin
def verificar_admin():
    admin = User.query.filter_by(username="admin").first()
    return admin is not None


# Importar rotas depois de inicializar tudo
from routes.auth_routes import auth_bp
from routes.problem_routes import problem_bp
from routes.user_routes import user_bp

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(problem_bp, url_prefix="/api/problems")
app.register_blueprint(user_bp, url_prefix="/api/users")


@app.route("/api/health")
def health_check():
    return jsonify({"status": "healthy"})


@app.route("/api/setup", methods=["POST"])
def setup_admin():
    # Verificar se já existe um admin
    if verificar_admin():
        return jsonify({"error": "Já existe um administrador configurado."}), 400

    # Obter dados do formulário
    data = request.get_json()
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Nome de usuário e senha são obrigatórios"}), 400

    # Criar o admin inicial
    admin = User(username=data["username"], role="admin")
    admin.set_password(data["password"])
    db.session.add(admin)
    db.session.commit()

    return jsonify({"message": "Administrador configurado com sucesso"}), 201


if __name__ == "__main__":
    with app.app_context():
        # Criar diretório de uploads
        create_upload_folder()

        # Criar tabelas
        db.create_all()

        # Verificar se o sistema precisa de setup inicial
        if not verificar_admin():
            print("=" * 80)
            print("ATENÇÃO: Nenhum administrador configurado.")
            print("Por favor, acesse /api/setup para criar o administrador inicial.")
            print("=" * 80)

    # Desabilitar carregamento automático do .env
    app.run(debug=True, load_dotenv=False)
