Gera ou mescla `CLAUDE.md` e `.claude/steering/` com dados reais do projeto.

Parâmetros opcionais: $ARGUMENTS

Este comando distingue dois diretórios, que podem ou não coincidir:

- **`{diretório do projeto}`** — onde fica o código-fonte e onde os Passos 1 (detecção de
  stack/banco) e 5 (`docs/specs/`, `docs/specs/tmp/`, `docs/changelogs/`) sempre operam. Esses
  diretórios de `docs/` moram dentro do próprio repositório do projeto, sempre, porque
  `/specforge-execute-spec` os commita junto com o código — nunca ficam em outro lugar,
  independentemente de qual dos dois modos abaixo está em uso.
- **`{diretório de configuração}`** — onde ficam `CLAUDE.md` e `.claude/steering/` (Passos 2, 3 e
  4). **Por padrão, é igual ao `{diretório do projeto}`** — é isso que dá o comportamento atual
  quando o comando é chamado diretamente pelo console, de dentro da pasta do projeto: nenhum
  diretório de configuração é informado, então tudo (`CLAUDE.md`, steering e as pastas de `docs/`)
  é gerado na própria pasta atual, como sempre foi.

**Quando invocado pelo `/specforge-add-project` ou `/specforge-update`**, os dois diretórios são
informados **separados e diferentes**: `{diretório do projeto}` é a pasta do repositório clonado
(ex.: `pedidos-api/`) e `{diretório de configuração}` é `.claude/{nome-do-projeto}/` — uma pasta
dentro do `.claude/` **da pasta pai (o workspace)**, não dentro do próprio projeto. Nesse caso,
`CLAUDE.md` e `.claude/steering/` do projeto passam a morar fora do repositório clonado
(`{workspace}/.claude/{nome-do-projeto}/CLAUDE.md` e
`{workspace}/.claude/{nome-do-projeto}/.claude/steering/` — repare no `.claude/` duplicado: a
segunda parte é a mesma subestrutura de sempre, só que relocada dentro do diretório de
configuração) — não são commitados junto com o código do projeto, são metadado local do
workspace. Isso é
intencional: só `docs/specs/` e `docs/changelogs/` (dentro do `{diretório do projeto}`) precisam
viajar com o código, porque são commitados pelo `/specforge-execute-spec`.

Se `{diretório de configuração}` não existir ainda (caso comum na primeira vez que um projeto é
adicionado via `/specforge-add-project`), crie-o antes de prosseguir para o Passo 2 — inclusive
`{diretório de configuração}/.claude/steering/` quando for gerar steering.

Os slash commands (`/specforge-create-spec`, `/specforge-execute-spec`) e os 4 sub-agentes do
specforge já vêm prontos do plugin desde a instalação — este comando não cria, copia nem
sobrescreve nenhum deles. O único papel deste comando é preparar o que é específico de cada
projeto: `CLAUDE.md`, `.claude/steering/` e as pastas em `docs/`.

**Regra fundamental:** esta skill nunca reestrutura nem reescreve o conteúdo que o time já
escreveu em `CLAUDE.md` ou em `.claude/steering/` (sempre dentro do `{diretório de configuração}`
determinado acima). Quando esses arquivos já existem, o comando faz **merge**: preserva tudo que
já está escrito e adiciona apenas o que falta para o specforge funcionar — em `.claude/steering/`,
mesclando entradas (seção 3.2); em `CLAUDE.md`, mantendo uma seção própria e claramente
identificada (seção 4.2). Essa seção própria é reanalisada e atualizada a cada execução, mesmo que
isso signifique substituir uma versão anterior dela mesma — o resto do arquivo nunca é tocado.

## Passo 1 — Detectar a stack e o banco de dados do projeto

**Sempre relativo ao `{diretório do projeto}`** (o código-fonte), independentemente de onde
`CLAUDE.md`/steering vão ser gravados neste modo. Verifique quais arquivos existem na raiz do projeto:

