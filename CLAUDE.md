# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**skill-specforge** é uma skill para Claude Code que automatiza geração e implementação de specs técnicas a partir de work items do **Azure DevOps** ou **Linear**. Instalada via `npx skills add`, ela injeta três slash commands no projeto-alvo.

## Organização

Este repositório é o **código-fonte da skill** — não o projeto que a usa. Os arquivos em `assets/` são templates que `/specforge-init-project` copia para `.claude/` do projeto-alvo:

- `assets/commands/` → `.claude/commands/` — slash commands `/specforge-create-spec` e `/specforge-execute-spec`
- `assets/steering/` → `.claude/steering/` — contexto persistente de arquitetura e domínio
- `assets/templates/CLAUDE.template.md` → `CLAUDE.md` gerado no projeto-alvo

`SKILL.md` define o frontmatter da skill (`name`, `description`). O workflow em `.github/workflows/claude.yml` roda `claude-code-action` automaticamente em issues e comentários de PR — requer o secret `CLAUDE_CODE_OAUTH_TOKEN`.

## Como contribuir

Não há build ou testes — o projeto é inteiramente Markdown e YAML.

- Para mudar o comportamento de um comando: edite `assets/commands/`.
- Para mudar o contexto injetado nos projetos: edite `assets/steering/`.
- Para mudar o CLAUDE.md gerado: edite `assets/templates/CLAUDE.template.md`.
- Antes de publicar uma nova versão: preencha `name` e `description` em `SKILL.md`.
