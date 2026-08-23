# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**skill-specforge** é um plugin de Claude Code que automatiza geração e implementação de specs técnicas a partir de work items do **Azure DevOps** ou **Linear**. Instalado via `claude plugin marketplace add` + `claude plugin install`, ele expõe slash commands e sub-agentes que ficam disponíveis imediatamente em qualquer projeto, sem etapa de instalação adicional no projeto-alvo.

O fluxo é organizado em torno de um **workspace**: uma pasta onde um ou mais repositórios são
clonados e vinculados via `/specforge-add-project`. O workspace tem seu próprio `CLAUDE.md`
(distinto do `CLAUDE.md` de cada projeto clonado dentro dele), com a lista de projetos vinculados
na seção `## Projetos vinculados (specforge)` e, opcionalmente, a lista de usuários que podem
responder dúvidas de spec (registrados via `/specforge-add-user`) na seção
`## Usuários para dúvidas (specforge)`. `/specforge-analyzer` roda a partir do workspace e usa
essas seções para decidir qual projeto um card afeta e quem referenciar ao comentar dúvidas.
`/specforge-analyzer-all` repete o fluxo do `/specforge-analyzer` para até 3 cards da coluna
Backlog por execução (limite fixo). Nenhum dos dois faz qualquer pergunta no console — um card
pode afetar mais de um projeto ao mesmo tempo, e qualquer decisão que dependeria de um humano
(projeto ambíguo, informação faltando) vira comentário no próprio card em vez de interromper a
execução esperando resposta na tela.

## Organização

Este repositório é o **código-fonte do plugin** — não o projeto que o usa. Segue a convenção de plugins do Claude Code: `commands/` e `agents/` na raiz são descobertos automaticamente após `claude plugin install`.

- `commands/` — slash commands do plugin, disponíveis imediatamente em qualquer projeto/workspace após instalar: `/specforge-add-project`, `/specforge-add-user`, `/specforge-update`, `/specforge-analyzer`, `/specforge-analyzer-all`, `/specforge-create-spec`, `/specforge-execute-spec`
- `agents/` — os 4 sub-agentes despachados por `/specforge-create-spec` e `/specforge-analyzer`/`/specforge-analyzer-all` (developer, qa, tech-lead, coordinator), também disponíveis imediatamente após instalar
- `assets/commands/specforge-init-project.md` — instruções de `/specforge-init-project`, acionado via a Skill (`SKILL.md`) porque precisa ler `assets/templates/CLAUDE.template.md` do próprio plugin; gera ou mescla `CLAUDE.md` e `.claude/steering/` no projeto-alvo (nunca copia commands/agents — esses já vêm do plugin). `/specforge-add-project` invoca esse mesmo fluxo, escopado à pasta do projeto recém-clonado.
- `assets/steering/` — exemplos de referência do formato esperado de `.claude/steering/`; não são copiados literalmente (`/specforge-init-project` sempre escreve conteúdo derivado da análise real do projeto-alvo)
- `assets/templates/CLAUDE.template.md` — template copiado (ou mesclado, se `CLAUDE.md` já existir) para `CLAUDE.md` do projeto-alvo

`SKILL.md` define o frontmatter da skill (`name`, `description`) que aciona `/specforge-init-project`. O workflow em `.github/workflows/claude.yml` roda `claude-code-action` automaticamente em issues e comentários de PR — requer o secret `CLAUDE_CODE_OAUTH_TOKEN`.

O `agent-coordinator` publica a spec no card em dois modos: `comentário` (padrão, usado por
`/specforge-create-spec`, interativo, um único projeto) ou `task` (usado por `/specforge-analyzer`,
sem nenhuma interação no console, um ou mais projetos consolidados numa única task). No modo
`task`, o agent-coordinator não pede aprovação humana (o agent-tech-lead já aprovou cada projeto
antes de chegar até ele), consolida todos os projetos afetados num só documento salvo em
`docs/specs/{ID}-spec-consolidado.md` na pasta workspace (nome deliberadamente diferente de
`{ID}-spec.md` — cada projeto também recebe sua própria cópia individual nesse nome, e um nome
igual ao do consolidado criaria risco de o `/specforge-execute-spec` ler o documento errado se
rodado da pasta workspace por engano; o `/specforge-execute-spec` também se recusa a rodar sobre
um arquivo com mais de um cabeçalho `## Projeto: ` como segunda camada de proteção), e não cria as
tasks adicionais de desenvolvimento/teste que cria no modo `comentário` — tudo fica na task única,
que precisa ser autossuficiente, sem referências a arquivos do repositório, pastas temporárias ou
anexos externos, porque quem executa pode não ter acesso a eles. `/specforge-analyzer` também move o card entre colunas/estados
do tracker — "Triaged / Refinement" quando há dúvidas, "Ready for Development" quando a spec é
publicada — sempre por correspondência automática de nome, nunca perguntando qual coluna usar.
`/specforge-analyzer` usa os comentários do card (incluindo respostas a dúvidas de execuções
anteriores) como entrada prioritária da análise, não só a descrição original, e pode identificar
mais de um projeto afetado pelo mesmo card.