- `package.json` → stack **Node** (frontend, backend JS/TS ou monorepo)
- `pom.xml` → stack **Java/Maven**
- `build.gradle` ou `build.gradle.kts` → stack **Java/Gradle**

Um projeto pode ter múltiplos arquivos (ex: monorepo com `package.json` na raiz e `pom.xml` em `backend/`). Registre todas as stacks encontradas — não assuma que é uma só.

Se nenhum arquivo de stack for encontrado, prossiga assim mesmo e deixe a seção de stack em branco no CLAUDE.md.

**Detecte também o tipo de banco de dados do projeto** — essa informação é usada depois pelo
`/specforge-analyzer` e pelos sub-agentes de geração de spec para saber se podem consultar um
banco real durante a análise. Procure sinais como:

- Dependências em `package.json` (`pg`/`pg-native` → PostgreSQL; `mysql`/`mysql2` → MySQL;
  `mssql`/`tedious` → SQL Server; `oracledb` → Oracle; `mongodb`/`mongoose` → MongoDB;
  `sqlite3`/`better-sqlite3` → SQLite) ou no `pom.xml`/`build.gradle` (driver JDBC: `postgresql`,
  `mysql-connector-*`, `mssql-jdbc`, `ojdbc*`, `h2`)
- URL de conexão em `.env`, `application.yml`/`application.properties` (prefixo
  `jdbc:postgresql:`/`jdbc:mysql:`/`jdbc:sqlserver:`/`jdbc:oracle:` ou
  `postgres://`/`mysql://`/`mongodb://`) ou schema do Prisma/TypeORM (campo `provider`/`type`)
- Serviços de banco em `docker-compose.yml` (imagem `postgres`, `mysql`, `mcr.microsoft.com/mssql/server`, `oracle/database`, `mongo`, etc.)

Registre o tipo e, se identificável, a versão (ex.: "PostgreSQL 15"). Se nenhum sinal confiável
for encontrado, deixe o campo como `<!-- TODO: preencher -->` — não adivinhe.

## Passo 2 — Verificar o que já existe e determinar o modo

Verifique a presença dos seguintes itens **dentro do `{diretório de configuração}`** (não do
`{diretório do projeto}`, quando os dois forem diferentes):

**Modo completo** — nenhuma estrutura Claude Code existe:
- `CLAUDE.md` ausente
- `.claude/steering/` ausente ou vazio

→ Executar Passos 3, 4 e 5.

**Modo steering** — projeto tem CLAUDE.md mas sem steering:
- `CLAUDE.md` existe
- `.claude/steering/` ausente ou sem arquivos

→ Executar Passo 3 (geração inicial), Passo 4 (variante de merge, pois `CLAUDE.md` já existe) e Passo 5.

**Modo merge** — estrutura Claude Code já completa:
- `CLAUDE.md` existe
- `.claude/steering/` existe e contém arquivos

→ Executar Passo 3 (variante de merge), Passo 4 (variante de merge) e Passo 5.

## Passo 3 — Gerar ou atualizar os arquivos de steering com dados reais do projeto

Este passo sempre roda, independentemente do modo determinado no Passo 2. **A análise sempre
inspeciona o `{diretório do projeto}` (o código-fonte); os arquivos de steering em si são lidos e
gravados em `{diretório de configuração}/.claude/steering/`** — os dois só coincidem quando
nenhum diretório de configuração separado foi informado. O que muda é o que fazer com o resultado
da análise do projeto:

- **`.claude/steering/` ausente ou vazio (em `{diretório de configuração}`):** siga a seção 3.1 (geração inicial).
- **`.claude/steering/` já existe com conteúdo em `{diretório de configuração}` (modo merge):** execute a mesma análise da
  seção 3.1 e depois aplique a seção 3.2 (merge) em vez de sobrescrever os arquivos.

### 3.1 — Análise do projeto e geração inicial

Não copie templates com placeholders. Analise o `{diretório do projeto}` e **escreva os arquivos
de steering (em `{diretório de configuração}/.claude/steering/`) preenchidos com dados reais**:

