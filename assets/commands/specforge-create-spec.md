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

Após confirmação, salve em `.claude/specs/{ID}.md` (crie o diretório se não existir) e informe:

```
✓ Spec salva em .claude/specs/{ID}.md

Próximo passo: /specforge-execute-spec {ID}
```
