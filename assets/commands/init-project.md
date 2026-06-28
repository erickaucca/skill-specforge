Inicializa a estrutura `.claude/` neste projeto com os comandos e steering da skill specforge.

Parâmetros opcionais: $ARGUMENTS

## Passo 1 — Detectar a stack do projeto

Verifique quais arquivos existem na raiz do projeto:

- `package.json` → stack **Node** (frontend, backend JS/TS ou monorepo)
- `pom.xml` → stack **Java/Maven**
- `build.gradle` ou `build.gradle.kts` → stack **Java/Gradle**

Um projeto pode ter múltiplos arquivos (ex: monorepo com `package.json` na raiz e `pom.xml` em `backend/`). Registre todas as stacks encontradas — não assuma que é uma só.

Se nenhum arquivo de stack for encontrado, prossiga assim mesmo e deixe a seção de stack em branco no CLAUDE.md.

## Passo 2 — Verificar o que já existe em `.claude/`

Antes de copiar qualquer arquivo, verifique se `.claude/commands/` e `.claude/steering/` já existem e se contêm arquivos. Para cada arquivo que já existir no destino:

- **Não sobrescreva** sem confirmar com o usuário.
- Liste os arquivos existentes e pergunte: "Deseja sobrescrever `[arquivo]`?" antes de continuar.

Se `.claude/` não existir, crie a estrutura completa sem perguntar.

## Passo 3 — Copiar e adaptar os templates

Copie os seguintes arquivos da skill para o projeto. Os caminhos de origem são relativos à instalação da skill (localizável via `npx skills path specforge`):

| Origem (skill) | Destino (projeto) |
|---|---|
| `assets/commands/gera-spec.md` | `.claude/commands/gera-spec.md` |
| `assets/commands/implementa-spec.md` | `.claude/commands/implementa-spec.md` |
| `assets/steering/architecture.md` | `.claude/steering/architecture.md` |
| `assets/steering/domain-rules.md` | `.claude/steering/domain-rules.md` |
| `assets/templates/CLAUDE.template.md` | `CLAUDE.md` |

Crie os diretórios intermediários que não existirem (`.claude/commands/`, `.claude/steering/`, `.claude/specs/`).

## Passo 4 — Preencher o CLAUDE.md gerado com dados reais

Após copiar `CLAUDE.md` a partir do template, substitua os placeholders com dados reais detectados do projeto:

- **`{{PROJECT_NAME}}`** → valor de `name` em `package.json`, `artifactId` em `pom.xml`, ou nome do diretório raiz
- **`{{VERSAO}}`** → valor de `version` em `package.json` ou `<version>` em `pom.xml`
- **`{{STACK}}`** → stacks detectadas no Passo 1 (ex: `Node 20 + Java 17/Maven`)
- **`{{COMANDO_INSTALL}}`** → ex: `npm install`, `mvn install`, `./gradlew dependencies`
- **`{{COMANDO_DEV}}`** → ex: `npm run dev`, `mvn spring-boot:run`, `./gradlew bootRun`
- **`{{COMANDO_BUILD}}`** → ex: `npm run build`, `mvn package`, `./gradlew build`
- **`{{COMANDO_TEST}}`** → ex: `npm test`, `mvn test`, `./gradlew test`
- **`{{COMANDO_TEST_UNITARIO}}`** → ex: `npm test -- --testPathPattern=unit`, `mvn test -Dgroups=unit`
- **`{{COMANDO_TEST_INTEGRACAO}}`** → ex: `npm test -- --testPathPattern=integration`, `mvn verify -Dgroups=integration`
- **`{{COMANDO_LINT}}`** → ex: `npm run lint`, `mvn checkstyle:check`
- **`{{COMANDO_FORMAT}}`** → ex: `npm run format`, `mvn spotless:apply`

Se um placeholder não puder ser preenchido com certeza, deixe um comentário `<!-- TODO: preencher -->` no lugar.

## Passo 5 — Confirmar o que foi criado

Ao final, liste todos os arquivos criados ou atualizados e informe a stack detectada. Exemplo de saída esperada:

```
✓ Estrutura inicializada

Stack detectada: Node 20 + Java 17/Maven

Arquivos criados:
  .claude/commands/gera-spec.md
  .claude/commands/implementa-spec.md
  .claude/steering/architecture.md
  .claude/steering/domain-rules.md
  .claude/specs/          (diretório vazio, pronto para specs)
  CLAUDE.md

Próximos passos:
  1. Revise o CLAUDE.md gerado e ajuste o que estiver incorreto.
  2. Configure o MCP do Azure DevOps ou Linear na sua sessão Claude Code.
  3. Use /gera-spec [ID] para gerar sua primeira spec.
```
