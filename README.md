# Lambari Games

Projeto com frontend em React/Vite e backend em Node.js/Express.

## Requisitos

- Node.js e npm instalados.

## Como rodar

Abra um terminal na pasta do projeto e instale as dependências de cada parte:

```bash
cd backend
npm install
```

Em outro terminal, instale as dependências do frontend:

```bash
cd frontend
npm install
```

### Iniciar o backend

No terminal do backend:

```bash
npm run dev
```

O servidor inicia em `http://localhost:3000`.

### Iniciar o frontend

No terminal do frontend:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local do frontend (normalmente `http://localhost:5173`). Abra esse endereço no navegador.

## Login de demonstração

- **Email:** `admin@teste.com`
- **Senha:** `123456`

O login atual do frontend valida essas credenciais localmente. O backend também possui a rota `POST /login`, mas ainda não está integrado ao formulário do frontend. O usuário é fixo e não há banco de dados; o token retornado pelo backend é apenas fictício.

## Scripts disponíveis

### Frontend (`frontend/`)

- `npm run dev`: inicia o servidor de desenvolvimento.
- `npm run build`: gera a versão de produção em `frontend/dist`.
- `npm run preview`: serve localmente a versão gerada.
- `npm run lint`: executa o ESLint.

### Backend (`backend/`)

- `npm run dev`: inicia o servidor com reinicialização automática via Nodemon.

O backend usa a variável `PORT` se definida; caso contrário, usa a porta `3000`.
