const BASE = import.meta.env.VITE_API_URL || "/api";
export const session = {
  get: () => sessionStorage.getItem("lambari_token"),
  set: (t) =>
    t
      ? sessionStorage.setItem("lambari_token", t)
      : sessionStorage.removeItem("lambari_token"),
};
export async function api(path, { method = "GET", body, signal } = {}) {
  const token = session.get();
  let response;
  try {
    response = await fetch(BASE + path, {
      method,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw Error(
      "Não foi possível conectar ao servidor. Confira se a API está em execução.",
    );
  }
  if (response.status === 204) return null;
  const data = await response
    .json()
    .catch(() => ({ mensagem: "Resposta inesperada do servidor." }));
  if (!response.ok) {
    const e = Error(data.mensagem || "Não foi possível concluir a operação.");
    e.status = response.status;
    if (response.status === 401)
      window.dispatchEvent(new Event("lambari:expired"));
    throw e;
  }
  return data;
}
export const money = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    (v || 0) / 100,
  );
export function centavos(v) {
  if (v === "" || v == null) return null;
  const s = String(v).trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s))
    throw Error("Informe um valor com no máximo duas casas decimais.");
  const [a, b = ""] = s.split(".");
  return Number(a) * 100 + Number(b.padEnd(2, "0"));
}
