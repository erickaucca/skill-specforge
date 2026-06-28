# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos essenciais

```bash
# Instalar dependências
{{COMANDO_INSTALL}}

# Rodar em desenvolvimento
{{COMANDO_DEV}}

# Build
{{COMANDO_BUILD}}

# Testes
{{COMANDO_TEST}}              # todos
{{COMANDO_TEST_UNITARIO}}     # apenas unitários
{{COMANDO_TEST_INTEGRACAO}}   # apenas integração

# Lint / format
{{COMANDO_LINT}}
{{COMANDO_FORMAT}}
```

## Projeto

**Stack:** {{STACK}}
**Versão:** {{VERSAO}}

Arquitetura e estrutura de pastas detalhadas: `.claude/steering/architecture.md`
Regras de negócio e vocabulário do domínio: `.claude/steering/domain-rules.md`

## Convenções de commit

Padrão: `type(scope): descrição` — ex: `feat(sinistro): adiciona validação de franquia`

| type | quando usar |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `refactor` | mudança sem alterar comportamento |
| `test` | adição ou correção de testes |
| `chore` | configuração, dependências, CI |

Commits devem referenciar o ID do work item quando aplicável: `feat(cotacao): calcula prêmio mínimo [WI-1234]`

## Comandos da skill specforge

Disponíveis em qualquer sessão Claude Code após instalar a skill:

- `/specforge-init-project` — recria ou atualiza a estrutura `.claude/` deste projeto
- `/specforge-gera-spec [ID]` — gera spec técnica a partir do work item (Azure DevOps ou Linear)
- `/specforge-implementa-spec [ID]` — implementa o que está em `.claude/specs/WI-{{ID}}.md`

Specs geradas ficam em `.claude/specs/` — commite junto com o código da implementação.
