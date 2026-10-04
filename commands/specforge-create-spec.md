---
description: Gera a spec técnica de um work item para o projeto atual, com os 4 sub-agentes e aprovação interativa
argument-hint: <ID do work item>
---

Gera a spec técnica de um work item (Azure DevOps ou Linear) para o projeto da pasta atual,
orquestrando os sub-agentes em sequência.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte antes de continuar.

## Passo 1 — Diretório de configuração

Se `../.claude/{nome da pasta atual}/CLAUDE.md` existir (projeto vinculado a um workspace), use
`../.claude/{nome da pasta atual}/` como `{config}`; senão use `.`. Apenas confirme que
`{config}/CLAUDE.md` e `{config}/.claude/steering/` existem — **não leia o conteúdo**: os
sub-agentes leem. Se nada existir, sugira rodar `/specforge-init-project` (ou
`/specforge-add-project` no workspace) e continue.

## Passo 2 — Work item via MCP

- **`linear`:** issue pelo ID (ex.: `ENG-1234`): título, descrição, labels, assignee, status,
  critérios de aceite.
- **`azure-devops`:** work item pelo ID: título, descrição, acceptance criteria, tags, área, iteração.
- Sem MCP: "Nenhum MCP de work tracker encontrado. Configure o MCP do Linear ou do Azure DevOps e
  tente novamente." e interrompa. Não encontrado: informe e interrompa.

Crie `docs/specs/tmp/` se não existir.

## Passo 3 — Sub-agentes

Contexto comum (`{card}`):
```
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {se houver}
- Diretório de configuração: {config}/
```

1. `specforge-agent-developer` com `{card}` + `MCP configurado: {linear | azure-devops}`.
   Sem `docs/specs/tmp/{ID}-solution.md` ao final: "agent-developer não criou
   docs/specs/tmp/{ID}-solution.md. Verifique os logs do agente." e interrompa.
2. `specforge-agent-qa` com `{card}`. Sem `docs/specs/tmp/{ID}-test-scenarios.md`: mensagem
   equivalente e interrompa.
3. `specforge-agent-tech-lead` com `{card}` + os dois documentos. Leia o status em
   `docs/specs/tmp/{ID}-spec-reviewed.md`: `REPROVADO` → exiba os critérios falhos e as ações e
   interrompa; arquivo ausente → mensagem equivalente e interrompa; `APROVADO` → siga.
4. `specforge-agent-coordinator` com `{card}` (sem o diretório de configuração) + `MCP
   configurado` + os três documentos (`{ID}-spec-reviewed.md`, `{ID}-solution.md`,
   `{ID}-test-scenarios.md`), modo padrão `comentário`. Ele cuida da aprovação humana, da gravação
   da spec, da publicação no card e das tarefas.
