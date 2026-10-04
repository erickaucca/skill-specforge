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
`../.claude/{nome da pasta atual}/` como `{config}` e `../.claude/specforge-metricas.md` como
`{métricas}`; senão use `.` e `.claude/specforge-metricas.md`. Apenas confirme que
`{config}/CLAUDE.md` e `{config}/.claude/steering/` existem — **não leia o steering**: os
sub-agentes leem. Se nada existir, sugira rodar `/specforge-init-project` (ou
`/specforge-add-project` no workspace) e continue.

## Passo 2 — Work item via MCP

- **`linear`:** issue pelo ID (ex.: `ENG-1234`): título, descrição, labels, assignee, status,
  critérios de aceite.
- **`azure-devops`:** work item pelo ID: título, descrição, acceptance criteria, tags, área, iteração.
- Sem MCP: "Nenhum MCP de work tracker encontrado. Configure o MCP do Linear ou do Azure DevOps e
  tente novamente." e interrompa. Não encontrado: informe e interrompa.

Crie `docs/specs/tmp/` se não existir.

## Passo 3 — Achados opcionais (somente leitura; sem MCP → pule em silêncio)

Os sub-agentes não têm acesso a MCP: estas consultas são feitas aqui e repassadas a eles.
- **Banco de dados:** se `**Banco de dados:**` de `{config}/CLAUDE.md` estiver preenchido e houver
  MCP desse banco, consulte estrutura e dados relevantes ao pedido **só com leitura** (`SELECT`,
  `SHOW`, `DESCRIBE`, `EXPLAIN`; nunca escrita/DDL; na dúvida, não execute). Resuma em `{achados banco}`.
- **Base de conhecimento:** se houver MCP de Confluence e/ou Notion, busque pelos termos de negócio
  do pedido e leia até 5 páginas relevantes (nunca crie nem edite). Resuma regras, fluxos e
  exceções, com o título da página, em `{achados base}` (até ~30 linhas). Se contradisser o card,
  mostre a contradição ao dev e pergunte qual vale antes de seguir.

## Passo 4 — Sub-agentes

Contexto comum (`{card}`):
```
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {se houver}
- Diretório de configuração: {config}/
```

1. `specforge-agent-developer` com `{card}` + `MCP configurado: {linear | azure-devops}` +
   `Achados de consulta ao banco de dados: {achados banco}` + `Achados da base de conhecimento:
   {achados base}`.
   - Resposta `DÚVIDA DE NEGÓCIO: …`: mostre as perguntas ao dev, colete as respostas e despache
     o developer de novo com `Esclarecimentos do dev: {respostas}` (até 2 vezes; depois, siga com
     o que houver). Sugira registrar as respostas no card.
   - Sem `docs/specs/tmp/{ID}-solution.md` ao final: "agent-developer não criou
     docs/specs/tmp/{ID}-solution.md. Verifique os logs do agente." e interrompa.
2. `specforge-agent-qa` com `{card}` + `Achados de consulta ao banco de dados`. Sem
   `docs/specs/tmp/{ID}-test-scenarios.md`: mensagem equivalente e interrompa.
3. `specforge-agent-tech-lead` com `{card}` + os dois documentos. Leia o status em
   `docs/specs/tmp/{ID}-spec-reviewed.md`: `REPROVADO` → exiba os critérios falhos e as ações e
   interrompa; arquivo ausente → mensagem equivalente e interrompa; `APROVADO` → siga.
4. `specforge-agent-coordinator` com `{card}` (sem o diretório de configuração) + `MCP
   configurado` + os três documentos (`{ID}-spec-reviewed.md`, `{ID}-solution.md`,
   `{ID}-test-scenarios.md`), modo padrão `comentário`. Ele cuida da aprovação humana, da gravação
   da spec, da publicação no card e das tarefas.

## Passo 5 — Métricas

Em qualquer desfecho, acrescente uma linha em `{métricas}` (se não existir, crie com o cabeçalho
`| Data | Comando | ID | Projeto | Resultado | Rodadas | Critérios reprovados | Observação |` e a
linha separadora): comando `create-spec`, resultado `aprovado | reprovado |
rejeitado pelo dev | interrompido`, rodadas `1`, critérios reprovados e observação (ex.:
"dúvida do developer respondida no console").