`/specforge-execute-spec` nunca implementa direto na branch principal (os projetos são clonados
a partir dela pelo `/specforge-add-project`): cria ou reutiliza uma branch `specforge/{ID}` antes
de tocar em qualquer arquivo, commita e dá push só nessa branch, e interrompe a execução se por
algum motivo continuar na branch principal depois de tentar trocar — abrir o PR dessa branch para
a principal continua manual, fora do escopo do comando.

O `/specforge-init-project` também detecta o tipo de banco de dados do projeto (dependências,
connection string, `docker-compose.yml`) e grava no campo `**Banco de dados:**` da seção
`## Comandos e projeto (specforge)` do `CLAUDE.md`. Com esse campo preenchido e um MCP
correspondente disponível na sessão, `/specforge-analyzer` e os sub-agentes `agent-developer`/
`agent-qa` podem consultar esse banco em tempo de análise/geração de spec para reduzir dúvidas
e propor soluções mais precisas — **sempre somente leitura, sem exceção** (pode consultar
qualquer estrutura ou dado que o acesso permitir, mas nunca `INSERT`/`UPDATE`/`DELETE`/DDL); sem
MCP de banco configurado, a consulta é pulada silenciosamente, nunca interrompe o fluxo.

O `/specforge-init-project` também deriva a seção `## Requisitos técnicos obrigatórios por tipo
de mudança` em `.claude/steering/architecture.md` — uma tabela por categoria de mudança (API /
endpoint HTTP; job assíncrono/batch/fila; procedure/rotina de banco; biblioteca interna) com o
requisito concreto do projeto para cada um dos 4 critérios do tech-lead (escalabilidade,
observabilidade, cobertura ≥80%, segurança). Existe porque esses critérios variam por tipo de
mudança (ex.: healthcheck de API não se aplica a uma stored procedure) e por stack — não faz
sentido um checklist genérico único. Com essa seção preenchida, `agent-developer`/`agent-qa` já
desenham a solução e os testes em conformidade com ela (via a subseção "Requisitos técnicos
aplicados" que o `agent-developer` grava em `{ID}-solution.md`), e `agent-tech-lead` revisa contra
o requisito concreto da categoria identificada em vez da pergunta genérica — reduzindo reprovações
por um critério que a categoria da mudança nem exige. Projetos sem essa seção ainda (não
atualizados desde essa novidade) caem no fallback genérico de sempre, sinalizado no relatório do
`agent-developer`.

`/specforge-update` roda na pasta workspace e percorre a tabela `## Projetos vinculados
(specforge)`, re-executando o fluxo do `/specforge-init-project` (sempre em modo merge, pois
esses projetos já têm `CLAUDE.md`/steering) em cada um — é o mecanismo para projetos já
vinculados herdarem novidades da skill (ex.: um campo novo no `CLAUDE.md`) depois que o plugin é
atualizado, sem precisar rodar `/specforge-init-project` manualmente pasta por pasta.

## Como contribuir

Não há build ou testes — o projeto é inteiramente Markdown e YAML.

- Para mudar o comportamento de um comando: edite `commands/`.
- Para mudar o comportamento de um sub-agente: edite `agents/`.
- Para mudar a geração/merge de `CLAUDE.md` ou steering no projeto-alvo: edite `assets/commands/specforge-init-project.md`.
- Para mudar o CLAUDE.md gerado: edite `assets/templates/CLAUDE.template.md`.
- Para mudar como a spec é publicada no card (comentário vs. task) ou as tarefas criadas: edite `agents/specforge-agent-coordinator.md`.
- Antes de publicar uma nova versão: preencha `name` e `description` em `SKILL.md` e bump a versão em `.claude-plugin/marketplace.json`.
