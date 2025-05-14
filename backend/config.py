import os
from datetime import timedelta


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "chave-secreta-padrao"
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL") or "sqlite:///wiki.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = "uploads"
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB máximo para uploads
    PERMANENT_SESSION_LIFETIME = timedelta(days=1)
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "pdf"}

    # Configurações para o Flask-Session e cookies
    SESSION_TYPE = "filesystem"
    SESSION_PERMANENT = True
    SESSION_COOKIE_SECURE = False  # Em produção, definir como True para usar HTTPS
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"  # Em produção, considere "Strict"

    # Para funcionar com CORS
    SESSION_COOKIE_DOMAIN = None  # Domínio dinâmico para desenvolvimento
