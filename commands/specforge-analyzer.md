Analisa um card do Azure DevOps ou Linear (descrição, comentários e anexos) contra os projetos vinculados no workspace para decidir se há informação suficiente para gerar a spec técnica com segurança. Se houver dúvidas, comenta as perguntas no card e move para "Triaged / Refinement". Se não houver dúvidas, gera a spec, publica como task "spec" no card e move para "Ready for Development".

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Ler os projetos vinculados e os usuários de dúvidas no workspace

Leia o CLAUDE.md da pasta atual (workspace) e localize a seção `## Projetos vinculados (specforge)`.

**Se o CLAUDE.md não existir, ou a seção não existir, ou a tabela estiver vazia:**
> "Nenhum projeto vinculado neste workspace. Rode `/specforge-add-project <url>` primeiro."

Interrompa a execução.

Caso contrário, monte a lista de projetos vinculados (nome, pasta, repositório) a partir da tabela.

Também localize a seção `## Usuários para dúvidas (specforge)` no mesmo CLAUDE.md, se existir, e
monte a lista de emails registrados via `/specforge-add-user`. Se a seção não existir, prossiga
sem lista de usuários — o comentário de dúvidas do Passo 5 simplesmente não referenciará ninguém.

## Passo 2 — Buscar o card completo via MCP

Use o MCP disponível na sessão para buscar o work item pelo ID informado:

**Se o MCP `linear` estiver configurado:**
- Busque a issue pelo ID (ex: `ENG-1234`)
- Extraia: título, descrição, labels, assignee, status, critérios de aceite (se presentes na descrição)
- Liste todos os comentários da issue (use a ferramenta de listagem disponível no MCP — ex.: `linear_get_comments`/`linear_list_comments` ou equivalente; se o nome exato for desconhecido, chame `list_tools` e filtre pelo prefixo `linear_`)
- Liste todos os anexos da issue; para cada um, leia o conteúdo se a ferramenta do MCP permitir (texto, imagem, PDF); caso não seja possível ler o conteúdo, registre nome e URL do anexo

**Se o MCP `azure-devops` estiver configurado:**
- Busque o work item pelo ID numérico
- Extraia: título, descrição, acceptance criteria, tags, área, iteração
- Liste todos os comentários/discussões do work item (use a ferramenta disponível no MCP — ex.: `azure_devops_get_work_item_comments`/`azure_devops_list_comments` ou equivalente; se o nome exato for desconhecido, chame `list_tools` e filtre pelo prefixo `azure_devops_`)
- Liste todos os anexos do work item; para cada um, leia o conteúdo se a ferramenta do MCP permitir; caso não seja possível, registre nome e URL do anexo

**Se nenhum MCP estiver disponível:**
- Informe: "Nenhum MCP de work tracker encontrado. Configure o MCP do Linear ou do Azure DevOps e tente novamente."
- Interrompa a execução.

Se o work item não for encontrado pelo ID, informe e interrompa.

## Passo 3 — Identificar o(s) projeto(s) relevante(s)

Para cada projeto listado no Passo 1, leia (dentro da pasta daquele projeto):
1. `CLAUDE.md` — stack e domínio descritos
2. `.claude/steering/architecture.md` — arquitetura e estrutura
3. `.claude/steering/domain-rules.md` — regras e vocabulário de domínio

Compare o título, descrição, labels/tags e comentários do card (Passo 2) com o domínio, stack e arquitetura de cada projeto para identificar qual(is) projeto(s) são afetados pelo work item.

- **Se um único projeto for claramente identificado:** prossiga com ele.
- **Se mais de um projeto parecer relevante, ou nenhum puder ser identificado com confiança:** pergunte ao dev qual(is) projeto(s) usar, listando os candidatos e o motivo da dúvida. Aguarde a resposta antes de prosseguir. **Esta pergunta não pode ser pulada.**

Registre o projeto (ou projetos) escolhido — será usado no Passo 6 como `{diretório do projeto}` (ex.: `pedidos-api/`).

