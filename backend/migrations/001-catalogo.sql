-- PostgreSQL. Migração não destrutiva: não apaga tabelas ou dados.
CREATE TABLE usuarios (
 id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL,
 senha VARCHAR(255) NOT NULL, perfil VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK(perfil IN ('cliente','admin')),
 preferencias JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX usuarios_email_unique ON usuarios(LOWER(email));
CREATE TABLE plataformas (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE UNIQUE INDEX plataformas_nome_unique ON plataformas(LOWER(nome));
CREATE TABLE generos (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE UNIQUE INDEX generos_nome_unique ON generos(LOWER(nome));
CREATE TABLE distribuidoras (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE UNIQUE INDEX distribuidoras_nome_unique ON distribuidoras(LOWER(nome));
CREATE TABLE criticos (id SERIAL PRIMARY KEY, nome VARCHAR(255) NOT NULL, site TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE UNIQUE INDEX criticos_nome_unique ON criticos(LOWER(nome));
CREATE TABLE jogos (
 id SERIAL PRIMARY KEY, titulo VARCHAR(255) NOT NULL, descricao TEXT NOT NULL DEFAULT '', capa_url TEXT,
 plataforma_id INTEGER NOT NULL REFERENCES plataformas(id) ON DELETE RESTRICT,
 genero_id INTEGER NOT NULL REFERENCES generos(id) ON DELETE RESTRICT,
 distribuidora_id INTEGER NOT NULL REFERENCES distribuidoras(id) ON DELETE RESTRICT,
 preco_centavos INTEGER NOT NULL CHECK(preco_centavos >= 0),
 promocao_centavos INTEGER CHECK(promocao_centavos >= 0 AND promocao_centavos < preco_centavos),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX jogos_titulo_plataforma_unique ON jogos(LOWER(titulo),plataforma_id);
CREATE INDEX jogos_genero_idx ON jogos(genero_id);
CREATE INDEX jogos_distribuidora_idx ON jogos(distribuidora_id);
CREATE TABLE estoque (
 id SERIAL PRIMARY KEY, jogo_id INTEGER NOT NULL UNIQUE REFERENCES jogos(id) ON DELETE CASCADE,
 quantidade INTEGER NOT NULL CHECK(quantidade >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE avaliacoes (
 id SERIAL PRIMARY KEY, jogo_id INTEGER NOT NULL REFERENCES jogos(id) ON DELETE CASCADE,
 critico_id INTEGER NOT NULL REFERENCES criticos(id) ON DELETE RESTRICT,
 nota DOUBLE PRECISION NOT NULL CHECK(nota BETWEEN 0 AND 100), url TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(jogo_id,critico_id)
);
CREATE TABLE desejos (
 id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 jogo_id INTEGER NOT NULL REFERENCES jogos(id) ON DELETE CASCADE, observacao TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(usuario_id,jogo_id)
);
CREATE TABLE sessoes (
 token VARCHAR(64) PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 expira BIGINT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX sessoes_usuario_idx ON sessoes(usuario_id);
