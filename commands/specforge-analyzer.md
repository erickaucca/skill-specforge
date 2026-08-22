Analisa um card do Azure DevOps ou Linear (descrição, comentários e anexos) contra os projetos vinculados no workspace para decidir se há informação suficiente para gerar a spec técnica com segurança. Roda sempre a partir da pasta workspace (pasta principal) e pode envolver um ou mais dos projetos vinculados, dependendo do que o card pede. Se houver dúvidas, comenta as perguntas no card e move para "Triaged / Refinement". Se não houver dúvidas, gera a spec, publica como task única "spec" no card e move para "Ready for Development". Roda do início ao fim sem nenhuma pergunta no console — qualquer coisa que falte é resolvida via comentário no próprio card, nunca interrompendo a execução para esperar resposta de um dev na tela.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar (esta é a única pergunta interativa deste comando — depende do próprio dev ter digitado o comando sem argumento).

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

**A partir daqui, toda referência a "a demanda" ou "o pedido" neste comando significa a
descrição original do card já enriquecida pelas respostas identificadas nos comentários** — não
o texto bruto da descrição. É esse entendimento consolidado (pedido original + esclarecimentos)
que alimenta a identificação de projetos (Passo 3), a avaliação de completude (Passo 4) e,
principalmente, o contexto despachado para os sub-agentes que constroem a spec (Passo 6) — os
mesmos sub-agentes usados por `/specforge-create-spec`, mas aqui recebem esse contexto já
resolvido diretamente, sem buscar o work item de novo pelo ID.

## Passo 3 — Identificar todos os projetos afetados

**Este card pode afetar um ou mais dos projetos vinculados ao mesmo tempo** — por exemplo, uma
mudança que expõe algo numa API e precisa de ajuste correspondente no front-end que a consome.
Não presuma que é sempre um projeto só.

Para cada projeto listado no Passo 1, leia (dentro da pasta daquele projeto):
1. `CLAUDE.md` — stack e domínio descritos
2. `.claude/steering/architecture.md` — arquitetura e estrutura
3. `.claude/steering/domain-rules.md` — regras e vocabulário de domínio

Compare a demanda (título, descrição já enriquecida, labels/tags e comentários) com o domínio, stack e arquitetura de cada projeto.

**Inclua um projeto na lista de afetados sempre que houver correspondência razoável** entre a demanda e o domínio/stack/arquitetura daquele projeto, ou quando o card mencionar explicitamente o sistema/repositório. **Na dúvida entre incluir ou não um projeto candidato, inclua** — um projeto incluído por engano é revisado e descartado pelo agent-tech-lead mais adiante; um projeto que devesse ter sido incluído e não foi deixa trabalho de fora da spec, o que é pior.

**Este comando nunca pergunta ao dev qual projeto usar** — a decisão é sempre autônoma, com base na análise acima:
- **Nenhum projeto identificado com nenhuma confiança:** não interrompa aqui. Registre isso como uma dúvida a mais para o Passo 4 (ex.: "Não conseguimos identificar a qual sistema esse pedido se refere — pode indicar qual sistema deve ser alterado?") e prossiga o fluxo normalmente a partir daí — ele seguirá pelo caminho de dúvidas do Passo 5.
- **Um ou mais projetos identificados:** registre a lista — será usada a partir do Passo 6 como `{diretórios dos projetos}` (ex.: `pedidos-api/`, `pedidos-web/`).

### Consultar o banco de dados dos projetos identificados (opcional, somente leitura)

Se algum projeto identificado tiver um banco de dados declarado, você pode consultá-lo agora
mesmo, em tempo de análise, para reduzir dúvidas que uma consulta real resolveria — por exemplo,
confirmar se um campo/tabela citado no card existe, como os dados realmente estão estruturados,
ou a distribuição real de um valor. Isso é além dos arquivos de steering, que podem estar
desatualizados.

1. Para cada projeto identificado, leia o campo `**Banco de dados:**` na seção
   `## Comandos e projeto (specforge)` do `CLAUDE.md` daquele projeto (já lido acima).
   - **Se estiver vazio, ausente, ou marcado como `<!-- TODO: preencher -->`:** não há banco
     declarado para esse projeto — pule a consulta a banco para ele. Não adivinhe o tipo.
