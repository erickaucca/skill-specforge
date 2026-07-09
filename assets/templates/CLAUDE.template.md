# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos e projeto (specforge)

> Seção gerenciada por `/specforge-init-project` — atualizada automaticamente a cada execução
> com base na análise do projeto. Não customize manualmente; adicione suas próprias
> convenções em outras seções deste arquivo.

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
{{COMANDO_TEST_COBERTURA}}    # unitários com relatório de cobertura (gate: ≥ 80%)
{{COMANDO_TEST_INTEGRACAO}}   # apenas integração

# Lint / format
{{COMANDO_LINT}}
{{COMANDO_FORMAT}}
```

**Nome:** {{PROJECT_NAME}}
**Stack:** {{STACK}}
**Versão:** {{VERSAO}}

Arquitetura e estrutura de pastas detalhadas: `.claude/steering/architecture.md`
Regras de negócio e vocabulário do domínio: `.claude/steering/domain-rules.md`

## Convenções de commit

Padrão: `type(scope): descrição` — ex: `feat(pedido): adiciona validação de estoque`

| type | quando usar |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `refactor` | mudança sem alterar comportamento |
| `test` | adição ou correção de testes |
| `chore` | configuração, dependências, CI |

Commits devem referenciar o ID do work item quando aplicável: `feat(pedido): calcula frete mínimo [ENG-1234]`

O `/specforge-execute-spec` commita automaticamente ao final da execução, usando um padrão
fixo (diferente da tabela acima): `feat({ID}): {título do work item} — specforge-execute-spec`.

## Comandos da skill specforge

Disponíveis em qualquer sessão Claude Code após instalar a skill:

- `/specforge-init-project` — recria ou atualiza a estrutura `.claude/` deste projeto
- `/specforge-create-spec [ID]` — gera spec técnica a partir do work item (Azure DevOps ou Linear)
- `/specforge-execute-spec [ID]` — implementa o que está em `docs/specs/{ID}-spec.md`
- `/specforge-migrate-specs` — migra specs antigas de `.claude/specs/` para `docs/specs/` (execute uma vez se atualizou o specforge)

Specs geradas ficam em `docs/specs/` — commite junto com o código da implementação.
Changelogs de implementação ficam em `docs/changelogs/`.
