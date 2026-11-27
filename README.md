# Lambari Games — frontend React e PostgreSQL

Sistema acadêmico para consultar o catálogo de jogos de uma loja física. O catálogo
é público; clientes conectados podem salvar desejos e preferências. Administradores
gerenciam jogos e cadastros relacionados. **Não há compras, pagamentos ou reservas.**

Esta versão utiliza **PostgreSQL**, com **Sequelize**,
relacionamentos e migrations. A interface segue a organização dos wireframes:
filtros à esquerda, busca no topo, jogos em grade, menu do usuário à direita,
login/cadastro e configurações com navegação lateral.

## 1. Requisitos e estrutura

- Linux como ambiente padrão; também pode ser executado em macOS.
- Node.js 22.13 ou superior e npm. Use uma versão par suportada do Node.
- PostgreSQL 14 ou superior, acessível por TCP. Integração validada com PostgreSQL 18.
- Internet para instalar dependências. As capas externas também precisam de internet;
  sem elas, o catálogo apresenta uma capa alternativa com o título do jogo.

```text
lambari-games/
  backend/
    migrations/           # SQL PostgreSQL versionado, executado uma vez
    scripts/              # migrar banco e criar admin
    src/database/         # conexão Sequelize, transações e demonstração
    src/models/           # tabelas e associações Sequelize
    src/cadastros/        # models e regras organizados por cadastro
    src/services/         # regras compartilhadas pela API e pelo terminal
    src/routes/           # rotas Express, com autenticação e permissões
    test/                 # testes reais no PostgreSQL
    .env.example
  frontend/
    src/pages/            # catálogo, login/cadastro, desejos, conta e CRUDs
    src/features/         # definições dos formulários por cadastro
    src/components/       # layout, diálogo, botões e elementos compartilhados
    src/context/          # conta, preferências, mensagens e referências
    src/lib/              # cliente HTTP e conversão de valores
    src/test/             # formulários e integração React → API → PostgreSQL
  docker-compose.yml      # PostgreSQL opcional via Docker
  iniciar-web.sh
```

## 2. Extrair e localizar a pasta no Linux

```bash
cd ~/Downloads
unzip Sistema_Lambari_Games_Web_Postgres.zip
cd lambari-games
```

Se você extraiu em outra pasta, use o caminho real. Para localizar:

```bash
find "$HOME" -type f -name 'iniciar-web.sh' 2>/dev/null
```

O ZIP não inclui `node_modules`, credenciais, banco ou arquivos de configuração
pessoal. O projeto antigo não precisa ser apagado.

## 3. Criar o banco PostgreSQL

Se já possui PostgreSQL, use o administrador do seu banco para criar uma base e
um usuário exclusivos para este projeto. Exemplo em uma instalação Linux local:

```bash
sudo -u postgres psql
```

Dentro do `psql`, execute:

```sql
CREATE ROLE lambari LOGIN;
\password lambari
CREATE DATABASE lambari_games OWNER lambari;
\q
```

O comando `\password` solicita a senha de forma interativa. Escolha sua própria
senha e guarde-a para a configuração seguinte. Se usuário ou banco já existirem,
confira a instalação antes de criá-los novamente. Também pode realizar esses
passos no pgAdmin.

### Alternativa: PostgreSQL via Docker

Se não houver outro PostgreSQL ocupando a porta 5432 e você já possuir Docker Compose:

```bash
export POSTGRES_PASSWORD='substitua-por-uma-senha-sua'
docker compose up -d postgres
```

O Compose cria banco `lambari_games`, usuário `lambari`, porta local 5432 e um volume
persistente. Configure a mesma senha em `backend/.env`. Não execute
`docker compose down -v` para desligar normalmente: `-v` remove o volume de dados.
Use `docker compose stop` para parar mantendo os cadastros.

## 4. Configurar a conexão