**Para gerar `.claude/steering/architecture.md`**, leia e inspecione:
- `package.json` ou `pom.xml` / `build.gradle` — stack, versão, dependências principais
- Estrutura de pastas do projeto (até 2 níveis) — infira organização e padrões arquiteturais
- Arquivos de configuração relevantes (`tsconfig.json`, `application.yml`, `docker-compose.yml`, etc.)
- `README.md` ou documentação existente — frequentemente descreve a arquitetura

Preencha as seções com o que foi encontrado. Para campos que não puderem ser inferidos com certeza, use `<!-- TODO: preencher -->`.

**Além da arquitetura, derive a seção `## Requisitos técnicos obrigatórios por tipo de mudança`**
de `architecture.md` — usada depois pelos sub-agentes `agent-developer`/`agent-qa` para desenhar
a solução já em conformidade, e por `agent-tech-lead` para revisar contra o que é exigível para
cada tipo de mudança, em vez de um checklist genérico:

1. Identifique quais das categorias abaixo existem de fato neste projeto (nem todo projeto tem
   todas):
   - **API / endpoint HTTP** — há controllers/routes/handlers HTTP no código
   - **Job assíncrono / batch / fila** — há cron, worker, consumer de fila ou dependência de
     agendamento (`bull`, `agenda`, `node-cron`, `@Scheduled`, `Quartz`, etc.)
   - **Procedure ou rotina executada diretamente no banco de dados** — há stored procedures,
     migrations com lógica de negócio, ou scripts SQL versionados no projeto
   - **Biblioteca interna / módulo sem interface externa** — há pacotes/módulos consumidos só
     internamente, sem endpoint nem job próprio

   Inclua no arquivo apenas a subseção de uma categoria que exista de fato no projeto. Se nenhuma
   categoria puder ser identificada com confiança, inclua ao menos "Biblioteca interna / módulo
   sem interface externa" como fallback conservador — nunca deixe a seção inteira ausente.
2. Para cada categoria identificada, preencha os 4 critérios (escalabilidade, observabilidade,
   cobertura de testes, segurança) com requisitos concretos e específicos deste projeto — não
   copie os exemplos do template literalmente. Baseie-se no que já existe no código: biblioteca
   de log usada, ferramenta de métricas/APM configurada, mecanismo de autenticação real, padrão
   de testes já seguido, convenção de nomenclatura de rotinas de banco, etc. Onde não houver como
   inferir um requisito concreto, escreva um requisito conservador genérico — **diferente do
   banco de dados, esses critérios sempre se aplicam de alguma forma; nunca use
   `<!-- TODO: preencher -->` nesta seção.**

**Para gerar `.claude/steering/domain-rules.md`**, leia e inspecione:
- Nomes de pacotes, módulos e classes — revelam os domínios do negócio
- Enums, constantes e validações no código — frequentemente codificam regras de negócio
- Testes de negócio — descrevem comportamento esperado em linguagem próxima do domínio
- Comentários e docstrings existentes no código

Escreva as regras inferidas no formato `**NOME_DA_REGRA**: descrição`. Se o domínio não puder ser inferido do código, crie a estrutura de seções vazia com uma nota `<!-- Preencha com as regras de negócio do domínio -->`.

### 3.2 — Merge com steering existente

Use esta variante quando `{diretório de configuração}/.claude/steering/architecture.md` e/ou
`{diretório de configuração}/.claude/steering/domain-rules.md` já existem com conteúdo (modo merge).

