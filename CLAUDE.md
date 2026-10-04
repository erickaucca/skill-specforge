# CLAUDE.md

Guia para o Claude Code neste repositório. A narrativa completa do fluxo e das decisões está em
`docs/design-notes.md` — leia sob demanda antes de mudar o comportamento de um comando ou agente.

## O que é

Plugin de Claude Code (**skill-specforge**) que transforma work items do **Azure DevOps** ou
**Linear** em specs técnicas e implementações. Este repositório é o código-fonte do plugin, não o
projeto que o usa. Sem build. Markdown, YAML e o instalador (Node, zero dependências); só o instalador tem testes (`npm test`, `node:test` com um `claude` falso).

## Conceitos

- **Workspace**: pasta onde repositórios são clonados e vinculados via `/specforge-add-project`.
  Seu `CLAUDE.md` tem as seções `## Projetos vinculados (specforge)` e
  `## Usuários para dúvidas (specforge)`.
- **Diretório do projeto** (código, `docs/specs/`, `docs/changelogs/`, sempre dentro do repositório)
  vs. **diretório de configuração** (`CLAUDE.md` + `.claude/steering/`). Coincidem quando
  `/specforge-init-project` roda direto no projeto; via `/specforge-add-project`/`/specforge-update`
  a configuração fica em `.claude/{projeto}/` no workspace, fora do repositório.
  `create-spec`/`execute-spec` resolvem sozinhos (`../.claude/{pasta atual}/CLAUDE.md` primeiro);
  `developer`/`qa`/`tech-lead` recebem os dois diretórios no despacho.

## Organização

- `commands/` — slash commands: `/specforge-add-project`, `-add-user`, `-update`, `-analyzer`,
  `-analyzer-all`, `-create-spec`, `-execute-spec`
- `agents/` — sub-agentes `developer`, `qa`, `tech-lead`, `coordinator`
- `assets/commands/specforge-init-project.md` — fluxo do `/specforge-init-project`, acionado pela
  skill (`SKILL.md`); gera ou mescla `CLAUDE.md` e `.claude/steering/` do projeto-alvo
- `assets/steering/` (exemplos de formato) e `assets/templates/CLAUDE.template.md`
- `bin/install.js`, `lib/mcps.js`, `lib/mcp-run.js`, `package.json` — instalador interativo
  (`npx github:erickaucca/skill-specforge`): plugin + MCPs (gestor de demandas, git, SQL Server,
  Confluence). Segredos vão para `~/.specforge/.env` e os MCPs stdio sobem pelo launcher
  `mcp-run.js`; nenhum segredo fica na configuração do Claude. `--check` faz o diagnóstico
  somente leitura (MCPs, `.env`, launcher e o workspace da pasta atual).
- `.claude-plugin/marketplace.json` (`metadata.version`) e `plugin.json` (`version`, a que
  `claude plugin list` exibe)
- `.github/workflows/claude.yml` — `claude-code-action` (requer o secret `CLAUDE_CODE_OAUTH_TOKEN`)

## Invariantes (não quebrar)

- **analyzer / analyzer-all**: nenhuma pergunta no console; dúvidas viram comentário no card e ele
  vai para "Triaged / Refinement". Spec publicada como **uma task `spec - {projeto}` por projeto**
  (nada gravado localmente) e card para "Ready for Development". Colunas por correspondência de
  nome, nunca perguntando.
- **Reprovação do tech-lead nunca vira comentário**: ciclo interno de correção. O tech-lead nunca
  recebe o histórico de rodadas. Proteção de 10 rodadas → comentário
  `## Revisão técnica não convergiu` e "Triaged / Refinement".
- **execute-spec**: MCP obrigatório para confirmar o card; nunca implementa na branch principal
  (usa `specforge/{ID}`); ordem fixa: confirmar card → branch → implementar → testes → coerência →
  commit → push → changelog → tasks/coluna. Move para "In Code Review" sem alterar o status; a task
  `qa - {projeto}` nunca é concluída pelo comando; abrir PR é manual.
- **Banco de dados**: consulta sempre somente leitura; sem MCP de banco, pula em silêncio.

## Como contribuir

- Comando: edite `commands/`. Sub-agente: `agents/`. Publicação da spec no card (comentário vs.
  task): `agents/specforge-agent-coordinator.md`.
- `/specforge-init-project`: `assets/commands/specforge-init-project.md`; `CLAUDE.md` gerado:
  `assets/templates/CLAUDE.template.md`.
- Mudou `bin/install.js` ou `lib/`: rode `npm test` (`test/installer.test.js`; as perguntas são respondidas por regex, então ajuste os testes se mudar o texto ou a ordem delas).
- Nova versão: preencha `name`/`description` em `SKILL.md` e bump de versão em
  `.claude-plugin/marketplace.json`, `.claude-plugin/plugin.json` e `package.json`.
