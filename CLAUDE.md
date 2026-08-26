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

**`CLAUDE.md`/`.claude/steering/` de um projeto vivem em um de dois lugares, dependendo de como
`/specforge-init-project` foi acionado** — esse é o conceito de "diretório de configuração",
distinto do "diretório do projeto" (onde ficam código, `docs/specs/` e `docs/changelogs/`, sempre
dentro do repositório clonado, sempre):
- **Chamado diretamente pelo console** (dev roda `/specforge-init-project` de dentro do próprio
  projeto, sem workspace envolvido): diretório de configuração = diretório do projeto — mesmo
  comportamento de sempre, `CLAUDE.md`/steering ficam na própria pasta do projeto.
- **Chamado por `/specforge-add-project` ou `/specforge-update`**: diretório de configuração =
  `.claude/{nome-do-projeto}/` **na pasta pai (o workspace)**, não dentro do repositório clonado.
  `CLAUDE.md`/`.claude/steering/` ficam fora do projeto e não são commitados junto com o código
  dele — são metadado local do workspace. Só `docs/specs/`/`docs/changelogs/` continuam dentro do
  projeto, porque `/specforge-execute-spec` precisa commitá-los junto com o código.

`/specforge-analyzer` (que já roda a partir do workspace) sempre lê/escreve o diretório de
configuração de cada projeto explicitamente. Já `/specforge-create-spec` e
`/specforge-execute-spec` rodam de dentro da pasta do projeto e precisam **resolver** o diretório
de configuração sozinhos: verificam se `../.claude/{nome da pasta atual}/CLAUDE.md` existe (caso
em que o projeto foi vinculado a um workspace) antes de recorrer à pasta atual. Os 3 sub-agentes
de spec (`developer`, `qa`, `tech-lead`) recebem esse diretório de configuração como um campo
próprio no contexto de despacho, distinto do diretório do projeto — quando não informado, caem de
volta no diretório do projeto (ou pasta atual), preservando o comportamento anterior a essa
mudança.

## Organização

Este repositório é o **código-fonte do plugin** — não o projeto que o usa. Segue a convenção de plugins do Claude Code: `commands/` e `agents/` na raiz são descobertos automaticamente após `claude plugin install`.

- `commands/` — slash commands do plugin, disponíveis imediatamente em qualquer projeto/workspace após instalar: `/specforge-add-project`, `/specforge-add-user`, `/specforge-update`, `/specforge-analyzer`, `/specforge-analyzer-all`, `/specforge-create-spec`, `/specforge-execute-spec`
- `agents/` — os 4 sub-agentes despachados por `/specforge-create-spec` e `/specforge-analyzer`/`/specforge-analyzer-all` (developer, qa, tech-lead, coordinator), também disponíveis imediatamente após instalar
- `assets/commands/specforge-init-project.md` — instruções de `/specforge-init-project`, acionado via a Skill (`SKILL.md`) porque precisa ler `assets/templates/CLAUDE.template.md` do próprio plugin; gera ou mescla `CLAUDE.md` e `.claude/steering/` (nunca copia commands/agents — esses já vêm do plugin). Distingue diretório do projeto (código, `docs/specs/`, `docs/changelogs/`) de diretório de configuração (`CLAUDE.md`/`.claude/steering/`) — os dois só coincidem quando chamado direto pelo console; `/specforge-add-project` e `/specforge-update` invocam esse mesmo fluxo informando os dois diferentes (ver seção acima).
- `assets/steering/` — exemplos de referência do formato esperado de `.claude/steering/`; não são copiados literalmente (`/specforge-init-project` sempre escreve conteúdo derivado da análise real do projeto-alvo)
- `assets/templates/CLAUDE.template.md` — template copiado (ou mesclado, se `CLAUDE.md` já existir) para `CLAUDE.md` do projeto-alvo

`SKILL.md` define o frontmatter da skill (`name`, `description`) que aciona `/specforge-init-project`. O workflow em `.github/workflows/claude.yml` roda `claude-code-action` automaticamente em issues e comentários de PR — requer o secret `CLAUDE_CODE_OAUTH_TOKEN`.

O `agent-coordinator` publica a spec no card em dois modos: `comentário` (padrão, usado por
`/specforge-create-spec`, interativo, um único projeto, grava `docs/specs/{ID}-spec.md`
diretamente) ou `task` (usado por `/specforge-analyzer`, sem nenhuma interação no console, um ou
mais projetos). No modo `task`, o agent-coordinator não pede aprovação humana (o agent-tech-lead
já aprovou cada projeto antes de chegar até ele) e **não grava nada localmente** — para cada
projeto afetado, cria (ou atualiza) uma task própria vinculada ao card, título `spec - {nome do
projeto}`, com a spec completa e autossuficiente daquele projeto (sem referências a arquivos do
repositório, pastas temporárias ou anexos externos, porque quem executa pode não ter acesso a
eles). Uma task por projeto — não uma consolidada — é o que permite devs diferentes pegarem
projetos diferentes do mesmo card em paralelo, sem depender de alguém commitar um arquivo antes:
é o próprio `/specforge-execute-spec`, rodado depois de dentro de cada projeto, que busca o
conteúdo direto da task correspondente no tracker (por nome) e só então grava
`docs/specs/{ID}-spec.md` localmente, como parte do commit da implementação — sem exigir que a
spec exista localmente de antemão, e ainda preservando a spec versionada junto do código. Não cria
as tasks adicionais de desenvolvimento/teste que cria no modo `comentário` — cada task de spec já
é completa por si só. `/specforge-analyzer` também move o card entre colunas/estados
do tracker — "Triaged / Refinement" quando há dúvidas, "Ready for Development" quando a spec é
publicada — sempre por correspondência automática de nome, nunca perguntando qual coluna usar.
`/specforge-analyzer` usa os comentários do card (incluindo respostas a dúvidas de execuções
anteriores) como entrada prioritária da análise, não só a descrição original, e pode identificar
mais de um projeto afetado pelo mesmo card.

