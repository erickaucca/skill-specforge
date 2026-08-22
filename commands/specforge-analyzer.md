Analisa um card do Azure DevOps ou Linear (descrição, comentários e anexos) contra os projetos vinculados no workspace para decidir se há informação suficiente para gerar a spec técnica com segurança. Se houver dúvidas, comenta as perguntas no card e move para "Triaged / Refinement". Se não houver dúvidas, gera a spec, publica como task "spec" no card e move para "Ready for Development".

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Ler os projetos vinculados e os usuários de dúvidas no workspace

Leia o CLAUDE.md da pasta atual (workspace) e localize a seção `## Projetos vinculados (specforge)`.

**Se o CLAUDE.md não existir, ou a seção não existir, ou a tabela estiver vazia:**
> "Nenhum projeto vinculado neste workspace. Rode `/specforge-add-project <url>` primeiro."

Interrompa a execução.

Caso contrário, monte a lista de projetos vinculados a partir da tabela (nome, pasta, stack, "para que serve" e repositório — as colunas `Stack` e `Para que serve` foram introduzidas pelo `/specforge-add-project`; se a tabela ainda estiver no formato antigo sem essas colunas, prossiga normalmente e trate-as como vazias).

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

**Preste atenção especial aos comentários ao montar o contexto da análise** — eles não são
metadado secundário, são entrada obrigatória da análise dos Passos 3 e 4. Em particular:

- Se existir um comentário com o cabeçalho `## Dúvidas para construção da spec — specforge-analyzer` (de uma execução anterior deste comando), identifique-o e leia os comentários postados depois dele em ordem cronológica — são as respostas às dúvidas levantadas.
- Para cada dúvida daquele comentário anterior, verifique se algum comentário posterior a responde. Anote, para cada uma: **respondida** (com o conteúdo da resposta) ou **ainda sem resposta**.
- Trate essas respostas como fonte de verdade — elas têm prioridade sobre a descrição original do card quando houver conflito, por serem mais recentes e mais específicas.

## Passo 3 — Identificar o(s) projeto(s) relevante(s)

Para cada projeto listado no Passo 1, leia (dentro da pasta daquele projeto):
1. `CLAUDE.md` — stack e domínio descritos
2. `.claude/steering/architecture.md` — arquitetura e estrutura
3. `.claude/steering/domain-rules.md` — regras e vocabulário de domínio

Compare o título, descrição, labels/tags e comentários do card (Passo 2) com o domínio, stack e arquitetura de cada projeto para identificar qual(is) projeto(s) são afetados pelo work item.

- **Se um único projeto for claramente identificado:** prossiga com ele.
- **Se mais de um projeto parecer relevante, ou nenhum puder ser identificado com confiança:** pergunte ao dev qual **único** projeto usar, listando os candidatos e o motivo da dúvida. Aguarde a resposta antes de prosseguir. **Esta pergunta não pode ser pulada.**

**Este fluxo suporta apenas um projeto por card.** Se o dev indicar que o work item afeta genuinamente mais de um projeto ao mesmo tempo, informe que o `/specforge-analyzer` não tem suporte a specs multi-projeto nesta versão e peça para escolher o projeto principal (ou dividir o work item em cards menores, um por projeto, no tracker). Não prossiga com mais de um diretório.

Registre o projeto escolhido — será usado a partir do Passo 6 como `{diretório do projeto}` (ex.: `pedidos-api/`).

## Passo 4 — Avaliar se há 100% das informações necessárias para a spec

Com base em tudo lido nos Passos 2 e 3 — **incluindo as respostas identificadas nos comentários**,
que têm prioridade sobre a descrição original quando preenchem uma lacuna ou resolvem uma
ambiguidade — avalie se é possível construir uma spec técnica com segurança, verificando:

- O problema/necessidade está descrito de forma clara e não ambígua (contexto + o que precisa mudar), já considerando o que foi esclarecido em comentários
- Existem critérios de aceite explícitos, ou claramente infiráveis da descrição/comentários
- O escopo (módulo, domínio, camada) está identificável dentro do projeto escolhido no Passo 3
- Não há contradições entre título, descrição, comentários e anexos
- Riscos, dependências externas ou decisões de negócio pendentes (se existirem) estão resolvidos ou explicitados — não deixados em aberto
- Anexos citados na descrição/comentários (mockups, prints, planilhas, documentos) foram de fato encontrados e lidos no Passo 2
- Toda dúvida de uma execução anterior do `/specforge-analyzer` (identificada no Passo 2) foi de fato respondida: uma dúvida só conta como resolvida se a resposta encontrada nos comentários for clara e completa; uma resposta parcial ou evasiva mantém a dúvida em aberto (ajuste o texto da dúvida para refletir especificamente o que ainda falta, em vez de repetir a pergunta original)

Liste explicitamente cada dúvida encontrada — as que restaram sem resposta de uma execução anterior e quaisquer dúvidas novas identificadas agora (pergunta objetiva e específica — não genérica). Se nenhuma dúvida for encontrada, considere que há 100% das informações necessárias.

