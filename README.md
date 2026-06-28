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

**Global** — disponível em todos os projetos via CLI `specforge`:

```bash
npm install -g erickaucca/skill-specforge
```

Após instalar, rode em cada projeto onde quiser usar a skill:

```bash
specforge install
```

**Por projeto** — como dev dependency, sem instalar globalmente:

```bash
npm install --save-dev erickaucca/skill-specforge
```

O `postinstall` copia os commands automaticamente para `.claude/commands/` ao instalar.

## Primeiros passos

```
/specforge-init-project
```
Detecta a stack, copia os comandos e steering para `.claude/` e gera o `CLAUDE.md` do projeto.

```
/specforge-gera-spec 1234
```
Busca o work item 1234, analisa os arquivos relevantes do projeto e salva a spec em `.claude/specs/WI-1234.md`.

```
/specforge-implementa-spec 1234
```
Lê a spec, apresenta um plano de implementação, aguarda confirmação e executa as mudanças.

## Como funciona

Ao rodar `/specforge-gera-spec`, o Claude conecta ao MCP configurado (Linear ou Azure DevOps), extrai título, descrição e critérios de aceite do work item, localiza os arquivos do projeto que serão afetados e produz uma spec técnica. A spec fica em `.claude/specs/` e deve ser commitada junto com o código.

Ao rodar `/specforge-implementa-spec`, o Claude lê essa spec e os arquivos de steering (arquitetura e regras de domínio), apresenta um plano com os arquivos que serão criados ou modificados e só executa após confirmação. Ao final, lista o que foi feito e sugere o próximo passo (rodar testes, abrir PR).

O workflow do GitHub Actions (`claude.yml`) permite acionar o Claude diretamente em issues e PRs mencionando `@claude` em um comentário.

## Como contribuir

Abra uma issue descrevendo o que quer mudar. Você pode mencionar `@claude` no comentário para que o Claude gere a spec e abra um PR automaticamente. Contribuições via PR são bem-vindas.

## Licença

MIT
