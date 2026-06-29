# Spec Auto-Post to Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After `specforge-create-spec` saves a spec locally, automatically post its content as a comment (Linear) or discussion (ADO) on the originating card, and update that comment idempotently on subsequent runs.

**Architecture:** The feature is implemented entirely as new Markdown instruction text inside `assets/commands/specforge-create-spec.md`. A new "Passo 6" is inserted after the existing save step (Passo 5). The step guides the Claude agent at runtime to: (1) detect which MCP was used in Passo 2; (2) check for an existing comment with the idempotency header; (3) update or create the comment; (4) fall back to local save + terminal error if the MCP call fails.

**Tech Stack:** Pure Markdown instruction files for Claude Code agents. No build system, no test runner — acceptance criteria are validated manually against real Linear issues and ADO work items.

## Global Constraints

- Usar somente o MCP já configurado na sessão (Linear ou ADO) — não criar nova integração.
- O comentário deve conter o cabeçalho `## Spec Técnica — gerada por specforge` para ser identificável.
- Operação idempotente: procurar comentário existente com esse cabeçalho antes de criar novo.
- Fallback em caso de erro: salvar spec em `.claude/specs/{ID}-spec.md` e reportar erro com instrução de reenvio manual.
- Não alterar o status do card.
- Cenários 1, 2 e 3 da user story devem ser cobertos.

---

### Task 1: Adicionar Passo 6 ao specforge-create-spec

**Files:**
- Modify: `assets/commands/specforge-create-spec.md` — inserir novo passo de posting após o passo de salvar a spec localmente

**Interfaces:**
- Consome: ID do work item (já disponível desde Passo 2), conteúdo da spec (gerado no Passo 4), MCP ativo detectado no Passo 2 (linear ou azure-devops).
- Produz: comentário/discussão atualizado no card de origem; ou erro reportado + arquivo de fallback `.claude/specs/{ID}-spec.md`.

- [ ] **Step 1: Ler o arquivo atual**

  Abra `assets/commands/specforge-create-spec.md` e localize a seção `## Passo 5 — Confirmar antes de salvar`. O texto atual encerra com:

  ```
  ✓ Spec salva em .claude/specs/{ID}.md

  Próximo passo: /specforge-execute-spec {ID}
  ```

  O novo passo será inserido entre o "salvar" e o "Próximo passo" dentro do Passo 5, de forma que o Passo 5 agora apenas confirma e salva, e um novo **Passo 6** executa o posting. A mensagem final será movida para o final do Passo 6.

- [ ] **Step 2: Aplicar a edição — reformatar final do Passo 5**

  Substitua o bloco final do Passo 5 (a partir de "Após confirmação") por:

  ```markdown
  Após confirmação, salve em `.claude/specs/{ID}.md` (crie o diretório se não existir) e prossiga para o Passo 6.
  ```

  O resultado final do Passo 5 (a mensagem `✓ Spec salva` e `Próximo passo`) será emitido apenas no Passo 6, após o posting ter sido tentado.