Quando o `agent-tech-lead` reprova a spec de algum projeto no fluxo do `/specforge-analyzer`, isso
**nunca vira comentário no card** — é um ciclo de correção interno à própria execução: o motivo da
reprovação vira contexto extra despachado ao `agent-developer`/`agent-qa` daquele projeto (que
refazem a solução), que volta para uma nova avaliação do `agent-tech-lead`, repetindo até aprovar
ou até uma proteção operacional de 10 rodadas ser atingida (não é uma política de tentativas — é
só para não deixar a execução rodando indefinidamente se os agentes ficarem oscilando entre dois
problemas). O `agent-tech-lead` nunca recebe esse histórico de rodadas — cada avaliação dele
precisa ser independente da anterior, para não reprovar de novo por inércia nem aprovar por
complacência; isso já é garantido pela arquitetura (cada dispatch de sub-agente é uma instância
nova, sem memória compartilhada entre invocações), então só é preciso ter o cuidado de não incluir
esse histórico no contexto de despacho dele. Só no caso raro de a proteção de 10 rodadas ser
atingida é que o card é comentado (`## Revisão técnica não convergiu — specforge-analyzer`) e
movido para "Triaged / Refinement" — mesmo destino das dúvidas de negócio, mas sinalizando que é
uma exceção que provavelmente precisa de decisão humana, não o caminho normal de uma reprovação.
O gate de informação de negócio (dúvidas) continua sem limite de tentativas via ciclo do card,
sem relação com essa proteção de 10 rodadas do ciclo técnico.

`/specforge-execute-spec` primeiro confirma via MCP que `{ID}` é um card real no tracker
configurado — **o MCP é obrigatório para este comando, sem exceção, mesmo quando a spec já existe
localmente** (fluxo `/specforge-create-spec`): sem consultar o tracker não há como garantir que a
branch fica vinculada a um card real, então criar `specforge/{ID}` sem essa confirmação não é
seguro. Se não encontrar, pergunta no console o ID correto a vincular, ou cancela. Sem essa
confirmação, nenhuma branch é criada e nada é implementado. Depois disso, nunca implementa direto na branch
principal (os projetos são clonados a partir dela pelo `/specforge-add-project`): cria ou reutiliza
uma branch `specforge/{ID}` antes de tocar em qualquer arquivo, commita e dá push só nessa branch,
e interrompe a execução se por algum motivo continuar na branch principal depois de tentar trocar
— abrir o PR dessa branch para a principal continua manual, fora do escopo do comando. Ele busca a spec em `docs/specs/{ID}-spec.md`
se o arquivo já existir localmente (fluxo do `/specforge-create-spec`); senão, busca pela task
`spec - {nome do projeto}` no card {ID} via MCP (fluxo do `/specforge-analyzer`, modo `task`) e só
grava o arquivo local no commit — nunca antes disso. Depois de commitar e dar push, grava
`docs/changelogs/{ID}.md` — um único arquivo, template fixo, com duas seções: o changelog
técnico e as evidências de atendimento aos critérios de aceite (linguagem simples, dirigida a
quem faz QA — resumo do que foi entregue, evidência e passo a passo de reprodução por critério
com dados reais extraídos dos testes escritos nesta implementação, nunca inventados, e a
cobertura de testes obtida). Todo comentário publicado recebe o **arquivo completo** — nunca uma
seção isolada: sempre no card {ID}, e também na mesma task de spec quando a origem foi o tracker.
Nesse caso, a task de spec também é marcada como concluída (estado da própria task, sem relação
com a distinção coluna/status do card explicada abaixo). Depois, cria ou atualiza uma
task `qa - {nome do projeto}` (sempre, independente da origem), com o mesmo conteúdo completo na
descrição, deixada pendente para quem faz QA continuar — nunca marcada como concluída por este
comando. Por fim, move o card {ID} para a coluna "In Code Review" do board sem alterar o campo de
status/estado: no Azure DevOps isso é o campo `System.BoardColumn`, distinto de `System.State`;
no Linear, que não separa coluna de status, o workflow state é alterado mesmo, e isso é sinalizado
no relatório final.

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
