// Centraliza tudo que muda entre dev e produção

const config = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",
};

module.exports = config;

// .env (na raiz do projeto, fora do git)
// PORT=3000