---
name: specforge
description: >
  Specforge: work items do Azure DevOps/Linear viram specs técnicas e implementações. Use para
  inicializar/configurar um projeto (/specforge-init-project), vincular repositórios ao workspace,
  triar cards, gerar specs e implementar work items — e quando citarem qualquer comando
  /specforge-*.
---

## Comandos

Os comandos e os 4 sub-agentes já vêm prontos do plugin (nada é copiado para o projeto-alvo);
cada um traz suas instruções completas em `commands/` e `agents/`:

| Comando | Para que serve |
|---|---|
| `/specforge-add-project [URL]` | clona um repositório no workspace e inicializa a configuração dele |
| `/specforge-add-user [emails]` | registra quem pode responder dúvidas de spec |
| `/specforge-update` | reaplica o init em todos os projetos vinculados após atualizar o plugin |
| `/specforge-analyzer [ID]` | triagem do card sem perguntas no console: dúvidas viram comentário; senão publica uma task `spec - {projeto}` por projeto afetado |
| `/specforge-analyzer-all` | o analyzer para até 3 cards do Backlog |
| `/specforge-create-spec [ID]` | spec de um único projeto, interativa, com os 4 sub-agentes |
| `/specforge-execute-spec [ID]` | implementa a spec em `specforge/{ID}`, com testes, changelog, task `qa` e card em "In Code Review" |

### /specforge-init-project

Instruções completas em `assets/commands/specforge-init-project.md` (relativo a esta skill) — leia esse arquivo ao executar o fluxo. Prepara o que é específico de cada projeto — a única parte que o plugin não pode entregar pronta:

1. Detecta a stack do projeto (`package.json` → Node, `pom.xml` → Java) e o tipo de banco de dados (dependências, connection string, `docker-compose.yml`)
2. Analisa o projeto e gera (ou mescla, se já existirem) os arquivos de steering com dados reais (arquitetura, regras de domínio, e os requisitos técnicos obrigatórios por tipo de mudança — API, job assíncrono, procedure de banco, biblioteca interna — usados pelos sub-agentes de spec)
3. Gera (ou mescla) um `CLAUDE.md` personalizado com dados reais do projeto, incluindo o banco de dados detectado
4. Cria os diretórios `docs/specs/` e `docs/changelogs/` (sempre dentro do próprio projeto, mesmo no caso do item 5)
5. **Quando chamado diretamente pelo console** (de dentro da pasta do projeto, sem passar por
   `/specforge-add-project`), `CLAUDE.md` e `.claude/steering/` ficam na própria pasta do
   projeto, como sempre. **Quando invocado pelo `/specforge-add-project` ou `/specforge-update`**,
   esses dois ficam em vez disso em `.claude/{nome-do-projeto}/` **da pasta pai** (o workspace) —
   fora do repositório clonado, não commitados junto com o código do projeto

Nunca reescreve o conteúdo já existente em `CLAUDE.md` ou `.claude/steering/` — quando esses
arquivos já existem, faz merge (mescla regras de steering, atualiza uma seção própria em
`CLAUDE.md` com os comandos que o specforge precisa; o resto do conteúdo do time nunca é
tocado). Execute uma vez por projeto, antes de usar os outros comandos — sem isso,
`/specforge-create-spec` e `/specforge-execute-spec` não têm CLAUDE.md/steering para ler. Esses
dois comandos resolvem sozinhos onde procurar CLAUDE.md/steering (pasta atual, ou
`../.claude/{nome-da-pasta-atual}/` se o projeto foi vinculado via `/specforge-add-project`).

## Dependências de MCP

Um MCP de tracker ativo na sessão: `azure-devops` (Azure DevOps Boards) ou `linear`.
