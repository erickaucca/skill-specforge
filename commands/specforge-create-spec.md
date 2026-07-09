Gera uma especificação técnica estruturada a partir de um work item do Azure DevOps ou Linear, orquestrando sub-agentes especializados em sequência.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Ler o contexto do projeto

Leia os seguintes arquivos para entender o projeto antes de orquestrar os agentes:

1. `CLAUDE.md` — stack, comandos, convenções gerais
2. `.claude/steering/architecture.md` — estrutura e decisões arquiteturais
3. `.claude/steering/domain-rules.md` — regras de negócio e restrições de domínio

Se algum desses arquivos não existir, sinalize e continue. Se nenhum existir, sugira rodar `/specforge-init-project` primeiro.

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

## Passo 3 — Preparar o diretório temporário

Crie o diretório `docs/specs/tmp/` se não existir.

## Passo 4 — Invocar o agent-developer

Despache o sub-agente `specforge-agent-developer` (fornecido pelo plugin specforge) com o seguinte contexto:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
```

Aguarde a conclusão do sub-agente.

Verifique que `docs/specs/tmp/{ID}-solution.md` foi criado antes de continuar.
Se o arquivo não existir: informe "agent-developer não criou docs/specs/tmp/{ID}-solution.md. Verifique os logs do agente." e interrompa.

## Passo 5 — Invocar o agent-qa

Despache o sub-agente `specforge-agent-qa` (fornecido pelo plugin specforge) com o seguinte contexto:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- Confirmação: docs/specs/tmp/{ID}-solution.md existe
```

Aguarde a conclusão do sub-agente.

Verifique que `docs/specs/tmp/{ID}-test-scenarios.md` foi criado antes de continuar.
Se o arquivo não existir: informe "agent-qa não criou docs/specs/tmp/{ID}-test-scenarios.md. Verifique os logs do agente." e interrompa.

## Passo 6 — Invocar o agent-tech-lead

Despache o sub-agente `specforge-agent-tech-lead` (fornecido pelo plugin specforge) com o seguinte contexto:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- Documentos gerados:
  - docs/specs/tmp/{ID}-solution.md
  - docs/specs/tmp/{ID}-test-scenarios.md
```

Aguarde a conclusão do sub-agente.

Verifique o resultado lendo `docs/specs/tmp/{ID}-spec-reviewed.md` (criado pelo agente):
- **Se o arquivo contém `**Status:** APROVADO`:** prossiga para o Passo 7.
- **Se o arquivo contém `**Status:** REPROVADO`:** exiba a mensagem de reprovação reportada pelo agente (com os critérios falhos e ações necessárias) e interrompa o fluxo.
- **Se o arquivo não existir:** informe "agent-tech-lead não criou docs/specs/tmp/{ID}-spec-reviewed.md. Verifique os logs do agente." e interrompa.

## Passo 7 — Invocar o agent-coordinator

Despache o sub-agente `specforge-agent-coordinator` (fornecido pelo plugin specforge) com o seguinte contexto:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {descrição completa}
- Critérios de aceite: {critérios de aceite, se disponíveis}
- MCP configurado: {linear | azure-devops}
- Documentos disponíveis:
  - docs/specs/tmp/{ID}-spec-reviewed.md  (spec revisada e aprovada pelo tech-lead)
  - docs/specs/tmp/{ID}-solution.md
  - docs/specs/tmp/{ID}-test-scenarios.md
```

O agent-coordinator gerencia a aprovação humana, a gravação da spec final, a publicação no card e a criação das tarefas.
