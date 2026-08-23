---
name: specforge
description: >
  Use quando o desenvolvedor disser: "inicializa o projeto", "configura o Claude Code",
  "adiciona projeto", "clona repositório no workspace", "adiciona usuário para dúvidas",
  "gera spec do work item", "cria especificação técnica", "implementa a spec",
  "implementa o work item", "cria estrutura .claude/", "analisa o card", "triagem do card",
  "processa a fila do backlog", "triagem em lote",
  "/specforge-init-project", "/specforge-add-project", "/specforge-add-user",
  "/specforge-update", "atualiza os projetos vinculados", "sincroniza os projetos do workspace",
  "/specforge-analyzer", "/specforge-analyzer-all",
  "/specforge-create-spec", "/specforge-execute-spec".
  Esta skill conecta work items do Azure DevOps ou Linear ao
  ciclo completo de desenvolvimento: da especificação à implementação.
---

## Comandos

`/specforge-add-project`, `/specforge-add-user`, `/specforge-update`, `/specforge-analyzer`,
`/specforge-analyzer-all`, `/specforge-create-spec`, `/specforge-execute-spec` e os 4 sub-agentes
que orquestram já vêm prontos do plugin — ficam disponíveis em qualquer projeto assim que o
plugin é instalado, sem nenhuma etapa de setup. Nenhum deles é copiado para dentro do
projeto-alvo.

### /specforge-add-project [URL do git]

Adiciona um projeto ao workspace atual (a pasta onde o comando é executado):

1. Clona a URL informada (branch `main`, com fallback para `master`) numa pasta com o nome do
   repositório, dentro do workspace
2. Invoca o fluxo do `/specforge-init-project` dentro da pasta clonada — gerando a estrutura
   `.claude/` do projeto exatamente como já é feito hoje
3. Registra o projeto na seção `## Projetos vinculados (specforge)` do `CLAUDE.md` do workspace:
   nome, pasta, **stack** (detectada no passo anterior), **para que serve** (resumo em 1 frase
   a partir do README/`description`), URL do git, branch e data. A seção também traz uma
   instrução fixa lembrando de ler `{pasta}/CLAUDE.md` e `{pasta}/.claude/steering/` de um
   projeto sempre que for preciso entendê-lo a fundo

Um mesmo workspace pode ter vários projetos vinculados, cada um em sua própria pasta.

### /specforge-add-user [email(s), separados por vírgula]

Registra um ou mais emails no CLAUDE.md do workspace, na seção `## Usuários para dúvidas
(specforge)`. São os usuários do Azure DevOps ou Linear com condição de responder dúvidas de
spec — o `/specforge-analyzer` os referencia (menção nativa quando possível, ou lista de emails
como fallback) ao comentar dúvidas em um card. Faz merge com a lista já registrada, sem duplicar.

### /specforge-update

Percorre a tabela `## Projetos vinculados (specforge)` do workspace e re-executa o fluxo do
`/specforge-init-project` (sempre em modo merge, já que os projetos vinculados já têm
`CLAUDE.md`/steering) em cada um — propaga novidades da skill (novos campos do `CLAUDE.md`,
novas convenções) para todos os projetos de uma vez, sem entrar manualmente em cada pasta. Rode
depois de atualizar o plugin (`claude plugin update specforge@...`). Sem limite de quantos
projetos processa por execução (cada um é só análise de arquivos locais, não uma chamada cara de
LLM por card). Relatório final por projeto: atualizado, sem alterações, ou erro (ex.: pasta
removida).

### /specforge-init-project

Prepara o que é específico de cada projeto — a única parte que o plugin não pode entregar pronta:

1. Detecta a stack do projeto (`package.json` → Node, `pom.xml` → Java) e o tipo de banco de dados (dependências, connection string, `docker-compose.yml`)
2. Analisa o projeto e gera (ou mescla, se já existirem) os arquivos de steering com dados reais (arquitetura, regras de domínio, e os requisitos técnicos obrigatórios por tipo de mudança — API, job assíncrono, procedure de banco, biblioteca interna — usados pelos sub-agentes de spec)
3. Gera (ou mescla) um `CLAUDE.md` personalizado com dados reais do projeto, incluindo o banco de dados detectado
4. Cria os diretórios `docs/specs/` e `docs/changelogs/`

Nunca reescreve o conteúdo já existente em `CLAUDE.md` ou `.claude/steering/` — quando esses
arquivos já existem, faz merge (mescla regras de steering, atualiza uma seção própria em
`CLAUDE.md` com os comandos que o specforge precisa; o resto do conteúdo do time nunca é
tocado). Execute uma vez por projeto, antes de usar os outros comandos — sem isso,
`/specforge-create-spec` e `/specforge-execute-spec` não têm CLAUDE.md/steering para ler.

