---
name: specforge
description: >
  Use quando o desenvolvedor disser: "inicializa o projeto", "configura o Claude Code",
  "gera spec do work item", "cria especificação técnica", "implementa a spec",
  "implementa o work item", "cria estrutura .claude/", "migra specs", "migração de specs",
  "/specforge-init-project", "/specforge-create-spec", "/specforge-execute-spec",
  "/specforge-migrate-specs". Esta skill conecta work items
  do Azure DevOps ou Linear ao
  ciclo completo de desenvolvimento: da especificação à implementação.
---

## Comandos

`/specforge-create-spec`, `/specforge-execute-spec`, `/specforge-migrate-specs` e os 4
sub-agentes que orquestram já vêm prontos do plugin — ficam disponíveis em qualquer projeto
assim que o plugin é instalado, sem nenhuma etapa de setup. Nenhum deles é copiado para dentro
do projeto-alvo.

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

### /specforge-migrate-specs

Migra specs de `.claude/specs/` para `docs/specs/` para projetos que usavam a versão anterior:

1. Detecta arquivos `.md` em `.claude/specs/`
2. Copia cada `{ID}.md` para `docs/specs/{ID}-spec.md` (pula se já existir)
3. Remove `.claude/specs/` após confirmar integridade de todos os arquivos
4. Verifica coerência das specs migradas com os steering files atuais

Execute uma vez por projeto ao atualizar o specforge para esta versão.

## Dependências de MCP

Esta skill requer um dos seguintes MCP servers ativo na sessão:

- `azure-devops` — para projetos que usam Azure DevOps Boards
- `linear` — para projetos que usam Linear