2. Se um tipo de banco estiver declarado, procure entre as ferramentas MCP disponíveis **nesta
   sessão** (chame `list_tools` se precisar) por alguma que corresponda a esse tipo — nome ou
   descrição mencionando o mesmo banco (ex.: banco declarado "PostgreSQL" → procure por
   `postgres`; "SQL Server" → `mssql`/`sqlserver`; "Oracle" → `oracle`; "MongoDB" → `mongo`) ou
   uma ferramenta genérica de SQL/consulta que sirva para esse tipo.
   - **Se nenhuma ferramenta correspondente estiver disponível na sessão:** pule a consulta para
     esse projeto — **isso nunca interrompe o fluxo, nunca gera erro, nunca é reportado como
     problema.** É normal e esperado quando o MCP de banco não está configurado nesta sessão.
   - **Se mais de uma ferramenta parecer compatível:** prefira a que mencionar explicitamente o
     tipo de banco declarado; na dúvida, escolha a mais específica.
3. **Regra crítica — acesso é sempre somente leitura, sem nenhuma exceção.** Pode consultar
   qualquer coisa que o acesso permitir: estrutura (tabelas, colunas, tipos, relacionamentos,
   índices, views) e dados (linhas reais, valores, contagens, distribuições). O que nunca pode
   acontecer, em hipótese alguma:
   - Executar `INSERT`, `UPDATE`, `DELETE`, `MERGE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`,
     `GRANT`, `REVOKE`, ou chamar qualquer procedure/function que possa ter efeito colateral de
     escrita.
   - Usar uma ferramenta MCP cuja descrição indique que ela pode escrever, mesmo que a consulta
     pretendida "só" leia — se a ferramenta permite qualquer SQL arbitrário sem separar
     leitura de escrita, você mesmo deve restringir o que envia a ela a comandos somente-leitura
     (`SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` e equivalentes de metadado/schema).
   - **Se houver qualquer dúvida sobre se uma ferramenta ou operação é segura (só leitura), não
     a use** — pule a consulta para aquele projeto em vez de arriscar. Silêncio é sempre a opção
     mais segura aqui; nunca "tentar e ver o que acontece".
4. Use o que for descoberto para embasar a análise dos Passos 4 e 5 (e o que for repassado aos
   sub-agentes no Passo 6) — priorize a realidade observada no banco sobre suposições do código
   ou do steering quando houver conflito. Não há restrição de citar dado real (valores, exemplos)
   no comentário de dúvidas ou na spec, se isso ajudar a esclarecer o pedido.

## Passo 4 — Avaliar se há 100% das informações necessárias para a spec

Com base em tudo lido nos Passos 2 e 3 — **incluindo as respostas identificadas nos comentários**
e o que foi observado em consultas ao banco de dados (quando disponíveis), que têm prioridade
sobre a descrição original e sobre suposições do steering quando preenchem uma lacuna ou resolvem
uma ambiguidade — avalie se é possível construir uma spec técnica com segurança, verificando:

- O problema/necessidade está descrito de forma clara e não ambígua (contexto + o que precisa mudar), já considerando o que foi esclarecido em comentários
- Existem critérios de aceite explícitos, ou claramente infiráveis da descrição/comentários
- O escopo (módulo, domínio, camada) está identificável dentro de cada projeto identificado no Passo 3 — incluindo o caso do Passo 3 não ter identificado nenhum projeto
- Não há contradições entre título, descrição, comentários e anexos
- Riscos, dependências externas ou decisões de negócio pendentes (se existirem) estão resolvidos ou explicitados — não deixados em aberto
- Anexos citados na descrição/comentários (mockups, prints, planilhas, documentos) foram de fato encontrados e lidos no Passo 2
- Toda dúvida de uma execução anterior do `/specforge-analyzer` (identificada no Passo 2) foi de fato respondida: uma dúvida só conta como resolvida se a resposta encontrada nos comentários for clara e completa; uma resposta parcial ou evasiva mantém a dúvida em aberto (ajuste o texto da dúvida para refletir especificamente o que ainda falta, em vez de repetir a pergunta original)

Liste explicitamente cada dúvida encontrada — as que restaram sem resposta de uma execução anterior, a de identificação de projeto do Passo 3 (se aplicável) e quaisquer dúvidas novas identificadas agora (pergunta objetiva e específica — não genérica). Se nenhuma dúvida for encontrada, considere que há 100% das informações necessárias.

Escreva cada dúvida já em linguagem simples e não técnica (evite nomes de arquivos, classes, tabelas, frameworks ou padrões de arquitetura) — quem vai ler e responder no card, no Passo 5, são analistas de negócio/produto, não desenvolvedores. Pergunte sobre a regra de negócio, o comportamento esperado ou a decisão que falta, nunca sobre como implementar.

## Passo 5 — Se houver dúvidas: comentar no card e mover para "Triaged / Refinement"

