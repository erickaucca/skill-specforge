Gera uma especificação técnica estruturada a partir de um work item do Azure DevOps ou Linear.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Ler o contexto do projeto

Leia os seguintes arquivos para entender o projeto antes de analisar o work item:

1. `CLAUDE.md` — stack, comandos, convenções gerais
2. `.claude/steering/architecture.md` — estrutura e decisões arquiteturais
3. `.claude/steering/domain-rules.md` — regras de negócio e restrições de domínio

Se algum desses arquivos não existir, sinalize e continue. Se nenhum existir, sugira rodar `/init-project` primeiro.

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

## Passo 4 — Gerar a spec técnica

Produza o conteúdo da spec seguindo exatamente a estrutura abaixo. Baseie cada seção no que foi coletado nos passos anteriores — não invente informações que não estejam no work item ou no código.

```markdown
# WI-{ID}: {título do work item}

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

{Traduza os critérios de aceite do work item para verificações técnicas concretas.}

## Riscos e dependências

- **Risco:** {descrição} — **Mitigação:** {ação}
- **Dependência:** {serviço, time ou PR que deve existir antes}

## Estimativa de esforço

{P / M / G / XG com justificativa de 1 linha. Baseie na quantidade de arquivos
afetados, complexidade das mudanças e dependências externas.}
```

## Passo 5 — Confirmar antes de salvar

Antes de salvar o arquivo, exiba a spec gerada e pergunte:

> "Spec gerada para WI-{ID}. Deseja salvar em `.claude/specs/WI-{ID}.md`?
> Você pode pedir ajustes antes de confirmar."

Aguarde a confirmação do dev. Se ele pedir ajustes, aplique e exiba novamente antes de salvar.

Após confirmação, salve em `.claude/specs/WI-{ID}.md` (crie o diretório se não existir) e informe:

```
✓ Spec salva em .claude/specs/WI-{ID}.md

Próximo passo: /implementa-spec {ID}
```