1. Leia o conteúdo atual de cada arquivo de steering antes de qualquer alteração.
2. Já com o resultado da análise da seção 3.1 em mãos, compare entrada por entrada (cada linha `**NOME_DA_REGRA**: descrição` em `domain-rules.md`, cada item de `architecture.md`) contra o que existe no arquivo atual. Na seção `## Requisitos técnicos obrigatórios por tipo de mudança`, trate cada categoria (`### {categoria}`) como uma unidade de merge, e cada célula de critério dentro dela (Escalabilidade/Observabilidade/Cobertura/Segurança) como uma entrada própria dentro dessa unidade — uma categoria inteira ausente no arquivo atual é "regra nova" (adicione a subseção completa); um critério com requisito diferente do que a análise encontrou é "conflito" (aplique a regra do item 3 abaixo).
3. Aplique o merge:
   - **Entrada existente sem equivalente na análise:** preserve exatamente como está — não é papel do specforge remover conhecimento que já estava documentado.
   - **Regra ou decisão nova encontrada na análise, ausente no arquivo atual:** adicione ao final da seção correspondente (crie a seção se ainda não existir).
   - **Entrada existente que conflita com o que a análise encontrou no estado atual do código** (ex: arquivo documenta "autenticação via cookie" mas o código hoje usa JWT via header; ou domain-rules.md descreve uma regra de negócio que o código já não implementa mais dessa forma): **a regra obtida pela análise do specforge é mandatória** — substitua a entrada conflitante pelo que foi inferido do código atual. Marque a alteração com um comentário imediatamente acima da entrada, no formato `<!-- specforge: atualizado em {data} — divergia de "{conteúdo anterior}" -->`, para que o dev veja exatamente o que mudou e possa reverter se a versão anterior era intencional.
4. Nunca reestruture o arquivo, reordene seções ou reescreva entradas que não estão em conflito — o merge só adiciona entradas novas e substitui as conflitantes.
5. Ao final, registre quantas entradas foram adicionadas e quantas foram substituídas por conflito em cada arquivo — esse resumo é usado no relatório final (Passo 6).

## Passo 4 — Gerar ou atualizar CLAUDE.md com dados reais do projeto

Este passo sempre roda, e o arquivo em si sempre é lido/gravado em
`{diretório de configuração}/CLAUDE.md` (a análise que o preenche continua olhando o
`{diretório do projeto}`). O que muda é o que fazer com o resultado da análise do projeto:

- **`CLAUDE.md` ausente em `{diretório de configuração}`:** siga a seção 4.1 (geração inicial).
- **`CLAUDE.md` já existe (modos steering e merge):** siga a seção 4.2 (merge) — nunca pule
  este passo só porque o arquivo já existe. O CLAUDE.md do projeto precisa conter as
  informações da seção 4.1 para o restante do specforge funcionar (`/specforge-create-spec` e
  `/specforge-execute-spec` leem esses comandos e placeholders); se elas não estiverem lá, a
  seção 4.2 garante que sejam adicionadas.

### 4.1 — Análise do projeto e geração inicial

Copie `assets/templates/CLAUDE.template.md` para `{diretório de configuração}/CLAUDE.md` e
substitua os placeholders (a análise que preenche cada um continua olhando o
`{diretório do projeto}`, não o diretório de configuração):

- **`{{PROJECT_NAME}}`** → `name` em `package.json`, `artifactId` em `pom.xml`, ou nome do diretório raiz
- **`{{VERSAO}}`** → `version` em `package.json` ou `<version>` em `pom.xml`
- **`{{STACK}}`** → stacks detectadas no Passo 1
- **`{{BANCO_DE_DADOS}}`** → tipo (e versão, se souber) detectado no Passo 1 — ex.: `PostgreSQL 15`, `SQL Server`, `Oracle`, `MongoDB`, `Nenhum identificado`
- **`{{COMANDO_INSTALL}}`** → ex: `npm install`, `mvn install`, `./gradlew dependencies`
- **`{{COMANDO_DEV}}`** → ex: `npm run dev`, `mvn spring-boot:run`, `./gradlew bootRun`
- **`{{COMANDO_BUILD}}`** → ex: `npm run build`, `mvn package`, `./gradlew build`
- **`{{COMANDO_TEST}}`** → ex: `npm test`, `mvn test`, `./gradlew test`
- **`{{COMANDO_TEST_UNITARIO}}`** → ex: `npm test -- --testPathPattern=unit`, `mvn test -Dgroups=unit`
- **`{{COMANDO_TEST_COBERTURA}}`** → ex: `npm test -- --coverage`, `mvn test jacoco:report` (comando usado pelo gate de cobertura do `/specforge-execute-spec`)
- **`{{COMANDO_TEST_INTEGRACAO}}`** → ex: `npm test -- --testPathPattern=integration`, `mvn verify -Dgroups=integration`
- **`{{COMANDO_LINT}}`** → ex: `npm run lint`, `mvn checkstyle:check`
- **`{{COMANDO_FORMAT}}`** → ex: `npm run format`, `mvn spotless:apply`

