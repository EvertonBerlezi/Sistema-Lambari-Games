const {
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHash,
} = require("node:crypto");
const { Erro } = require("./validacao");
const hashToken = (t) => createHash("sha256").update(t).digest("hex");
function hashSenha(v) {
  if (typeof v !== "string" || v.length < 8 || v.length > 128)
    throw new Erro("A senha deve ter entre 8 e 128 caracteres.");
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(v, salt, 64).toString("hex");
}
function conferir(v, salvo) {
  if (typeof v !== "string" || v.length > 128) return false;
  const [salt, hash] = salvo.split(":");
  return timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(v, salt, 64));
}

module.exports = { hashToken, hashSenha, conferir };
