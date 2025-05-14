# Wiki de Problemas Técnicos para Assistência Eletrônica

Um sistema web completo para gerenciamento de problemas técnicos com upload de arquivos, categorização e etiquetagem.

## Recursos

- Interface responsiva com React e Bootstrap
- Sistema de autenticação com 3 níveis de usuário
- Upload e visualização de imagens e PDFs
- Filtros por categoria e tags
- API RESTful com Flask

## Requisitos

- Python 3.8+
- Node.js 14+
- npm ou yarn

## Estrutura do Projeto

- `/backend` - API Flask
- `/frontend` - Aplicação React

## Instalação e Execução

### Backend (Flask)

1. Navegue até a pasta do backend:

```
cd backend
```

2. Crie um ambiente virtual Python:

```
python -m venv venv
```

3. Ative o ambiente virtual:

- Windows:

```
venv\Scripts\activate
```

- Linux/Mac:

```
source venv/bin/activate
```

4. Instale as dependências:

```
pip install -r ../requirements.txt
```

5. Inicialize o banco de dados:

```
python init_db.py --criar-usuarios
```

Ou, para inicializar apenas as tabelas sem usuários:

```
python init_db.py
```

6. Execute o servidor:

```
python app.py
```

O servidor estará rodando em `http://localhost:5000`.

### Frontend (React)

1. Em outro terminal, navegue até a pasta do frontend:

```
cd frontend
```

2. Instale as dependências:

```
npm install
```

ou

```
yarn install
```

3. Execute a aplicação:

```
npm start
```

ou

```
yarn start
```

A aplicação estará disponível em `http://localhost:3000`.

## Enviando o Projeto Sem Node.js

Para reduzir o tamanho do projeto ao compartilhá-lo:

1. Exclua a pasta `frontend/node_modules` antes de comprimir/enviar
2. O arquivo `.gitignore` já está configurado para ignorar essa pasta se estiver usando Git
3. Após receber o projeto, basta seguir as instruções de instalação acima, executando `npm install` na pasta do frontend

## Configuração Inicial

Ao acessar o sistema pela primeira vez, caso não existam usuários, você será solicitado a criar um usuário administrador pela interface de login.

Alternativamente, você pode criar os usuários iniciais usando o comando interativo:

```
python init_db.py --criar-usuarios
```

## Níveis de Acesso

- **Administrador**: Acesso total. Pode criar, editar e excluir qualquer problema, além de gerenciar usuários.
- **Técnico**: Pode criar e editar seus próprios problemas.
- **Usuário comum**: Apenas visualiza problemas.

## Funcionalidades

- Login/Logout
- Listar problemas
- Filtrar por categoria
- Filtrar por tag
- Visualizar detalhes de um problema com arquivos anexados
- Criar novo problema (admin e técnico)
- Editar problema (admin e autor)
- Excluir problema (admin)
- Gerenciar usuários (admin)