Estando na raiz `lambari-games`:

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Ajuste com os dados reais da sua instalação:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=lambari_games
DB_USER=lambari
DB_PASSWORD=sua_senha
DB_SSL=false
PORT=3001
HOST=127.0.0.1
FRONTEND_ORIGIN=http://localhost:5173
```

Também é possível informar `DATABASE_URL` no lugar dos dados individuais DB_*.
Para PostgreSQL remoto com TLS, use `DB_SSL=true` e um certificado confiável para
esse servidor. Não é desabilitada a validação de certificados.
O programa carrega `backend/.env` mesmo que seja iniciado de outra pasta.

## 5. Instalar, migrar e criar o administrador

Na raiz do projeto:

```bash
npm run install:all
cd backend
npm run db:migrate
npm run db:admin
```

Informe nome, email e senha de 8 a 128 caracteres. Não existe conta administrativa
ou senha padrão. O comando cria apenas o primeiro administrador; os próximos são
cadastrados em **Administração → Usuários**.

A senha aparece ao digitar nesse comando simples do terminal. No banco ela fica
protegida com hash scrypt e salt. **Na tela de login web a senha fica oculta**, com
um botão para mostrar/ocultar.

As migrations são registradas em `schema_migrations` e podem ser executadas
novamente sem apagar dados. A inicialização do servidor também as verifica.
Não há `sync({ force: true })` nem recriação automática do banco.

## 6. Iniciar o site completo

Depois de instalar e configurar, volte à raiz e execute:

```bash
cd ..
sh iniciar-web.sh
```

Se já estiver na raiz, não use `cd ..`. O script verifica a configuração, executa
as migrations, compila o React e inicia o Express servindo **frontend e API juntos**.

Abra no navegador:

**http://localhost:3001**

- Catálogo: `http://localhost:3001/`
- Login: `http://localhost:3001/login`
- Cadastro: `http://localhost:3001/cadastro`
- Administração: `http://localhost:3001/admin/jogos`
- Saúde da API: `http://localhost:3001/api/saude`

Para encerrar, use `Ctrl+C` no terminal que iniciou o servidor. O PostgreSQL mantém
os dados. A pasta `frontend/dist` pode ser recompilada sem perder cadastros.

### Modo de desenvolvimento

No primeiro terminal:

```bash
cd backend
npm start
```

No segundo terminal, a partir da raiz:

```bash
cd frontend
npm run dev
```

Abra **http://localhost:5173**. O Vite encaminha `/api` para a API em 3001.
Se alterar a porta da API, informe o destino correspondente ao iniciar o Vite:

```bash
API_PROXY_TARGET=http://127.0.0.1:3002 npm run dev
```

Em uma implantação com API em outro endereço, `VITE_API_URL` define a URL pública
da API durante a compilação. Para o uso local padrão, deixe essa variável ausente.

## 7. Usar o catálogo público

1. Abra a página inicial; não precisa fazer login.
2. Digite parte do nome na busca do topo.
3. Marque plataformas, gêneros e distribuidoras na lateral. Pode marcar mais de uma
   opção da mesma categoria; entre categorias, os filtros se combinam.
4. Marque **Somente em estoque** para consultar saldo maior que zero.
5. Marque **Ofertas e promoções** para consultar jogos com preço promocional ativo.
6. Use **Limpar** para remover os filtros.
7. Ordene por nome, menor preço ou maior nota da crítica.
8. Clique na capa ou no título para ver descrição, estoque, preços e avaliações.

Os resultados têm paginação quando ultrapassam 12 jogos. No celular, o botão
**Filtros** abre a lista de opções. As capas podem ser informadas por URL.
Sem capa ou caso a imagem não carregue, aparece uma alternativa com o nome do jogo.

Notas da crítica usam escala de 0 a 100 e são mostradas somente quando cadastradas.
Não são criadas avaliações fictícias. A disponibilidade não representa uma reserva.

## 8. Cadastro, login e menu do usuário

No canto superior direito, clique no ícone da conta.

- **Entrar na conta:** informe email e senha reais cadastrados no banco.
- **Criar uma conta:** informe nome, email, senha e confirmação.
- O cadastro público sempre cria um cliente, sem acesso à administração.
- Após entrar, o menu mostra nome, email, perfil, conta, desejos e opção de sair.
- A opção de administração só aparece para administradores.

A sessão expira em 24 horas e o token fica no armazenamento da sessão da aba.
Sair invalida o token no servidor. Rotas e operações administrativas também são
protegidas no backend; esconder um botão não é a única verificação de acesso.

## 9. Lista de desejos

1. Faça login.
2. No catálogo, clique no coração do jogo para adicionar à sua lista.
3. Clique novamente para remover ou abra **Lista de desejos** no topo.
4. Use o botão de edição para incluir, alterar ou limpar a observação.
5. Use a lixeira e confirme a remoção para excluir um desejo.

Cada conta acessa apenas a própria lista. O saldo e o preço mostrados são atuais.
Não há notificação automática de promoções nem reserva de estoque.

