-- Identifica a procedência e separa dados de demonstração do cadastro real da loja.
ALTER TABLE jogos ADD COLUMN dados_demonstracao BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE jogos ADD COLUMN fonte_url TEXT;
ALTER TABLE jogos ADD COLUMN fonte_consultada_em DATE;