### /specforge-analyzer [ID]

Faz a triagem de um card antes de gerar a spec, sempre a partir da pasta workspace (onde os
projetos foram vinculados via `/specforge-add-project`). **Roda do início ao fim sem nenhuma
pergunta no console** — qualquer coisa que falte é registrada como comentário no próprio card,
nunca interrompe esperando resposta na tela:

1. Lê o card completo — descrição, comentários e anexos — via MCP do **Azure DevOps** ou **Linear**.
   Comentários que respondem dúvidas de uma execução anterior do `/specforge-analyzer` têm
   prioridade sobre a descrição original e são usados para considerar essas dúvidas resolvidas
2. Identifica, entre os projetos vinculados no workspace, **todos** os que são afetados pelo work
   item — pode ser um ou vários ao mesmo tempo (ex.: uma mudança de API que também exige ajuste
   no front-end que a consome). A decisão é sempre autônoma; se nenhum projeto puder ser
   relacionado ao pedido, isso vira uma dúvida (ver item 4), nunca uma pergunta no console
3. Avalia se há 100% das informações necessárias para gerar a spec com segurança — se o projeto
   tiver um banco de dados declarado no `CLAUDE.md` e um MCP correspondente estiver disponível
   na sessão, consulta o banco (sempre **somente leitura**, nunca altera nada) para reduzir
   dúvidas que a documentação sozinha não resolveria; se não houver MCP de banco configurado,
   isso é pulado silenciosamente, sem interromper nada
4. **Se houver dúvidas:** comenta no card, em linguagem não técnica (o público é analista de
   negócio/produto), quatro blocos fixos — **o que entendemos do pedido**, **o que está sendo
   pedido para entregar**, **projetos que este pedido impacta** e **dúvidas em aberto** —
   referenciando os usuários de `/specforge-add-user`, e move o card para **Triaged / Refinement**
5. **Se não houver dúvidas:** gera e revisa a spec de cada projeto afetado, um ciclo independente
   por projeto — `agent-developer` propõe, `agent-qa` gera os testes, `agent-tech-lead` revisa
   contra os 4 critérios (mesmo fluxo do `/specforge-create-spec`). **Uma reprovação do tech-lead
   nunca vira comentário no card** — é um ciclo de correção interno à execução: o motivo da
   reprovação volta como contexto extra para o `agent-developer`/`agent-qa` refazerem a solução,
   numa nova rodada de revisão, repetindo até aprovar ou até uma proteção operacional de 10
   rodadas ser atingida (caso raro — não uma política de tentativas, só para não deixar a execução
   rodando indefinidamente se os agentes oscilarem entre dois problemas). O `agent-tech-lead`
   nunca recebe o histórico de rodadas anteriores — cada avaliação dele é independente, para não
   reprovar de novo por inércia nem aprovar por complacência
6. **Com todos os projetos aprovados:** cria (ou atualiza) **uma task por projeto** vinculada ao
   card, título `spec - {nome do projeto}`, cada uma autossuficiente (sem referências a arquivos
   do repositório, pastas temporárias ou anexos externos) e move o card para **Ready for
   Development**. **Nenhum arquivo é gravado localmente** — uma task por projeto, em vez de uma
   consolidando tudo, é o que permite devs diferentes pegarem projetos diferentes do mesmo card e
   rodarem `/specforge-execute-spec` em paralelo; é esse comando, rodado depois de dentro de cada
   projeto, que busca o conteúdo direto da task correspondente no tracker e só então grava
   `docs/specs/{ID}-spec.md` localmente, junto do commit da implementação. Diferente do
   `/specforge-create-spec`, não cria tasks adicionais de desenvolvimento/teste — cada task de
   spec já é completa por si só
7. **Caso raro: se algum projeto não convergir após 10 rodadas do ciclo do item 5:** comenta no
   card a última pendência registrada (comentário técnico próprio, `## Revisão técnica não
   convergiu`) e move para **Triaged / Refinement** — sinal de que provavelmente precisa de uma
   decisão humana, não o caminho normal de uma reprovação

Requer que ao menos um projeto tenha sido adicionado via `/specforge-add-project`.

### /specforge-analyzer-all

Roda o `/specforge-analyzer` para até **3 cards** da coluna/estado **Backlog** por execução
(limite fixo, mesmo que a fila tenha mais — rode novamente para continuar). Não recebe ID. Ao
final, relatório com o resultado de cada card processado e quantos ainda restam na fila.

### /specforge-create-spec [ID]

