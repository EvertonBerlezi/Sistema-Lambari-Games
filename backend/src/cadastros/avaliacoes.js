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
      critico_id: { type: D.INTEGER, allowNull: false },
      nota: { type: D.DOUBLE, allowNull: false },
      url: { type: D.TEXT, allowNull: false },
    };
  },
  async validar(d, servico) {
    if (
      typeof d.nota !== "number" ||
      !Number.isFinite(d.nota) ||
      d.nota < 0 ||
      d.nota > 100
    )
      throw new Erro("Nota deve estar entre 0 e 100.");
    const campos = {
      jogo_id: inteiro(d.jogo_id, "Jogo"),
      critico_id: inteiro(d.critico_id, "Fonte"),
      nota: d.nota,
      url: validarUrl(d.url),
    };
    await servico.existe("jogos", campos.jogo_id);
    await servico.existe("criticos", campos.critico_id);
    return campos;
  },
};
