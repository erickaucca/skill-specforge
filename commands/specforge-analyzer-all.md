Lista os cards da coluna/estado "Backlog" do tracker configurado e roda o fluxo do `/specforge-analyzer` para até 3 deles, em sequência. Assim como o `/specforge-analyzer`, roda do início ao fim sem nenhuma pergunta no console.

Este comando não recebe ID — processa até 3 cards encontrados em "Backlog" no momento em que é iniciado. Rode novamente para continuar processando o restante da fila.

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

Procure automaticamente por um estado/coluna cujo nome corresponda a "Backlog":
1. Comparação exata ignorando maiúsculas/minúsculas e espaços extras.
2. Se não encontrar, procure um estado/coluna cujo nome contenha a palavra "backlog" (em qualquer variação/idioma razoável).
3. **Se encontrar em qualquer uma das duas tentativas:** use esse estado/coluna para listar os cards.
4. **Se não encontrar:** **não pergunte ao dev.** Informe:
   ```
   ✗ Não foi possível identificar a coluna "Backlog" neste tracker.
   Estados/colunas disponíveis: {lista}

   Ajuste o nome de uma coluna no tracker para corresponder a "Backlog", ou rode
   /specforge-analyzer {ID} diretamente para cards específicos.
   ```
   Interrompa a execução aqui.

Liste todos os cards atualmente nesse estado/coluna (IDs + títulos). Essa é a fila.

**Se a fila estiver vazia:**
```
✓ Nenhum card em Backlog — nada a processar.
```
Interrompa a execução aqui.

## Passo 3 — Processar até 3 cards da fila, em sequência

Este comando processa **no máximo 3 cards por execução**, mesmo que a fila tenha mais — isso limita o custo e o tempo de uma única execução. O restante fica para a próxima vez que `/specforge-analyzer-all` for rodado.

Mantenha um conjunto `processados` (vazio no início, máximo 3 IDs) e uma tabela de resultados (vazia no início).

Repita até `processados` atingir 3 IDs **ou** a fila filtrada ficar vazia (o que ocorrer primeiro):

1. Relea os cards atualmente no estado/coluna "Backlog" (mesma consulta do Passo 2) e remova
   dessa lista qualquer ID que já esteja em `processados`. Isso cobre tanto cards que chegaram em
   Backlog durante a execução quanto evita reprocessar um card que ficou em Backlog por erro (ver
   abaixo) — dúvidas de negócio e reprovação técnica não deixam o card em Backlog, ambas o movem
   para "Triaged / Refinement". Se a lista resultante estiver vazia, encerre o loop.
2. Pegue o primeiro ID dessa lista filtrada.
3. Execute integralmente os Passos 2 a 9 do `/specforge-analyzer` (`commands/specforge-analyzer.md`)
   para esse ID, reaproveitando a lista de projetos vinculados e de usuários já lida no Passo 1
   deste comando (não repita a leitura do CLAUDE.md do workspace a cada card). Assim como
   `/specforge-analyzer`, essa execução não faz nenhuma pergunta no console — qualquer dúvida,
   falta de informação ou reprovação técnica é registrada como comentário no próprio card (ver
   `/specforge-analyzer` Passos 5 e 7), nunca interrompe esperando resposta na tela.
4. Adicione o ID a `processados`, independentemente do resultado — conta como "processado" tanto
   um card que teve sucesso quanto um que gerou dúvida, foi reprovado ou deu erro.
5. Registre o resultado na tabela:
   - **Dúvidas de negócio registradas** → card movido para "Triaged / Refinement" (ou não movido, se nenhum estado correspondente foi encontrado — ver `/specforge-analyzer` Passo 5)
   - **Spec publicada** → card movido para "Ready for Development" (ou não movido, mesma ressalva acima)
   - **Revisão técnica pendente** (agent-tech-lead reprovou em algum projeto) → card movido para "Triaged / Refinement" com o comentário técnico (ver `/specforge-analyzer` Passo 7), sem limite de tentativas — volta a ser processado quando alguém mover o card de volta para Backlog
   - **Erro** (falha de MCP, etc.) → registre a mensagem de erro e continue para o próximo card sem abortar o restante da execução; o card permanece em Backlog nesse caso

## Passo 4 — Relatório final

Exiba a tabela consolidada:

```
✓ /specforge-analyzer-all concluído

{N} card(s) processado(s) nesta execução (máximo 3):

| ID | Resultado |
|---|---|
| {ID} | ✓ Spec publicada — movido para Ready for Development |
| {ID} | ⚠ Dúvidas de negócio registradas — movido para Triaged / Refinement |
| {ID} | ⚠ Revisão técnica pendente — movido para Triaged / Refinement |
| {ID} | ✗ Erro: {mensagem} — permanece em Backlog |

{Se ainda houver cards em Backlog além dos processados:}
{K} card(s) continuam em Backlog e não foram processados nesta execução (limite de 3 por rodada).
Rode /specforge-analyzer-all novamente para continuar a fila.
```
