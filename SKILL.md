---
name: specforge
description: >
  Use quando o desenvolvedor disser: "inicializa o projeto", "configura o Claude Code",
  "gera spec do work item", "cria especificação técnica", "implementa a spec",
  "implementa o work item", "cria estrutura .claude/", "/specforge-init-project",
  "/specforge-gera-spec", "/specforge-implementa-spec". Esta skill conecta work items
  do Azure DevOps ou Linear ao
  ciclo completo de desenvolvimento: da especificação à implementação.
---

## Comandos

### /specforge-init-project

Inicializa a estrutura `.claude/` no projeto do desenvolvedor:

1. Detecta a stack do projeto (`package.json` → Node, `pom.xml` → Java)
2. Copia os slash commands para `.claude/commands/`
3. Copia os arquivos de steering para `.claude/steering/`
4. Gera um `CLAUDE.md` personalizado com dados reais do projeto

Execute uma vez por projeto, antes de usar os outros comandos.

### /specforge-gera-spec [ID]

Gera uma especificação técnica estruturada a partir de um work item:

1. Busca o work item pelo ID via MCP do **Azure DevOps** ou **Linear**
2. Analisa o contexto do projeto (stack, arquitetura, regras de domínio)
3. Produz uma spec com: objetivo, escopo, decisões técnicas e critérios de aceite
4. Salva a spec em `.claude/specs/[ID].md`

Requer o MCP do Azure DevOps (`azure-devops`) ou do Linear (`linear`) configurado
na sessão Claude Code.

### /specforge-implementa-spec [ID]

Implementa o que está na spec gerada pelo `/specforge-gera-spec`:

1. Lê `.claude/specs/[ID].md`
2. Executa as mudanças de código descritas na spec
3. Segue as regras de domínio e arquitetura dos arquivos de steering

Sempre rode `/specforge-gera-spec [ID]` antes de `/specforge-implementa-spec [ID]`.

## Dependências de MCP

Esta skill requer um dos seguintes MCP servers ativo na sessão:

- `azure-devops` — para projetos que usam Azure DevOps Boards
- `linear` — para projetos que usam Linear

