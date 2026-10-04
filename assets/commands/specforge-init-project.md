Gera ou mescla `CLAUDE.md` e `.claude/steering/` com dados reais do projeto.

Parâmetros opcionais: $ARGUMENTS

Dois diretórios:
- **`{projeto}`** — código-fonte. A análise (Passo 1) e as pastas `docs/` (Passo 5) ficam sempre
  aqui, porque o `/specforge-execute-spec` as commita com o código.
- **`{config}`** — onde ficam `CLAUDE.md` e `.claude/steering/` (Passos 2–4). Padrão: igual a
  `{projeto}` (chamada direta no console). Via `/specforge-add-project`/`/specforge-update` é
  `.claude/{nome}/` do workspace, fora do repositório (repare no `.claude/` duplicado:
  `.claude/{nome}/.claude/steering/`). Crie `{config}` (e `{config}/.claude/steering/`) se faltar.

Comandos e sub-agentes já vêm do plugin — não copie nada para o projeto.

**Regra fundamental:** nunca reestruture nem reescreva o que o time escreveu. Arquivos existentes
recebem **merge** (3.2 e 4.2); só a seção `## Comandos e projeto (specforge)` do `CLAUDE.md` é
gerenciada (e regravada) pelo specforge.

**Arquivos enxutos:** os sub-agentes releem o steering a cada spec. Ao gerar, mantenha cada
arquivo de steering com **até ~150 linhas**: uma linha por regra/decisão, sem prosa explicativa
nem trechos de código longos.

## Passo 1 — Stack e banco de dados (em `{projeto}`)

Stack pela raiz (pode haver várias, ex.: monorepo): `package.json` → Node; `pom.xml` →
Java/Maven; `build.gradle(.kts)` → Java/Gradle. Nenhuma: deixe a stack em branco.

Banco de dados, por sinais confiáveis:
- dependências: `pg` → PostgreSQL; `mysql`/`mysql2` → MySQL; `mssql`/`tedious` → SQL Server;
  `oracledb` → Oracle; `mongodb`/`mongoose` → MongoDB; `sqlite3`/`better-sqlite3` → SQLite;
  drivers JDBC (`postgresql`, `mysql-connector-*`, `mssql-jdbc`, `ojdbc*`, `h2`);
- URLs de conexão em `.env`/`application.yml`/`application.properties` (`jdbc:…`, `postgres://`,
  `mongodb://`…) ou `provider`/`type` do Prisma/TypeORM;
- imagens em `docker-compose.yml` (`postgres`, `mysql`, `mssql/server`, `oracle/database`, `mongo`).

Registre tipo e versão se souber (ex.: "PostgreSQL 15"). Sem sinal confiável:
`<!-- TODO: preencher -->` — não adivinhe.

## Passo 2 — Modo (olhando `{config}`)

- **Completo:** sem `CLAUDE.md` e sem steering → Passos 3.1, 4.1, 5.
- **Steering:** `CLAUDE.md` existe, steering ausente/vazio → 3.1, 4.2, 5.
- **Merge:** ambos existem → 3.1 (só a análise) + 3.2, 4.2, 5.

## Passo 3 — Steering (`{config}/.claude/steering/`)

### 3.1 — Análise e geração

Sem copiar templates com placeholders: escreva com dados reais de `{projeto}`.

**`architecture.md`** — a partir de `package.json`/`pom.xml`/`build.gradle`, estrutura de pastas
(até 2 níveis), configs (`tsconfig.json`, `application.yml`, `docker-compose.yml`…) e `README.md`.
Incerto: `<!-- TODO: preencher -->`.

Inclua `## Requisitos técnicos obrigatórios por tipo de mudança` (base do developer, qa e
tech-lead), com uma subseção `### {categoria}` só para as categorias que existem no projeto:
- **API / endpoint HTTP** (controllers/routes/handlers);
- **Job assíncrono / batch / fila** (cron, worker, consumer, `bull`, `@Scheduled`, Quartz…);
- **Procedure ou rotina de banco** (stored procedures, migrations com lógica, SQL versionado);
- **Biblioteca interna / módulo sem interface externa** — use como fallback se nenhuma for
  identificada (a seção nunca fica ausente).

Em cada categoria, um requisito concreto deste projeto para escalabilidade, observabilidade,
cobertura de testes e segurança (biblioteca de log, APM, autenticação real, padrão de testes…).
Sem como inferir: requisito conservador genérico — **nunca TODO nesta seção**.

