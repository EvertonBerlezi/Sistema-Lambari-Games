const s = require("../services/authService");
async function login(req, res) {
  res.json(await s.login(req.body.email, req.body.senha));
}
async function cadastro(req, res) {
  res.status(201).json(await s.cadastrar({ ...req.body, perfil: "cliente" }));
}
module.exports = { login, cadastro };
