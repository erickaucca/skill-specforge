Instala os comandos da skill specforge no projeto atual.

Parâmetros opcionais: $ARGUMENTS

**Regra fundamental:** esta skill nunca sobrescreve estrutura `.claude/` existente.
Se o projeto já tem CLAUDE.md, steering ou commands próprios, eles são preservados.
A skill apenas adiciona o que ainda não existe.

## Passo 1 — Detectar a stack do projeto

Verifique quais arquivos existem na raiz do projeto:

- `package.json` → stack **Node** (frontend, backend JS/TS ou monorepo)
- `pom.xml` → stack **Java/Maven**
- `build.gradle` ou `build.gradle.kts` → stack **Java/Gradle**

Um projeto pode ter múltiplos arquivos (ex: monorepo com `package.json` na raiz e `pom.xml` em `backend/`). Registre todas as stacks encontradas — não assuma que é uma só.

Se nenhum arquivo de stack for encontrado, prossiga assim mesmo e deixe a seção de stack em branco no CLAUDE.md.

## Passo 2 — Determinar o modo de instalação

Verifique a presença dos seguintes itens e classifique o projeto em um dos três modos:

**Modo completo** — nenhuma estrutura Claude Code existe:
- `CLAUDE.md` ausente
- `.claude/steering/` ausente ou vazio
- `.claude/commands/` ausente ou vazio

→ Executar Passos 3, 4 e 5.

**Modo steering** — projeto tem estrutura Claude Code mas `.claude/steering/` está ausente ou vazio:
- `CLAUDE.md` existe **ou** `.claude/commands/` tem arquivos próprios
- `.claude/steering/` ausente ou sem arquivos

→ Instalar commands (Passo 3) + analisar o projeto e gerar os arquivos de steering com dados reais (Passo 4a). Não tocar em `CLAUDE.md`.

**Modo parcial** — projeto tem estrutura Claude Code e `.claude/steering/` com arquivos:
- `.claude/steering/` existe e contém arquivos

→ Instalar **apenas os commands** (Passo 3). Não tocar em `CLAUDE.md` nem em `.claude/steering/`.

Em todos os modos, crie `.claude/specs/` se não existir.

## Passo 3 — Instalar os commands da skill

Os caminhos de origem são relativos à instalação da skill (localizável via `npx skills path specforge`).

Instale em todos os modos:

| Origem (skill) | Destino (projeto) |
|---|---|
| `assets/commands/specforge-gera-spec.md` | `.claude/commands/specforge-gera-spec.md` |
| `assets/commands/specforge-implementa-spec.md` | `.claude/commands/specforge-implementa-spec.md` |

Se um arquivo de command já existir, pergunte antes de sobrescrever.

## Passo 4 — Gerar conteúdo ausente

### 4a — Gerar steering com dados reais do projeto (modo completo e modo steering)

> **Pule se `.claude/steering/` já tem arquivos (modo parcial).**

Não copie os templates com placeholders. Analise o projeto e **escreva os arquivos de steering preenchidos com dados reais**:

**Para gerar `.claude/steering/architecture.md`**, leia e inspecione:
- `package.json` ou `pom.xml` / `build.gradle` — stack, versão, dependências principais
- Estrutura de pastas do projeto (até 2 níveis) — infira organização e padrões arquiteturais
- Arquivos de configuração relevantes (`tsconfig.json`, `application.yml`, `docker-compose.yml`, etc.)
- `README.md` ou documentação existente — frequentemente descreve a arquitetura

Preencha as seções com o que foi encontrado. Para campos que não puderem ser inferidos com certeza, use `<!-- TODO: preencher -->`.

**Para gerar `.claude/steering/domain-rules.md`**, leia e inspecione:
- Nomes de pacotes, módulos e classes — revelam os domínios do negócio
- Enums, constantes e validações no código — frequentemente codificam regras de negócio
- Testes de negócio — descrevem comportamento esperado em linguagem próxima do domínio
- Comentários e docstrings existentes no código