Se um placeholder não puder ser preenchido com certeza, use `<!-- TODO: preencher -->`.

### 4.2 — Merge com CLAUDE.md existente

Use esta variante sempre que `{diretório de configuração}/CLAUDE.md` já existir, independentemente
de quão completo ou customizado ele esteja.

1. Leia o `CLAUDE.md` existente integralmente e identifique se ele já documenta, em qualquer
   seção ou formato, cada um dos 13 itens da seção 4.1: nome e versão do projeto, stack, banco
   de dados, e os comandos de install/dev/build/test/test unitário/test cobertura/test
   integração/lint/format.
2. Execute a mesma análise do Passo 1 e da seção 4.1 (inspecionar `package.json`/`pom.xml`/
   `build.gradle`, scripts configurados, etc.) para obter o valor real e atual de cada item.
3. Procure no arquivo por uma seção marcada com o cabeçalho exato `## Comandos e projeto (specforge)`
   — ela indica que uma execução anterior desta skill já fez esse merge.
   - **Se a seção existir:** substitua **somente o conteúdo dessa seção** pelos 13 itens
     recalculados na análise atual (mesmo formato da seção 4.1). Esta seção é gerenciada pela
     skill — sempre reflete a análise mais recente, mesmo que substitua uma versão anterior
     dela mesma.
   - **Se a seção não existir:** acrescente-a ao final do arquivo, com o cabeçalho exato
     `## Comandos e projeto (specforge)` seguido do bloco de comandos e dos campos de projeto
     no mesmo formato da seção 4.1 (bloco ```bash``` de comandos + Nome/Stack/Versão/Banco de dados).
4. Nunca edite, mova ou remova qualquer outra seção, parágrafo ou comando já escrito pelo time
   em `CLAUDE.md` — mesmo que pareça desatualizado ou redundante com a seção do specforge.
   Se notar uma divergência clara entre algo documentado em outra seção e o que a análise
   encontrou (ex: a seção "Como rodar" do time cita um comando de build diferente do que a
   análise achou em `package.json`), **não corrija essa outra seção** — apenas registre a
   divergência para o relatório final (Passo 6), para o dev decidir se atualiza manualmente.
5. Para qualquer item que não puder ser inferido com certeza, use `<!-- TODO: preencher -->`,
   igual à seção 4.1.
6. Ao final, registre se a seção do specforge foi criada, atualizada, ou manteve os mesmos
   valores da execução anterior, e quantas divergências foram encontradas em outras partes do
   arquivo — esse resumo é usado no relatório final (Passo 6).

## Passo 5 — Criar diretórios do projeto

**Sempre dentro do `{diretório do projeto}`, nunca do `{diretório de configuração}`** — mesmo
quando os dois são diferentes, porque `/specforge-execute-spec` precisa commitar o conteúdo
gravado aqui junto com o código do projeto. Crie os seguintes diretórios se ainda não existirem:

- `docs/specs/` — onde as specs técnicas serão salvas
- `docs/specs/tmp/` — arquivos temporários gerados pelo fluxo multi-agente (descartáveis)
- `docs/changelogs/` — onde os changelogs de implementação serão registrados

Nada precisa ser copiado para `.claude/commands/`: os slash commands e os 4 sub-agentes do
specforge já estão disponíveis a partir do plugin instalado.

