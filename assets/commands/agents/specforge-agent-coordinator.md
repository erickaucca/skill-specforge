Sub-agente do specforge responsável por: verificar consistência da spec revisada, obter aprovação humana, gravar a spec final, publicar no card de origem e criar as tarefas de desenvolvimento e teste no sistema de work tracking.

Este agente é invocado pelo `/specforge-create-spec` apenas quando o agent-tech-lead retornar APROVADO. Ao receber o prompt de despacho, este arquivo já terá sido lido pelo sub-agente — as instruções a seguir são para o sub-agente executar.

O prompt de despacho inclui:
- ID do work item
- Título, descrição completa e critérios de aceite do work item
- MCP configurado: `linear` ou `azure-devops`
- Caminhos: `docs/specs/tmp/{ID}-spec-reviewed.md`, `docs/specs/tmp/{ID}-solution.md`, `docs/specs/tmp/{ID}-test-scenarios.md`

## Passo 1 — Verificar consistências na spec revisada

Leia `docs/specs/tmp/{ID}-spec-reviewed.md` integralmente.

Verifique se:
- A "Solução proposta" é coerente com os "Critérios de aceite técnicos" listados
- Os critérios de aceite técnicos cobrem os critérios de aceite do work item
- Os casos na "Estratégia de testes" referem-se aos mesmos arquivos de "Arquivos que serão alterados"
- A "Estimativa de esforço" é coerente com a quantidade de arquivos e tarefas

Registre cada inconsistência encontrada. Elas serão exibidas ao dev mas não bloqueiam o fluxo.

## Passo 2 — Apresentar a spec e solicitar aprovação humana

Exiba no terminal (não pule esta etapa — esta é a gate de aprovação humana antes de gravar e criar as tarefas; o tech-lead já exibiu seu relatório, mas o dev precisa aprovar explicitamente aqui):

```
────────────────────────────────────────────────────────────
📋 Spec gerada — {ID}: {título}
────────────────────────────────────────────────────────────

{Exiba o conteúdo completo de docs/specs/tmp/{ID}-spec-reviewed.md}

────────────────────────────────────────────────────────────
{Se houver inconsistências identificadas no Passo 1, adicione:}
⚠ Inconsistências identificadas:
  - {inconsistência 1}
  - {inconsistência 2}
────────────────────────────────────────────────────────────

Aprovar esta spec e criar as tarefas? (s = aprovar / n = rejeitar):
```

Aguarde a resposta do dev. **Esta pergunta não pode ser pulada.**

## Passo 3 — Tratar a resposta do dev

**Se aprovado** (resposta "s", "sim", "yes", "y" ou variante afirmativa):
Prossiga para o Passo 4.

**Se rejeitado** (qualquer outra resposta) ou se o dev solicitar ajuste:
Exiba:
```
✗ Spec não aprovada pelo dev.

Os arquivos temporários permanecem em docs/specs/tmp/ para revisão manual:
  - docs/specs/tmp/{ID}-solution.md
  - docs/specs/tmp/{ID}-test-scenarios.md
  - docs/specs/tmp/{ID}-spec-reviewed.md

Para ajustar e re-gerar:
  1. Edite os arquivos em docs/specs/tmp/ conforme necessário
  2. Execute novamente: /specforge-create-spec {ID}
```
Interrompa o fluxo. **Não grave docs/specs/{ID}-spec.md.**

## Passo 4 — Gravar a spec final

Crie `docs/specs/` se não existir.

Copie o conteúdo de `docs/specs/tmp/{ID}-spec-reviewed.md` para `docs/specs/{ID}-spec.md`.

## Passo 5 — Publicar a spec no card de origem

Publique o conteúdo de `docs/specs/{ID}-spec.md` como comentário no card {ID} usando o MCP configurado.

O corpo do comentário deve começar exatamente com:

```
## Spec Técnica — gerada por specforge

{conteúdo completo de docs/specs/{ID}-spec.md}
```

**Verificação de idempotência antes de postar:**

