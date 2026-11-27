# Validação da versão web com PostgreSQL

Data: 02/11/2026.

- 12 testes do backend aprovados em PostgreSQL real.
- 9 testes de componentes/formulários React aprovados.
- 1 fluxo integrado React → HTTP → PostgreSQL aprovado: autenticar administrador,
  criar/editar jogo, registrar estoque, adicionar desejo, editar observação e sair.
- Build de produção do Vite aprovado.
- Servidor compilado responde às rotas de página inicial, login e administração,
  além dos endpoints de saúde e catálogo.
- A versão anterior foi mantida em outra pasta, sem alterações no SQLite original.

A inspeção visual em navegador real não estava disponível nesta execução.
As interações foram verificadas em DOM simulado, com integração HTTP e PostgreSQL.
O ambiente de teste foi macOS; os comandos e scripts da entrega são preparados para Linux.

O banco normal utiliza configuração própria. Os testes utilizam bases isoladas
terminadas em `_test`, cujas tabelas podem ser limpas pelo teste.

O ZIP não contém bancos, contas, credenciais, .env pessoal ou node_modules.
Siga o README para configurar a instalação e criar seu próprio administrador.

Atualização da base: 50 jogos para PC e 50 capas incluídas. Carga repetível testada,
preservando preços, estoque e descrições existentes. Notas Metacritic somente quando
informadas pela fonte Steam. Valores demonstrativos identificados na interface.
