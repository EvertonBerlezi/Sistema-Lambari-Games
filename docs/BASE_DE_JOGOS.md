# Base de jogos pesquisada — Lambari Games

Consulta: 2026-11-02T20:27:32.849Z.

50 registros para PC, conferidos no endpoint público `https://store.steampowered.com/api/appdetails` e nas páginas da loja Steam. Não foram coletados preços de venda ou estoques da loja física.

## Conteúdo e origem

- Título, distribuidora, disponibilidade Windows e dados Metacritic: informação retornada pela Steam.
- Gênero principal: curadoria para os filtros; gêneros originais mantidos em `generos_fonte`.
- Descrições: redação própria, curta, em português; não são descrições longas copiadas das lojas.
- Capas: imagens da CDN da Steam, incluídas em `frontend/public/capas`. A URL original está em `capa_original_url`. Direitos das respectivas editoras.
- Notas: 44 registros têm nota e link Metacritic informados pela Steam. Notas ausentes permanecem ausentes; não há notas IGN geradas.
- Os valores e saldos usados pelo importador são de demonstração e são identificados na interface. Não representam preços atuais da Steam nem o estoque real da loja.
- Cada entrada contém a URL da página do jogo e a data da consulta. O JSON é um retrato da pesquisa, não uma sincronização contínua.

## Carregar no PostgreSQL

Em `backend`, depois de configurar `.env` e instalar as dependências:

```bash
npm run db:catalogo
```

As migrations são verificadas antes da carga. A carga é transacional e adiciona somente os títulos ausentes na plataforma PC. Repetir não duplica nem sobrescreve dados.

Para usar dados reais, revise preço e estoque e desmarque a indicação de demonstração no cadastro do jogo.

## Relação pesquisada