Execute este passo apenas se o Passo 4 encontrou ao menos uma dúvida. Caso contrário, pule para o Passo 6.

**Este é o único mecanismo de "pergunta" deste comando — e não é uma pergunta interativa.** Nenhuma dúvida é resolvida esperando resposta no console: tudo que falta é registrado como comentário no próprio card, e o fluxo termina normalmente aqui (sem travar nem aguardar nada). Uma execução futura deste comando — depois que alguém responder no card — é que vai ler essas respostas (Passo 2) e reavaliar.

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
com base no que foi lido dele no Passo 3. Se nenhum projeto foi identificado no Passo 3, escreva:
"Ainda não identificamos com segurança qual sistema este pedido afeta — ver dúvida abaixo."}

**Dúvidas em aberto**
{lista numerada com cada dúvida identificada no Passo 4}
```

Todo o texto dos quatro blocos — não só as dúvidas — deve estar em **linguagem simples e não
técnica**: quem lê e responde esse comentário são analistas de negócio e produto, não
desenvolvedores. Evite jargão técnico (nomes de arquivos, classes, tabelas, frameworks, padrões
de arquitetura, termos como "endpoint" ou "payload"); descreva em termos de comportamento do
sistema e regras de negócio.

**Se houver usuários registrados** na seção `## Usuários para dúvidas (specforge)` (lida no Passo 1), referencie-os ao final do comentário como menção nativa de verdade — não como texto simples com o email. O texto simples é fallback de último caso, não o caminho padrão; tente ativamente montar a menção antes de desistir.

**Se o MCP `azure-devops` estiver configurado:**
1. Para cada email, resolva a identidade do usuário: procure uma ferramenta de identidade/usuário do MCP (nomes prováveis: `azure_devops_get_user`, `azure_devops_search_identity`, `azure_devops_list_users`, algo com `graph`/`identity` no nome — chame `list_tools` e filtre pelo prefixo `azure_devops_` se nenhum nome óbvio for reconhecido) que aceite busca por email/UPN e retorne o **GUID da identidade** e o nome de exibição.
2. Com o GUID em mãos, monte a menção **exatamente** neste formato HTML — é o formato nativo que o Azure DevOps usa para notificar o usuário mencionado em comentários/discussões de work item:
   ```html
   <a href="#" data-vss-mention="version:2.0,{identityGuid}">@{Nome de exibição}</a>
   ```
3. Insira essa marcação diretamente no corpo do comentário (ao final, uma por linha). Se a ferramenta de criação/atualização de comentário tiver um parâmetro de formato/tipo de conteúdo (ex.: `format`, `contentType`), defina como HTML — se o comentário for postado como texto puro/escapado, a tag `<a>` aparece literalmente na tela e ninguém é notificado, que é exatamente o sintoma a evitar aqui.
4. Só caia no fallback de texto simples (abaixo) se a busca de identidade não retornar um GUID para aquele email específico — não pelo simples fato de o formato de menção não ser óbvio à primeira vista.

**Se o MCP `linear` estiver configurado:**
1. Para cada email, resolva o usuário: `linear_list_users`/`linear_get_user`/equivalente filtrando por email, para obter o `id` do usuário.
2. Verifique no schema/descrição da ferramenta de criação de comentário se existe suporte a menção — o Linear tipicamente aceita a sintaxe de menção inline dentro do corpo em markdown/rich text referenciando o ID do usuário (ex.: um nó de menção com o `id` resolvido, ou sintaxe `@[Nome](user:{id})` dependendo da versão do MCP). Use a forma documentada pela ferramenta disponível na sessão.
3. Se a ferramenta de comentário não expuser nenhuma forma de menção estruturada (nem campo dedicado, nem sintaxe inline documentada), aí sim use o fallback de texto simples abaixo.

**Fallback — só quando a resolução de identidade falhar de verdade para um email específico**, adicione ao final do comentário, em texto simples, apenas os emails que não puderam ser resolvidos (mantenha a menção nativa para os que deram certo):
   ```
   ---
   Necessita resposta de: {email1}, {email2}, {email3}
   ```

**Verificação de idempotência antes de postar:** liste os comentários do card (já obtidos no Passo 2) e procure um que comece com `## Dúvidas para construção da spec — specforge-analyzer`.
- **Se encontrar:** atualize esse comentário com os quatro blocos e as referências de usuário atuais (use a ferramenta de atualização do MCP; se não existir ou falhar, crie um novo comentário e adicione logo após o cabeçalho `> Atualização de comentário anterior — ID {comment_id}`).
- **Se não encontrar:** crie um novo comentário.