Escreva as regras inferidas no formato `**NOME_DA_REGRA**: descrição`. Se o domínio não puder ser inferido do código, crie a estrutura de seções vazia com uma nota `<!-- Preencha com as regras de negócio do domínio -->`.

### 4b — Gerar CLAUDE.md com dados reais do projeto (modo completo apenas)

> **Pule se `CLAUDE.md` já existe (modos steering e parcial).**

Copie `assets/templates/CLAUDE.template.md` para `CLAUDE.md` e substitua os placeholders:

- **`{{PROJECT_NAME}}`** → `name` em `package.json`, `artifactId` em `pom.xml`, ou nome do diretório raiz
- **`{{VERSAO}}`** → `version` em `package.json` ou `<version>` em `pom.xml`
- **`{{STACK}}`** → stacks detectadas no Passo 1
- **`{{COMANDO_INSTALL}}`** → ex: `npm install`, `mvn install`, `./gradlew dependencies`
- **`{{COMANDO_DEV}}`** → ex: `npm run dev`, `mvn spring-boot:run`, `./gradlew bootRun`
- **`{{COMANDO_BUILD}}`** → ex: `npm run build`, `mvn package`, `./gradlew build`
- **`{{COMANDO_TEST}}`** → ex: `npm test`, `mvn test`, `./gradlew test`
- **`{{COMANDO_TEST_UNITARIO}}`** → ex: `npm test -- --testPathPattern=unit`, `mvn test -Dgroups=unit`
- **`{{COMANDO_TEST_INTEGRACAO}}`** → ex: `npm test -- --testPathPattern=integration`, `mvn verify -Dgroups=integration`
- **`{{COMANDO_LINT}}`** → ex: `npm run lint`, `mvn checkstyle:check`
- **`{{COMANDO_FORMAT}}`** → ex: `npm run format`, `mvn spotless:apply`

Se um placeholder não puder ser preenchido com certeza, use `<!-- TODO: preencher -->`.

## Passo 5 — Confirmar o que foi criado

Ao final, liste o que foi instalado e o que foi preservado.

**Modo completo:**

```
✓ Estrutura inicializada

Stack detectada: Node 20 + Java 17/Maven

Arquivos criados:
  .claude/commands/specforge-gera-spec.md
  .claude/commands/specforge-implementa-spec.md
  .claude/steering/architecture.md    (gerado com dados reais do projeto)
  .claude/steering/domain-rules.md    (gerado com dados reais do projeto)
  .claude/specs/
  CLAUDE.md

Próximos passos:
  1. Revise CLAUDE.md e os arquivos de steering — ajuste o que estiver incorreto.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-gera-spec [ID] para gerar sua primeira spec.
```

**Modo steering (estrutura Claude Code sem steering):**

```
✓ Comandos e steering instalados

Estrutura Claude Code detectada — CLAUDE.md preservado.
Pasta .claude/steering/ ausente: arquivos gerados com análise do projeto.

Arquivos criados:
  .claude/commands/specforge-gera-spec.md
  .claude/commands/specforge-implementa-spec.md
  .claude/steering/architecture.md    (gerado com dados reais do projeto)
  .claude/steering/domain-rules.md    (gerado com dados reais do projeto)
  .claude/specs/

Não alterados:
  CLAUDE.md

Próximos passos:
  1. Revise os arquivos de steering gerados e ajuste o que estiver incorreto.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-gera-spec [ID] para gerar sua primeira spec.
```

**Modo parcial (estrutura Claude Code completa):**

```
✓ Comandos da skill instalados

Estrutura Claude Code detectada — arquivos existentes preservados.

Arquivos criados:
  .claude/commands/specforge-gera-spec.md
  .claude/commands/specforge-implementa-spec.md
  .claude/specs/

Não alterados:
  CLAUDE.md
  .claude/steering/

Próximos passos:
  1. Configure o MCP do Azure DevOps ou Linear.
  2. Use /specforge-gera-spec [ID] para gerar sua primeira spec.
```
