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

## Passo 2 — Verificar o que já existe e determinar o modo

Verifique a presença dos seguintes itens:

**Modo completo** — nenhuma estrutura Claude Code existe:
- `CLAUDE.md` ausente
- `.claude/steering/` ausente ou vazio

→ Executar Passos 3, 4 e 5.

**Modo steering** — projeto tem CLAUDE.md mas sem steering:
- `CLAUDE.md` existe
- `.claude/steering/` ausente ou sem arquivos

→ Executar apenas Passos 3 e 5. Não tocar em `CLAUDE.md`.

**Modo mínimo** — estrutura Claude Code já completa:
- `CLAUDE.md` existe
- `.claude/steering/` existe e contém arquivos

→ Executar apenas Passo 5 (criar diretórios ausentes).

## Passo 3 — Gerar os arquivos de steering com dados reais do projeto

> **Pule se `.claude/steering/` já tem arquivos (modo mínimo).**

Não copie templates com placeholders. Analise o projeto e **escreva os arquivos de steering preenchidos com dados reais**:

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

## Passo 4 — Gerar CLAUDE.md com dados reais do projeto

> **Pule se `CLAUDE.md` já existe (modos steering e mínimo).**

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

## Passo 5 — Criar diretórios necessários

Crie os seguintes diretórios se ainda não existirem:

- `docs/specs/` — onde as specs técnicas serão salvas
- `docs/changelogs/` — onde os changelogs de implementação serão registrados

## Passo 6 — Confirmar o que foi criado

Ao final, liste o que foi instalado e o que foi preservado.

**Modo completo:**

```
✓ Estrutura inicializada

Stack detectada: Node 20 + Java 17/Maven

Arquivos criados:
  .claude/steering/architecture.md    (gerado com dados reais do projeto)
  .claude/steering/domain-rules.md    (gerado com dados reais do projeto)
  docs/specs/
  docs/changelogs/
  CLAUDE.md

Próximos passos:
  1. Revise CLAUDE.md e os arquivos de steering — ajuste o que estiver incorreto.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-create-spec [ID] para gerar sua primeira spec.
```

**Modo steering (CLAUDE.md existe, steering ausente):**

```
✓ Steering gerado

CLAUDE.md preservado.
Pasta .claude/steering/ ausente: arquivos gerados com análise do projeto.

Arquivos criados:
  .claude/steering/architecture.md    (gerado com dados reais do projeto)
  .claude/steering/domain-rules.md    (gerado com dados reais do projeto)
  docs/specs/
  docs/changelogs/

Não alterados:
  CLAUDE.md

Próximos passos:
  1. Revise os arquivos de steering gerados e ajuste o que estiver incorreto.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-create-spec [ID] para gerar sua primeira spec.
```

**Modo mínimo (estrutura Claude Code já completa):**

```
✓ Diretórios criados

Estrutura Claude Code detectada — arquivos existentes preservados.

Criados (se ausentes):
  docs/specs/
  docs/changelogs/

Não alterados:
  CLAUDE.md
  .claude/steering/

Próximos passos:
  1. Configure o MCP do Azure DevOps ou Linear.
  2. Use /specforge-create-spec [ID] para gerar sua primeira spec.
```
