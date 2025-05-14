from flask import Blueprint, request, jsonify
from flask_login import current_user, login_required
from models import User, db

user_bp = Blueprint("users", __name__)


@user_bp.route("/", methods=["GET"])
@login_required
def get_users():
    # Somente admin pode listar usuários
    if current_user.role != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403

    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@user_bp.route("/<int:id>", methods=["GET"])
@login_required
def get_user(id):
    # Somente admin ou o próprio usuário pode ver detalhes
    if current_user.role != "admin" and current_user.id != id:
        return jsonify({"error": "Acesso não autorizado"}), 403

    user = User.query.get_or_404(id)
    return jsonify(user.to_dict()), 200


@user_bp.route("/<int:id>", methods=["PUT"])
@login_required
def update_user(id):
    # Somente admin pode atualizar usuários
    if current_user.role != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403

    user = User.query.get_or_404(id)
    data = request.get_json()

    if "username" in data and data["username"] != user.username:
        if User.query.filter_by(username=data["username"]).first():
            return jsonify({"error": "Nome de usuário já existe"}), 400
        user.username = data["username"]

    if "role" in data and data["role"] in ["admin", "tecnico", "user"]:
        user.role = data["role"]

    if "password" in data and data["password"]:
        user.set_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict()), 200


@user_bp.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_user(id):
    # Somente admin pode excluir usuários
    if current_user.role != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403

    # Não permitir excluir o próprio usuário
    if current_user.id == id:
        return jsonify({"error": "Não é possível excluir seu próprio usuário"}), 400

    user = User.query.get_or_404(id)

    # Verificar se é o último admin
    if user.role == "admin" and User.query.filter_by(role="admin").count() <= 1:
        return jsonify({"error": "Não é possível excluir o último administrador"}), 400

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Usuário excluído com sucesso"}), 200
