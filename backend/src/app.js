const express = require("express");
const cors = require("cors");
const { resolve } = require("node:path");
const { existsSync } = require("node:fs");
const { mensagemErro } = require("./services/catalogoService");
const app = express();
app.disable("x-powered-by");
app.use(
  cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }),
);
app.use(express.json({ limit: "64kb" }));
app.use((req, res, next) => {
  req.body ??= {};
  next();
});
app.use("/api", require("./routes"));
app.use("/api", (req, res) =>
  res.status(404).json({ mensagem: "Rota não encontrada." }),
);
const dist = resolve(__dirname, "../../frontend/dist");
if (existsSync(resolve(dist, "index.html"))) {
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) => res.sendFile(resolve(dist, "index.html")));
} else
  app.get("/", (req, res) =>
    res.json({
      mensagem:
        "API Lambari Games. Inicie o frontend na porta 5173 ou execute npm run build em frontend.",
    }),
  );
app.use((e, req, res, next) => {
  const status =
    e.status ||
    (e.name?.startsWith("Sequelize") && !e.name.includes("Connection")
      ? 400
      : 500);
  if (status === 500) console.error("Falha no servidor:", e.name);
  res
    .status(status)
    .json({
      mensagem:
        e.type === "entity.parse.failed" ? "JSON inválido." : mensagemErro(e),
    });
});
module.exports = app;
