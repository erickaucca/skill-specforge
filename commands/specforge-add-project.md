---
description: Clona um repositório no workspace, gera a configuração specforge dele em .claude/{projeto}/ e o registra no CLAUDE.md do workspace
argument-hint: <url do repositório git>
---

Clona um repositório para o workspace atual, inicializa a configuração specforge dele (fora do
repositório, em `.claude/{projeto}/`) e o registra no `CLAUDE.md` do workspace.

URL do repositório: $ARGUMENTS

Se nenhuma URL for informada, pergunte antes de continuar.

## Passo 1 — Nome do projeto

Último segmento da URL sem `.git` (ex.: `.../pedidos-api.git` → `pedidos-api`).
- Pasta `{nome}/` já existe: pergunte se usa outro nome ou cancela. Nunca sobrescreva.
- `.claude/{nome}/` já existe com conteúdo (configuração órfã de um projeto removido): pergunte
  "Já existe uma configuração specforge para '{nome}' em `.claude/{nome}/`. Reaproveitar (o novo
  código será mesclado contra ela), começar do zero ou cancelar?" — do zero: apague o conteúdo de
  `.claude/{nome}/`; cancelar: pare sem clonar.

## Passo 2 — Clonar

`git clone --branch main <url> {nome}`; se `main` não existir, `--branch master`; se nenhuma,
sem `--branch` (informe a branch usada). Clone falhou: mostre o erro do git e pare sem tocar no
`CLAUDE.md` do workspace. Em falha de autenticação, sugira guardar o token pelo instalador
(`npx github:erickaucca/skill-specforge`, etapa Repositórios) ou conferir com
`npx github:erickaucca/skill-specforge --check`.

## Passo 3 — Inicializar

Crie `.claude/{nome}/` e invoque a skill `specforge` para o fluxo do `/specforge-init-project` com:
- **Diretório do projeto:** `{nome}/` (análise e `docs/`)
- **Diretório de configuração:** `.claude/{nome}/` (`CLAUDE.md` e `.claude/steering/`)

Aguarde o fim; o Passo 4 usa a stack detectada.

## Passo 4 — Registrar no CLAUDE.md do workspace

Colete:
- **Stack:** campo `**Stack:**` de `.claude/{nome}/CLAUDE.md`, em poucas palavras (ex.: `Node 20 + React`).
- **Para que serve:** uma frase simples (o que o sistema faz) a partir do primeiro parágrafo útil
  de `{nome}/README.md` ou do `description` de `package.json`/`pom.xml`; senão `<!-- TODO: preencher -->`.

**`CLAUDE.md` do workspace não existe** — crie:

```markdown
# CLAUDE.md

Workspace specforge — projetos vinculados via `/specforge-add-project`.

## Projetos vinculados (specforge)

> Seção gerenciada por `/specforge-add-project`. Para remover um projeto, apague a pasta dele, a
> pasta `.claude/{pasta}/` e a linha da tabela.
> Contexto de cada projeto: `.claude/{pasta}/CLAUDE.md` e `.claude/{pasta}/.claude/steering/`
> (não o `CLAUDE.md` de dentro do repositório, que é do time).

| Projeto | Pasta | Stack | Para que serve | Repositório | Branch | Adicionado em |
|---|---|---|---|---|---|---|
| {nome} | `{nome}/` | {stack} | {para que serve} | {url} | {branch} | {AAAA-MM-DD} |
```

**Já existe:**
- Com a seção `## Projetos vinculados (specforge)`: se a tabela não tiver `Stack`/`Para que
  serve`, adicione as colunas (`<!-- TODO: preencher -->` nas linhas antigas). Linha com a mesma
  pasta: atualize-a; senão, acrescente. Se faltar a nota `>` sobre onde fica o contexto de cada
  projeto, acrescente-a ao bloco existente.
- Sem a seção: acrescente-a ao fim, igual ao bloco acima.
- Nunca altere outras seções.

## Passo 5 — Relatório

```
✓ Projeto adicionado — {nome}
Repositório: {url} (branch: {branch}) · Clonado em ./{nome}/
Configuração specforge: ./.claude/{nome}/ (fora do repositório; docs/specs/ e docs/changelogs/ ficam no projeto)
CLAUDE.md do workspace: {criado | atualizado}

{resumo do /specforge-init-project}

Próximos passos:
  1. Se ainda não registrou quem responde dúvidas: /specforge-add-user <email>
  2. /specforge-analyzer [ID] no workspace, ou /specforge-create-spec [ID] dentro de ./{nome}/
```