## 10. Minha conta e preferências

Menu do usuário → **Minha conta e preferências**.

### Minha conta

- Alterar nome e email e clicar em **Salvar alterações**.
- Excluir a própria conta com confirmação. Isso também remove seus desejos e sessões.
- A exclusão do último administrador é bloqueada.

### Preferências

- Tema claro ou escuro, aplicado à interface.
- Plataforma favorita, aplicada como filtro inicial ao abrir o catálogo.
- Preferência por mostrar somente jogos em estoque.
- **Salvar alterações** persiste as opções no PostgreSQL.
- Os filtros podem ser alterados normalmente depois; **Limpar** remove os filtros atuais.

### Segurança

- Informe senha atual, nova senha e confirmação.
- Nova senha deve ter entre 8 e 128 caracteres.
- Após salvar, todas as sessões da conta são invalidadas; entre novamente.

## 11. Administração — todos os CRUDs

Entre como administrador e abra **Administração** no topo. O menu lateral dá acesso
aos cadastros. Todas as telas têm busca na lista, botão **Novo registro**, edição
pelo lápis e exclusão pela lixeira com confirmação.

| Cadastro | Campos e como utilizar |
| --- | --- |
| Plataformas | Nome, como PlayStation 5, Nintendo Switch ou PC |
| Gêneros | Nome, como RPG, Aventura ou Corrida |
| Distribuidoras | Nome da distribuidora |
| Fontes de avaliação | Nome do veículo/crítico e URL de seu site |
| Jogos | Título, descrição, URL de capa opcional, plataforma, gênero, distribuidora, preço normal e promoção opcional |
| Estoque | Jogo selecionado pelo título/plataforma e saldo final disponível |
| Avaliações | Jogo, fonte, nota de 0 a 100 e URL da avaliação original |
| Usuários | Nome, email, perfil e senha inicial na criação; edição permite nome, email e perfil |

### Ordem recomendada

1. Plataformas, gêneros e distribuidoras.
2. Jogos.
3. Estoque.
4. Fontes de avaliação e avaliações.

No formulário de jogo, os vínculos são escolhidos pelo **nome**, sem digitação de
IDs. Se faltar um cadastro relacionado, o formulário explica o que cadastrar e
bloqueia o salvamento até existirem opções. Na API/terminal, a mensagem de vínculo
inexistente identifica o tipo e o ID, por exemplo **Plataforma com ID 1 não encontrado(a)**.

### Preços

Na interface web, preencha em reais: `120,00` ou `120.00`. O frontend converte para
centavos inteiros antes de enviar à API. Não digite `12000` esperando R$ 120,00 na
web: isso representa R$ 12.000,00.

A promoção deve ser menor que o preço normal. Deixe o campo promocional vazio para
remover a promoção. As promoções são valores ativos, sem agendamento.

### Estoque

O saldo é um inteiro maior ou igual a zero. Cada jogo tem um registro de estoque.
Se o saldo mudou de 5 para 3, edite o registro e informe `3`, e não `-2`.
Não há histórico de entradas/saídas ou movimentação de vendas.
Excluir o estoque mantém o jogo, com disponibilidade zero.

### Avaliações

Cadastre a fonte e a URL da crítica original. Uma nota 9/10 deve ser informada
como `90`. Há no máximo uma avaliação de cada fonte por jogo; para corrigir, edite
a avaliação existente. O programa não verifica certificação ou importa críticas
sozinho. Quando há avaliações, a nota do cartão é a média simples das notas cadastradas.

### Usuários e exclusões

- O administrador pode criar cliente ou administrador.
- A edição de outra conta não redefine sua senha. Cada usuário troca a própria senha
  na área de segurança, informando a senha atual.
- Não é possível excluir ou rebaixar o último administrador.
- Emails, nomes de cadastros auxiliares e combinações jogo/plataforma são únicos.
- Excluir um jogo remove também estoque, avaliações e desejos vinculados.
- Excluir usuário remove desejos e sessões desse usuário.
- Excluir uma plataforma, gênero, distribuidora ou fonte ainda vinculada é bloqueado.
- Uma falha mantém o formulário aberto, com a mensagem para corrigir o problema.

## 12. Base pesquisada de 50 jogos

Para carregar a base completa, em `backend`:

```bash
npm run db:catalogo
```

