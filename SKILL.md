---
name: specforge
description: >
  Use quando o desenvolvedor disser: "inicializa o projeto", "configura o Claude Code",
  "adiciona projeto", "clona repositório no workspace", "adiciona usuário para dúvidas",
  "gera spec do work item", "cria especificação técnica", "implementa a spec",
  "implementa o work item", "cria estrutura .claude/", "analisa o card", "triagem do card",
  "processa a fila do backlog", "triagem em lote",
  "/specforge-init-project", "/specforge-add-project", "/specforge-add-user",
  "/specforge-analyzer", "/specforge-analyzer-all",
  "/specforge-create-spec", "/specforge-execute-spec".
  Esta skill conecta work items do Azure DevOps ou Linear ao
  ciclo completo de desenvolvimento: da especificação à implementação.
---

## Comandos

`/specforge-add-project`, `/specforge-add-user`, `/specforge-analyzer`, `/specforge-analyzer-all`,
`/specforge-create-spec`, `/specforge-execute-spec` e os 4 sub-agentes que orquestram já vêm
prontos do plugin — ficam disponíveis em qualquer projeto assim que o plugin é instalado, sem
nenhuma etapa de setup. Nenhum deles é copiado para dentro do projeto-alvo.

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

### /specforge-init-project

Prepara o que é específico de cada projeto — a única parte que o plugin não pode entregar pronta:

1. Detecta a stack do projeto (`package.json` → Node, `pom.xml` → Java)
2. Analisa o projeto e gera (ou mescla, se já existirem) os arquivos de steering com dados reais (arquitetura e regras de domínio)
3. Gera (ou mescla) um `CLAUDE.md` personalizado com dados reais do projeto
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
3. Avalia se há 100% das informações necessárias para gerar a spec com segurança
4. **Se houver dúvidas:** comenta no card, em linguagem não técnica (o público é analista de
   negócio/produto), quatro blocos fixos — **o que entendemos do pedido**, **o que está sendo
   pedido para entregar**, **projetos que este pedido impacta** e **dúvidas em aberto** —
   referenciando os usuários de `/specforge-add-user`, e move o card para **Triaged / Refinement**
5. **Se não houver dúvidas:** gera a spec de cada projeto afetado (mesmo fluxo de
   `agent-developer` → `agent-qa` → `agent-tech-lead` do `/specforge-create-spec`, um projeto por
   vez, com uma spec própria de cada projeto — `{projeto}/docs/specs/{ID}-spec.md`, no mesmo
   formato que o `/specforge-create-spec` geraria, para aquele `/specforge-execute-spec` continuar
   funcionando normalmente dentro de cada projeto; se o tech-lead reprovar em qualquer um dos
   projetos, o card inteiro fica reprovado — não publica spec parcial), e também grava um
   documento **consolidado** juntando todas as specs de projeto — `docs/specs/{ID}-spec-consolidado.md`
   na pasta workspace (nome deliberadamente diferente de `{ID}-spec.md`, para nunca ser confundido
   com a spec de um projeto específico) — que vira o conteúdo de uma **única task "spec"** no
   card, autossuficiente e sem referências a arquivos do repositório, pastas temporárias ou anexos
   externos, e move o card para **Ready for Development**. Diferente do `/specforge-create-spec`,
   não cria tasks adicionais de desenvolvimento/teste — fica tudo consolidado na task única

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

### /specforge-execute-spec [ID]

Implementa o que está na spec gerada pelo `/specforge-create-spec`:

1. Lê `docs/specs/{ID}-spec.md`
2. Apresenta o plano de implementação e aguarda confirmação
3. Executa as mudanças de código respeitando padrões do projeto
4. Executa os testes unitários do projeto — exige 100% de testes passando e cobertura ≥ 80%; se falhar, interrompe sem commitar
5. Verifica coerência entre regras de negócio e a implementação; corrige inconsistências encontradas e reexecuta os testes antes de prosseguir
6. Commita as mudanças (`feat({ID}): {título} — specforge-execute-spec`) e faz push do branch atual; se o push falhar, interrompe e orienta o reenvio manual
7. Gera changelog em `docs/changelogs/{ID}.md` e publica como comentário no card de origem (arquivos alterados, testes, cobertura e hash do commit)
8. Atualiza os arquivos de steering com o que foi aprendido

Sempre rode `/specforge-create-spec [ID]` antes de `/specforge-execute-spec [ID]`. A ordem
testes → coerência → correção (se necessário) → commit → push → changelog é fixa e não pode
ser pulada; abrir PR continua sendo manual, fora do escopo deste comando.

## Dependências de MCP

Esta skill requer um dos seguintes MCP servers ativo na sessão:

- `azure-devops` — para projetos que usam Azure DevOps Boards
- `linear` — para projetos que usam Linear
