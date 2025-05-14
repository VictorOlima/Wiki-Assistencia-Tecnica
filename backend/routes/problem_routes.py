import os
from flask import (
    Blueprint,
    request,
    jsonify,
    current_app,
    send_from_directory,
    send_file,
)
from flask_login import current_user, login_required
from models import Problem, db
from werkzeug.utils import secure_filename
from datetime import datetime
import uuid

problem_bp = Blueprint("problems", __name__)


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in current_app.config["ALLOWED_EXTENSIONS"]
    )


def save_file(file):
    if file and allowed_file(file.filename):
        # Gerar nome único para o arquivo
        filename = secure_filename(file.filename)
        filename = f"{uuid.uuid4().hex}_{filename}"
        file_path = os.path.join(
            current_app.root_path, current_app.config["UPLOAD_FOLDER"], filename
        )
        file.save(file_path)
        return os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    return None


@problem_bp.route("/", methods=["GET"])
def get_problems():
    # Parâmetros de consulta opcionais para filtrar
    tag = request.args.get("tag")
    category = request.args.get("category")

    query = Problem.query

    if tag:
        query = query.filter(Problem.tags.like(f"%{tag}%"))

    if category:
        query = query.filter_by(category=category)

    problems = query.order_by(Problem.created_at.desc()).all()
    return jsonify([problem.to_dict() for problem in problems]), 200


@problem_bp.route("/<int:id>", methods=["GET"])
def get_problem(id):
    problem = Problem.query.get_or_404(id)
    return jsonify(problem.to_dict()), 200


@problem_bp.route("/", methods=["POST"])
@login_required
def create_problem():
    # Verificar se o usuário tem permissão (admin ou técnico)
    if current_user.role not in ["admin", "tecnico"]:
        return jsonify({"error": "Acesso não autorizado"}), 403

    # Processar dados do formulário
    title = request.form.get("title")
    description = request.form.get("description")
    category = request.form.get("category")
    tags = request.form.get("tags")
    youtubeLink = request.form.get("youtubeLink")

    if not title or not description or not category or not tags:
        return jsonify({"error": "Todos os campos são obrigatórios"}), 400

    # Criar novo problema
    problem = Problem(
        title=title,
        description=description,
        category=category,
        tags=tags,
        youtubeLink=youtubeLink,
        author_id=current_user.id,
    )

    # Processar arquivos
    files = []
    if "files" in request.files:
        file_list = request.files.getlist("files")
        for file in file_list:
            file_path = save_file(file)
            if file_path:
                files.append(file_path)

    problem.files = files

    db.session.add(problem)
    db.session.commit()

    return jsonify(problem.to_dict()), 201


