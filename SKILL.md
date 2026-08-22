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

Faz a triagem de um card antes de gerar a spec, a partir da pasta workspace (onde os projetos
foram vinculados via `/specforge-add-project`):

1. Lê o card completo — descrição, comentários e anexos — via MCP do **Azure DevOps** ou **Linear**
2. Identifica, entre os projetos vinculados no workspace, qual(is) é(são) afetado(s) pelo work item
3. Avalia se há 100% das informações necessárias para gerar a spec com segurança
4. **Se houver dúvidas:** comenta no card, em linguagem não técnica (o público é analista de
   negócio/produto), quatro blocos fixos — **o que entendemos do pedido**, **o que está sendo
   pedido para entregar**, **projetos que este pedido impacta** e **dúvidas em aberto** —
   referenciando os usuários de `/specforge-add-user`, e move o card para **Triaged / Refinement**
5. **Se não houver dúvidas:** gera a spec (mesmo fluxo de `agent-developer` → `agent-qa` →
   `agent-tech-lead` do `/specforge-create-spec`), cria uma task **"spec"** no card com o
   conteúdo da spec (em vez do comentário automático) e move o card para **Ready for Development**

Requer que ao menos um projeto tenha sido adicionado via `/specforge-add-project`.

### /specforge-analyzer-all

Roda o `/specforge-analyzer` para todos os cards da coluna/estado **Backlog**, em sequência, até
processar toda a fila lida no início da execução (cards que entrarem em Backlog depois de
iniciado também são pegos, mas nenhum card já processado nesta execução é reprocessado — evita
loop infinito com cards reprovados pelo tech-lead, que permanecem em Backlog). Não recebe ID.
Ao final, relatório com o resultado por card e o que permaneceu em Backlog para ação manual.

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
