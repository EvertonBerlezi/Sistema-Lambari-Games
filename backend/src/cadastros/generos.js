const {
  Erro,
  texto,
  inteiro,
  validarUrl,
  email,
  plain,
  ocultar,
} = require("../services/validacao");
module.exports = {
  campos(D) {
    return { nome: { type: D.STRING(255), allowNull: false } };
  },
  async validar(d, servico) {
    return { nome: texto(d.nome, "Nome") };
  },
};
