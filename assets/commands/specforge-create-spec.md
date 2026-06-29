Gera uma especificação técnica estruturada a partir de um work item do Azure DevOps ou Linear.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Ler o contexto do projeto

Leia os seguintes arquivos para entender o projeto antes de analisar o work item:

1. `CLAUDE.md` — stack, comandos, convenções gerais
2. `.claude/steering/architecture.md` — estrutura e decisões arquiteturais
3. `.claude/steering/domain-rules.md` — regras de negócio e restrições de domínio

Se algum desses arquivos não existir, sinalize e continue. Se nenhum existir, sugira rodar `/specforge-init-project` primeiro.

## Passo 2 — Buscar o work item via MCP

Use o MCP disponível na sessão para buscar o work item pelo ID informado:

**Se o MCP `linear` estiver configurado:**
- Busque a issue pelo ID (ex: `ENG-1234`)
- Extraia: título, descrição, labels, assignee, status, critérios de aceite (se presentes na descrição)

**Se o MCP `azure-devops` estiver configurado:**
- Busque o work item pelo ID numérico
- Extraia: título, descrição, acceptance criteria, tags, área, iteração

**Se nenhum MCP estiver disponível:**
- Informe o dev: "Nenhum MCP de work tracker encontrado. Configure o MCP do Linear ou do Azure DevOps e tente novamente."
- Interrompa a execução.

Se o work item não for encontrado pelo ID, informe e interrompa.

## Passo 3 — Identificar arquivos relevantes do projeto

Com base no título, descrição e tags do work item:

1. Infira quais módulos, domínios ou camadas provavelmente serão tocados (ex: autenticação, pagamentos, notificações)
2. Use busca por padrão de nome e conteúdo para localizar arquivos candidatos
3. Leia os arquivos mais relevantes para entender o estado atual do código — limite a no máximo 10 arquivos para não ampliar demais o escopo
4. Registre os arquivos lidos: eles serão listados na seção "Arquivos que serão alterados" da spec
5. **Detecte se a mudança envolve uma API** — verifique se o work item cria ou modifica endpoints HTTP (controllers, routes, handlers). Registre essa informação: ela determina se a seção de healthcheck será incluída na spec
6. **Detecte o tipo do work item** — feat/fix/refactor ou chore/docs/config. Registre: determina se critérios de cobertura de testes serão incluídos

## Passo 4 — Gerar a spec técnica

Produza o conteúdo da spec seguindo exatamente a estrutura abaixo. Baseie cada seção no que foi coletado nos passos anteriores — não invente informações que não estejam no work item ou no código.

```markdown
# {ID}: {título do work item}

**Work item:** {link ou referência}
**Data:** {data de hoje}
**Status:** rascunho

---

## Contexto

{Por que este trabalho existe? Qual é o cenário atual que motiva a mudança?}

## Problema a resolver

{O que está quebrado, faltando ou inadequado? Seja específico.}

## Solução proposta

{Descrição técnica da abordagem escolhida. Inclua: padrões usados, fluxo de dados,
integrações afetadas. Evite detalhar o óbvio — foque nas decisões não-triviais.}

## Arquivos que serão alterados

| Arquivo | Tipo de alteração | Motivo |
|---|---|---|
| `caminho/do/arquivo.ts` | adição / modificação / remoção | breve justificativa |

## Impacto em outros domínios

{Quais outros módulos, serviços ou times podem ser afetados indiretamente?
Se não houver impacto identificado, escreva "Nenhum identificado."}

## Critérios de aceite técnicos

- [ ] {critério mensurável 1}
- [ ] {critério mensurável 2}
{Se o work item envolver código testável (feat, fix, refactor): inclua o critério abaixo. Omita para chore, docs ou configuração pura.}
- [ ] Cobertura de testes ≥ 80% nos arquivos criados ou modificados por esta spec

{Traduza os critérios de aceite do work item para verificações técnicas concretas.}

## Estratégia de testes

{Preencha esta seção apenas se o work item envolver código testável (feat, fix, refactor).
Se for chore, docs ou configuração pura, substitua o conteúdo por: "Não aplicável."}

**Cobertura mínima:** 80% nas linhas dos arquivos alterados por esta spec. Inclua o comando
para verificar cobertura: `{COMANDO_TEST} --coverage` (ajuste conforme o CLAUDE.md do projeto).

**Dependências a mockar:**

| Dependência | Tipo | Motivo do mock |
|---|---|---|
| {ex: repositório de banco} | repositório | isola o teste da infraestrutura |
| {ex: cliente HTTP externo} | serviço externo | evita chamada real em teste |
| {ex: serviço de e-mail} | serviço externo | comportamento controlável |

{Liste todas as dependências externas ao módulo testado que devem ser mockadas.
Não mocke lógica de negócio — apenas infraestrutura e serviços externos.}

**Casos obrigatórios a cobrir:**
- [ ] Caminho feliz (entrada válida, resultado esperado)
- [ ] Entrada inválida ou nula (validação)
- [ ] Falha de dependência mockada (resiliência)
- [ ] {caso específico do domínio derivado dos critérios de aceite}

## Healthcheck de API

{Preencha esta seção apenas se o work item criar ou modificar endpoints HTTP.
Se não houver API envolvida, substitua o conteúdo por: "Não aplicável."}

**Endpoints criados ou modificados:**

| Método | Rota | Comportamento esperado |
|---|---|---|
| GET | `/health` | retorna 200 com status do serviço |
| {método} | `{rota}` | {o que retorna em condição normal} |

**Critério de healthcheck:**
- [ ] Endpoint `GET /health` retorna `200 OK` com payload `{ "status": "up" }` quando o serviço está saudável
- [ ] Endpoint `GET /health` retorna `503 Service Unavailable` quando uma dependência crítica está indisponível
- [ ] Healthcheck não expõe informações sensíveis (credenciais, stack trace, dados de usuário)

{Se o projeto já tem um padrão de healthcheck, siga-o. Verifique em `.claude/steering/architecture.md`
antes de propor um novo endpoint.}

## Riscos e dependências

- **Risco:** {descrição} — **Mitigação:** {ação}
- **Dependência:** {serviço, time ou PR que deve existir antes}

## Estimativa de esforço

{P / M / G / XG com justificativa de 1 linha. Baseie na quantidade de arquivos
afetados, complexidade das mudanças e dependências externas.}
```

