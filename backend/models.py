from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(
        db.String(20), nullable=False, default="user"
    )  # admin, tecnico, user
    problems = db.relationship("Problem", backref="author", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "username": self.username, "role": self.role}


class Problem(db.Model):
    __tablename__ = "problems"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    tags = db.Column(db.String(200), nullable=False)  # Tags separadas por vírgula
    files_json = db.Column(
        db.Text, default="[]"
    )  # Lista de caminhos de arquivos em JSON
    youtubeLink = db.Column(db.String(255), nullable=True)  # URL do vídeo do YouTube
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @property
    def files(self):
        try:
            return json.loads(self.files_json)
        except:
            return []

    @files.setter
    def files(self, value):
        self.files_json = json.dumps(value)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "tags": self.tags.split(","),
            "files": self.files,
            "youtubeLink": self.youtubeLink,
            "author": self.author.username,
            "author_id": self.author_id,
            "created_at": self.created_at.isoformat(),
        }
