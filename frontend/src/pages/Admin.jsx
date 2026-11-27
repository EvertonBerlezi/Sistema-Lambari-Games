import { useEffect, useState, useCallback, useMemo } from "react";
import { NavLink, useParams, Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api, money, centavos } from "../lib/api";
import {
  PageHeading,
  Icon,
  Modal,
  ErrorBox,
  Empty,
  Loading,
} from "../components/UI";
import { kinds, fields } from "../features/cadastros";
export default function Admin() {
  const { tipo = "jogos" } = useParams(),
    { refs, refreshRefs, notify } = useApp();
  const [rows, setRows] = useState([]),
    [games, setGames] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState("");
  const valid = Object.hasOwn(kinds, tipo);
  const load = useCallback(async () => {
    if (!Object.hasOwn(kinds, tipo)) return;
    setLoading(true);
    setError("");
    try {
      const [r, g] = await Promise.all([api("/admin/" + tipo), api("/jogos")]);
      setRows(r);
      setGames(g);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tipo]);
  useEffect(() => {
    setSearch("");
    setEditing(null);
    setDeleting(null);
    load();
  }, [load]);
  const closeEdit = useCallback(() => {
    if (!busy) {
      setEditing(null);
      setFormError("");
    }
  }, [busy]);
  const closeDelete = useCallback(() => {
    if (!busy) {
      setDeleting(null);
      setFormError("");
    }
  }, [busy]);
  const options = {
    ...refs,
    jogos: games,
    perfil: [
      { id: "cliente", nome: "Cliente" },
      { id: "admin", nome: "Administrador" },
    ],
  };
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        JSON.stringify(r)
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
      ),
    [rows, search],
  );
  const activeFields = (fields[tipo] || []).filter(
    ([k]) => !(k === "senha" && editing?.id),
  );
  const missing = activeFields.filter(
    ([, , t]) => options[t] && t !== "perfil" && !options[t].length,
  );
  function labelRef(t, id) {
    const r = (options[t] || []).find((x) => x.id === id);
    return r ? (r.titulo ? `${r.titulo} · ${r.plataforma}` : r.nome) : "#" + id;
  }
  function summary(row) {
    if (tipo === "jogos")
      return [
        row.titulo,
        labelRef("plataformas", row.plataforma_id),
        money(row.promocao_centavos ?? row.preco_centavos),
      ];
    if (tipo === "estoque")
      return [labelRef("jogos", row.jogo_id), row.quantidade + " unidade(s)"];
    if (tipo === "avaliacoes")
      return [
        labelRef("jogos", row.jogo_id),
        labelRef("criticos", row.critico_id),
        row.nota + "/100",
      ];
    if (tipo === "usuarios")
      return [
        row.nome,
        row.email,
        row.perfil === "admin" ? "Administrador" : "Cliente",
      ];
    if (tipo === "criticos") return [row.nome, row.site];
    return [row.nome];
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const data = new FormData(e.currentTarget),
        body = {};
      for (const [k, , t] of activeFields) {
        const v = data.get(k);
        body[k] =
          t === "checkbox"
            ? v === "on"
            : t === "money"
              ? centavos(v)
              : ["number", "integer"].includes(t) ||
                  [
                    "plataforma_id",
                    "genero_id",
                    "distribuidora_id",
                    "critico_id",
                    "jogo_id",
                  ].includes(k)
                ? Number(v)
                : v;
      }
      await api("/admin/" + tipo + (editing.id ? "/" + editing.id : ""), {
        method: editing.id ? "PATCH" : "POST",
        body,
      });
      setEditing(null);
      notify("Registro salvo.");
      await Promise.all([load(), refreshRefs()]);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setFormError("");
    try {
      await api("/admin/" + tipo + "/" + deleting.id, { method: "DELETE" });
      setDeleting(null);
      notify("Registro excluído.");
      await Promise.all([load(), refreshRefs()]);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="eyebrow">PAINEL DA LOJA</span>
        <h2>Administração</h2>
        <nav aria-label="Cadastros administrativos">
          {Object.entries(kinds).map(([key, label]) => (
            <NavLink to={"/admin/" + key} key={key}>
              <Icon
                name={
                  key === "jogos"
                    ? "game"
                    : key === "estoque"
                      ? "box"
                      : key === "usuarios"
                        ? "user"
                        : "grid"
                }
                size={18}
              />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="sidebar-settings" to="/">
          ← Voltar ao catálogo
        </Link>
      </aside>
      <section className="admin-main">
        {!valid ? (
          <Empty
            title="Cadastro não encontrado"
            text="Escolha um cadastro no menu lateral."
          />
        ) : (
          <>
            <PageHeading
              eyebrow="GERENCIAMENTO"
              title={kinds[tipo]}
              text={
                tipo === "jogos"
                  ? "Organize os jogos que fazem parte do seu catálogo."
                  : tipo === "estoque"
                    ? "Atualize o saldo disponível de cada edição."
                    : "Crie e mantenha os registros da sua loja."
              }
            >
              <button
                className="button"
                onClick={() => {
                  setFormError("");
                  setEditing({});
                }}
              >
                <Icon name="plus" />
                Novo registro
              </button>
            </PageHeading>
            <div className="admin-tools">
              <label className="search-input">
                <Icon name="search" />
                <input
                  placeholder="Buscar nesta lista…"
                  aria-label="Buscar registros"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
              <span className="muted">{filtered.length} registro(s)</span>
            </div>
            <ErrorBox message={error} onRetry={load} />
            {loading ? (
              <Loading />
            ) : (
              !error &&
              (filtered.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>
                          {tipo === "estoque" || tipo === "avaliacoes"
                            ? "Jogo"
                            : tipo === "jogos"
                              ? "Título"
                              : "Nome"}
                        </th>
                        {[
                          "jogos",
                          "estoque",
                          "avaliacoes",
                          "usuarios",
                          "criticos",
                        ].includes(tipo) && (
                          <th>
                            {tipo === "jogos"
                              ? "Plataforma"
                              : tipo === "estoque"
                                ? "Quantidade"
                                : tipo === "avaliacoes"
                                  ? "Fonte"
                                  : tipo === "usuarios"
                                    ? "Email"
                                    : "Site"}
                          </th>
                        )}
                        {["jogos", "avaliacoes", "usuarios"].includes(tipo) && (
                          <th>
                            {tipo === "jogos"
                              ? "Preço atual"
                              : tipo === "avaliacoes"
                                ? "Nota"
                                : "Perfil"}
                          </th>
                        )}
                        <th className="actions-heading">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          <td className="id-cell">#{r.id}</td>
                          {summary(r).map((v, i) => (
                            <td
                              key={i}
                              className={i === 0 ? "primary-cell" : ""}
                            >
                              {v}
                            </td>
                          ))}
                          <td>
                            <div className="row-actions">
                              <button
                                className="icon-button"
                                aria-label={"Editar registro " + r.id}
                                onClick={() => {
                                  setFormError("");
                                  setEditing(r);
                                }}
                              >
                                <Icon name="edit" size={18} />
                              </button>
                              <button
                                className="icon-button danger"
                                aria-label={"Excluir registro " + r.id}
                                onClick={() => {
                                  setFormError("");
                                  setDeleting(r);
                                }}
                              >
                                <Icon name="trash" size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title={
                    search ? "Nenhum resultado" : "Vamos começar este cadastro?"
                  }
                  text={
                    search
                      ? "Tente buscar por outro termo."
                      : "Os registros adicionados aparecerão nesta lista."
                  }
                >
                  <button className="button" onClick={() => setEditing({})}>
                    <Icon name="plus" />
                    Criar primeiro registro
                  </button>
                </Empty>
              ))
            )}
            {tipo === "avaliacoes" && (
              <p className="footnote">
                Informe a fonte original e use notas de 0 a 100. Uma nota 9/10
                corresponde a 90/100.
              </p>
            )}
            {tipo === "estoque" && (
              <p className="footnote">
                Informe o saldo final. Para alterar o estoque de um jogo
                existente, edite o registro.
              </p>
            )}
          </>
        )}
        {editing && (
          <Modal
            title={(editing.id ? "Editar" : "Novo") + " · " + kinds[tipo]}
            onClose={closeEdit}
          >
            <ErrorBox message={formError} />
            {missing.length > 0 && (
              <div className="error-box">
                Antes de continuar, cadastre:{" "}
                {missing.map(([, label]) => label).join(", ")}. Feche esta
                janela e use o menu lateral.
              </div>
            )}
            <form onSubmit={save}>
              <div className="form-grid">
                {activeFields.map(([key, label, t, optional]) => {
                  let value = editing[key] ?? "";
                  if (t === "money" && value !== "")
                    value = (value / 100).toFixed(2);
                  if (key === "perfil" && !value) value = "cliente";
                  return (
                    <label
                      className={
                        t === "textarea"
                          ? "span-2"
                          : t === "checkbox"
                            ? "checkbox span-2"
                            : ""
                      }
                      key={key}
                    >
                      {label}
                      {optional && <small className="optional">opcional</small>}
                      {t === "checkbox" ? (
                        <input
                          name={key}
                          type="checkbox"
                          defaultChecked={!!editing[key]}
                        />
                      ) : options[t] ? (
                        <select
                          name={key}
                          defaultValue={value}
                          required={!optional}
                        >
                          <option value="" disabled>
                            Selecione…
                          </option>
                          {options[t].map((r) => (
                            <option key={r.id} value={r.id}>
                              {t === "jogos"
                                ? `${r.titulo} · ${r.plataforma}`
                                : r.nome}
                            </option>
                          ))}
                        </select>
                      ) : t === "textarea" ? (
                        <textarea
                          name={key}
                          rows={3}
                          defaultValue={value}
                          maxLength={10000}
                        />
                      ) : (
                        <input
                          name={key}
                          type={
                            t === "money"
                              ? "text"
                              : t === "integer"
                                ? "number"
                                : t
                          }
                          inputMode={t === "money" ? "decimal" : undefined}
                          defaultValue={value}
                          required={!optional}
                          min={
                            ["integer", "number"].includes(t) ? 0 : undefined
                          }
                          max={t === "number" ? 100 : undefined}
                          step={
                            t === "integer"
                              ? 1
                              : t === "number"
                                ? "any"
                                : undefined
                          }
                          minLength={t === "password" ? 8 : undefined}
                          maxLength={
                            t === "password"
                              ? 128
                              : ["text", "email"].includes(t)
                                ? 255
                                : 2000
                          }
                          placeholder={
                            t === "money"
                              ? "0,00"
                              : t === "url"
                                ? "https://…"
                                : undefined
                          }
                        />
                      )}
                    </label>
                  );
                })}
              </div>
              {tipo === "jogos" && (
                <p className="muted">
                  Selecione os cadastros pelo nome. Deixe a promoção vazia para
                  removê-la. Desmarque a opção de demonstração somente depois de
                  conferir preço e estoque reais da loja.
                </p>
              )}
              <div className="form-actions">
                <button
                  type="button"
                  className="button secondary"
                  disabled={busy}
                  onClick={closeEdit}
                >
                  Cancelar
                </button>
                <button
                  className="button"
                  disabled={busy || missing.length > 0}
                >
                  {busy ? "Salvando…" : "Salvar registro"}
                  <Icon name="check" />
                </button>
              </div>
            </form>
          </Modal>
        )}
        {deleting && (
          <Modal title="Excluir registro?" onClose={closeDelete}>
            <p>
              Confirma a exclusão de <strong>{summary(deleting)[0]}</strong>?
            </p>
            <p className="muted">
              {tipo === "jogos"
                ? "O estoque, as avaliações e os desejos vinculados a este jogo também serão removidos."
                : tipo === "usuarios"
                  ? "As sessões e os desejos deste usuário também serão removidos."
                  : "Cadastros com vínculos podem ter sua exclusão bloqueada."}
            </p>
            <ErrorBox message={formError} />
            <div className="form-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={closeDelete}
              >
                Cancelar
              </button>
              <button
                className="button danger-button"
                disabled={busy}
                onClick={remove}
              >
                {busy ? "Excluindo…" : "Excluir registro"}
              </button>
            </div>
          </Modal>
        )}
      </section>
    </div>
  );
}