**`domain-rules.md`** — a partir de nomes de módulos/classes, enums, constantes, validações,
testes de negócio e comentários. Formato `**NOME_DA_REGRA**: descrição`. Domínio não inferível:
seções vazias com `<!-- Preencha com as regras de negócio do domínio -->`.

### 3.2 — Merge com steering existente

1. Leia os arquivos atuais e compare entrada a entrada com a análise (`**REGRA**: …` em
   `domain-rules.md`, itens de `architecture.md`; em Requisitos técnicos, cada `### {categoria}` é
   uma unidade e cada critério dentro dela, uma entrada).
2. Entrada existente sem equivalente na análise: **preserve**. Entrada nova (ou categoria
   inteira ausente): **adicione** ao fim da seção correspondente (crie a seção se faltar).
3. Entrada que **conflita** com o código atual: a análise prevalece — substitua e marque acima
   dela `<!-- specforge: atualizado em {data} — divergia de "{conteúdo anterior}" -->`.
4. Nunca reordene nem reescreva o que não está em conflito. Conte adicionadas e substituídas por
   arquivo. Se um arquivo passar de ~200 linhas, sinalize no relatório (sem apagar conteúdo do time).

## Passo 4 — `{config}/CLAUDE.md`

### 4.1 — Geração

Copie `CLAUDE.template.md` (em `../templates/`, relativo a este arquivo) para `{config}/CLAUDE.md`
e preencha a partir de `{projeto}`:
- `{{PROJECT_NAME}}`: `name` do `package.json`, `artifactId` do `pom.xml` ou nome da pasta
- `{{VERSAO}}`: `version` / `<version>`
- `{{STACK}}` e `{{BANCO_DE_DADOS}}`: do Passo 1 (ou `Nenhum identificado`)
- `{{COMANDO_INSTALL}}`, `{{COMANDO_DEV}}`, `{{COMANDO_BUILD}}`, `{{COMANDO_TEST}}`,
  `{{COMANDO_TEST_UNITARIO}}`, `{{COMANDO_TEST_COBERTURA}}` (usado pelo gate de cobertura do
  execute-spec), `{{COMANDO_TEST_INTEGRACAO}}`, `{{COMANDO_LINT}}`, `{{COMANDO_FORMAT}}`: dos
  scripts/plugins configurados (ex.: `npm test -- --coverage`, `mvn test jacoco:report`)

Incerto: `<!-- TODO: preencher -->`.

### 4.2 — Merge

1. Recalcule os 13 itens da 4.1 (nome, versão, stack, banco e os 9 comandos).
2. Se existir `## Comandos e projeto (specforge)`, substitua **só o conteúdo dela**; senão
   acrescente-a ao fim (bloco ```bash``` de comandos + Nome/Stack/Versão/Banco de dados, no
   formato do template).
3. Nunca altere outra seção. Divergência clara com outra seção (ex.: comando de build diferente):
   não corrija, só registre para o relatório.
4. Registre se a seção foi criada, atualizada ou ficou igual.

## Passo 5 — Pastas em `{projeto}`

Crie, se faltarem: `docs/specs/`, `docs/specs/tmp/`, `docs/changelogs/`.

## Passo 6 — Relatório

```
✓ {Estrutura inicializada | Steering gerado, CLAUDE.md atualizado | Steering e CLAUDE.md mesclados}
Stack: {…} · Banco de dados: {…}

Steering ({caminho}):
  architecture.md — {gerado | N adicionadas, K substituídas | sem alterações} {⚠ > 200 linhas}
  domain-rules.md — {idem}
CLAUDE.md ({caminho}): seção "Comandos e projeto (specforge)" {criada | atualizada | sem alterações}
  {⚠ "{seção}" documenta "{X}", a análise encontrou "{Y}" — revisar manualmente}
Pastas: docs/specs/, docs/specs/tmp/, docs/changelogs/

{Substituições por conflito: ⚠ {arquivo} — "{anterior}" → "{atual}" (reverta se era intencional)}
{Se {config} ≠ {projeto}: ⚠ CLAUDE.md e steering ficam em {config}, fora do repositório — só docs/ é versionado.}

Próximos passos: revise CLAUDE.md e steering; depois /specforge-create-spec [ID] (ou /specforge-analyzer [ID] no workspace).
```
