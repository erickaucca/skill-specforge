---
description: Registra emails no CLAUDE.md do workspace como quem responde dúvidas de spec nos cards
argument-hint: <email1, email2, ...>
model: haiku
---

Registra emails na seção `## Usuários para dúvidas (specforge)` do `CLAUDE.md` do workspace,
usados pelo `/specforge-analyzer` para mencionar quem deve responder as dúvidas no card.

Email(s), separados por vírgula: $ARGUMENTS

Se nenhum email for informado, pergunte antes de continuar.

## Passo 1 — Validar

Separe por vírgula e tire espaços. Válido = contém `@` e um `.` depois do `@`. Avise os inválidos e
siga com os válidos; nenhum válido → "Nenhum email válido informado." e pare.

## Passo 2 — Gravar no `CLAUDE.md` da pasta atual

**Arquivo não existe** — crie:

```markdown
# CLAUDE.md

Workspace specforge — projetos vinculados via `/specforge-add-project`.

## Usuários para dúvidas (specforge)

> Seção gerenciada por `/specforge-add-user`. Para remover alguém, apague a linha.

- {email1}
- {email2}
```

**Arquivo existe:** com a seção, acrescente ao fim da lista só os emails ainda ausentes
(comparação sem diferenciar maiúsculas); sem a seção, acrescente-a ao fim do arquivo como acima.
Nunca altere outras seções.

## Passo 3 — Relatório

```
✓ Usuário(s) registrado(s) para dúvidas de spec
{N} adicionado(s): {emails}
{K já estavam registrados — sem alterações.}
{⚠ {J} inválido(s) ignorado(s): {itens}}
```
