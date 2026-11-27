import { useState, useEffect, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Brand, Icon } from "./UI";
export default function Layout() {
  const { user, logout } = useApp(),
    location = useLocation(),
    navigate = useNavigate();
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    setOpen(false);
    setMobile(false);
  }, [location.pathname]);
  useEffect(() => {
    const click = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const key = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMobile(false);
      }
    };
    document.addEventListener("pointerdown", click);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", click);
      document.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <>
      <header className="header">
        <div className="header-brand">
          <button
            className="icon-button mobile-only"
            aria-label="Abrir navegação"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            <Icon name="menu" />
          </button>
          <Brand />
        </div>
        <nav
          className={mobile ? "top-nav mobile-open" : "top-nav"}
          aria-label="Navegação principal"
        >
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Catálogo
          </Link>
          {user?.perfil === "admin" && (
            <Link
              className={location.pathname.startsWith("/admin") ? "active" : ""}
              to="/admin/jogos"
            >
              Administração
            </Link>
          )}
        </nav>
        <div className="header-actions">
          <Link className="wish-link" to={user ? "/desejos" : "/login"}>
            <Icon name="heart" />
            <span>Lista de desejos</span>
          </Link>
          <div ref={ref} className="user-wrap">
            <button
              className={"user-button " + (open ? "active" : "")}
              aria-label="Abrir menu do usuário"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className="avatar">
                {user ? (
                  user.nome.slice(0, 1).toUpperCase()
                ) : (
                  <Icon name="user" size={18} />
                )}
              </span>
              <span className="user-caption">
                {user ? user.nome.split(" ")[0] : "Minha conta"}
              </span>
            </button>
            {open && (
              <div className="user-menu">
                <div className="user-info">
                  <strong>{user?.nome || "Olá, visitante!"}</strong>
                  <small>
                    {user?.email || "Encontre seu próximo jogo favorito."}
                  </small>
                  {user && (
                    <span className="badge">
                      {user.perfil === "admin" ? "Administrador" : "Cliente"}
                    </span>
                  )}
                </div>
                {user ? (
                  <>
                    <Link to="/conta">
                      <Icon name="settings" />
                      Minha conta e preferências
                    </Link>
                    <Link to="/desejos">
                      <Icon name="heart" />
                      Lista de desejos
                    </Link>
                    {user.perfil === "admin" && (
                      <Link to="/admin/jogos">
                        <Icon name="grid" />
                        Administrar catálogo
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await logout();
                        setOpen(false);
                        navigate("/");
                      }}
                    >
                      <Icon name="logout" />
                      Sair da conta
                    </button>
                  </>
                ) : (
                  <>
                    <Link className="login-link" to="/login">
                      Entrar na conta
                      <Icon name="arrow" />
                    </Link>
                    <Link to="/cadastro">Criar uma conta</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <span>© {new Date().getFullYear()} Lambari Games</span>
        <span>Seu jogo começa na loja. Consulte a disponibilidade.</span>
      </footer>
    </>
  );
}
