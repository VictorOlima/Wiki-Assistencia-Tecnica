from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, current_user, login_required
from models import User, db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"error": "Usuário e senha são obrigatórios"}), 400

    user = User.query.filter_by(username=data["username"]).first()

    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Usuário ou senha inválidos"}), 401

    login_user(user, remember=True)
    session.permanent = True

    return jsonify(user.to_dict()), 200


@auth_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout realizado com sucesso"}), 200


@auth_bp.route("/me", methods=["GET"])
def me():
    if current_user.is_authenticated:
        return jsonify(current_user.to_dict()), 200
    else:
        return jsonify({"error": "Não autenticado"}), 401


@auth_bp.route("/register", methods=["POST"])
@login_required
def register():
    # Somente administradores podem registrar novos usuários
    if current_user.role != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403

    data = request.get_json()

    if (
        not data
        or not data.get("username")
        or not data.get("password")
        or not data.get("role")
    ):
        return jsonify({"error": "Todos os campos são obrigatórios"}), 400

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Nome de usuário já existe"}), 400

    if data["role"] not in ["admin", "tecnico", "user"]:
        return jsonify({"error": "Papel inválido"}), 400

    user = User(username=data["username"], role=data["role"])
    user.set_password(data["password"])

    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201
