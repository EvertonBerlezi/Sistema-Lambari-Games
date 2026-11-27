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
    return {
      jogo_id: { type: D.INTEGER, allowNull: false },
      quantidade: { type: D.INTEGER, allowNull: false },
    };
  },
  async validar(d, servico) {
    const campos = {
      jogo_id: inteiro(d.jogo_id, "Jogo"),
      quantidade: inteiro(d.quantidade, "Quantidade", 0),
    };
    await servico.existe("jogos", campos.jogo_id);
    return campos;
  },
};
