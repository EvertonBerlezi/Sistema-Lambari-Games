import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api, money } from "../lib/api";
import {
  PageHeading,
  Icon,
  Cover,
  Loading,
  Empty,
  ErrorBox,
  Modal,
} from "../components/UI";
export default function Wishes() {
  const { notify } = useApp();
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api("/desejos"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
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
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      await api("/desejos/" + editing.id, {
        method: "PATCH",
        body: { observacao: new FormData(e.currentTarget).get("observacao") },
      });
      setEditing(null);
      notify("Observação atualizada.");
      await load();
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
      await api("/desejos/" + deleting.id, { method: "DELETE" });
      setDeleting(null);
      notify("Jogo removido da lista.");
      await load();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page-container">
      <PageHeading
        eyebrow="SEUS FAVORITOS"
        title="Lista de desejos"
        text="Os jogos que você quer ter por perto."
      >
        <Link className="button secondary" to="/">
          Explorar catálogo
          <Icon name="arrow" />
        </Link>
      </PageHeading>
      <ErrorBox message={error} onRetry={load} />
      {loading ? (
        <Loading />
      ) : (
        !error &&
        (rows.length ? (
          <div className="wish-list">
            {rows.map((d) => (
              <article className="wish-row" key={d.id}>
                <Cover game={d.jogo} />
                <div className="wish-copy">
                  <span className="eyebrow">{d.jogo.plataforma}</span>
                  <h2>{d.jogo.titulo}</h2>
                  <span
                    className={
                      d.jogo.quantidade ? "stock available-text" : "muted"
                    }
                  >
                    {d.jogo.quantidade
                      ? "Disponível na loja"
                      : "Indisponível no momento"}
                  </span>
                  <p>
                    {d.observacao || "Adicione uma observação para este jogo."}
                  </p>
                </div>
                <div className="wish-price">
                  {d.jogo.promocao_centavos !== null && (
                    <span className="badge offer">Em promoção</span>
                  )}
                  <strong>{money(d.jogo.preco_atual_centavos)}</strong>
                  {d.jogo.dados_demonstracao && (
                    <span className="demo-label">
                      Preço e estoque demonstrativos
                    </span>
                  )}
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={"Editar observação de " + d.jogo.titulo}
                      onClick={() => {
                        setFormError("");
                        setEditing(d);
                      }}
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      className="icon-button danger"
                      aria-label={"Remover " + d.jogo.titulo}
                      onClick={() => {
                        setFormError("");
                        setDeleting(d);
                      }}
                    >
                      <Icon name="trash" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Sua próxima aventura está esperando"
            text="Encontre um jogo no catálogo e toque no coração para salvá-lo aqui."
          >
            <Link className="button" to="/">
              Explorar jogos
            </Link>
          </Empty>
        ))
      )}
      {editing && (
        <Modal title="Observação do desejo" onClose={closeEdit}>
          <p>{editing.jogo.titulo}</p>
          <ErrorBox message={formError} />
          <form onSubmit={save}>
            <label>
              Observação
              <textarea
                name="observacao"
                defaultValue={editing.observacao}
                maxLength={2000}
                rows={4}
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button secondary"
                onClick={closeEdit}
                disabled={busy}
              >
                Cancelar
              </button>
              <button className="button" disabled={busy}>
                Salvar
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Remover da lista?" onClose={closeDelete}>
          <p>
            O jogo <strong>{deleting.jogo.titulo}</strong> será removido dos
            seus desejos.
          </p>
          <ErrorBox message={formError} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={closeDelete}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="button danger-button"
              onClick={remove}
              disabled={busy}
            >
              Remover
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
