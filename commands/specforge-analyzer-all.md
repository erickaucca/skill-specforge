Lista todos os cards da coluna/estado "Backlog" do tracker configurado e roda o fluxo do `/specforge-analyzer` para cada um, em sequência, até processar toda a fila.

Este comando não recebe ID — processa todos os cards encontrados em "Backlog" no momento em que é iniciado.

## Passo 1 — Ler os projetos vinculados e os usuários de dúvidas no workspace

Execute o Passo 1 do `/specforge-analyzer` (`commands/specforge-analyzer.md`) uma única vez: leia a
seção `## Projetos vinculados (specforge)` e a seção `## Usuários para dúvidas (specforge)` do
CLAUDE.md do workspace. Reaproveite esse resultado para todos os cards processados neste comando —
não releia o CLAUDE.md a cada iteração.

**Se nenhum projeto estiver vinculado:** interrompa com a mesma mensagem do `/specforge-analyzer`.

## Passo 2 — Localizar a coluna/estado "Backlog" e listar os cards

Verifique qual MCP está configurado na sessão (`linear` ou `azure-devops`). Se nenhum estiver
disponível, informe e interrompa (mesma mensagem do `/specforge-analyzer`, Passo 2).

Liste os estados/colunas disponíveis do board via MCP (Linear: workflow states do time; Azure
DevOps: valores válidos do campo de estado/coluna do board — use `list_tools` para achar a
ferramenta certa se o nome não for óbvio).

Procure por um estado/coluna cujo nome corresponda a "Backlog" (comparação sem diferenciar
maiúsculas/minúsculas e ignorando espaços extras).
- **Se encontrar:** use esse estado/coluna para listar os cards.
- **Se não encontrar uma correspondência clara:** exiba a lista de estados/colunas disponíveis e
  pergunte ao dev qual deve ser usado equivalente a "Backlog". Aguarde a resposta antes de
  continuar. **Esta pergunta não pode ser pulada.**

Liste todos os cards atualmente nesse estado/coluna (IDs + títulos). Essa é a fila inicial.

**Se a fila estiver vazia:**
```
✓ Nenhum card em Backlog — nada a processar.
```
Interrompa a execução aqui.

## Passo 3 — Processar a fila em sequência

Mantenha um conjunto `processados` (vazio no início) com os IDs já tratados nesta execução, e uma
tabela de resultados (vazia no início).

Repita até a fila filtrada ficar vazia:

1. Relea os cards atualmente no estado/coluna "Backlog" (mesma consulta do Passo 2) e remova
   dessa lista qualquer ID que já esteja em `processados`. Isso cobre tanto cards que chegaram em
   Backlog durante a execução quanto evita reprocessar um card que ficou em Backlog por reprovação
   ou erro (ver abaixo). Se a lista resultante estiver vazia, encerre o loop.
2. Pegue o primeiro ID dessa lista filtrada.
3. Execute integralmente os Passos 2 a 8 do `/specforge-analyzer` (`commands/specforge-analyzer.md`)
   para esse ID, reaproveitando a lista de projetos vinculados e de usuários já lida no Passo 1
   deste comando (não repita a leitura do CLAUDE.md do workspace a cada card).
4. Adicione o ID a `processados`, independentemente do resultado.
5. Registre o resultado na tabela:
   - **Dúvidas registradas** → card movido para "Triaged / Refinement"
   - **Spec publicada** → card movido para "Ready for Development"
   - **Reprovado pelo agent-tech-lead** → card permanece em "Backlog"
   - **Erro** (falha de MCP, projeto não identificado mesmo após pergunta ao dev, etc.) → registre
     a mensagem de erro e continue para o próximo card sem abortar o restante da fila

Se o dev interromper uma pergunta obrigatória de um card específico (ex.: identificação de
projeto no Passo 3 do `/specforge-analyzer`, ou aprovação humana no agent-coordinator) com uma
resposta que rejeite a continuação, trate como concluído para aquele card (sem mover o card) e
prossiga para o próximo da fila.

## Passo 4 — Relatório final

Exiba a tabela consolidada:

```
✓ /specforge-analyzer-all concluído

{N} card(s) processado(s) da coluna Backlog:

| ID | Resultado |
|---|---|
| {ID} | ✓ Spec publicada — movido para Ready for Development |
| {ID} | ⚠ Dúvidas registradas — movido para Triaged / Refinement |
| {ID} | ✗ Reprovado pelo tech-lead — permanece em Backlog |
| {ID} | ✗ Erro: {mensagem} — permanece em Backlog |

{Se algum card permaneceu em Backlog:}
⚠ {K} card(s) permanecem em Backlog e não foram reprocessados nesta execução (reprovados ou com
erro). Corrija o que for necessário e rode /specforge-analyzer {ID} manualmente para cada um.
```
