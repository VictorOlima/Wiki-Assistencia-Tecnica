from app import app, create_upload_folder
from models import db, User
import getpass
import argparse


# Função para inicializar o banco de dados
def init_db(criar_usuarios=False):
    with app.app_context():
        # Criar diretório para uploads
        create_upload_folder()

        # Criar tabelas
        db.create_all()

        # Verificar se já existe um usuário admin
        admin = User.query.filter_by(username="admin").first()

        # Se não existir admin e a flag criar_usuarios está ativa
        if not admin and criar_usuarios:
            print("Criando usuário administrador")
            admin_password = getpass.getpass("Digite a senha do administrador: ")

            admin = User(username="admin", role="admin")
            admin.set_password(admin_password)
            db.session.add(admin)

            criar_tecnico = input("Criar usuário técnico? (s/n): ").lower() == "s"
            if criar_tecnico:
                tecnico_password = getpass.getpass("Digite a senha do técnico: ")
                tecnico = User(username="tecnico", role="tecnico")
                tecnico.set_password(tecnico_password)
                db.session.add(tecnico)

            criar_usuario = input("Criar usuário comum? (s/n): ").lower() == "s"
            if criar_usuario:
                usuario_password = getpass.getpass("Digite a senha do usuário comum: ")
                usuario = User(username="usuario", role="user")
                usuario.set_password(usuario_password)
                db.session.add(usuario)

            db.session.commit()
            print("Banco de dados inicializado com sucesso.")
        elif not admin:
            print("Banco de dados inicializado sem usuários.")
            print("Use o endpoint /api/setup para criar o administrador.")
        else:
            print("Banco de dados já inicializado com usuários.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inicializar o banco de dados")
    parser.add_argument(
        "--criar-usuarios",
        action="store_true",
        help="Criar usuários iniciais de forma interativa",
    )
    args = parser.parse_args()

    init_db(criar_usuarios=args.criar_usuarios)