Escreva cada dúvida já em linguagem simples e não técnica (evite nomes de arquivos, classes, tabelas, frameworks ou padrões de arquitetura) — quem vai ler e responder no card, no Passo 5, são analistas de negócio/produto, não desenvolvedores. Pergunte sobre a regra de negócio, o comportamento esperado ou a decisão que falta, nunca sobre como implementar.

## Passo 5 — Se houver dúvidas: comentar no card e mover para "Triaged / Refinement"

Execute este passo apenas se o Passo 4 encontrou ao menos uma dúvida. Caso contrário, pule para o Passo 6.

### Comentar as dúvidas no card

Monte o comentário com exatamente estes quatro blocos, nesta ordem:

```
## Dúvidas para construção da spec — specforge-analyzer

**O que entendemos do pedido**
{resumo de 2-4 frases do que foi entendido da demanda, com base no card lido no Passo 2}

**O que está sendo pedido para entregar**
{resumo de 1-3 frases do resultado/entrega esperada — o que muda para quem usa o sistema}

**Projetos que este pedido impacta**
{lista com o(s) projeto(s) identificado(s) no Passo 3, usando o nome do projeto e o resumo
"para que serve" registrado no CLAUDE.md do workspace — não use nomes técnicos de pasta/repositório.
Se o resumo estiver vazio ou marcado como TODO para algum projeto, descreva-o em 1 frase simples
com base no que foi lido dele no Passo 3}

**Dúvidas em aberto**
{lista numerada com cada dúvida identificada no Passo 4}
```

Todo o texto dos quatro blocos — não só as dúvidas — deve estar em **linguagem simples e não
técnica**: quem lê e responde esse comentário são analistas de negócio e produto, não
desenvolvedores. Evite jargão técnico (nomes de arquivos, classes, tabelas, frameworks, padrões
de arquitetura, termos como "endpoint" ou "payload"); descreva em termos de comportamento do
sistema e regras de negócio.

**Se houver usuários registrados** na seção `## Usuários para dúvidas (specforge)` (lida no Passo 1), referencie-os ao final do comentário para que sejam notificados:

1. Tente resolver cada email para o usuário correspondente na plataforma via MCP (ferramenta de busca de usuário por email — ex.: `linear_get_user`/`linear_list_users` ou `azure_devops_list_users`/equivalente; use `list_tools` se o nome exato for desconhecido).
2. Se conseguir resolver e a ferramenta de criação/atualização de comentário aceitar sintaxe de menção nativa (ex.: `@usuário` no Linear, menção por identidade no Azure DevOps), inclua as menções nativas ao final do comentário — isso notifica o usuário diretamente.
3. Se não for possível resolver algum email ou a menção nativa não for suportada pela ferramenta disponível, adicione ao final do comentário, em texto simples:
   ```
   ---
   Necessita resposta de: {email1}, {email2}, {email3}
   ```

**Verificação de idempotência antes de postar:** liste os comentários do card (já obtidos no Passo 2) e procure um que comece com `## Dúvidas para construção da spec — specforge-analyzer`.
- **Se encontrar:** atualize esse comentário com os quatro blocos e as referências de usuário atuais (use a ferramenta de atualização do MCP; se não existir ou falhar, crie um novo comentário e adicione logo após o cabeçalho `> Atualização de comentário anterior — ID {comment_id}`).
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

Despache, em sequência, os mesmos 3 sub-agentes usados pelo `/specforge-create-spec` — reaproveitando os dados do card já obtidos no Passo 2 (não busque o work item novamente) — cada um com o mesmo formato de contexto que `/specforge-create-spec` usa nos seus Passos 4-6, acrescentando sempre `Diretório do projeto: {diretório do projeto}/`:

**`specforge-agent-developer`:**
```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
- Diretório do projeto: {diretório do projeto}/
```
Verifique que `{diretório do projeto}/docs/specs/tmp/{ID}-solution.md` foi criado antes de continuar (mesma verificação de `/specforge-create-spec` Passo 4).

**`specforge-agent-qa`:**
```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- Confirmação: {diretório do projeto}/docs/specs/tmp/{ID}-solution.md existe
- Diretório do projeto: {diretório do projeto}/
```
Verifique que `{diretório do projeto}/docs/specs/tmp/{ID}-test-scenarios.md` foi criado antes de continuar (mesma verificação de `/specforge-create-spec` Passo 5).

**`specforge-agent-tech-lead`:**
```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- Documentos gerados:
  - {diretório do projeto}/docs/specs/tmp/{ID}-solution.md
  - {diretório do projeto}/docs/specs/tmp/{ID}-test-scenarios.md
- Diretório do projeto: {diretório do projeto}/
```

Siga exatamente as mesmas interrupções descritas em `/specforge-create-spec` (Passos 4-6) — se algum arquivo esperado não for criado, ou se o agent-tech-lead reprovar, exiba a mensagem correspondente e **interrompa** (não mova o card, não prossiga para o Passo 7).

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
