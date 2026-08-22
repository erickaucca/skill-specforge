Registra um ou mais emails no CLAUDE.md do workspace como usuários que podem responder dúvidas de spec nos cards — usados pelo `/specforge-analyzer` ao comentar dúvidas no card.

Email(s), separados por vírgula: $ARGUMENTS

Se nenhum email for informado, pergunte ao dev antes de continuar.

## Passo 1 — Validar os emails informados

Separe a lista por vírgula e remova espaços em branco ao redor de cada item.

Para cada item, valide um formato básico de email (contém `@` e um `.` após o `@`).

- **Se algum item for inválido:** avise quais itens são inválidos e prossiga apenas com os válidos.
- **Se todos forem inválidos:** informe "Nenhum email válido informado." e interrompa a execução.

## Passo 2 — Registrar os emails no CLAUDE.md do workspace

Este é o CLAUDE.md da pasta atual (workspace) — o mesmo arquivo mantido pelo `/specforge-add-project`, na seção `## Projetos vinculados (specforge)`.

**Se o CLAUDE.md do workspace não existir:** crie um novo com o conteúdo mínimo:

```markdown
# CLAUDE.md

Workspace specforge — projetos vinculados via `/specforge-add-project`.

## Usuários para dúvidas (specforge)

> Seção gerenciada por `/specforge-add-user` — usada pelo `/specforge-analyzer` para referenciar
> quem pode responder dúvidas de spec nos cards. Não edite manualmente; para remover um usuário,
> apague a linha correspondente.

- {email1}
- {email2}
```

**Se o CLAUDE.md do workspace já existir:**

1. Procure a seção com o cabeçalho exato `## Usuários para dúvidas (specforge)`.
2. **Se a seção existir:** compare os emails válidos do Passo 1 (comparação sem diferenciar
   maiúsculas/minúsculas) com a lista já existente.
   - Emails já presentes: não duplique.
   - Emails novos: adicione ao final da lista.
3. **Se a seção não existir:** acrescente-a ao final do arquivo, com o cabeçalho exato acima e a
   lista dos emails válidos informados.
4. Nunca edite, mova ou remova qualquer outra seção ou conteúdo já escrito no CLAUDE.md do
   workspace — inclusive a seção `## Projetos vinculados (specforge)`, se existir.

## Passo 3 — Confirmar o que foi feito

Exiba o relatório final:

```
✓ Usuário(s) registrado(s) para dúvidas de spec

{N} email(s) adicionado(s):
  - {email1}
  - {email2}
{Se algum já existia: "{K} email(s) já estavam registrados — sem alterações."}
{Se algum item foi rejeitado no Passo 1: "⚠ {J} item(ns) inválido(s) ignorado(s): {itens}"}

Esses emails serão referenciados pelo /specforge-analyzer ao comentar dúvidas em um card.
```
