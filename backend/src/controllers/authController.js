const authService = require("../services/authService");

function login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            autenticado: false,
            mensagem: "Informe email e senha"
        });
    }

    const ok = authService.autenticar(email, senha);

    if (ok) {
        return res.status(200).json({
            autenticado: true,
            token: "token-fake-123"
        });
    }

    return res.status(401).json({
        autenticado: false,
        mensagem: "Email ou senha inválidos"
    });
}

module.exports = { login };