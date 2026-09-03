// Sem banco por enquanto: um único usuário fixo em memória

const USUARIO_FIXO = {
    email: "admin@teste.com",
    senha: "123456",
};

function autenticar(email, senha) {
    return email === USUARIO_FIXO.email && senha === USUARIO_FIXO.senha;
}

module.exports = { autenticar };