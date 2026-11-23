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
      titulo: { type: D.STRING(255), allowNull: false },
      descricao: { type: D.TEXT, defaultValue: "" },
      capa_url: D.TEXT,
      dados_demonstracao: {
        type: D.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      fonte_url: D.TEXT,
      fonte_consultada_em: D.DATEONLY,
      plataforma_id: { type: D.INTEGER, allowNull: false },
      genero_id: { type: D.INTEGER, allowNull: false },
      distribuidora_id: { type: D.INTEGER, allowNull: false },
      preco_centavos: { type: D.INTEGER, allowNull: false },
      promocao_centavos: D.INTEGER,
    };
  },
  async validar(d, servico) {
    const campos = {
      titulo: texto(d.titulo, "Título"),
      dados_demonstracao: d.dados_demonstracao ?? false,
      descricao: d.descricao == null ? "" : String(d.descricao).trim(),
      capa_url: d.capa_url
        ? typeof d.capa_url === "string" &&
          /^\/capas\/steam-\d+\.jpg$/.test(d.capa_url)
          ? d.capa_url
          : validarUrl(d.capa_url)
        : null,
      plataforma_id: inteiro(d.plataforma_id, "Plataforma"),
      genero_id: inteiro(d.genero_id, "Gênero"),
      distribuidora_id: inteiro(d.distribuidora_id, "Distribuidora"),
      preco_centavos: inteiro(d.preco_centavos, "Preço", 0),
      promocao_centavos:
        d.promocao_centavos == null
          ? null
          : inteiro(d.promocao_centavos, "Promoção", 0),
    };
    if (typeof campos.dados_demonstracao !== "boolean")
      throw new Erro("Indicador de demonstração inválido.");
    if (campos.descricao.length > 10000)
      throw new Erro("Descrição deve ter até 10000 caracteres.");
    if (
      campos.promocao_centavos !== null &&
      campos.promocao_centavos >= campos.preco_centavos
    )
      throw new Erro("A promoção deve ser menor que o preço normal.");
    for (const [tabela, campo] of [
      ["plataformas", "plataforma_id"],
      ["generos", "genero_id"],
      ["distribuidoras", "distribuidora_id"],
    ])
      await servico.existe(tabela, campos[campo]);
    return campos;
  },
};