@problem_bp.route("/<int:id>", methods=["PUT"])
@login_required
def update_problem(id):
    problem = Problem.query.get_or_404(id)

    # Verificar se o usuário tem permissão (admin ou autor do problema)
    if current_user.role != "admin" and problem.author_id != current_user.id:
        return jsonify({"error": "Acesso não autorizado"}), 403

    # Processar dados do formulário
    title = request.form.get("title")
    description = request.form.get("description")
    category = request.form.get("category")
    tags = request.form.get("tags")
    youtubeLink = request.form.get("youtubeLink")

    if title:
        problem.title = title
    if description:
        problem.description = description
    if category:
        problem.category = category
    if tags:
        problem.tags = tags
    if youtubeLink is not None:  # Permitir remover o link definindo como string vazia
        problem.youtubeLink = youtubeLink

    # Inicializar lista de arquivos final
    current_files = []

    # 1. Primeiramente, processar os arquivos existentes
    if "existing_files" in request.form:
        try:
            # Carregar a lista de arquivos existentes do formulário
            json_data = request.form.get("existing_files")
            current_app.logger.info(f"JSON recebido: {json_data}")

            if json_data and json_data.strip():
                import json

                existing_files = json.loads(json_data)

                # Verificar quais arquivos foram removidos
                original_files = problem.files
                files_to_remove = [f for f in original_files if f not in existing_files]

                for file_path in files_to_remove:
                    try:
                        full_path = os.path.join(current_app.root_path, file_path)
                        if os.path.exists(full_path):
                            os.remove(full_path)
                            current_app.logger.info(f"Arquivo removido: {file_path}")
                    except Exception as e:
                        current_app.logger.error(f"Erro ao excluir arquivo: {e}")

                # Adicionar arquivos mantidos à lista final
                current_files.extend(existing_files)
        except Exception as e:
            current_app.logger.error(f"Erro ao processar arquivos existentes: {e}")
            return (
                jsonify({"error": f"Erro ao processar arquivos existentes: {str(e)}"}),
                400,
            )
    else:
        # Se não há informações sobre arquivos existentes, manter todos os arquivos atuais
        current_files = problem.files

    # 2. Processar novos arquivos
    if "files" in request.files:
        file_list = request.files.getlist("files")
        current_app.logger.info(f"Novos arquivos recebidos: {len(file_list)}")

        # Processar apenas arquivos válidos
        for file in file_list:
            if file and file.filename and file.filename.strip():
                current_app.logger.info(f"Processando: {file.filename}")
                file_path = save_file(file)
                if file_path:
                    current_app.logger.info(f"Salvo em: {file_path}")
                    current_files.append(file_path)

    # 3. Atualizar a lista de arquivos do problema
    current_app.logger.info(f"Lista final de arquivos: {current_files}")
    problem.files = current_files

    # 4. Salvar as alterações
    try:
        db.session.commit()
        return jsonify(problem.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Erro ao salvar problema: {e}")
        return jsonify({"error": f"Erro ao salvar problema: {str(e)}"}), 500


@problem_bp.route("/<int:id>", methods=["DELETE"])
@login_required
def delete_problem(id):
    # Somente admin pode excluir problemas
    if current_user.role != "admin":
        return jsonify({"error": "Acesso não autorizado"}), 403

    problem = Problem.query.get_or_404(id)

    # Excluir arquivos associados
    for file_path in problem.files:
        try:
            full_path = os.path.join(current_app.root_path, file_path)
            if os.path.exists(full_path):
                os.remove(full_path)
        except:
            pass

    db.session.delete(problem)
    db.session.commit()

    return jsonify({"message": "Problema excluído com sucesso"}), 200


@problem_bp.route("/categories", methods=["GET"])
def get_categories():
    categories = db.session.query(Problem.category.distinct()).all()
    return jsonify([category[0] for category in categories]), 200


@problem_bp.route("/tags", methods=["GET"])
def get_tags():
    problems = Problem.query.all()
    all_tags = set()

    for problem in problems:
        tags = problem.tags.split(",")
        for tag in tags:
            tag = tag.strip()
            if tag:
                all_tags.add(tag)

    return jsonify(list(all_tags)), 200


# Rota para servir arquivos diretamente com opção de visualização inline
@problem_bp.route("/files/<path:filename>", methods=["GET"])
def serve_file(filename):
    # Verificar se é um pedido de download
    force_download = request.args.get("download", "false").lower() == "true"

    # Preparar o caminho do arquivo
    if filename.startswith("uploads/"):
        filename = filename[8:]  # Remove 'uploads/'

    # Caminho completo para o arquivo
    file_path = os.path.join(current_app.root_path, "uploads", filename)

    # Verificar se o arquivo existe
    if not os.path.exists(file_path):
        return jsonify({"error": "Arquivo não encontrado"}), 404

    # Extrair o nome original do arquivo (remover UUID)
    original_filename = (
        "_".join(filename.split("_")[1:]) if "_" in filename else filename
    )

    # Obter o tipo de arquivo da extensão
    file_ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""

    # Configurar o tipo MIME para alguns tipos comuns
    mime_types = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
    }

    mime_type = mime_types.get(file_ext, "application/octet-stream")

    # Verificar se é imagem ou PDF para abrir inline (se não for forçado download)
    inline_exts = ["jpg", "jpeg", "png", "gif", "pdf"]
    as_attachment = force_download or file_ext not in inline_exts

    # Usar send_file que é mais confiável para diversos tipos de arquivo
    return send_file(
        file_path,
        mimetype=mime_type,
        as_attachment=as_attachment,
        download_name=original_filename,
        conditional=True,
    )