Esse comando inclui **50 jogos para PC**, pesquisados na Steam, com título,
descrição própria em português, gênero principal, distribuidora, fonte e capa.
As 50 capas estão incluídas em `frontend/public/capas`; não é necessário acessar
a internet para importar a base ou visualizar essas capas depois da instalação.

A base pode ser adicionada mesmo se já existirem jogos. Cada título/plataforma
existente é preservado: preços, estoque, descrição e avaliações cadastrados pela
loja não são sobrescritos. Repetir o comando não cria cópias. Edições de consoles
já cadastradas continuam disponíveis; os dados pesquisados para PC não são
aplicados automaticamente a versões de console.

**Preços, promoções e estoques novos são ilustrativos**, para demonstrar o sistema.
Cada jogo importado recebe a marca “Preço e estoque demonstrativos”. O catálogo e
a lista de desejos exibem essa indicação. Para cadastrar os valores reais, edite
o jogo e seu estoque; após conferir ambos, desmarque **Preços e estoque de demonstração**
no formulário do jogo.

A Steam disponibilizou dados Metacritic para 44 dos 50 títulos na consulta. Essas
notas e seus links são preservados no arquivo da base; o importador cadastra a nota
somente quando está adicionando um jogo novo. Não inventa notas e não substitui
avaliações de jogos existentes. A origem é o dado Metacritic informado pela Steam,
não uma raspagem direta do site Metacritic.

O arquivo `backend/data-catalogo/jogos.json` contém a base e as fontes por jogo.
A relação completa e os detalhes da pesquisa estão em `docs/BASE_DE_JOGOS.md`.
Gênero principal é uma classificação curada para os filtros da loja; os gêneros
originais da Steam também foram mantidos no JSON.

A demonstração pequena anterior continua opcional:

```bash
npm run demo
```

Ela adiciona oito edições de jogos e só funciona com o catálogo vazio. Para usar
apenas a base nova, execute diretamente `npm run db:catalogo`. Não é necessário
rodar os dois comandos. Nenhum deles cria usuários ou senhas.

## 13. Banco e referência técnica

A inspiração para a organização veio de:
https://gitlab.com/marcos.moretto/desenvweb2026

Foi consultada uma cópia atualizada da referência em 02/11/2026, HEAD
`d86a17806b52590c28074e2fae3f13bb41530649`. Foram aproveitados os conceitos de
models Sequelize, relacionamentos, serviços, variáveis de conexão, timestamps e
migrations. O domínio e as tabelas continuam sendo os do Lambari Games.

Base original do projeto:
https://github.com/EvertonBerlezi/Sistema-Lambari-Games

O banco tem:

| Tabela | Finalidade |
| --- | --- |
| usuarios | Conta, senha com hash, perfil e preferências JSONB |
| sessoes | Hash dos tokens e expiração |
| plataformas | Plataformas dos jogos |
| generos | Gêneros |
| distribuidoras | Distribuidoras |
| criticos | Fontes das avaliações |
| jogos | Jogos/edições, vínculos, capa e preços em centavos |
| estoque | Saldo por jogo |
| avaliacoes | Notas e fontes originais |
| desejos | Lista privada e observações |
| schema_migrations | Controle de migrations já aplicadas |

Cada jogo possui uma plataforma, um gênero e uma distribuidora. Um título pode ser
cadastrado para plataformas diferentes. Tabelas têm `created_at` e `updated_at`. Jogos também guardam `dados_demonstracao`,
`fonte_url` e `fonte_consultada_em` para identificar a procedência da base.
Chaves estrangeiras e restrições também são verificadas pelo PostgreSQL.
O SQL de criação está em `backend/migrations/001-catalogo.sql`.

## 14. API HTTP

Agora as rotas têm prefixo **`/api`**, para separar a API das páginas React. Exemplos:

```bash
curl http://localhost:3001/api/saude
curl http://localhost:3001/api/jogos
curl 'http://localhost:3001/api/jogos?plataforma_id=1,2&disponivel=true'
```

| Método | Rota | Acesso |
| --- | --- | --- |
| POST | /api/cadastro | Público; cria cliente |
| POST | /api/login | Público; retorna token e conta |
| POST | /api/logout | Conectado |
| GET | /api/jogos e /api/jogos/:id | Público |
| GET | /api/plataformas, /api/generos, /api/distribuidoras, /api/criticos, /api/estoque, /api/avaliacoes | Público |
| GET, PATCH, DELETE | /api/conta | Própria conta |
| GET, POST | /api/desejos | Própria lista |
| PATCH, DELETE | /api/desejos/:id | Próprio desejo |
| GET, POST | /api/admin/:cadastro | Administrador |
| PATCH, DELETE | /api/admin/:cadastro/:id | Administrador |

