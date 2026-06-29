---
name: specforge
description: >
  Use quando o desenvolvedor disser: "inicializa o projeto", "configura o Claude Code",
  "gera spec do work item", "cria especificação técnica", "implementa a spec",
  "implementa o work item", "cria estrutura .claude/", "/specforge-init-project",
  "/specforge-create-spec", "/specforge-execute-spec". Esta skill conecta work items
  do Azure DevOps ou Linear ao
  ciclo completo de desenvolvimento: da especificação à implementação.
---

## Comandos

### /specforge-init-project

Inicializa a estrutura `.claude/` no projeto do desenvolvedor:

1. Detecta a stack do projeto (`package.json` → Node, `pom.xml` → Java)
2. Analisa o projeto e gera os arquivos de steering com dados reais (arquitetura e regras de domínio)
3. Gera um `CLAUDE.md` personalizado com dados reais do projeto
4. Cria os diretórios `docs/specs/` e `docs/changelogs/`

Preserva estruturas existentes — nunca sobrescreve CLAUDE.md, steering ou commands já presentes.
Execute uma vez por projeto, antes de usar os outros comandos.

### /specforge-create-spec [ID]

Gera uma especificação técnica estruturada a partir de um work item:

1. Busca o work item pelo ID via MCP do **Azure DevOps** ou **Linear**
2. Analisa o contexto do projeto (stack, arquitetura, regras de domínio)
3. Produz uma spec com: objetivo, escopo, decisões técnicas e critérios de aceite
4. Salva a spec em `docs/specs/{ID}-spec.md` após confirmação do dev
5. Publica a spec como comentário no card de origem (Linear ou Azure DevOps)

Requer o MCP do Azure DevOps (`azure-devops`) ou do Linear (`linear`) configurado
na sessão Claude Code.

### /specforge-execute-spec [ID]

Implementa o que está na spec gerada pelo `/specforge-create-spec`:

1. Lê `docs/specs/{ID}-spec.md`
2. Apresenta o plano de implementação e aguarda confirmação
3. Executa as mudanças de código respeitando padrões do projeto
4. Gera changelog em `docs/changelogs/{ID}.md`
5. Atualiza os arquivos de steering com o que foi aprendido

Sempre rode `/specforge-create-spec [ID]` antes de `/specforge-execute-spec [ID]`.

## Dependências de MCP

Esta skill requer um dos seguintes MCP servers ativo na sessão:

- `azure-devops` — para projetos que usam Azure DevOps Boards
- `linear` — para projetos que usam Linear