- [ ] **Step 3: Inserir o novo Passo 6 completo**

  Adicione o seguinte bloco imediatamente após o Passo 5:

  ````markdown
  ## Passo 6 — Publicar a spec no card de origem

  Com a spec já salva localmente, publique seu conteúdo como comentário (Linear) ou discussão (ADO) no card de origem. Use o mesmo MCP identificado no Passo 2.

  ### Montar o corpo do comentário

  O conteúdo a ser postado é exatamente o texto da spec gerada no Passo 4, prefixado pelo cabeçalho de identificação:

  ```
  ## Spec Técnica — gerada por specforge

  {conteúdo completo da spec em Markdown}
  ```

  ### Verificar idempotência antes de postar

  Antes de criar um novo comentário, verifique se já existe um com o cabeçalho `## Spec Técnica — gerada por specforge` no card:

  **Se o MCP `linear` foi usado:**
  1. Liste os comentários da issue (use a ferramenta de listagem de comentários disponível no MCP linear — ex.: `linear_get_comments`, `linear_list_comments` ou equivalente).
  2. Busque pelo campo de corpo (`body` / `content`) que comece com `## Spec Técnica — gerada por specforge`.
  3. **Se encontrar:** use a ferramenta de atualização de comentário (ex.: `linear_update_comment`) passando o ID do comentário existente e o novo corpo.
  4. **Se não encontrar:** crie um novo comentário com a ferramenta de criação (ex.: `linear_create_comment`) referenciando o ID da issue.

  **Se o MCP `azure-devops` foi usado:**
  1. Liste os comentários/discussões do work item (use a ferramenta disponível no MCP — ex.: `azure_devops_get_work_item_comments`, `azure_devops_list_comments` ou equivalente).
  2. Busque pelo campo de texto que comece com `## Spec Técnica — gerada por specforge`.
  3. **Se encontrar:** use a ferramenta de atualização de comentário do work item passando o ID do comentário e o novo texto.
  4. **Se não encontrar:** adicione um novo comentário/discussão ao work item com a ferramenta de criação (ex.: `azure_devops_add_work_item_comment`).

  > **Nota:** os nomes exatos das ferramentas MCP variam por configuração. Use `list_tools` ou equivalente para descobrir as ferramentas disponíveis caso não reconheça os nomes acima.

  ### Tratar falha na atualização do card

  **Se o MCP retornar erro ou a ferramenta não estiver disponível:**

  1. Sinalize o erro no terminal com a mensagem exata abaixo — não interrompa silenciosamente:

  ```
  ✗ Não foi possível publicar a spec no card {ID}.
  Erro: {mensagem de erro retornada pelo MCP}

  A spec foi salva localmente em .claude/specs/{ID}.md.

  Para publicar manualmente, copie o conteúdo de .claude/specs/{ID}.md
  e cole como comentário no card {ID} no seu sistema de work tracking.
  ```

  2. Mesmo em caso de falha no posting, a spec já está salva localmente — informe isso explicitamente ao dev.

  ### Emitir o relatório final

  Após o posting (com sucesso ou com fallback), exiba:

  **Em caso de sucesso:**
  ```
  ✓ Spec salva em .claude/specs/{ID}.md
  ✓ Card {ID} atualizado com a spec técnica

  Próximo passo: /specforge-execute-spec {ID}
  ```

  **Em caso de falha no posting:**
  ```
  ✓ Spec salva em .claude/specs/{ID}.md
  ✗ Falha ao atualizar o card {ID} — veja instruções acima para envio manual.

  Próximo passo: /specforge-execute-spec {ID}
  ```
  ````

- [ ] **Step 4: Verificar consistência do arquivo editado**

  Leia `assets/commands/specforge-create-spec.md` do início ao fim e confirme:
  - Existem exatamente 6 passos numerados (Passo 1 a Passo 6).
  - O Passo 5 não contém mais a mensagem `✓ Spec salva` nem `Próximo passo` — esses estão somente no Passo 6.
  - O Passo 6 contém os três cenários da user story: Linear (Cenário 1), ADO (Cenário 2) e falha (Cenário 3).
  - O cabeçalho `## Spec Técnica — gerada por specforge` aparece literalmente no Passo 6.
  - A palavra "idempotente"/"idempotência" está presente ou o conceito está claro nos passos de verificação.

- [ ] **Step 5: Commit**

  ```bash
  git add assets/commands/specforge-create-spec.md
  git commit -m "feat: publica spec no card de origem após geração (Linear e ADO)

  Adiciona Passo 6 ao specforge-create-spec que, após salvar a spec
  localmente, posta o conteúdo como comentário no card do Linear ou
  discussão no ADO. Idempotente: atualiza comentário existente se já
  houver um com o cabeçalho identificador. Fallback local em caso de
  falha no MCP."
  ```

---

## Validação manual (Definição de Pronto)

Os critérios abaixo **não têm automação** — devem ser verificados manualmente pelo dev contra cards reais:

### Cenário 1 — Linear com sucesso
1. Ter um card no Linear em status "Em análise" com ID válido (ex: `ENG-1234`).
2. Rodar `/specforge-create-spec ENG-1234` num projeto com MCP `linear` configurado.
3. Confirmar a spec quando solicitado.
4. Verificar no card do Linear que um comentário foi criado com cabeçalho `## Spec Técnica — gerada por specforge`.
5. Rodar `/specforge-create-spec ENG-1234` novamente.
6. Verificar que o card tem **um único comentário** (atualizado, não duplicado).

### Cenário 2 — ADO com sucesso
1. Ter um work item no ADO em estado "Em análise" com ID numérico válido.
2. Rodar `/specforge-create-spec {ID}` num projeto com MCP `azure-devops` configurado.
3. Confirmar a spec quando solicitado.
4. Verificar no work item ADO que uma discussão foi adicionada com cabeçalho `## Spec Técnica — gerada por specforge`.
5. Rodar novamente e verificar idempotência.

### Cenário 3 — Fallback em caso de falha
1. Simular falha desconectando o MCP ou usando um ID inexistente.
2. Verificar que o terminal exibe a mensagem de erro com instrução de reenvio manual.
3. Verificar que `.claude/specs/{ID}.md` existe e contém a spec completa.

### Regressão
1. Rodar `/specforge-create-spec` sem ID fornecido — deve perguntar o ID (comportamento anterior preservado).
2. Rodar com ID inválido — deve interromper no Passo 2 (comportamento anterior preservado).
3. A spec gerada deve continuar com o mesmo formato (sem alterações estruturais).