Gera uma especificação técnica estruturada a partir de um work item, orquestrando 4 sub-agentes especializados em sequência:

1. Busca o work item pelo ID via MCP do **Azure DevOps** ou **Linear**
2. **agent-developer** — analisa o projeto e propõe a solução técnica com tarefas ordenadas → `docs/specs/tmp/{ID}-solution.md`
3. **agent-qa** — gera cenários de teste mapeados aos critérios de aceite → `docs/specs/tmp/{ID}-test-scenarios.md`
4. **agent-tech-lead** — revisa contra 4 critérios (escalabilidade, observabilidade, cobertura ≥ 80%, segurança); aprova ou rejeita → `docs/specs/tmp/{ID}-spec-reviewed.md`
5. **agent-coordinator** — valida a spec, solicita aprovação humana, grava `docs/specs/{ID}-spec.md`, publica no card e cria as tarefas de desenvolvimento e teste no tracker

Requer o MCP do Azure DevOps (`azure-devops`) ou do Linear (`linear`) configurado na sessão Claude Code.
O agent-developer e o agent-qa também podem consultar (somente leitura) o banco de dados do
projeto, se declarado no `CLAUDE.md` e um MCP correspondente estiver disponível na sessão — a
consulta é sempre opcional e nunca interrompe o fluxo caso não haja MCP configurado.
Se `.claude/steering/architecture.md` tiver a seção de requisitos técnicos por tipo de mudança
(gerada pelo `/specforge-init-project`), o agent-developer já desenha a solução em conformidade
com o requisito concreto da categoria da mudança, e o agent-tech-lead revisa contra esse mesmo
requisito em vez de um checklist genérico.

### /specforge-execute-spec [ID]

Implementa o que está na spec gerada pelo `/specforge-create-spec` ou publicada pelo
`/specforge-analyzer`:

1. Busca a spec: se `docs/specs/{ID}-spec.md` já existir localmente (fluxo `/specforge-create-spec`), usa esse arquivo diretamente; senão, busca no tracker (via MCP) a task `spec - {nome do projeto}` vinculada ao card {ID} (fluxo `/specforge-analyzer`, modo `task`) — nesse caso o arquivo local só é gravado no Passo 7 (commit), nunca antes, permitindo que devs de projetos diferentes do mesmo card trabalhem em paralelo sem depender de commit alheio
2. Apresenta o plano de implementação (incluindo a branch que vai usar) e aguarda confirmação
3. Cria (ou reutiliza) a branch `specforge/{ID}` a partir da branch atual — **nunca implementa
   diretamente em `main`/`master`**; se por algum motivo a branch atual continuar sendo a
   principal do repositório depois desse passo, interrompe em vez de prosseguir
4. Executa as mudanças de código respeitando padrões do projeto
5. Executa os testes unitários do projeto — exige 100% de testes passando e cobertura ≥ 80%; se falhar, interrompe sem commitar
6. Verifica coerência entre regras de negócio e a implementação; corrige inconsistências encontradas e reexecuta os testes antes de prosseguir
7. Se a spec veio da task do tracker (item 1), grava `docs/specs/{ID}-spec.md` agora, para ir junto do commit. Commita as mudanças (`feat({ID}): {título} — specforge-execute-spec`) na branch `specforge/{ID}` e faz push dela para o remoto (`git push -u origin specforge/{ID}`); se o push falhar, interrompe e orienta o reenvio manual
8. Gera changelog em `docs/changelogs/{ID}.md` e publica como comentário no card de origem (arquivos alterados, testes, cobertura e hash do commit) — artefato técnico, para quem desenvolve
9. Gera e publica as **evidências de atendimento aos critérios de aceite** — um artefato separado, em linguagem simples, dirigido a quem faz QA: resumo do que foi implementado, evidência e passo a passo de reprodução por critério de aceite (com dados reais dos testes escritos, nunca inventados) e a cobertura de testes obtida. Publica na mesma task de spec (se a origem foi o tracker) ou no card (se a origem foi o arquivo local)
10. Atualiza os arquivos de steering com o que foi aprendido

A spec sempre precisa existir antes — via `/specforge-create-spec [ID]` (arquivo local) ou
`/specforge-analyzer [ID]` (task no tracker) — mas não precisa ter sido gerada nesta mesma sessão
nem por este mesmo dev. A ordem branch → implementação → testes → coerência → correção (se
necessário) → commit → push → changelog é fixa e não pode ser pulada; abrir PR continua sendo
manual, fora do escopo deste comando.

## Dependências de MCP

Esta skill requer um dos seguintes MCP servers ativo na sessão:

- `azure-devops` — para projetos que usam Azure DevOps Boards
- `linear` — para projetos que usam Linear