### Mover o card para "Triaged / Refinement"

Liste os estados/colunas disponíveis do card via MCP (Linear: workflow states do time; Azure DevOps: valores válidos do campo de estado/coluna do board — use `list_tools` para achar a ferramenta certa se o nome não for óbvio).

Procure automaticamente por um estado/coluna cujo nome corresponda a "Triaged / Refinement":
1. Comparação exata ignorando maiúsculas/minúsculas e espaços extras.
2. Se não encontrar, procure um estado/coluna cujo nome contenha as palavras "triag" ou "refin" (em qualquer variação/idioma razoável).
3. **Se encontrar em qualquer uma das duas tentativas:** mova o card para esse estado/coluna.
4. **Se não encontrar:** **não pergunte ao dev.** Não mova o card. Registre no relatório final (Passo 8) que não foi possível mover o card, junto com a lista de estados/colunas disponíveis, para que alguém ajuste manualmente ou renomeie um estado no tracker depois.

Em caso de falha do MCP ao comentar ou mover o card, informe o erro e continue para o relatório final (Passo 8) — não interrompa silenciosamente.

Após este passo, **não** prossiga para o Passo 6 — a geração da spec só ocorre em uma execução futura, depois que as dúvidas forem respondidas no card.

## Passo 6 — Se não houver dúvidas: gerar a spec técnica de cada projeto afetado

Execute este passo apenas se o Passo 4 não encontrou nenhuma dúvida (o que implica que o Passo 3 identificou ao menos um projeto).

Para **cada projeto** em `{diretórios dos projetos}`, repita o bloco abaixo (pode ser em sequência, projeto por projeto):

Crie o diretório `{diretório do projeto}/docs/specs/tmp/` se não existir.

Despache, em sequência, os mesmos 3 sub-agentes usados pelo `/specforge-create-spec` — reaproveitando os dados do card já obtidos no Passo 2, já com o entendimento consolidado descrito no fim do Passo 2 (não busque o work item novamente, não refaça a leitura por ID) — cada um com o mesmo formato de contexto que `/specforge-create-spec` usa nos seus Passos 4-6, acrescentando sempre `Diretório do projeto: {diretório do projeto}/`:

**`specforge-agent-developer`:**
```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa, já enriquecida pelos comentários}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
- Diretório do projeto: {diretório do projeto}/
- Achados de consulta ao banco de dados (opcional): {resumo do que foi observado no Passo 3 para este projeto, se alguma consulta foi feita}
```
Verifique que `{diretório do projeto}/docs/specs/tmp/{ID}-solution.md` foi criado antes de continuar (mesma verificação de `/specforge-create-spec` Passo 4).

**`specforge-agent-qa`:**
```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa, já enriquecida pelos comentários}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- Confirmação: {diretório do projeto}/docs/specs/tmp/{ID}-solution.md existe
- Diretório do projeto: {diretório do projeto}/
- Achados de consulta ao banco de dados (opcional): {resumo do que foi observado no Passo 3 para este projeto, se alguma consulta foi feita}
```
Verifique que `{diretório do projeto}/docs/specs/tmp/{ID}-test-scenarios.md` foi criado antes de continuar (mesma verificação de `/specforge-create-spec` Passo 5).

**`specforge-agent-tech-lead`:**
```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa, já enriquecida pelos comentários}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- Documentos gerados:
  - {diretório do projeto}/docs/specs/tmp/{ID}-solution.md
  - {diretório do projeto}/docs/specs/tmp/{ID}-test-scenarios.md
- Diretório do projeto: {diretório do projeto}/
```

Registre, para este projeto, se o resultado em `{diretório do projeto}/docs/specs/tmp/{ID}-spec-reviewed.md` foi `APROVADO` ou `REPROVADO`.

Se algum arquivo esperado (`{ID}-solution.md`, `{ID}-test-scenarios.md` ou `{ID}-spec-reviewed.md`) não for criado por algum sub-agente em algum projeto, trate como reprovação desse projeto, com a mensagem correspondente de `/specforge-create-spec`.

**Depois de rodar os 3 sub-agentes para todos os projetos de `{diretórios dos projetos}`:**
- **Se todos os projetos foram `APROVADO`:** prossiga para o Passo 7.
- **Se algum projeto foi `REPROVADO`:** trate o card inteiro como reprovado — **não** prossiga para o Passo 7, não mova o card, não crie a task. Uma spec parcial (só alguns dos projetos afetados) não é publicada. Reúna as mensagens de reprovação de cada projeto reprovado para o relatório final (Passo 8).

