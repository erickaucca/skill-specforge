# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**skill-specforge** é um plugin de Claude Code que automatiza geração e implementação de specs técnicas a partir de work items do **Azure DevOps** ou **Linear**. Instalado via `claude plugin marketplace add` + `claude plugin install`, ele expõe slash commands e sub-agentes que ficam disponíveis imediatamente em qualquer projeto, sem etapa de instalação adicional no projeto-alvo.

O fluxo é organizado em torno de um **workspace**: uma pasta onde um ou mais repositórios são
clonados e vinculados via `/specforge-add-project`. O workspace tem seu próprio `CLAUDE.md`
(distinto do `CLAUDE.md` de cada projeto clonado dentro dele), com a lista de projetos vinculados
na seção `## Projetos vinculados (specforge)` e, opcionalmente, a lista de usuários que podem
responder dúvidas de spec (registrados via `/specforge-add-user`) na seção
`## Usuários para dúvidas (specforge)`. `/specforge-analyzer` roda a partir do workspace e usa
essas seções para decidir qual projeto um card afeta e quem referenciar ao comentar dúvidas.
`/specforge-analyzer-all` repete o fluxo do `/specforge-analyzer` para todos os cards da coluna
Backlog, em sequência.

## Organização

Este repositório é o **código-fonte do plugin** — não o projeto que o usa. Segue a convenção de plugins do Claude Code: `commands/` e `agents/` na raiz são descobertos automaticamente após `claude plugin install`.

- `commands/` — slash commands do plugin, disponíveis imediatamente em qualquer projeto/workspace após instalar: `/specforge-add-project`, `/specforge-add-user`, `/specforge-analyzer`, `/specforge-analyzer-all`, `/specforge-create-spec`, `/specforge-execute-spec`
- `agents/` — os 4 sub-agentes despachados por `/specforge-create-spec` e `/specforge-analyzer`/`/specforge-analyzer-all` (developer, qa, tech-lead, coordinator), também disponíveis imediatamente após instalar
- `assets/commands/specforge-init-project.md` — instruções de `/specforge-init-project`, acionado via a Skill (`SKILL.md`) porque precisa ler `assets/templates/CLAUDE.template.md` do próprio plugin; gera ou mescla `CLAUDE.md` e `.claude/steering/` no projeto-alvo (nunca copia commands/agents — esses já vêm do plugin). `/specforge-add-project` invoca esse mesmo fluxo, escopado à pasta do projeto recém-clonado.
- `assets/steering/` — exemplos de referência do formato esperado de `.claude/steering/`; não são copiados literalmente (`/specforge-init-project` sempre escreve conteúdo derivado da análise real do projeto-alvo)
- `assets/templates/CLAUDE.template.md` — template copiado (ou mesclado, se `CLAUDE.md` já existir) para `CLAUDE.md` do projeto-alvo

`SKILL.md` define o frontmatter da skill (`name`, `description`) que aciona `/specforge-init-project`. O workflow em `.github/workflows/claude.yml` roda `claude-code-action` automaticamente em issues e comentários de PR — requer o secret `CLAUDE_CODE_OAUTH_TOKEN`.

O `agent-coordinator` publica a spec no card em dois modos: `comentário` (padrão, usado por
`/specforge-create-spec`) ou `task` (usado por `/specforge-analyzer`, que também move o card entre
colunas/estados do tracker — "Triaged / Refinement" quando há dúvidas, "Ready for Development"
quando a spec é publicada).

## Como contribuir

Não há build ou testes — o projeto é inteiramente Markdown e YAML.

- Para mudar o comportamento de um comando: edite `commands/`.
- Para mudar o comportamento de um sub-agente: edite `agents/`.
- Para mudar a geração/merge de `CLAUDE.md` ou steering no projeto-alvo: edite `assets/commands/specforge-init-project.md`.
- Para mudar o CLAUDE.md gerado: edite `assets/templates/CLAUDE.template.md`.
- Para mudar como a spec é publicada no card (comentário vs. task) ou as tarefas criadas: edite `agents/specforge-agent-coordinator.md`.
- Antes de publicar uma nova versão: preencha `name` e `description` em `SKILL.md` e bump a versão em `.claude-plugin/marketplace.json`.
