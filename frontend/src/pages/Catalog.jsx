import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { api, money } from "../lib/api";
import { Icon, Cover, Modal, Empty, ErrorBox, Loading } from "../components/UI";
const clean = {
  busca: "",
  plataforma_id: [],
  genero_id: [],
  distribuidora_id: [],
  disponivel: false,
  promocao: false,
};
export default function Catalog() {
  const { user, refs, refsError, refreshRefs, notify } = useApp(),
    navigate = useNavigate();
  const [filters, setFilters] = useState(clean),
    [games, setGames] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [sort, setSort] = useState("titulo"),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState(null),
    [filterOpen, setFilterOpen] = useState(false),
    [refresh, setRefresh] = useState(0);
  const [wishes, setWishes] = useState([]),
    [busy, setBusy] = useState(null);
  useEffect(() => {
    const p = user?.preferencias;
    setFilters({
      ...clean,
      plataforma_id: p?.plataforma_favorita ? [p.plataforma_favorita] : [],
      disponivel: !!p?.somente_disponiveis,
    });
  }, [
    user?.id,
    user?.preferencias?.plataforma_favorita,
    user?.preferencias?.somente_disponiveis,
  ]);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const q = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          if (v.length) q.set(k, v.join(","));
        } else if (v) q.set(k, String(v));
      });
      api("/jogos?" + q, { signal: controller.signal })
        .then((rows) => {
          setGames(rows);
          setError("");
          setPage(1);
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters, refresh]);
  const loadWishes = useCallback(async () => {
    if (!user) {
      setWishes([]);
      return;
    }
    try {
      setWishes(await api("/desejos"));
    } catch (e) {
      notify(e.message, "error");
    }
  }, [user, notify]);
  useEffect(() => {
    loadWishes();
  }, [loadWishes]);
  const ordered = useMemo(
    () =>
      [...games].sort((a, b) =>
        sort === "preco"
          ? a.preco_atual_centavos - b.preco_atual_centavos
          : sort === "nota"
            ? (b.nota_media ?? -1) - (a.nota_media ?? -1)
            : a.titulo.localeCompare(b.titulo, "pt-BR"),
      ),
    [games, sort],
  );
  function update(k, v) {
    setFilters((f) => ({ ...f, [k]: v }));
  }
  function toggle(k, id) {
    setFilters((f) => ({
      ...f,
      [k]: f[k].includes(id) ? f[k].filter((x) => x !== id) : [...f[k], id],
    }));
  }
  async function wish(game) {
    if (!user) {
      navigate("/login", { state: { from: "/" } });
      return;
    }
    setBusy(game.id);
    try {
      const old = wishes.find((d) => d.jogo_id === game.id);
      await api("/desejos" + (old ? "/" + old.id : ""), {
        method: old ? "DELETE" : "POST",
        body: old ? undefined : { jogo_id: game.id },
      });
      await loadWishes();
      notify(
        old ? "Jogo removido da lista." : "Jogo adicionado à lista de desejos.",
      );
    } catch (e) {
      notify(e.message, "error");
    } finally {
      setBusy(null);
    }
  }
  const close = useCallback(() => setSelected(null), []);
  const active =
    filters.plataforma_id.length +
    filters.genero_id.length +
    filters.distribuidora_id.length +
    Number(filters.disponivel) +
    Number(filters.promocao);
  return (
    <div className="catalog-layout">
      <aside
        className={"filter-sidebar " + (filterOpen ? "show" : "")}
        aria-label="Filtros do catálogo"
      >
        <div className="sidebar-heading">
          <span className="eyebrow">ENCONTRE SEU JOGO</span>
          <div>
            <h2>Filtros</h2>
            <button className="text-button" onClick={() => setFilters(clean)}>
              Limpar{active ? ` (${active})` : ""}
            </button>
          </div>
        </div>
        <ErrorBox message={refsError} onRetry={refreshRefs} />
        {[
          ["plataformas", "plataforma_id", "Plataformas"],
          ["generos", "genero_id", "Gêneros"],
          ["distribuidoras", "distribuidora_id", "Distribuidoras"],
        ].map(([ref, key, title]) => (
          <details key={key} open>
            <summary>
              {title}
              <Icon name="arrow" size={16} />
            </summary>
            <div className="filter-options">
              {refs[ref].length ? (
                refs[ref].map((item) => (
                  <label className="checkbox" key={item.id}>
                    <input
                      type="checkbox"
                      checked={filters[key].includes(item.id)}
                      onChange={() => toggle(key, item.id)}
                    />
                    <span>{item.nome}</span>
                  </label>
                ))
              ) : (
                <small className="muted">Nenhuma opção cadastrada.</small>
              )}
            </div>
          </details>
        ))}
        <details open>
          <summary>
            Disponibilidade
            <Icon name="arrow" size={16} />
          </summary>
          <div className="filter-options">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.disponivel}
                onChange={(e) => update("disponivel", e.target.checked)}
              />
              Somente em estoque
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={filters.promocao}
                onChange={(e) => update("promocao", e.target.checked)}
              />
              Ofertas e promoções
            </label>
          </div>
        </details>
        <div className="sidebar-bottom">
          <Icon name="box" />
          <p>
            Catálogo da loja física.
            <br />
            <strong>Sem compras online.</strong>
          </p>
        </div>
        <Link className="sidebar-settings" to={user ? "/conta" : "/login"}>
          <Icon name="settings" />
          Configurações
        </Link>
      </aside>
      <section className="catalog-main">
        <h1 className="sr-only">Catálogo de jogos</h1>
        {games.some((j) => j.dados_demonstracao) && (
          <div className="demo-notice" role="note">
            <strong>Base de demonstração.</strong> Preços, promoções e estoque
            dos jogos marcados são ilustrativos.
          </div>
        )}
        <div className="search-toolbar">
          <label className="search-input">
            <Icon name="search" />
            <input
              aria-label="Buscar jogo pelo título"
              placeholder="Qual jogo você está procurando?"
              value={filters.busca}
              onChange={(e) => update("busca", e.target.value)}
            />
            {filters.busca && (
              <button
                className="icon-button"
                aria-label="Limpar busca"
                onClick={() => update("busca", "")}
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </label>
          <button
            className="button secondary mobile-only"
            onClick={() => setFilterOpen(!filterOpen)}
            aria-expanded={filterOpen}
          >
            <Icon name="settings" />
            Filtros
          </button>
        </div>
        <div className="results-line">
          <span>
            {loading ? (
              "Buscando jogos…"
            ) : (
              <>
                <strong>{games.length}</strong>{" "}
                {games.length === 1 ? "jogo encontrado" : "jogos encontrados"}
              </>
            )}
          </span>
          <label>
            Ordenar por{" "}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="titulo">Nome do jogo</option>
              <option value="preco">Menor preço</option>
              <option value="nota">Maior nota</option>
            </select>
          </label>
        </div>
        <ErrorBox message={error} onRetry={() => setRefresh((x) => x + 1)} />
        {loading ? (
          <Loading />
        ) : (
          !error &&
          (!ordered.length ? (
            <Empty
              title="Nenhum jogo por aqui ainda"
              text={
                active || filters.busca
                  ? "Tente outros filtros ou limpe a busca."
                  : "Os jogos cadastrados pela loja aparecerão aqui."
              }
            >
              <button
                className="button secondary"
                onClick={() => setFilters(clean)}
              >
                Limpar filtros
              </button>
            </Empty>
          ) : (
            <>
              <div className="game-grid">
                {ordered.slice((page - 1) * 12, page * 12).map((game) => (
                  <article className="game-card" key={game.id}>
                    <button
                      className="card-cover-button"
                      onClick={() => setSelected(game)}
                      aria-label={"Ver detalhes de " + game.titulo}
                    >
                      <Cover game={game} />
                      {game.promocao_centavos !== null && (
                        <span className="offer-badge">
                          −
                          {Math.round(
                            (1 - game.promocao_centavos / game.preco_centavos) *
                              100,
                          )}
                          %
                        </span>
                      )}
                    </button>
                    <div className="card-info">
                      <small className="card-platform">{game.plataforma}</small>
                      <button
                        className="card-title"
                        onClick={() => setSelected(game)}
                      >
                        {game.titulo}
                      </button>
                      {game.dados_demonstracao && (
                        <span className="demo-label">
                          Preço e estoque demonstrativos
                        </span>
                      )}
                      <div className="card-stock">
                        <span
                          className={
                            "stock-dot " + (game.quantidade ? "available" : "")
                          }
                        />
                        {game.quantidade
                          ? "Disponível na loja"
                          : "Indisponível no momento"}
                      </div>
                      <div className="price-row">
                        <div>
                          {game.promocao_centavos !== null && (
                            <del>{money(game.preco_centavos)}</del>
                          )}
                          <strong>{money(game.preco_atual_centavos)}</strong>
                        </div>
                        <button
                          className={
                            "icon-button heart " +
                            (wishes.some((d) => d.jogo_id === game.id)
                              ? "saved"
                              : "")
                          }
                          aria-label={
                            (wishes.some((d) => d.jogo_id === game.id)
                              ? "Remover "
                              : "Adicionar ") +
                            game.titulo +
                            " da lista de desejos"
                          }
                          disabled={busy === game.id}
                          onClick={() => wish(game)}
                        >
                          <Icon name="heart" />
                        </button>
                      </div>
                      <div className="rating">
                        <span aria-hidden="true">★</span>
                        {game.nota_media !== null ? (
                          <>
                            <strong>{game.nota_media}</strong>
                            <small>/100 · crítica</small>
                          </>
                        ) : (
                          <small>Sem avaliação cadastrada</small>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {ordered.length > 12 && (
                <nav className="pagination" aria-label="Paginação">
                  <button
                    className="button secondary"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {page} de {Math.ceil(ordered.length / 12)}
                  </span>
                  <button
                    className="button secondary"
                    disabled={page * 12 >= ordered.length}
                    onClick={() => setPage(page + 1)}
                  >
                    Próxima
                  </button>
                </nav>
              )}
            </>
          ))
        )}
      </section>
      {selected && (
        <Modal title="Detalhes do jogo" onClose={close} wide>
          <div className="game-detail">
            <Cover game={selected} large />
            <div>
              <span className="eyebrow">{selected.plataforma}</span>
              <h2>{selected.titulo}</h2>
              {selected.dados_demonstracao && (
                <p className="demo-notice">
                  Preço e disponibilidade de demonstração. Confirme os dados
                  reais com a loja.
                </p>
              )}
              <p>{selected.descricao || "Descrição não informada."}</p>
              <dl>
                <div>
                  <dt>Gênero</dt>
                  <dd>{selected.genero}</dd>
                </div>
                <div>
                  <dt>Distribuidora</dt>
                  <dd>{selected.distribuidora}</dd>
                </div>
                <div>
                  <dt>Estoque na loja</dt>
                  <dd>{selected.quantidade} unidade(s)</dd>
                </div>
              </dl>
              <div className="detail-price">
                {selected.promocao_centavos !== null && (
                  <del>{money(selected.preco_centavos)}</del>
                )}
                <strong>{money(selected.preco_atual_centavos)}</strong>
              </div>
              <button
                className="button"
                disabled={busy === selected.id}
                onClick={() => wish(selected)}
              >
                <Icon name="heart" />
                {wishes.some((d) => d.jogo_id === selected.id)
                  ? "Remover dos desejos"
                  : "Adicionar aos desejos"}
              </button>
              {selected.fonte_url && (
                <a
                  className="source-link"
                  href={selected.fonte_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Informações do jogo na Steam ↗
                </a>
              )}
              <h3>Avaliações da crítica</h3>
              {selected.avaliacoes.length ? (
                selected.avaliacoes.map((a) => (
                  <a
                    key={a.id}
                    className="review"
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>{a.critico}</strong>
                    <span>{a.nota}/100 ↗</span>
                  </a>
                ))
              ) : (
                <p className="muted">Nenhuma avaliação cadastrada.</p>
              )}
              <small className="muted">
                Consulta de disponibilidade. A compra é realizada na loja
                física.
              </small>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
