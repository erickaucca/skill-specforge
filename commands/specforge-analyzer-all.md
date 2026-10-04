---
description: Roda o /specforge-analyzer para até 3 cards da coluna Backlog, sem perguntas no console
---

Processa até 3 cards da coluna/estado "Backlog" com o fluxo do `/specforge-analyzer`, em
sequência e sem nenhuma pergunta no console. Rode de novo para continuar a fila.

## Passo 1 — Workspace

Execute o Passo 1 do `/specforge-analyzer` (arquivo `specforge-analyzer.md`, na mesma pasta deste
comando) **uma vez** e reaproveite projetos e usuários para todos os cards. Sem projetos
vinculados: mesma mensagem do analyzer e interrompa.

## Passo 2 — Fila do Backlog

Sem MCP de tracker: mesma mensagem do analyzer e interrompa. Liste os estados/colunas do board e
escolha, sem perguntar, o igual a "Backlog" (ignorando caixa e espaços) ou, senão, o que contém
"backlog". Não encontrou:
```
✗ Não foi possível identificar a coluna "Backlog". Estados disponíveis: {lista}
Renomeie uma coluna para "Backlog" ou rode /specforge-analyzer {ID} por card.
```
e interrompa. Fila vazia: `✓ Nenhum card em Backlog — nada a processar.` e interrompa.

## Passo 3 — Até 3 cards, em sequência

Repita até 3 IDs processados ou fila vazia:
1. Releia os cards em Backlog e descarte os já processados (cobre cards novos e cards que ficaram
   em Backlog por erro). Vazia → encerre.
2. Execute os Passos 2 a 9 do `/specforge-analyzer` para o primeiro ID.
3. **Ao terminar o card, guarde só uma linha de resultado** (ID + desfecho). Nos cards seguintes,
   não reutilize nem cite dados, comentários, steering ou documentos do card anterior — cada card
   começa do zero, com exceção da lista de projetos/usuários do Passo 1.
4. Conte o card como processado qualquer que seja o resultado. Erro (falha de MCP etc.): registre
   e siga; o card fica em Backlog.

## Passo 4 — Relatório

```
✓ /specforge-analyzer-all concluído — {N} card(s) (máximo 3)

| ID | Resultado |
|---|---|
| {ID} | ✓ Spec publicada — Ready for Development |
| {ID} | ⚠ Dúvidas registradas — Triaged / Refinement |
| {ID} | ✗ Revisão técnica não convergiu — Triaged / Refinement |
| {ID} | ✗ Erro: {mensagem} — permanece em Backlog |

{Se sobrar fila: {K} card(s) continuam em Backlog. Rode /specforge-analyzer-all novamente.}
```
(Card não movido por falta de coluna correspondente: indique na linha.)
