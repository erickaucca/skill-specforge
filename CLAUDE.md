# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**skill-specforge** é um plugin de Claude Code que automatiza geração e implementação de specs técnicas a partir de work items do **Azure DevOps** ou **Linear**. Instalado via `claude plugin marketplace add` + `claude plugin install`, ele expõe slash commands e sub-agentes que ficam disponíveis imediatamente em qualquer projeto, sem etapa de instalação adicional no projeto-alvo.

## Organização

Este repositório é o **código-fonte do plugin** — não o projeto que o usa. Segue a convenção de plugins do Claude Code: `commands/` e `agents/` na raiz são descobertos automaticamente após `claude plugin install`.

- `commands/` — slash commands do plugin, disponíveis imediatamente em qualquer projeto após instalar: `/specforge-create-spec`, `/specforge-execute-spec`, `/specforge-migrate-specs`
- `agents/` — os 4 sub-agentes despachados por `/specforge-create-spec` (developer, qa, tech-lead, coordinator), também disponíveis imediatamente após instalar
- `assets/commands/specforge-init-project.md` — instruções de `/specforge-init-project`, acionado via a Skill (`SKILL.md`) porque precisa ler `assets/templates/CLAUDE.template.md` do próprio plugin; gera ou mescla `CLAUDE.md` e `.claude/steering/` no projeto-alvo (nunca copia commands/agents — esses já vêm do plugin)
- `assets/steering/` — exemplos de referência do formato esperado de `.claude/steering/`; não são copiados literalmente (`/specforge-init-project` sempre escreve conteúdo derivado da análise real do projeto-alvo)
- `assets/templates/CLAUDE.template.md` — template copiado (ou mesclado, se `CLAUDE.md` já existir) para `CLAUDE.md` do projeto-alvo

`SKILL.md` define o frontmatter da skill (`name`, `description`) que aciona `/specforge-init-project`. O workflow em `.github/workflows/claude.yml` roda `claude-code-action` automaticamente em issues e comentários de PR — requer o secret `CLAUDE_CODE_OAUTH_TOKEN`.

## Como contribuir

Não há build ou testes — o projeto é inteiramente Markdown e YAML.

- Para mudar o comportamento de um comando: edite `commands/`.
- Para mudar o comportamento de um sub-agente: edite `agents/`.
- Para mudar a geração/merge de `CLAUDE.md` ou steering no projeto-alvo: edite `assets/commands/specforge-init-project.md`.
- Para mudar o CLAUDE.md gerado: edite `assets/templates/CLAUDE.template.md`.
- Antes de publicar uma nova versão: preencha `name` e `description` em `SKILL.md` e bump a versão em `.claude-plugin/marketplace.json`.
