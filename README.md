# skill-specforge

Skill para Claude Code que transforma work items do Azure DevOps ou Linear em specs técnicas e implementações de código.

## O que faz

- Lê um work item pelo ID e gera uma especificação técnica estruturada (contexto, solução, arquivos afetados, critérios de aceite)
- Implementa o código descrito na spec respeitando os padrões e regras de domínio do projeto
- Inicializa a estrutura `.claude/` com comandos, steering e `CLAUDE.md` preenchido automaticamente

## Pré-requisitos

- [Claude Code](https://claude.ai/code) instalado
- MCP do **Linear** (`linear`) ou **Azure DevOps** (`azure-devops`) configurado na sessão

## Instalação

```bash
npx skills add erickaucca/skill-specforge
```

Depois, dentro de cada projeto onde quiser usar a skill, abra o Claude Code e rode:

```
/specforge-init-project
```

Esse comando detecta a stack, gera os arquivos de steering com dados reais do projeto e cria o `CLAUDE.md`. Execute uma vez por projeto.

## Uso

```
/specforge-create-spec 1234
```
Busca o work item 1234, analisa os arquivos relevantes do projeto e salva a spec em `.claude/specs/1234.md`.

```
/specforge-execute-spec 1234
```
Lê a spec, apresenta um plano de implementação, aguarda confirmação e executa as mudanças. Em seguida roda testes unitários, verifica coerência com as regras de negócio, commita, faz push e publica o changelog no card de origem.

## Como funciona

Ao rodar `/specforge-create-spec`, o Claude conecta ao MCP configurado (Linear ou Azure DevOps), extrai título, descrição e critérios de aceite do work item, localiza os arquivos do projeto que serão afetados e produz uma spec técnica. A spec fica em `.claude/specs/` e deve ser commitada junto com o código.

Ao rodar `/specforge-execute-spec`, o Claude lê essa spec e os arquivos de steering (arquitetura e regras de domínio), apresenta um plano com os arquivos que serão criados ou modificados e só executa após confirmação. Depois de implementar, o fluxo roda automaticamente: testes unitários com gate de cobertura ≥ 80%, verificação de coerência entre regras de negócio e implementação (com correção e reteste se necessário), commit padronizado, push e publicação do changelog como comentário no card de origem. Nenhum commit ocorre se os testes falharem.

O workflow do GitHub Actions (`claude.yml`) permite acionar o Claude diretamente em issues e PRs mencionando `@claude` em um comentário.

## Como contribuir

Abra uma issue descrevendo o que quer mudar. Você pode mencionar `@claude` no comentário para que o Claude gere a spec e abra um PR automaticamente. Contribuições via PR são bem-vindas.

## Licença

MIT