`:cadastro` aceita jogos, plataformas, generos, distribuidoras, criticos, estoque,
avaliacoes e usuarios. Envie `Authorization: Bearer TOKEN` nas rotas protegidas.
Filtros: busca, plataforma_id, genero_id, distribuidora_id, disponivel e promocao.
IDs podem ser separados por vírgula para seleção múltipla; booleanos usam true/false.

Na API, preços continuam em **centavos inteiros**. Exemplo de criação de jogo:

```json
{
  "titulo": "Jogo exemplo",
  "descricao": "Edição física",
  "capa_url": null,
  "plataforma_id": 1,
  "genero_id": 1,
  "distribuidora_id": 1,
  "preco_centavos": 12000,
  "promocao_centavos": null
}
```

## 15. Testes

Crie bancos **exclusivos e descartáveis** de testes, com o mesmo proprietário usado
em `backend/.env`:

```sql
CREATE DATABASE lambari_games_test OWNER lambari;
CREATE DATABASE lambari_games_ui_test OWNER lambari;
```

Depois, na raiz:

```bash
npm test
npm run build
```

Os testes do backend usam `lambari_games_test`; o teste React → HTTP → PostgreSQL usa
`lambari_games_ui_test`. **As tabelas desses dois bancos são limpas pelos testes**.
Não coloque dados importantes neles. O banco normal configurado para a loja não é
usado por essas suítes.

Se forem necessários outros bancos/credenciais de teste, informe
`TEST_DATABASE_URL` para o backend e `TEST_UI_DATABASE_URL` para o frontend.
Os nomes desses bancos precisam terminar em `_test`. Essas URLs devem estar no
ambiente do comando; não são configuração pública de frontend.

Também pode testar os formulários sem PostgreSQL:

```bash
cd frontend
npx vitest run src/test/flows.test.jsx
```

Validações realizadas nesta implementação:

- 12 testes de backend com PostgreSQL real, incluindo migrations, permissões, CRUDs,
  filtros, desejos privados, sessões, persistência e terminal.
- 9 testes de componentes e formulários React.
- 1 teste integrado real de React → HTTP → PostgreSQL: login, criar/editar jogo,
  estoque, desejos, observações e logout.
- Compilação de produção do Vite.

Os testes de interface utilizam DOM simulado. Não foi possível fazer inspeção visual
em um navegador real neste ambiente. Os testes foram executados em macOS; os scripts
e instruções de execução foram preparados para Linux.

## 16. Backup e problemas comuns

Com o PostgreSQL em execução, faça backup usando os dados da sua instalação:

```bash
pg_dump -h 127.0.0.1 -p 5432 -U lambari -d lambari_games -Fc -f lambari_backup.dump
```

A senha pode ser solicitada pelo utilitário. Para restaurar, use `pg_restore` em
um banco de destino apropriado; preserve os dados existentes antes de substituir.
O backup não é incluído no ZIP, pois contém dados e contas do usuário.

| Problema | O que conferir |
| --- | --- |
| Não conecta ao PostgreSQL | Serviço iniciado, DB_HOST/PORT, usuário, senha e banco de backend/.env |
| Porta 3001 ocupada | Encerre o processo antigo ou altere PORT; ajuste o proxy no desenvolvimento |
| Site mostra somente mensagem da API | Execute npm run build na raiz ou inicie o Vite na porta 5173 |
| Erro de conexão no catálogo | API disponível, caminho /api e proxy/URL configurados |
| Administrador inicial já existe | Entre com a conta já criada; crie outros em Administração → Usuários |
| Não há opções para criar jogo | Cadastre plataforma, gênero e distribuidora primeiro |
| Registro duplicado | Revise email, nome, título/plataforma ou vínculo já existente |
| Exclusão bloqueada | Remova ou altere os vínculos do cadastro auxiliar |
| Capas não carregam | Confira a URL e a internet; o sistema utiliza capa alternativa |
| Outro computador não abre localhost | localhost é o próprio computador; configure acesso à rede explicitamente se necessário |

O uso padrão é local, em `127.0.0.1`. Não há publicação automática na internet.
Nenhum commit/push foi feito nos repositórios de referência.
