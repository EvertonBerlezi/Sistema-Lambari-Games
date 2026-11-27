import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
const paths = {
  search: "m21 21-4.4-4.4 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  user: "M20 21v-2a7 7 0 0 0-14 0v2 M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  arrow: "m9 5 7 7-7 7",
  plus: "M12 5v14 M5 12h14",
  edit: "m16 3 5 5-12 12-6 1 1-6Z M14 5l5 5",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  close: "m6 6 12 12 M18 6 6 18",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  game: "M7 6h10l4 12c1 4-4 4-6-1H9c-2 5-7 5-6 1Z M6 11h6 M9 8v6 M16 10h.01 M18 13h.01",
  logout: "M9 4H4v16h5 M9 12h12 M17 8l4 4-4 4",
  check: "m5 12 4 4L19 6",
  box: "m3 7 9-5 9 5v10l-9 5-9-5Z M3 7l9 5 9-5 M12 12v10",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
};
export function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.game} />
    </svg>
  );
}
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Lambari Games, início">
      <span className="brand-icon">
        <Icon name="game" size={24} />
      </span>
      <span>
        LAMBARI<span className="brand-sub">GAMES / CATÁLOGO</span>
      </span>
    </Link>
  );
}
export function ErrorBox({ message, onRetry }) {
  return message ? (
    <div className="error-box" role="alert">
      {message}
      {onRetry && (
        <button className="text-button" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  ) : null;
}
export function Empty({
  title = "Nenhum registro encontrado",
  text,
  children,
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name="game" size={38} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Carregando…
    </div>
  );
}
export function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    const close = (e) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", close);
    return () => {
      d.removeEventListener("cancel", close);
      d.close();
    };
  }, [onClose]);
  return (
    <dialog
      ref={ref}
      className={"modal " + (wide ? "wide" : "")}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Cover({ game, large = false }) {
  return (
    <div
      className={"cover " + (large ? "large" : "")}
      data-color={(game.id || 0) % 6}
    >
      {game.capa_url ? (
        <img
          src={game.capa_url}
          alt={"Capa de " + game.titulo}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.hidden = true;
          }}
        />
      ) : null}
      <div className="cover-fallback">
        <Icon name="game" size={large ? 65 : 42} />
        <span>{game.titulo}</span>
        <small>LAMBARI GAMES</small>
      </div>
    </div>
  );
}
export function PageHeading({ eyebrow, title, text, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </div>
  );
}
