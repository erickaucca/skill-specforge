---
description: Reaplica o /specforge-init-project em todos os projetos vinculados do workspace (após atualizar o plugin)
model: sonnet
---

Reaplica o fluxo do `/specforge-init-project` em cada projeto vinculado do workspace, para que
herdem as novidades do plugin. Sem argumentos; rode na pasta workspace depois de
`claude plugin update`.

## Passo 1 — Projetos vinculados

Leia a tabela `## Projetos vinculados (specforge)` do `CLAUDE.md` da pasta atual. Sem arquivo,
seção ou linhas: "Nenhum projeto vinculado neste workspace. Rode `/specforge-add-project <url>`
primeiro." e interrompa.

Localize pela skill `specforge` o caminho absoluto de `assets/commands/specforge-init-project.md`
(`{init}`) — **não leia o conteúdo aqui**; cada sub-agente lê.

## Passo 2 — Um sub-agente por projeto

Para cada projeto, na ordem da tabela:
- **Pasta do projeto não existe:** registre `✗ pasta não encontrada — remova a linha da tabela e
  apague .claude/{pasta}/ se o projeto não existe mais` e siga.
- **Senão:** despache um sub-agente `general-purpose` com `model: sonnet` (um por vez) com o prompt:
  ```
  Leia {init} e execute o fluxo completo do /specforge-init-project (ele escolhe o modo:
  completo, steering ou merge). Não faça perguntas.
  - Diretório do projeto: {pasta}/ (código, docs/specs/, docs/changelogs/)
  - Diretório de configuração: .claude/{pasta sem a barra}/ (CLAUDE.md e .claude/steering/)
  - Se .claude/{pasta}/CLAUDE.md não existir mas {pasta}/CLAUDE.md existir (formato antigo): use o
    antigo (e o .claude/steering/ ao lado dele) como base do merge, grave o resultado no novo local
    e não apague os arquivos antigos.
  Responda só uma linha: "atualizado: {resumo curto}" | "sem alterações" | "criado do zero" |
  "migrado: {resumo}" | "erro: {mensagem}".
  ```
  Guarde só essa linha.

## Passo 3 — Relatório

```
✓ /specforge-update concluído — {N} projeto(s)

| Projeto | Resultado |
|---|---|
| {nome} | ✓ Atualizado — {resumo} |
| {nome} | ✓ Sem alterações |
| {nome} | ✓ Criado do zero em .claude/{pasta}/ |
| {nome} | ⚠ Migrado para .claude/{pasta}/ — remova CLAUDE.md/.claude/steering/ antigos do repositório depois de conferir |
| {nome} | ✗ Erro: {mensagem} |

{Se houver erros: ⚠ {K} projeto(s) com erro — corrija e rode /specforge-update novamente.}
```
