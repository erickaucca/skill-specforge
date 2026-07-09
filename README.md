# skill-specforge

Plugin de Claude Code que transforma work items do Azure DevOps ou Linear em specs técnicas e implementações de código.

## O que faz

- Lê um work item pelo ID e gera uma especificação técnica estruturada (contexto, solução, arquivos afetados, critérios de aceite)
- Implementa o código descrito na spec respeitando os padrões e regras de domínio do projeto
- Gera (ou mescla, se já existirem) `CLAUDE.md` e os arquivos de steering do projeto-alvo com dados reais

## Pré-requisitos

- [Claude Code](https://claude.ai/code) instalado
- MCP do **Linear** (`linear`) ou **Azure DevOps** (`azure-devops`) configurado na sessão

## Instalação

```bash
claude plugin marketplace add erickaucca/skill-specforge
claude plugin install specforge@erickaucca/skill-specforge
```

`/specforge-create-spec`, `/specforge-execute-spec` e os 4 sub-agentes já ficam disponíveis
imediatamente após instalar, em qualquer projeto — nada é copiado para dentro do repositório.

Depois, dentro de cada projeto onde quiser usar o specforge, abra o Claude Code e rode:

```
/specforge-init-project
```

Esse comando detecta a stack, gera (ou mescla) os arquivos de steering com dados reais do projeto e o `CLAUDE.md`. Execute uma vez por projeto, antes dos outros comandos.

## Uso

```
/specforge-create-spec 1234
```
Busca o work item 1234, analisa os arquivos relevantes do projeto e salva a spec em `docs/specs/1234-spec.md`.

```
/specforge-execute-spec 1234
```
Lê a spec, apresenta um plano de implementação, aguarda confirmação e executa as mudanças. Em seguida roda testes unitários, verifica coerência com as regras de negócio, commita, faz push e publica o changelog no card de origem.

## Como funciona

Ao rodar `/specforge-create-spec`, o Claude conecta ao MCP configurado (Linear ou Azure DevOps), extrai título, descrição e critérios de aceite do work item, localiza os arquivos do projeto que serão afetados e produz uma spec técnica. A spec fica em `docs/specs/` e deve ser commitada junto com o código.

Ao rodar `/specforge-execute-spec`, o Claude lê essa spec e os arquivos de steering (arquitetura e regras de domínio), apresenta um plano com os arquivos que serão criados ou modificados e só executa após confirmação. Depois de implementar, o fluxo roda automaticamente: testes unitários com gate de cobertura ≥ 80%, verificação de coerência entre regras de negócio e implementação (com correção e reteste se necessário), commit padronizado, push e publicação do changelog como comentário no card de origem. Nenhum commit ocorre se os testes falharem.

O workflow do GitHub Actions (`claude.yml`) permite acionar o Claude diretamente em issues e PRs mencionando `@claude` em um comentário.

## Como contribuir

Abra uma issue descrevendo o que quer mudar. Você pode mencionar `@claude` no comentário para que o Claude gere a spec e abra um PR automaticamente. Contribuições via PR são bem-vindas.

## Licença

MIT