| Jogo | Gênero principal | Distribuidora informada | Metacritic (PC) | Fonte |
| --- | --- | --- | --- | --- |
| ELDEN RING | RPG | FromSoftware, Inc. / Bandai Namco Entertainment | 94/100 | [Steam](https://store.steampowered.com/app/1245620/) |
| Hollow Knight | Metroidvania | Team Cherry | 87/100 | [Steam](https://store.steampowered.com/app/367520/) |
| Stardew Valley | Simulação | ConcernedApe | 89/100 | [Steam](https://store.steampowered.com/app/413150/) |
| Hades | Roguelike | Supergiant Games | 93/100 | [Steam](https://store.steampowered.com/app/1145360/) |
| Terraria | Sobrevivência | Re-Logic | 83/100 | [Steam](https://store.steampowered.com/app/105600/) |
| Baldur's Gate 3 | RPG | Larian Studios | 96/100 | [Steam](https://store.steampowered.com/app/1086940/) |
| Celeste | Plataforma | Maddy Makes Games Inc. | 88/100 | [Steam](https://store.steampowered.com/app/504230/) |
| Dead Cells | Roguelike | Motion Twin | 89/100 | [Steam](https://store.steampowered.com/app/588650/) |
| The Witcher 3: Wild Hunt — Remastered | RPG | CD PROJEKT RED | 93/100 | [Steam](https://store.steampowered.com/app/292030/) |
| Cyberpunk 2077 | RPG | CD PROJEKT RED | 86/100 | [Steam](https://store.steampowered.com/app/1091500/) |
| Red Dead Redemption 2 | Ação e aventura | Rockstar Games | 93/100 | [Steam](https://store.steampowered.com/app/1174180/) |
| Portal 2 | Quebra-cabeça | Valve | 95/100 | [Steam](https://store.steampowered.com/app/620/) |
| Portal | Quebra-cabeça | Valve | 90/100 | [Steam](https://store.steampowered.com/app/400/) |
| Half-Life | Tiro | Valve | 96/100 | [Steam](https://store.steampowered.com/app/70/) |
| Half-Life 2 | Tiro | Valve | 96/100 | [Steam](https://store.steampowered.com/app/220/) |
| Left 4 Dead 2 | Tiro cooperativo | Valve | 89/100 | [Steam](https://store.steampowered.com/app/550/) |
| Deep Rock Galactic | Tiro cooperativo | Coffee Stain Publishing | 85/100 | [Steam](https://store.steampowered.com/app/548430/) |
| Dead by Daylight | Terror | Behaviour Interactive Inc. | Não informado | [Steam](https://store.steampowered.com/app/381210/) |
| Don't Starve Together | Sobrevivência | Klei Entertainment | 83/100 | [Steam](https://store.steampowered.com/app/322330/) |
| Don't Starve | Sobrevivência | Klei Entertainment | 79/100 | [Steam](https://store.steampowered.com/app/219740/) |
| Slay the Spire | Estratégia | Mega Crit | 89/100 | [Steam](https://store.steampowered.com/app/646570/) |
| The Binding of Isaac: Rebirth | Roguelike | Nicalis, Inc. | Não informado | [Steam](https://store.steampowered.com/app/250900/) |
| Bloons TD 6 | Estratégia | Ninja Kiwi | Não informado | [Steam](https://store.steampowered.com/app/960090/) |
| Hearts of Iron IV | Estratégia | Paradox Interactive | 83/100 | [Steam](https://store.steampowered.com/app/394360/) |
| Sid Meier’s Civilization VI | Estratégia | 2K / Aspyr (Mac) / Aspyr (Linux) | 88/100 | [Steam](https://store.steampowered.com/app/289070/) |
| Stellaris | Estratégia | Paradox Interactive | 78/100 | [Steam](https://store.steampowered.com/app/281990/) |
| RimWorld | Simulação | Ludeon Studios | 87/100 | [Steam](https://store.steampowered.com/app/294100/) |
| Cities: Skylines | Simulação | Paradox Interactive | 85/100 | [Steam](https://store.steampowered.com/app/255710/) |
| Factorio | Automação | Wube Software LTD. | 90/100 | [Steam](https://store.steampowered.com/app/427520/) |
| The Elder Scrolls V: Skyrim Special Edition | RPG | Bethesda Softworks | 74/100 | [Steam](https://store.steampowered.com/app/489830/) |
| Fallout 4 | RPG | Bethesda Softworks | 84/100 | [Steam](https://store.steampowered.com/app/377160/) |
| Fallout: New Vegas | RPG | Bethesda Softworks | 84/100 | [Steam](https://store.steampowered.com/app/22380/) |
| Sekiro: Shadows Die Twice - GOTY Edition | Ação | Activision (Excluding Japan and Asia) / FromSoftware, Inc. (Japan) / 方块游戏 (Asia) | 88/100 | [Steam](https://store.steampowered.com/app/814380/) |
| DARK SOULS III | RPG | FromSoftware, Inc. / Bandai Namco Entertainment | 89/100 | [Steam](https://store.steampowered.com/app/374320/) |
| Resident Evil 4 | Terror | CAPCOM Co., Ltd. | 91/100 | [Steam](https://store.steampowered.com/app/2050650/) |
| Resident Evil 2 | Terror | CAPCOM Co., Ltd. | 89/100 | [Steam](https://store.steampowered.com/app/883710/) |
| Resident Evil Village | Terror | CAPCOM Co., Ltd. | 83/100 | [Steam](https://store.steampowered.com/app/1196590/) |
| Undertale | RPG | tobyfox | 92/100 | [Steam](https://store.steampowered.com/app/391540/) |
| BioShock Infinite | Tiro | 2K | 94/100 | [Steam](https://store.steampowered.com/app/8870/) |
| Tomb Raider Game of the Year | Ação e aventura | Crystal Dynamics / Feral Interactive (Mac) | 86/100 | [Steam](https://store.steampowered.com/app/203160/) |
| Rise of the Tomb Raider | Ação e aventura | Crystal Dynamics / Feral Interactive (Mac) / Feral Interactive (Linux) | 86/100 | [Steam](https://store.steampowered.com/app/391220/) |
| Shadow of the Tomb Raider: Definitive Edition | Ação e aventura | Crystal Dynamics / Feral Interactive (Mac) / Feral interactive (Linux) | 77/100 | [Steam](https://store.steampowered.com/app/750920/) |
| Enter the Gungeon | Roguelike | Devolver Digital | 84/100 | [Steam](https://store.steampowered.com/app/311690/) |
| Tom Clancy's Rainbow Six Siege | Tiro tático | Ubisoft | Não informado | [Steam](https://store.steampowered.com/app/359550/) |
| Vampire Survivors | Roguelike | poncle | 86/100 | [Steam](https://store.steampowered.com/app/1794680/) |
| Horizon Zero Dawn Complete Edition | Ação e aventura | PlayStation Publishing LLC | Não informado | [Steam](https://store.steampowered.com/app/1151640/) |
| God of War | Ação e aventura | PlayStation Publishing LLC | 93/100 | [Steam](https://store.steampowered.com/app/1593500/) |
| Marvel’s Spider-Man Remastered | Ação e aventura | PlayStation Publishing LLC | Não informado | [Steam](https://store.steampowered.com/app/1817070/) |
| Ori and the Will of the Wisps | Metroidvania | Xbox Game Studios | 88/100 | [Steam](https://store.steampowered.com/app/1057090/) |
| Ori and the Blind Forest | Metroidvania | Xbox Game Studios | 88/100 | [Steam](https://store.steampowered.com/app/261570/) |