## Passo 4 — Avaliar se há 100% das informações necessárias para a spec

Com base em tudo lido nos Passos 2 e 3, avalie se é possível construir uma spec técnica com segurança, verificando:

- O problema/necessidade está descrito de forma clara e não ambígua (contexto + o que precisa mudar)
- Existem critérios de aceite explícitos, ou claramente infiráveis da descrição/comentários
- O escopo (módulo, domínio, camada) está identificável dentro do projeto escolhido no Passo 3
- Não há contradições entre título, descrição, comentários e anexos
- Riscos, dependências externas ou decisões de negócio pendentes (se existirem) estão resolvidos ou explicitados — não deixados em aberto
- Anexos citados na descrição/comentários (mockups, prints, planilhas, documentos) foram de fato encontrados e lidos no Passo 2

Liste explicitamente cada dúvida encontrada (pergunta objetiva e específica — não genérica). Se nenhuma dúvida for encontrada, considere que há 100% das informações necessárias.

## Passo 5 — Se houver dúvidas: comentar no card e mover para "Triaged / Refinement"

Execute este passo apenas se o Passo 4 encontrou ao menos uma dúvida. Caso contrário, pule para o Passo 6.

### Comentar as dúvidas no card

Monte o comentário:

```
## Dúvidas para construção da spec — specforge-analyzer

{lista numerada com cada dúvida identificada no Passo 4, uma pergunta objetiva por item}
```

**Se houver usuários registrados** na seção `## Usuários para dúvidas (specforge)` (lida no Passo 1), referencie-os ao final do comentário para que sejam notificados:

1. Tente resolver cada email para o usuário correspondente na plataforma via MCP (ferramenta de busca de usuário por email — ex.: `linear_get_user`/`linear_list_users` ou `azure_devops_list_users`/equivalente; use `list_tools` se o nome exato for desconhecido).
2. Se conseguir resolver e a ferramenta de criação/atualização de comentário aceitar sintaxe de menção nativa (ex.: `@usuário` no Linear, menção por identidade no Azure DevOps), inclua as menções nativas ao final do comentário — isso notifica o usuário diretamente.
3. Se não for possível resolver algum email ou a menção nativa não for suportada pela ferramenta disponível, adicione ao final do comentário, em texto simples:
   ```
   ---
   Necessita resposta de: {email1}, {email2}, {email3}
   ```

**Verificação de idempotência antes de postar:** liste os comentários do card (já obtidos no Passo 2) e procure um que comece com `## Dúvidas para construção da spec — specforge-analyzer`.
- **Se encontrar:** atualize esse comentário com a lista de dúvidas e as referências de usuário atuais (use a ferramenta de atualização do MCP; se não existir ou falhar, crie um novo comentário e adicione logo após o cabeçalho `> Atualização de comentário anterior — ID {comment_id}`).
- **Se não encontrar:** crie um novo comentário.

### Mover o card para "Triaged / Refinement"

Liste os estados/colunas disponíveis do card via MCP (Linear: workflow states do time; Azure DevOps: valores válidos do campo de estado/coluna do board — use `list_tools` para achar a ferramenta certa se o nome não for óbvio).

Procure por um estado/coluna cujo nome corresponda a "Triaged / Refinement" (comparação sem diferenciar maiúsculas/minúsculas e ignorando espaços extras).
- **Se encontrar:** mova o card para esse estado/coluna.
- **Se não encontrar uma correspondência clara:** exiba a lista de estados/colunas disponíveis e pergunte ao dev qual deve ser usado equivalente a "Triaged / Refinement". Aguarde a resposta antes de mover.

Em caso de falha do MCP ao comentar ou mover o card, informe o erro e continue para o relatório final (Passo 8) — não interrompa silenciosamente.

Após este passo, **não** prossiga para o Passo 6 — a geração da spec só ocorre em uma execução futura, depois que as dúvidas forem respondidas no card.

## Passo 6 — Se não houver dúvidas: gerar a spec técnica