**Se o MCP `linear` foi usado:**
1. Liste os comentários da issue via ferramenta de listagem disponível no MCP (`linear_get_comments`, `linear_list_comments` ou equivalente — se o nome exato for desconhecido, chame `list_tools` e filtre os resultados pelo prefixo `linear_` para identificar a ferramenta correta)
2. Busque no campo `body` ou `content` o texto `## Spec Técnica — gerada por specforge`
3. **Se encontrar:** atualize usando a ferramenta de atualização (`linear_update_comment` ou equivalente) com o ID do comentário e o novo corpo
   - Se a ferramenta de atualização não existir ou retornar erro: crie novo comentário com o conteúdo e adicione logo após o cabeçalho: `> Atualização de comentário anterior — ID {comment_id}`
4. **Se não encontrar:** crie novo comentário com a ferramenta de criação (`linear_create_comment` ou equivalente)

**Se o MCP `azure-devops` foi usado:**
1. Liste os comentários do work item via ferramenta disponível no MCP (`azure_devops_get_work_item_comments`, `azure_devops_list_comments` ou equivalente — se o nome exato for desconhecido, chame `list_tools` e filtre os resultados pelo prefixo `azure_devops_` para identificar a ferramenta correta)
2. Busque no campo de texto o texto `## Spec Técnica — gerada por specforge`
3. **Se encontrar:** atualize com a ferramenta de atualização passando o ID do comentário e o novo texto
   - Se a ferramenta de atualização não existir ou retornar erro: crie novo comentário e adicione logo após o cabeçalho: `> Atualização de comentário anterior — ID {comment_id}`
4. **Se não encontrar:** adicione novo comentário com a ferramenta de criação (`azure_devops_add_work_item_comment` ou equivalente)

**Em caso de falha total no MCP:**
```
✗ Não foi possível publicar a spec no card {ID}.
Erro: {mensagem de erro retornada pelo MCP}

A spec foi salva localmente em docs/specs/{ID}-spec.md.
Para publicar manualmente: copie o conteúdo e cole como comentário no card {ID}.
```
Continue para o Passo 6 mesmo em caso de falha no posting.

## Passo 6 — Criar tarefas de desenvolvimento no tracker

Leia a seção `## Tarefas de desenvolvimento (ordenadas)` de `docs/specs/tmp/{ID}-solution.md`.

> Nota: esta seção não é copiada para a spec revisada pelo tech-lead — o documento de origem (`{ID}-solution.md`) é a fonte para as tarefas de desenvolvimento. Se o tech-lead tiver indicado alterações no escopo das tarefas na seção "Revisão de qualidade" de `docs/specs/{ID}-spec.md`, ajuste as tarefas a criar de acordo antes de continuar.

Para cada linha da tabela de tarefas:

Use o MCP configurado para criar uma tarefa com:
- **Título:** `[{ID}] Dev {#}: {descrição da tarefa da coluna "Tarefa"}`
- **Descrição:**
  ```
  Arquivo(s): {coluna "Arquivo(s)" da tabela}
  Estimativa: {coluna "Estimativa" da tabela}

  Spec: docs/specs/{ID}-spec.md
  Card de origem: {ID}
  ```

Se o MCP retornar erro ao criar uma tarefa individual, registre o erro e continue com as próximas (não aborte o passo inteiro).

## Passo 7 — Criar tarefas de teste no tracker

Leia a seção `## Cenários de aceitação (mapeados aos critérios de aceite)` de `docs/specs/tmp/{ID}-test-scenarios.md`.

Para cada linha da tabela de cenários de aceitação:

Use o MCP configurado para criar uma tarefa com:
- **Título:** `[{ID}] QA: {descrição do cenário da coluna "Critério de aceite" ou equivalente}`
- **Descrição:**
  ```
  Cenário: {dado / quando / então da tabela}
  Resultado esperado: {resultado esperado da tabela}

  Spec: docs/specs/{ID}-spec.md
  Card de origem: {ID}
  ```

Se o MCP retornar erro ao criar uma tarefa individual, registre o erro e continue (não aborte).

## Passo 8 — Relatório final

Exiba o relatório consolidado:

```
✓ Fluxo concluído — {ID}: {título}

Spec:
  ✓ Gravada em docs/specs/{ID}-spec.md
  {✓ Card {ID} atualizado com a spec técnica | ✗ Falha ao atualizar card — veja mensagem acima}

Tarefas criadas:
  ✓ {N} tarefas de desenvolvimento criadas
  ✓ {M} tarefas de teste criadas
  {Se houve erros: ✗ {K} tarefas não criadas — veja erros acima}

Próximo passo: /specforge-execute-spec {ID}
```
