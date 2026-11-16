const { Sequelize } = require("sequelize");
const { AsyncLocalStorage } = require("node:async_hooks");
const { readFileSync, readdirSync } = require("node:fs");
const { resolve } = require("node:path");
require("dotenv").config({
  path: resolve(__dirname, "../../.env"),
  quiet: true,
});
function abrirBanco(url = process.env.DATABASE_URL) {
  const options = {
    dialect: "postgres",
    logging: false,
    pool: { max: 8, min: 0, idle: 10000 },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  };
  if (process.env.DB_SSL === "true")
    options.dialectOptions = {
      ssl: { require: true, rejectUnauthorized: true },
    };
  const sequelize = url
    ? new Sequelize(url, options)
    : new Sequelize(
        process.env.DB_NAME || "lambari_games",
        process.env.DB_USER || "postgres",
        process.env.DB_PASSWORD || "",
        {
          ...options,
          host: process.env.DB_HOST || "127.0.0.1",
          port: Number(process.env.DB_PORT || 5432),
        },
      );
  const contexto = new AsyncLocalStorage();
  const db = {
    sequelize,
    contexto,
    options() {
      return { transaction: contexto.getStore() };
    },
    async transacao(fn) {
      if (contexto.getStore()) return fn();
      return sequelize.transaction((t) => contexto.run(t, fn));
    },
    async close() {
      await sequelize.close();
    },
  };
  db.models = require("../models")(sequelize);
  db.migrar = async () => {
    await sequelize.authenticate();
    await db.transacao(async () => {
      const transaction = contexto.getStore();
      await sequelize.query("SELECT pg_advisory_xact_lock(88216001)", {
        transaction,
      });
      await sequelize.query(
        "CREATE TABLE IF NOT EXISTS schema_migrations (nome TEXT PRIMARY KEY, executada_em TIMESTAMPTZ NOT NULL DEFAULT NOW())",
        { transaction },
      );
      const [rows] = await sequelize.query(
        "SELECT nome FROM schema_migrations",
        { transaction },
      );
      for (const nome of readdirSync(resolve(__dirname, "../../migrations"))
        .filter((n) => n.endsWith(".sql"))
        .sort()) {
        if (rows.some((r) => r.nome === nome)) continue;
        await sequelize.query(
          readFileSync(resolve(__dirname, "../../migrations", nome), "utf8"),
          { transaction },
        );
        await sequelize.query(
          "INSERT INTO schema_migrations(nome) VALUES(:nome)",
          { replacements: { nome }, transaction },
        );
      }
    });
  };
  return db;
}
module.exports = { abrirBanco };