## Passo 5 — Confirmar antes de salvar

Antes de salvar o arquivo, exiba a spec gerada e pergunte:

> "Spec gerada para {ID}. Deseja salvar em `.claude/specs/{ID}.md`?
> Você pode pedir ajustes antes de confirmar."

Aguarde a confirmação do dev. Se ele pedir ajustes, aplique e exiba novamente antes de salvar.

Após confirmação, salve em `.claude/specs/{ID}.md` (crie o diretório se não existir) e prossiga para o Passo 6.

## Passo 6 — Publicar a spec no card de origem

Com a spec já salva localmente, publique seu conteúdo como comentário (Linear) ou discussão (ADO) no card de origem. Use o mesmo MCP identificado no Passo 2.

**Guard — sem MCP disponível:** Se no Passo 2 nenhum MCP estava disponível (nenhum MCP de work tracker encontrado), pule as seções de posting abaixo e vá diretamente para "Emitir o relatório final", usando a variante de falha com o texto de erro: `Nenhum MCP de work tracker configurado nesta sessão — posting não realizado automaticamente`.

### Montar o corpo do comentário

O conteúdo a ser postado é exatamente o texto da spec gerada no Passo 4, prefixado pelo cabeçalho de identificação:

```
## Spec Técnica — gerada por specforge

{conteúdo completo da spec em Markdown}
```

Inclua o conteúdo completo da spec tal como foi gerado no Passo 4, incluindo o cabeçalho `# {ID}: {título}`. No contexto de um comentário de card, a hierarquia de cabeçalhos não precisa ser ajustada.

### Verificar idempotência antes de postar

Antes de criar um novo comentário, verifique se já existe um com o cabeçalho `## Spec Técnica — gerada por specforge` no card:

**Se o MCP `linear` foi usado:**
1. Liste os comentários da issue (use a ferramenta de listagem de comentários disponível no MCP linear — ex.: `linear_get_comments`, `linear_list_comments` ou equivalente).
2. Busque pelo campo de corpo (`body` / `content`) que contenha, em qualquer posição, o texto `## Spec Técnica — gerada por specforge`.
3. **Se encontrar:** use a ferramenta de atualização de comentário (ex.: `linear_update_comment`) passando o ID do comentário existente e o novo corpo.
   - 3b. **Se a ferramenta de atualização não existir ou retornar erro ao tentar atualizar:** crie um novo comentário com o mesmo conteúdo. No cabeçalho do novo comentário, logo após `## Spec Técnica — gerada por specforge`, inclua a linha: `> Atualização de comentário anterior — ID {comment_id}`. Não deixe a spec sem posting.
4. **Se não encontrar:** crie um novo comentário com a ferramenta de criação (ex.: `linear_create_comment`) referenciando o ID da issue.

**Se o MCP `azure-devops` foi usado:**
1. Liste os comentários do work item (use a ferramenta disponível no MCP — ex.: `azure_devops_get_work_item_comments`, `azure_devops_list_comments` ou equivalente).
2. Busque pelo campo de texto que contenha, em qualquer posição, o texto `## Spec Técnica — gerada por specforge`.
3. **Se encontrar:** use a ferramenta de atualização de comentário do work item passando o ID do comentário e o novo texto.
   - 3b. **Se a ferramenta de atualização não existir ou retornar erro ao tentar atualizar**, crie um novo comentário com o mesmo conteúdo. No cabeçalho do novo comentário, logo após `## Spec Técnica — gerada por specforge`, inclua a linha: `> Atualização de comentário anterior — ID {comment_id}`. Não deixe a spec sem posting.
4. **Se não encontrar:** adicione um novo comentário ao work item com a ferramenta de criação (ex.: `azure_devops_add_work_item_comment`).

> **Nota:** os nomes exatos das ferramentas MCP variam por configuração. Use `list_tools` ou equivalente para descobrir as ferramentas disponíveis caso não reconheça os nomes acima. Se após a listagem nenhuma ferramenta de comentário for identificada, trate como falha de MCP e siga para "Tratar falha na atualização do card".

### Tratar falha na atualização do card

**Se o MCP retornar erro ou a ferramenta não estiver disponível:**

1. Sinalize o erro no terminal com a mensagem abaixo, substituindo `{ID}` pelo ID real do work item e `{mensagem de erro}` pelo texto de erro retornado pelo MCP — não interrompa silenciosamente:

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
✓ Card {ID} recebeu a spec técnica

Próximo passo: /specforge-execute-spec {ID}
```

**Nota (sub-step 3b):** Se a ferramenta de atualização de comentário não estava disponível e um novo comentário foi criado com a nota de proveniência, use a mensagem de sucesso acima mas adicione uma linha de aviso:
```
⚠ O comentário anterior com a spec não foi removido — pode ser necessário apagá-lo manualmente no card.
```

**Em caso de falha no posting:**
```
✓ Spec salva em .claude/specs/{ID}.md
✗ Falha ao atualizar o card {ID} — veja instruções acima para envio manual.

Próximo passo: /specforge-execute-spec {ID}
```
