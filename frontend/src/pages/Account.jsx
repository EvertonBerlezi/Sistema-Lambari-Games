import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api, session } from "../lib/api";
import { PageHeading, Icon, ErrorBox, Modal } from "../components/UI";
export default function Account() {
  const { user, setUser, refs, notify } = useApp(),
    navigate = useNavigate();
  const [tab, setTab] = useState("conta"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState(false);
  const close = useCallback(() => {
    if (!busy) setDeleting(false);
  }, [busy]);
  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      let body;
      if (tab === "preferencias")
        body = {
          preferencias: {
            tema: d.tema,
            plataforma_favorita: d.plataforma_favorita
              ? Number(d.plataforma_favorita)
              : null,
            somente_disponiveis: d.somente_disponiveis === "on",
          },
        };
      else if (tab === "senha") {
        if (d.senha !== d.confirmar) throw Error("As senhas não conferem.");
        body = { senha_atual: d.senha_atual, senha: d.senha };
      } else body = { nome: d.nome, email: d.email };
      const u = await api("/conta", { method: "PATCH", body });
      if (tab === "senha") {
        session.set(null);
        setUser(null);
        navigate("/login");
        notify("Senha alterada. Entre novamente.");
      } else {
        setUser(u);
        notify("Alterações salvas.");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api("/conta", { method: "DELETE" });
      session.set(null);
      setUser(null);
      navigate("/");
      notify("Conta excluída.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const p = user.preferencias || {};
  return (
    <section className="page-container">
      <PageHeading
        eyebrow="DO SEU JEITO"
        title="Configurações"
        text="Cuide da sua conta e personalize sua experiência."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Categorias de configurações">
          {[
            ["conta", "user", "Minha conta"],
            ["preferencias", "settings", "Preferências"],
            ["senha", "eye", "Segurança"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              className={tab === key ? "active" : ""}
              onClick={() => {
                setTab(key);
                setError("");
              }}
            >
              <Icon name={icon} />
              {label}
              <Icon name="arrow" size={15} />
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          <ErrorBox message={error} />
          <h2>
            {tab === "conta"
              ? "Informações da conta"
              : tab === "preferencias"
                ? "Suas preferências"
                : "Alterar senha"}
          </h2>
          <p className="muted">
            {tab === "conta"
              ? "Mantenha seus dados atualizados."
              : tab === "preferencias"
                ? "Estas opções serão aplicadas ao abrir o catálogo."
                : "Sua senha atual é necessária para fazer a alteração."}
          </p>
          <form onSubmit={save} key={tab}>
            {tab === "conta" ? (
              <>
                <label>
                  Nome
                  <input
                    name="nome"
                    defaultValue={user.nome}
                    required
                    maxLength={255}
                    autoComplete="name"
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    required
                    maxLength={255}
                    autoComplete="email"
                  />
                </label>
                <span className="badge">
                  {user.perfil === "admin" ? "Administrador" : "Cliente"}
                </span>
              </>
            ) : tab === "preferencias" ? (
              <>
                <label>
                  Tema
                  <select name="tema" defaultValue={p.tema || "claro"}>
                    <option value="claro">Claro</option>
                    <option value="escuro">Escuro</option>
                  </select>
                </label>
                <label>
                  Plataforma favorita
                  <select
                    name="plataforma_favorita"
                    defaultValue={p.plataforma_favorita || ""}
                  >
                    <option value="">Todas as plataformas</option>
                    {refs.plataformas.map((r) => (
                      <option value={r.id} key={r.id}>
                        {r.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input
                    name="somente_disponiveis"
                    type="checkbox"
                    defaultChecked={!!p.somente_disponiveis}
                  />
                  Mostrar somente jogos em estoque ao abrir o catálogo
                </label>
              </>
            ) : (
              <>
                <label>
                  Senha atual
                  <input
                    type="password"
                    name="senha_atual"
                    autoComplete="current-password"
                    required
                    maxLength={128}
                  />
                </label>
                <label>
                  Nova senha
                  <input
                    type="password"
                    name="senha"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
                <label>
                  Confirmar nova senha
                  <input
                    type="password"
                    name="confirmar"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                  />
                </label>
                <p className="muted">
                  Use pelo menos 8 caracteres. Você precisará entrar novamente
                  após a alteração.
                </p>
              </>
            )}
            <div className="form-actions">
              <button className="button" disabled={busy}>
                {busy ? "Salvando…" : "Salvar alterações"}
                <Icon name="check" />
              </button>
            </div>
          </form>
          {tab === "conta" && (
            <div className="danger-zone">
              <h3>Excluir conta</h3>
              <p>Remove sua conta e sua lista de desejos permanentemente.</p>
              <button
                className="text-button danger"
                onClick={() => setDeleting(true)}
              >
                Excluir minha conta
              </button>
            </div>
          )}
        </section>
      </div>
      {deleting && (
        <Modal title="Excluir sua conta?" onClose={close}>
          <p>
            Seus dados e sua lista de desejos serão excluídos. Esta ação não
            pode ser desfeita.
          </p>
          <ErrorBox message={error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={close}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="button danger-button"
              disabled={busy}
              onClick={remove}
            >
              Excluir conta
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
