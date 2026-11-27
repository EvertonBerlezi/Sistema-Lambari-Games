import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api } from "../lib/api";
import { Icon, ErrorBox } from "../components/UI";
export default function Auth({ register = false }) {
  const { login, notify } = useApp(),
    navigate = useNavigate(),
    location = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [show, setShow] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const d = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (register) {
        if (d.senha !== d.confirmar) throw Error("As senhas não conferem.");
        await api("/cadastro", {
          method: "POST",
          body: { nome: d.nome, email: d.email, senha: d.senha },
        });
      }
      await login(d.email, d.senha);
      notify(register ? "Conta criada. Seja bem-vindo!" : "Login realizado.");
      navigate(location.state?.from || "/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <span className="eyebrow">BEM-VINDO AO LAMBARI GAMES</span>
        <h1>
          Seu próximo
          <br />
          favorito começa
          <br />
          <span>aqui.</span>
        </h1>
        <p>
          Guarde seus jogos na lista de desejos e acompanhe o catálogo da sua
          loja.
        </p>
        <div className="story-game">
          <Icon name="game" size={140} />
        </div>
        <Link to="/">← Explorar sem entrar</Link>
      </div>
      <section className="auth-form">
        <span className="eyebrow">SUA CONTA</span>
        <h2>{register ? "Entre para o jogo." : "Bom ter você de volta."}</h2>
        <p>
          {register
            ? "Crie sua conta e monte sua lista de desejos."
            : "Entre para acessar sua lista de desejos e preferências."}
        </p>
        <ErrorBox message={error} />
        <form onSubmit={submit}>
          {register && (
            <label>
              Nome
              <input name="nome" autoComplete="name" maxLength={255} required />
            </label>
          )}
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={255}
              placeholder="voce@exemplo.com"
              required
            />
          </label>
          <label>
            Senha
            <div className="password-field">
              <input
                name="senha"
                type={show ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                minLength={register ? 8 : undefined}
                maxLength={128}
                required
              />
              <button
                type="button"
                className="icon-button"
                aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={show}
                onClick={() => setShow(!show)}
              >
                <Icon name="eye" />
              </button>
            </div>
          </label>
          {register && (
            <label>
              Confirmar senha
              <input
                name="confirmar"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
              <small>Mínimo de 8 caracteres.</small>
            </label>
          )}
          <button className="button full" disabled={busy}>
            {busy ? "Aguarde…" : register ? "Criar minha conta" : "Entrar"}
            <Icon name="arrow" />
          </button>
        </form>
        <p className="auth-switch">
          {register ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          <Link to={register ? "/login" : "/cadastro"}>
            {register ? "Entrar" : "Cadastre-se"}
          </Link>
        </p>
      </section>
    </div>
  );
}
