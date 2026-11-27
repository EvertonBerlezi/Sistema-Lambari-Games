class Erro extends Error {
  constructor(m, status = 400) {
    super(m);
    this.status = status;
  }
}
const texto = (v, c, max = 255) => {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max)
    throw new Erro(`${c}: informe de 1 a ${max} caracteres.`);
  return v.trim();
};
const inteiro = (v, c, min = 1) => {
  if (!Number.isSafeInteger(v) || v < min || v > 2147483647)
    throw new Erro(`${c}: informe um inteiro entre ${min} e 2147483647.`);
  return v;
};
const validarUrl = (v) => {
  const s = texto(v, "URL", 2000);
  try {
    if (!["http:", "https:"].includes(new URL(s).protocol)) throw Error();
  } catch {
    throw new Erro("Informe uma URL http ou https válida.");
  }
  return s;
};
const email = (v) => {
  const s = texto(v, "Email").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw new Erro("Email inválido.");
  return s;
};
const plain = (r) => (r?.get ? r.get({ plain: true }) : r);
const ocultar = (r) => {
  if (!r) return null;
  const { senha, ...u } = plain(r);
  return u;
};

module.exports = { Erro, texto, inteiro, validarUrl, email, plain, ocultar };
