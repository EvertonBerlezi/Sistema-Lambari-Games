const { DataTypes: D } = require("sequelize");
module.exports = (sequelize) => {
  const id = { type: D.INTEGER, autoIncrement: true, primaryKey: true };
  const ref = { type: D.INTEGER, allowNull: false };
  const models = {};
  const definir = (t, attrs) =>
    (models[t] = sequelize.define(
      t,
      Object.fromEntries(
        Object.entries({ id, ...attrs }).map(([key, value]) => [
          key,
          value && typeof value === "object" && "type" in value
            ? { ...value }
            : value,
        ]),
      ),
      { tableName: t },
    ));
  const cadastros = require("../cadastros");
  for (const [tabela, cadastro] of Object.entries(cadastros))
    definir(tabela, cadastro.campos(D));
  models.sessoes = sequelize.define(
    "sessoes",
    {
      token: { type: D.STRING(64), primaryKey: true },
      usuario_id: ref,
      expira: { type: D.BIGINT, allowNull: false },
    },
    { tableName: "sessoes" },
  );
  for (const [alias, t, key] of [
    ["plataforma", "plataformas", "plataforma_id"],
    ["genero", "generos", "genero_id"],
    ["distribuidora", "distribuidoras", "distribuidora_id"],
  ]) {
    models.jogos.belongsTo(models[t], { as: alias, foreignKey: key });
    models[t].hasMany(models.jogos, { as: "jogos", foreignKey: key });
  }
  models.jogos.hasOne(models.estoque, { as: "estoque", foreignKey: "jogo_id" });
  models.estoque.belongsTo(models.jogos, { as: "jogo", foreignKey: "jogo_id" });
  models.jogos.hasMany(models.avaliacoes, {
    as: "avaliacoes",
    foreignKey: "jogo_id",
  });
  models.avaliacoes.belongsTo(models.criticos, {
    as: "critico",
    foreignKey: "critico_id",
  });
  models.desejos.belongsTo(models.jogos, { as: "jogo", foreignKey: "jogo_id" });
  models.desejos.belongsTo(models.usuarios, {
    as: "usuario",
    foreignKey: "usuario_id",
  });
  models.sessoes.belongsTo(models.usuarios, {
    as: "usuario",
    foreignKey: "usuario_id",
  });
  return models;
};