## Passo 7 — Publicar a spec consolidada como task única "spec" e mover o card para "Ready for Development"

Execute este passo apenas se o Passo 6 terminou com todos os projetos `APROVADO`.

Despache o sub-agente `specforge-agent-coordinator` **uma única vez** (mesmo com múltiplos projetos) com o seguinte contexto:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa, já enriquecida pelos comentários}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
- Modo de publicação: task
- Nome da task: spec
- Projetos:
  - Diretório: {diretório do projeto 1}/
    Documentos:
      - {diretório do projeto 1}/docs/specs/tmp/{ID}-spec-reviewed.md
      - {diretório do projeto 1}/docs/specs/tmp/{ID}-solution.md
      - {diretório do projeto 1}/docs/specs/tmp/{ID}-test-scenarios.md
  - {repita para cada projeto adicional em {diretórios dos projetos}}
```

O agent-coordinator roda em modo `task` sem nenhuma interação no console — a aprovação de qualidade já foi feita pelo agent-tech-lead de cada projeto no Passo 6. Ele consolida todos os projetos num único documento, grava `docs/specs/{ID}-spec-consolidado.md` na pasta workspace (com nome propositalmente diferente de `{ID}-spec.md` — ver justificativa no agent-coordinator, Passo 4 — além de uma cópia individual `{ID}-spec.md` por projeto), cria **uma única** task "spec" no card e não cria tarefas adicionais de desenvolvimento/teste no tracker (o conteúdo já vem consolidado nessa task).

**Se a criação da task falhar no MCP:** a spec já foi gravada localmente (mensagem de erro do agent-coordinator explica onde) — mesmo assim, prossiga para tentar mover o card (a falta da task não deve travar a movimentação; registre ambos os problemas no relatório final).

**Depois do agent-coordinator concluir** (com ou sem sucesso na criação da task):

Liste os estados/colunas disponíveis do card via MCP e procure automaticamente por um que corresponda a "Ready for Development":
1. Comparação exata ignorando maiúsculas/minúsculas e espaços extras.
2. Se não encontrar, procure um estado/coluna cujo nome contenha as palavras "ready" e "dev" (em qualquer variação/idioma razoável).
3. **Se encontrar em qualquer uma das duas tentativas:** mova o card para esse estado/coluna.
4. **Se não encontrar:** **não pergunte ao dev.** Não mova o card. Registre no relatório final a lista de estados/colunas disponíveis para ajuste manual depois.

Em caso de falha do MCP ao mover o card, informe o erro — a spec e a task já foram criadas normalmente, então não desfaça nada.

## Passo 8 — Relatório final

**Se o fluxo parou no Passo 5 (dúvidas):**
```
⚠ Dúvidas identificadas — {ID}: {título}

{N} dúvida(s) publicada(s) como comentário no card.
{Se houver usuários registrados: "Usuários referenciados: {email} — {✓ menção nativa | ✗ fallback em texto, motivo: {razão}}" para cada um}
{Card movido para: Triaged / Refinement | ✗ Card não movido — nenhum estado/coluna correspondente a "Triaged / Refinement" encontrado. Estados disponíveis: {lista}}

Próximo passo: alguém responde as dúvidas no card {ID} e roda /specforge-analyzer {ID} novamente.
```

**Se o fluxo parou no Passo 6 (algum projeto reprovado pelo tech-lead):**
```
✗ Spec REPROVADA — {ID}: {título}

Projetos avaliados: {lista com o resultado de cada um — APROVADO / REPROVADO}

{Para cada projeto REPROVADO, a mensagem de reprovação já exibida pelo agent-tech-lead daquele projeto}

O card não foi movido. Nenhuma task foi criada.
```

**Se o fluxo concluiu o Passo 7:**
```
✓ Fluxo concluído — {ID}: {título}

Projetos: {lista}
Spec consolidada: docs/specs/{ID}-spec-consolidado.md (workspace)
Spec individual por projeto: {lista de "{diretório}/docs/specs/{ID}-spec.md"} — use esta com /specforge-execute-spec
{✓ Task "spec" criada/atualizada no card {ID} | ✗ Falha ao criar/atualizar task — veja mensagem acima}
{Card movido para: Ready for Development | ✗ Card não movido — nenhum estado/coluna correspondente a "Ready for Development" encontrado. Estados disponíveis: {lista}}

Nenhuma tarefa adicional de desenvolvimento/teste foi criada no tracker — está tudo consolidado na task "spec".
```