Execute este passo apenas se o Passo 4 não encontrou nenhuma dúvida.

Crie o diretório `{diretório do projeto}/docs/specs/tmp/` se não existir.

Despache, em sequência, os mesmos 3 sub-agentes usados pelo `/specforge-create-spec` — `specforge-agent-developer`, `specforge-agent-qa` e `specforge-agent-tech-lead` — reaproveitando os dados do card já obtidos no Passo 2 (não busque o work item novamente). Cada dispatch deve incluir:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
- Diretório do projeto: {diretório do projeto}/
```

Siga exatamente as regras de verificação de cada sub-agente (arquivos `{ID}-solution.md`, `{ID}-test-scenarios.md` e `{ID}-spec-reviewed.md` dentro de `{diretório do projeto}/docs/specs/tmp/`) e as mesmas interrupções descritas em `/specforge-create-spec` — se o agent-tech-lead reprovar, exiba a mensagem de reprovação e **interrompa** (não mova o card, não prossiga para o Passo 7).

## Passo 7 — Publicar a spec como task "spec" e mover o card para "Ready for Development"

Execute este passo apenas se o Passo 6 terminou com `**Status:** APROVADO` em `{diretório do projeto}/docs/specs/tmp/{ID}-spec-reviewed.md`.

Despache o sub-agente `specforge-agent-coordinator` com o seguinte contexto:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
- Diretório do projeto: {diretório do projeto}/
- Modo de publicação: task
- Nome da task: spec
- Documentos disponíveis:
  - {diretório do projeto}/docs/specs/tmp/{ID}-spec-reviewed.md
  - {diretório do projeto}/docs/specs/tmp/{ID}-solution.md
  - {diretório do projeto}/docs/specs/tmp/{ID}-test-scenarios.md
```

O agent-coordinator gerencia a aprovação humana, a gravação da spec final e a criação das tarefas de desenvolvimento e teste — com "Modo de publicação: task", ele cria a task "spec" no card em vez de postar um comentário.

**Se o dev rejeitar a spec na aprovação humana do agent-coordinator:** não mova o card — ele permanece onde está. Reporte a rejeição (mensagem já exibida pelo agent-coordinator) e pare aqui.

**Se a spec for aprovada e gravada** (`{diretório do projeto}/docs/specs/{ID}-spec.md` existe):

Liste os estados/colunas disponíveis do card via MCP e procure um que corresponda a "Ready for Development" (comparação sem diferenciar maiúsculas/minúsculas e ignorando espaços extras).
- **Se encontrar:** mova o card para esse estado/coluna.
- **Se não encontrar uma correspondência clara:** exiba a lista de estados/colunas disponíveis e pergunte ao dev qual deve ser usado equivalente a "Ready for Development". Aguarde a resposta antes de mover.

Em caso de falha do MCP ao mover o card, informe o erro — a spec e a task já foram criadas normalmente, então não desfaça nada.

## Passo 8 — Relatório final

**Se o fluxo parou no Passo 5 (dúvidas):**
```
⚠ Dúvidas identificadas — {ID}: {título}

{N} dúvida(s) publicada(s) como comentário no card.
Card movido para: Triaged / Refinement

Próximo passo: responda as dúvidas no card {ID} e rode /specforge-analyzer {ID} novamente.
```

**Se o fluxo parou no Passo 6 (reprovado pelo tech-lead):**
```
✗ Spec REPROVADA pelo agent-tech-lead — {ID}: {título}

{mensagem de reprovação já exibida pelo agent-tech-lead}

O card não foi movido.
```

**Se o fluxo concluiu o Passo 7 com sucesso:**
```
✓ Fluxo concluído — {ID}: {título}

Projeto: {diretório do projeto}/
Spec gravada em: {diretório do projeto}/docs/specs/{ID}-spec.md
Task "spec" criada/atualizada no card {ID}.
Card movido para: Ready for Development

Tarefas de desenvolvimento e teste criadas no tracker (ver relatório do agent-coordinator acima).
```
