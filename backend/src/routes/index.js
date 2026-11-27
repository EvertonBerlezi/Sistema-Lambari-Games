const { Router } = require("express");
const authRoutes = require("./authRoutes");
const s = require("../services/authService");
const { Erro } = require("../services/catalogoService");
const router = Router();
router.get("/saude", async (req, res) => {
  await s.db.sequelize.authenticate();
  res.json({ status: "ok", banco: "PostgreSQL" });
});
router.use(authRoutes);
const id = (req) => {
  const valor = Number(req.params.id);
  if (!Number.isSafeInteger(valor) || valor < 1) throw new Erro("ID inválido.");
  return valor;
};
const autenticar = async (req, res, next) => {
  const cabecalho = req.get("Authorization") || "";
  if (!cabecalho.startsWith("Bearer "))
    throw new Erro("Informe o token Bearer.", 401);
  req.token = cabecalho.slice(7);
  req.usuario = await s.autenticarToken(req.token);
  next();
};
router.get("/jogos", async (req, res) => {
  const f = { ...req.query };
  for (const chave of ["plataforma_id", "genero_id", "distribuidora_id"])
    if (f[chave] !== undefined)
      f[chave] = String(f[chave]).includes(",")
        ? String(f[chave]).split(",").map(Number)
        : Number(f[chave]);
  for (const chave of ["disponivel", "promocao"]) {
    if (f[chave] !== undefined && !["true", "false"].includes(f[chave]))
      throw new Erro(`${chave}: use true ou false.`);
    f[chave] = f[chave] === "true";
  }
  res.json(await s.catalogo(f));
});
router.get("/jogos/:id", async (req, res) =>
  res.json(await s.detalhe(id(req))),
);
for (const tipo of [
  "plataformas",
  "generos",
  "distribuidoras",
  "criticos",
  "estoque",
  "avaliacoes",
])
  router.get("/" + tipo, async (req, res) => res.json(await s.listar(tipo)));
router.post("/logout", autenticar, async (req, res) => {
  await s.logout(req.token);
  res.sendStatus(204);
});
router.get("/conta", autenticar, async (req, res) =>
  res.json(await s.usuario(req.usuario.id)),
);
router.patch("/conta", autenticar, async (req, res) =>
  res.json(await s.atualizarConta(req.usuario.id, req.body)),
);
router.delete("/conta", autenticar, async (req, res) => {
  await s.excluirUsuario(req.usuario.id, req.usuario.id);
  res.sendStatus(204);
});
router.get("/desejos", autenticar, async (req, res) =>
  res.json(await s.desejos(req.usuario.id)),
);
router.post("/desejos", autenticar, async (req, res) =>
  res.status(201).json(await s.salvarDesejo(req.usuario.id, req.body)),
);
router.patch("/desejos/:id", autenticar, async (req, res) =>
  res.json(await s.salvarDesejo(req.usuario.id, req.body, id(req))),
);
router.delete("/desejos/:id", autenticar, async (req, res) => {
  await s.excluirDesejo(req.usuario.id, id(req));
  res.sendStatus(204);
});
router.use("/admin", autenticar, async (req, res, next) => {
  await s.exigir(req.usuario.id, true);
  next();
});
router.get("/admin/usuarios", async (req, res) =>
  res.json(await s.listarUsuarios(req.usuario.id)),
);
router.post("/admin/usuarios", async (req, res) =>
  res.status(201).json(await s.cadastrar(req.body, req.usuario.id)),
);
router.patch("/admin/usuarios/:id", async (req, res) =>
  res.json(await s.atualizarUsuario(req.usuario.id, id(req), req.body)),
);
router.delete("/admin/usuarios/:id", async (req, res) => {
  await s.excluirUsuario(req.usuario.id, id(req));
  res.sendStatus(204);
});
for (const tipo of [
  "plataformas",
  "generos",
  "distribuidoras",
  "criticos",
  "jogos",
  "estoque",
  "avaliacoes",
]) {
  router.get("/admin/" + tipo, async (req, res) =>
    res.json(await s.listar(tipo)),
  );
  router.post("/admin/" + tipo, async (req, res) =>
    res.status(201).json(await s.salvar(req.usuario.id, tipo, req.body)),
  );
  router.patch("/admin/" + tipo + "/:id", async (req, res) =>
    res.json(await s.salvar(req.usuario.id, tipo, req.body, id(req))),
  );
  router.delete("/admin/" + tipo + "/:id", async (req, res) => {
    await s.excluir(req.usuario.id, tipo, id(req));
    res.sendStatus(204);
  });
}
module.exports = router;
