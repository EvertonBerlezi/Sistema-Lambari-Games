const app = require("./app");
const s = require("./services/authService");
(async () => {
  await s.db.migrar();
  const port = Number(process.env.PORT || 3001),
    host = process.env.HOST || "127.0.0.1";
  const server = app.listen(port, host, () =>
    console.log(`Lambari Games: http://${host}:${port}`),
  );
  server.on("error", async (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? "Porta ocupada. Altere PORT no .env."
        : "Falha ao iniciar servidor.",
    );
    await s.db.close();
    process.exitCode = 1;
  });
  for (const sinal of ["SIGINT", "SIGTERM"])
    process.once(sinal, () =>
      server.close(async () => {
        await s.db.close();
        process.exit(0);
      }),
    );
})().catch((e) => {
  console.error(
    "Não foi possível conectar/migrar o PostgreSQL. Confira backend/.env.",
    e.message,
  );
  process.exitCode = 1;
});