## Passo 6 — Confirmar o que foi criado

Ao final, liste o que foi instalado e o que foi preservado. Nos exemplos abaixo, os caminhos de
`CLAUDE.md`/`.claude/steering/` são mostrados como ficam quando **nenhum diretório de configuração
separado foi informado** (caso do console manual — mesma pasta do projeto). **Quando
`{diretório de configuração}` foi informado e é diferente do `{diretório do projeto}`** (caso
`/specforge-add-project`/`/specforge-update`), prefixe esses mesmos caminhos com
`{diretório de configuração}/` nos relatórios abaixo, e acrescente uma linha extra deixando
explícito que esses arquivos ficam **fora do repositório do projeto**, ex.:

```
⚠ CLAUDE.md e .claude/steering/ deste projeto ficam em {diretório de configuração}/, fora do
  repositório clonado — não são commitados junto com o código. Apenas docs/specs/ e
  docs/changelogs/ (dentro do próprio projeto) são versionados normalmente.
```

**Modo completo:**

```
✓ Estrutura inicializada

Stack detectada: Node 20 + Java 17/Maven

Arquivos criados:
  .claude/steering/architecture.md          (gerado com dados reais do projeto)
  .claude/steering/domain-rules.md          (gerado com dados reais do projeto)
  docs/specs/
  docs/specs/tmp/
  docs/changelogs/
  CLAUDE.md

Próximos passos:
  1. Revise CLAUDE.md e os arquivos de steering — ajuste o que estiver incorreto.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-create-spec [ID] para gerar sua primeira spec.
```

**Modo steering (CLAUDE.md existe, steering ausente):**

```
✓ Steering gerado, CLAUDE.md atualizado

Pasta .claude/steering/ ausente: arquivos gerados com análise do projeto.

Arquivos criados:
  .claude/steering/architecture.md          (gerado com dados reais do projeto)
  .claude/steering/domain-rules.md          (gerado com dados reais do projeto)
  docs/specs/
  docs/specs/tmp/
  docs/changelogs/

CLAUDE.md:
  ~ seção "## Comandos e projeto (specforge)" {criada | atualizada | sem alterações}
  {Se houver divergências com outras seções do arquivo:}
  ⚠ {seção do arquivo} documenta "{X}", mas a análise do projeto encontrou "{Y}" — revisar manualmente
  Resto do arquivo: não alterado

Próximos passos:
  1. Revise os arquivos de steering gerados e a seção do specforge em CLAUDE.md.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-create-spec [ID] para gerar sua primeira spec.
```

**Modo merge (CLAUDE.md e steering já existem):**

```
✓ Steering e CLAUDE.md mesclados

Steering:
  ~ .claude/steering/architecture.md   {N} regras novas adicionadas, {K} substituídas por conflito
  ~ .claude/steering/domain-rules.md   {N} regras novas adicionadas, {K} substituídas por conflito
  {Se nada mudou em algum arquivo: "✓ .claude/steering/{arquivo}.md — nenhuma regra nova ou conflitante encontrada."}

CLAUDE.md:
  ~ seção "## Comandos e projeto (specforge)" {criada | atualizada | sem alterações}
  {Se houver divergências com outras seções do arquivo:}
  ⚠ {seção do arquivo} documenta "{X}", mas a análise do projeto encontrou "{Y}" — revisar manualmente
  Resto do arquivo: não alterado

Diretórios:
  docs/specs/
  docs/specs/tmp/
  docs/changelogs/

{Se houve substituições por conflito no steering, liste-as:}
Divergências resolvidas a favor do specforge (revise e reverta se a versão anterior era intencional):
  ⚠ .claude/steering/{arquivo}.md — "{entrada anterior}" substituída por "{entrada atual}"

Próximos passos:
  1. Revise as regras de steering e a seção do specforge em CLAUDE.md.
  2. Configure o MCP do Azure DevOps ou Linear.
  3. Use /specforge-create-spec [ID] para gerar sua primeira spec.
```
