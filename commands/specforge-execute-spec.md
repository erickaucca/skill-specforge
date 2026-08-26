Implementa as mudanças de código descritas na spec técnica do work item.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar. Antes de qualquer outra coisa,
o comando confirma que esse ID corresponde a um card real no tracker configurado (Passo 1.0) —
sem isso, não cria branch nem implementa nada.

## Passo 1 — Confirmar o card no tracker e localizar a spec

### 1.0 — Confirmar que o card {ID} existe no tracker (mandatório, bloqueia tudo)

**Regra fundamental: o MCP do work tracker (Azure DevOps ou Linear) é obrigatório para este
comando, sem exceção — mesmo quando a spec já existe como arquivo local.** Sem consultar o
tracker, não há como confirmar que `{ID}` corresponde a um card real, e criar a branch
`specforge/{ID}` (Passo 6) sem essa confirmação não é seguro: a branch, o commit e tudo que for
publicado depois ficariam vinculados a um ID que pode não existir, estar errado ou apontar para
outra demanda. Nunca pule esta verificação, mesmo que uma spec local já exista para `{ID}`.

1. Verifique qual MCP está configurado na sessão (`linear` ou `azure-devops`). **Se nenhum
   estiver disponível:**
   > "Nenhum MCP de work tracker configurado. Este comando precisa confirmar que o card {ID} existe antes de criar a branch e implementar — sem isso não há como garantir que a branch fica vinculada a um card real. Configure o MCP do Azure DevOps ou do Linear e tente novamente."

   Interrompa a execução — não crie a branch, não leia a spec.
2. Busque o work item/issue pelo ID exatamente como informado (`{ID}`) via MCP.
3. **Se encontrado:** confirme o título e prossiga para 1.1 usando este `{ID}` normalmente.
4. **Se não encontrado:** este é interativo — pergunte ao dev (junto com o Passo 5, são as duas
   únicas perguntas de console deste comando):
   ```
   ⚠ O card {ID} não foi encontrado no {Azure DevOps | Linear} configurado nesta sessão.

   Toda implementação do specforge precisa estar vinculada a um card real — a branch, o commit e
   os comentários publicados dependem disso. Informe o ID correto do card a ser vinculado (ou
   digite "cancelar" para interromper):
   ```
   Aguarde a resposta.
   - **Se o dev informar um novo ID:** repita o item 2 para esse novo ID. Se confirmado, **todo o
     restante da execução passa a usar esse ID** — a busca da spec em 1.1, o nome da branch no
     Passo 6, mensagens de commit e as publicações finais. Não prossiga com o `{ID}` original que
     não foi encontrado.
   - **Se o dev digitar "cancelar" ou equivalente:** interrompa a execução sem criar branch nem
     alterar nada no projeto.

### 1.05 — Resolver o diretório de configuração

Este comando roda de dentro da pasta do projeto (a pasta atual), mas se este projeto foi vinculado
a um workspace via `/specforge-add-project`, `CLAUDE.md` e `.claude/steering/` não ficam na pasta
atual — ficam em `.claude/{nome desta pasta}/` **da pasta pai**. Determine o diretório de
configuração antes de continuar:

1. Verifique se `../.claude/{nome da pasta atual}/CLAUDE.md` existe (pasta pai = workspace,
   `{nome da pasta atual}` = nome da pasta onde este comando está rodando).
   - **Se existir:** use `../.claude/{nome da pasta atual}/` como `{diretório de configuração}`
     para todo o restante deste comando.
   - **Se não existir:** use a pasta atual (`.`) como `{diretório de configuração}` — projeto
     inicializado diretamente, sem vínculo com um workspace (ou ainda no formato antigo).

Todo o restante deste comando que lê `CLAUDE.md` ou `.claude/steering/` (Passos 1.1 item 1, 3) usa
este `{diretório de configuração}`, nunca a pasta atual diretamente quando os dois forem
diferentes. `docs/specs/`, `docs/specs/tmp/` e `docs/changelogs/` continuam sempre na pasta atual
(o próprio repositório do projeto) — isso não muda.

### 1.1 — Localizar a spec: arquivo local primeiro, task do tracker como alternativa

Este comando aceita dois formatos de origem, verificados nesta ordem:

**1. Arquivo local `docs/specs/{ID}-spec.md`** — fluxo do `/specforge-create-spec` (sessão única,
já grava o arquivo direto). **Se existir**, verifique que é uma spec de um único projeto antes de
prosseguir: conte quantas vezes o cabeçalho `## Projeto: ` aparece no arquivo.
- **Duas ou mais ocorrências:** isso indicaria um documento consolidado multi-projeto de uma
  versão antiga deste fluxo — não deveria mais ser gerado, mas a checagem continua por segurança.
  Exiba:
  > "`docs/specs/{ID}-spec.md` parece ser um documento consolidado de múltiplos projetos, não a spec deste projeto. Verifique se você está na pasta do projeto certo (não na pasta workspace)."

  Interrompa a execução sem alterar nada.
- **Zero ou uma ocorrência:** use o conteúdo deste arquivo como a spec (pule o item 2 abaixo) e
  prossiga para o Passo 2. Marque a origem como **arquivo local** — não é necessário regravar nada
  no Passo 11.

**2. Se o arquivo local não existir:** fluxo do `/specforge-analyzer` — a spec vive só como task no
tracker, ainda não commitada localmente por ninguém (é assim de propósito, para permitir que devs
diferentes peguem projetos diferentes do mesmo card em paralelo, sem depender de um commit alheio).
Busque-a (o MCP já foi confirmado disponível no 1.0, não verifique de novo):

1. Leia `CLAUDE.md` do `{diretório de configuração}` resolvido em 1.05, seção
   `## Comandos e projeto (specforge)`, campo `**Nome:**`. **Se estiver vazio, ausente ou
   `<!-- TODO: preencher -->`, use o nome da pasta atual** (o diretório onde este comando está
   rodando, não o diretório de configuração) como identificador — precisa ser o mesmo valor que o
   `agent-coordinator` usou para nomear a task.
2. Liste as tasks/sub-itens do card {ID} via ferramenta disponível no MCP (Linear: sub-issues;
   Azure DevOps: work items filhos — use `list_tools` se o nome da ferramenta não for óbvio).
3. Procure uma task cujo título seja exatamente `spec - {nome do projeto, do item 1}`.
   - **Não encontrar nenhuma:** exiba:
     > "Nenhuma spec encontrada para {ID} — nem localmente (`docs/specs/{ID}-spec.md`), nem como task `spec - {nome do projeto}` no card {ID}. Rode `/specforge-create-spec {ID}` ou `/specforge-analyzer {ID}` primeiro."

     Interrompa a execução.
   - **Encontrar mais de uma** com o mesmo título (não deveria acontecer, a criação é idempotente):
     exiba as opções encontradas (ID de cada uma) e peça pro dev indicar qual usar antes de
     prosseguir — não escolha sozinho nesse caso ambíguo.
   - **Encontrar exatamente uma:** leia a descrição completa dessa task — esse é o conteúdo da
     spec (equivalente ao que estaria em `{ID}-spec.md`). Marque a origem como **task do
     tracker** — o Passo 11 vai gravar esse conteúdo localmente como parte do commit.

## Passo 2 — Ler a spec completa

Use o conteúdo obtido no Passo 1 (do arquivo local ou da task, conforme a origem identificada).
Preste atenção especial em:

- **Solução proposta** — a abordagem técnica escolhida
- **Arquivos que serão alterados** — lista de arquivos e tipo de alteração
- **Critérios de aceite técnicos** — o que deve estar verdadeiro ao final
- **Riscos e dependências** — o que pode dar errado ou precisa existir antes

## Passo 3 — Ler o contexto do projeto

Leia os seguintes arquivos antes de escrever qualquer código (os itens 1-3 vêm do
`{diretório de configuração}` resolvido no Passo 1.05 — pode ser a pasta atual ou
`../.claude/{nome da pasta atual}/`, conforme o caso):

1. `CLAUDE.md` — convenções gerais, comandos de build e test
2. `.claude/steering/architecture.md` — padrões arquiteturais que devem ser seguidos
3. `.claude/steering/domain-rules.md` — regras de negócio que não podem ser violadas
4. Cada arquivo listado na seção "Arquivos que serão alterados" da spec (sempre relativo à pasta
   atual, o código do projeto) — leia o estado atual antes de modificar

Para arquivos que serão criados do zero, leia arquivos similares existentes no projeto para inferir os padrões usados (nomenclatura, estrutura, imports, estilo de teste).

## Passo 4 — Criar e apresentar o plano de implementação

Antes de modificar qualquer arquivo, apresente o plano completo ao dev:

```
Plano de implementação — {ID}: {título}

Branch de trabalho: specforge/{ID} (criada a partir de `{branch atual}` se ainda não existir —
nunca implementa diretamente em main/master)

Arquivos a criar:
  + caminho/novo-arquivo.ts          — motivo

Arquivos a modificar:
  ~ caminho/arquivo-existente.ts     — o que muda e por quê

Arquivos a remover:
  - caminho/arquivo-obsoleto.ts      — motivo

Ordem de execução:
  1. {primeiro passo}
  2. {segundo passo}
  ...

Testes:
  + caminho/novo-arquivo.test.ts     — cobre: {o que será testado}
  ~ caminho/teste-existente.test.ts  — adiciona casos: {quais}

Estimativa: {nº de arquivos afetados} arquivos

Após a implementação, o fluxo executa automaticamente: testes unitários → verificação de
coerência de regras de negócio → correção e reteste (se necessário) → commit → push →
changelog no card {ID}. Nenhum commit ocorre se os testes falharem ou a cobertura ficar
abaixo de 80%.
```

Se a spec contiver riscos marcados como bloqueantes, sinalize antes de apresentar o plano.

## Passo 5 — Aguardar confirmação

Após apresentar o plano, pergunte:

> "Posso prosseguir com a implementação? Ou deseja ajustar o plano antes?"

Não escreva nenhum código até receber confirmação. Se o dev pedir ajustes no plano, atualize e apresente novamente.

## Passo 6 — Criar (ou reutilizar) a branch de trabalho

**Regra crítica — nunca implemente diretamente em `main`/`master`.** Os projetos deste workspace
são clonados a partir da branch principal pelo `/specforge-add-project` — ela precisa continuar
espelhando o remoto, sem commits locais deste fluxo.

O `{ID}` usado no nome da branch abaixo já foi confirmado como um card real do tracker no
Passo 1.0 — nunca crie `specforge/{ID}` para um ID não confirmado.

1. Verifique a branch atual (`git branch --show-current`).
2. Nome da branch de trabalho para esta spec: `specforge/{ID}`.
3. **Se a branch atual já for `specforge/{ID}`:** prossiga nela — é a continuação de uma execução anterior deste comando para o mesmo ID.
4. **Se `specforge/{ID}` já existir localmente mas não for a branch atual:** faça checkout nela (`git checkout specforge/{ID}`).
5. **Caso contrário:** crie a branch a partir da branch atual (`git checkout -b specforge/{ID}`).
6. Confirme que a branch atual agora é `specforge/{ID}`. **Se, por qualquer motivo, a branch atual ainda for `main`, `master` ou a branch padrão do remoto (verifique com `git remote show origin` se o nome não for literalmente "main"/"master"), interrompa a execução** e informe o dev — não prossiga implementando numa branch principal.

Toda a implementação a partir daqui (Passos 7 em diante) acontece em `specforge/{ID}`, nunca na branch principal.

## Passo 7 — Implementar seguindo o plano

Execute as mudanças na ordem definida no plano. Durante a implementação:

**Siga os padrões do projeto:**
- Use os mesmos padrões de import, nomenclatura e organização encontrados nos arquivos existentes
- Se o projeto usa classes, use classes. Se usa funções, use funções. Não introduza padrões novos.
- Respeite as regras em `.claude/steering/domain-rules.md` — se uma regra conflitar com a spec, aponte o conflito ao dev antes de continuar

**Crie testes para o que foi implementado** (se a spec indicar cobertura de testes):
- Use o framework de testes já presente no projeto (não instale um novo)
- Cubra ao menos os critérios de aceite técnicos listados na spec
- Siga a estrutura e convenções dos testes existentes

**Não faça além do escopo da spec:**
- Se notar problemas no código circundante, relate ao dev mas não corrija na mesma implementação
- Se uma decisão da spec parecer errada, aponte e pergunte antes de desviar

A partir daqui, os passos 8 a 13 executam automaticamente, sem confirmação adicional do dev,
na ordem fixa: testes → coerência → correção (se necessário) → reteste → commit → push →
changelog. Essa ordem não pode ser alterada nem pulada.

## Passo 8 — Executar testes unitários e validar cobertura

Execute o comando `{{COMANDO_TEST_COBERTURA}}` documentado em `CLAUDE.md` (testes unitários
com relatório de cobertura). Esta etapa cobre apenas testes unitários — não execute testes de
integração ou e2e. Se `CLAUDE.md` não tiver esse comando preenchido, use `{{COMANDO_TEST_UNITARIO}}`
e sinalize ao dev que a cobertura não pôde ser medida automaticamente.

Leia o resultado do comando para obter quantos testes passaram/falharam e o percentual de
cobertura total e por arquivo.

**Critério de aprovação:** 100% dos testes passam **e** a cobertura total é ≥ 80%.

**Se aprovado:** exiba um resumo (`{N} testes passaram, cobertura {X}%`) e siga para o Passo 9.

**Se reprovado** (algum teste falhou ou cobertura < 80%):

Interrompa o fluxo imediatamente. **Não realize commit.** Exiba:

```
✗ Testes não aprovados — implementação não commitada

Testes que falharam:
  ✗ {arquivo de teste} — {nome do teste}: {motivo da falha}

Arquivos com cobertura insuficiente:
  {caminho/arquivo.ts} — {percentual}% (mínimo: 80%)

As mudanças ficam na branch specforge/{ID} (não commitadas). Corrija os problemas acima e
rode novamente /specforge-execute-spec {ID}.
```

Não prossiga para os passos seguintes.

## Passo 9 — Verificar coerência entre regras de negócio e implementação

Com os testes aprovados, compare a implementação feita (Passo 7) contra:

- `.claude/steering/domain-rules.md`
- Os critérios de aceite (negócio e técnicos) da spec (Passo 2)

Procure por inconsistências como: código que contradiz uma regra de negócio documentada,
comportamento que não atende a um critério de aceite do work item, ou validação de domínio
exigida pela spec/steering que ficou ausente.

**Se nenhuma inconsistência for encontrada:**

Exiba `✓ Nenhuma inconsistência entre regras de negócio e implementação.` e siga direto para
o Passo 11 — não reexecute os testes.

**Se inconsistências forem encontradas:**

Liste cada uma (`⚠ {arquivo}: {descrição da inconsistência}`) e siga para o Passo 10.

## Passo 10 — Corrigir inconsistências e reexecutar testes

Este passo só ocorre se o Passo 9 encontrou inconsistências.

1. Corrija exclusivamente as inconsistências identificadas no Passo 9 — corrigir falhas de
   teste que não tenham origem em incoerência de regras de negócio está fora do escopo desta
   etapa
2. Reexecute os testes unitários (mesmo comando do Passo 8), incluindo cobertura, para
   confirmar que a correção não introduziu regressão

**Se os testes passarem com cobertura ≥ 80% após a correção:** exiba um resumo das
inconsistências corrigidas e siga para o Passo 11.

**Se os testes falharem após a correção:** trate como reprovação — use a mesma saída do
Passo 8, deixando explícito que a falha persiste após a correção de incoerência — e
interrompa o fluxo. Não há retentativa automática adicional.

## Passo 11 — Commit

Só execute este passo após testes e coerência validados nos Passos 8–10, e confirme mais uma
vez que a branch atual é `specforge/{ID}` (Passo 6) — nunca commit em `main`/`master`.

1. **Se a origem da spec (Passo 1) foi a task do tracker** (não havia arquivo local): crie
   `docs/specs/` se não existir e grave o conteúdo lido da task em `docs/specs/{ID}-spec.md`
   agora — é este commit que passa a versionar a spec junto do código, preenchendo a lacuna que
   antes exigia alguém commitar o arquivo antes de outro dev conseguir trabalhar. **Se a origem já
   era o arquivo local, pule este item** — ele já existe e não precisa ser regravado.
2. Adicione ao stage os arquivos criados, modificados ou removidos na implementação (Passo 7),
   em eventuais correções do Passo 10, e `docs/specs/{ID}-spec.md` se foi gravado no item 1
3. Crie o commit com a mensagem exatamente neste padrão, sem variação de tipo:

```
feat({ID}): {título do work item} — specforge-execute-spec
```

## Passo 12 — Push

Envie a branch `specforge/{ID}` para o remoto — nunca para `main`/`master`:

```bash
git push -u origin specforge/{ID}
```

**Se o push for bem-sucedido:** registre o hash do commit (`git rev-parse HEAD`) e o nome do
branch (`specforge/{ID}`), e siga para o Passo 13.

**Se o push falhar** (conflito, permissão, rede ou outro motivo):

Interrompa o fluxo. Exiba:

```
✗ Push falhou — commit realizado localmente na branch specforge/{ID}, mas não enviado

Motivo: {mensagem de erro retornada pelo git}

O commit está salvo localmente na branch specforge/{ID}. Para reenviar manualmente:
  1. Resolva o motivo acima (ex.: git pull --rebase origin specforge/{ID}, verifique permissões/rede)
  2. Rode: git push -u origin specforge/{ID}
  3. Após o push, poste o changelog manualmente no card {ID} usando docs/changelogs/{ID}.md
```

Não prossiga para o Passo 13.

## Passo 13 — Gerar e publicar changelog e evidências de aceite

Changelog e evidências de aceite moram no **mesmo arquivo local**, num único template
padronizado — evita duas fontes de verdade espalhadas pelo projeto e garante que todo work item
gere o mesmo formato, sempre. **Todo comentário publicado no tracker recebe o arquivo completo**,
nunca uma seção isolada. Depois de publicar, este passo também fecha o ciclo no tracker: sempre
no card {ID} (13.2); na task de spec quando a origem foi o tracker, marcando-a como concluída
(13.3); criando/atualizando a task `qa - {nome do projeto}` para quem faz QA continuar, sempre
(13.4); e movendo o card para a coluna "In Code Review", sem alterar o status (13.5).

### 13.1 — Gravar `docs/changelogs/{ID}.md`

Crie a pasta `docs/changelogs/` se não existir. Cada work item tem seu próprio arquivo — não
edite arquivos de outros work items. **Sempre no template abaixo, completo, nesta ordem exata —
é isso que garante que todo changelog gerado pelo specforge tenha a mesma estrutura:**

Na seção "Evidências por critério de aceite" (dirigida a quem faz QA — linguagem simples na
narrativa, evitando jargão de implementação; os dados de reprodução como JSON/comandos/passo a
passo continuam técnicos porque são o que é preciso para reproduzir): **regra crítica, nunca
invente dado de reprodução** — todo exemplo vem dos testes reais escritos e executados no
Passo 7/8, com os mesmos valores que os testes usam. Um critério sem teste automatizado
correspondente é sinalizado como tal, nunca recebe evidência forjada.

```markdown
# {ID} — {título do work item}

**Data:** {data de hoje}
**Tipo:** feat / fix / refactor / chore
**Work item:** {link ou referência}
**Commit:** {hash do commit} (branch `specforge/{ID}`)

### O que foi implementado

{3-6 frases em linguagem simples: o que mudou para quem usa o sistema — comportamento
observável, não como foi codificado. Baseie-se no "Contexto"/"Solução proposta" da spec e no que
foi de fato implementado no Passo 7.}

## O que mudou

- {descrição objetiva da mudança 1}
- {descrição objetiva da mudança 2}

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `caminho/arquivo1.ts` | criado / modificado / removido |
| `caminho/arquivo2.ts` | criado / modificado / removido |

## Testes

- Testes executados: {N} ({resultado: todos passaram})
- Cobertura obtida: {X}%
- Inconsistências de regras de negócio corrigidas: {nenhuma / lista do Passo 10}

## Critérios de aceite

- [x] {critério 1}
- [x] {critério 2}
- [ ] {critério 3} — requer validação manual

### Evidências por critério de aceite

{Repita o bloco abaixo para cada critério de "Estratégia de testes" > "Casos obrigatórios a
cobrir" da spec (Passo 2) — são os mesmos critérios já mapeados pelo agent-qa em formato
dado/quando/então, os mesmos do checklist acima. Se a spec não tiver essa seção detalhada, use os
itens de "Critérios de aceite técnicos" no lugar.}

#### {critério de aceite, em linguagem simples — ex.: "Pedido não pode ser cancelado após o envio"}

- **O que foi testado:** {1-2 frases descrevendo o cenário coberto, dado/quando/então em
  linguagem simples}
- **Como reproduzir:**
  {Adapte o formato ao tipo de mudança desta parte da solução (ver "Requisitos técnicos
  aplicados"/categoria na spec, se presente):
  - **API/endpoint:** passo a passo com método HTTP, rota, um exemplo real de payload de entrada
    em JSON (tirado do teste), e a resposta esperada (status code + corpo em JSON)
  - **Job/batch/fila:** comando ou evento que dispara o processamento, e o resultado/log/estado
    esperado depois
  - **Procedure/rotina de banco:** chamada (com parâmetros reais usados no teste) e o resultado
    esperado
  - **Biblioteca/módulo interno:** exemplo de chamada com entrada real usada no teste e o retorno
    esperado
  Numere os passos, um por linha, com valores concretos — não escreva "envie os dados
  necessários", escreva os dados de verdade.}
- **Resultado:** ✓ Coberto por teste automatizado (`caminho/arquivo.test.ts`, caso "{nome do
  teste}") | ⚠ Sem teste automatizado correspondente — requer validação manual do QA

{Se o relatório de cobertura do Passo 8 detalhar por arquivo, liste aqui os arquivos tocados por
esta implementação com cobertura abaixo de 100%, para o QA saber onde vale reforçar teste manual.
Se não houver detalhamento por arquivo disponível, omita — a cobertura total já está em "Testes".}
```

**Regra do 13.2 e 13.3 — o comentário é sempre o arquivo completo, nunca uma seção isolada.**
Quem lê o card ou a task recebe o changelog e as evidências juntos, na mesma ordem do arquivo
local — nunca só a parte técnica ou só a parte de QA. Simplifica a leitura (um único documento,
não dois fragmentos) e mantém o comentário publicado idêntico ao arquivo versionado no git.

### 13.2 — Publicar no card de origem

Use o MCP já configurado na sessão (`linear` ou `azure-devops` — não crie uma integração
nova) para postar um comentário no card {ID}. Se o nome exato da ferramenta de comentário não
for conhecido, chame `list_tools` e filtre pelo prefixo do MCP em uso (`linear_` ou
`azure_devops_`) para identificá-la.

O corpo do comentário deve começar exatamente com:

```
## Changelog e evidências de aceite — specforge-execute-spec

**Commit:** {hash do commit} (branch `specforge/{ID}`)

{conteúdo completo de docs/changelogs/{ID}.md, do título até o final — changelog e evidências
juntos, sem cortar nenhuma seção}
```

**Verificação de idempotência antes de postar:** liste os comentários do card e procure um que
comece com `## Changelog e evidências de aceite — specforge-execute-spec`.
- **Se encontrar:** atualize esse comentário com o conteúdo atual.
- **Se não encontrar:** crie um novo comentário.

**Se a publicação no card falhar:**

```
✗ Não foi possível publicar o changelog no card {ID}.
Erro: {mensagem de erro retornada pelo MCP}

O conteúdo foi salvo localmente em docs/changelogs/{ID}.md.
Para publicar manualmente: copie o conteúdo e cole como comentário no card {ID}.
```

Continue para o 13.3 mesmo em caso de falha na publicação — commit e push já foram concluídos
com sucesso.

### 13.3 — Publicar também na task de spec e marcar como concluída (só quando a origem foi o tracker)

Execute este passo **apenas se a origem da spec identificada no Passo 1 foi a task do tracker**
(`spec - {nome do projeto}`). Se a origem foi o arquivo local (fluxo `/specforge-create-spec`,
sem task), pule para o 13.4 — o 13.2 já publicou o conteúdo completo no card.

1. Publique **o mesmo conteúdo completo do 13.2** (changelog e evidências juntos, arquivo
   inteiro) como comentário **na mesma task** usada no Passo 1. Use o MCP já configurado — corpo
   idêntico ao do 13.2, mesmo cabeçalho `## Changelog e evidências de aceite —
   specforge-execute-spec`.

   **Verificação de idempotência antes de postar:** liste os comentários da task e procure um
   que comece com esse cabeçalho.
   - **Se encontrar:** atualize esse comentário com o conteúdo atual.
   - **Se não encontrar:** crie um novo comentário.

   **Se a publicação falhar:**
   ```
   ✗ Não foi possível publicar o changelog/evidências na task "spec - {nome do projeto}".
   Erro: {mensagem de erro retornada pelo MCP}

   O conteúdo foi salvo localmente em docs/changelogs/{ID}.md (e já publicado no card {ID}, se o 13.2 teve sucesso).
   Para publicar manualmente: copie o conteúdo e cole como comentário nessa task.
   ```
   Continue para o item 2 mesmo em caso de falha aqui.

2. **Marque essa task como concluída** — a spec foi implementada, não está mais pendente.
   - Liste os estados/status válidos para esse tipo de work item (task) via MCP.
   - Procure por correspondência com "concluído": comparação exata ignorando maiúsculas/minúsculas,
     depois por substring — "done", "closed", "concluído", "concluída", "completo", "fechado" (em
     qualquer variação/idioma razoável).
   - **Se encontrar:** atualize o estado da task para esse valor.
   - **Se não encontrar:** não bloqueie o fluxo — registre no relatório final (Passo 15) que a
     task não pôde ser marcada como concluída, com a lista de estados disponíveis, para ajuste
     manual.
   - Em caso de falha do MCP: mesma coisa — registre e continue, não interrompa.

### 13.4 — Criar (ou atualizar) a task `qa - {nome do projeto}`

Execute sempre, independente da origem da spec (diferente do 13.3). É a task que fica pendente
para quem faz QA seguir com os testes — nunca é marcada como concluída por este comando.

1. Determine o nome do projeto (mesma lógica do Passo 1: campo `**Nome:**` do `CLAUDE.md` deste
   projeto, com fallback para o nome da pasta atual).
2. **Verificação de idempotência:** liste as tasks/sub-itens do card {ID} via MCP e procure uma
   cujo título seja exatamente `qa - {nome do projeto}`.
   - **Se encontrar:** atualize a descrição com o conteúdo atual de `docs/changelogs/{ID}.md`
     (arquivo completo, mesmo conteúdo do 13.2/13.3) — **não altere o estado dessa task**, deixe
     como quem faz QA já deixou (pode já estar em andamento).
   - **Se não encontrar:** crie uma nova task vinculada ao card {ID}: título `qa - {nome do
     projeto}`, descrição = conteúdo completo de `docs/changelogs/{ID}.md`. Deixe no estado
     padrão/pendente do tracker — esta task representa o trabalho de QA que ainda falta, nunca é
     criada já concluída.
3. **Se a criação/atualização falhar no MCP:** registre o erro no relatório final e continue —
   o conteúdo já está publicado no card (13.2) e, se aplicável, na task de spec (13.3).

### 13.5 — Mover o card para "In Code Review" (sem alterar o status)

Depois de marcar a task de spec como concluída (13.3, quando aplicável) e criar/atualizar a task
de QA (13.4), mova o **card** {ID} para a coluna **"In Code Review"** do board — **só a posição
no board, nunca o campo de status/estado do card**. Isso roda sempre, independente da origem da
spec.

**Se o MCP `azure-devops` estiver em uso:** Azure DevOps separa a coluna do board (campo
`System.BoardColumn`, e opcionalmente `System.BoardColumnDone`) do estado do work item (campo
`System.State`) — **atualize somente `System.BoardColumn`, nunca `System.State`**, para que a
mudança seja só de posição visual no board, sem disparar nenhuma transição de fluxo de trabalho.
1. Verifique os valores de `System.BoardColumn` configurados no board do time para este work item.
2. Procure por correspondência com "In Code Review": comparação exata ignorando
   maiúsculas/minúsculas, depois por substring ("code review", "revisão de código", em qualquer
   variação/idioma razoável).
3. **Se encontrar:** atualize `System.BoardColumn` para esse valor.
4. **Se não encontrar:** não bloqueie — registre no relatório final, com a lista de colunas
   disponíveis, para ajuste manual ou renomeação de uma coluna no board.

**Se o MCP `linear` estiver em uso:** o Linear não separa coluna de estado — a coluna do board
**é** o workflow state. Não existe como mudar só a posição sem mudar o estado nesse caso. Mova o
workflow state para o mais próximo de "In Code Review" (mesmo mecanismo de correspondência
automática por nome), e sinalize isso claramente no relatório final: "Linear não separa coluna de
status — o estado do card foi alterado para refletir a nova coluna, diferente do comportamento no
Azure DevOps."

**Em caso de falha do MCP ao mover:** registre o erro e continue — não interrompa o fluxo.

Continue para o Passo 14 mesmo em caso de falha em qualquer uma das publicações/movimentações
(13.2 a 13.5) — o arquivo local já foi gravado com sucesso no 13.1.

## Passo 14 — Atualizar a base de conhecimento em `.claude/steering/`

Após cada implementação, atualize os arquivos de steering (dentro do `{diretório de configuração}`
resolvido no Passo 1.05 — pode não ser a pasta atual) com o que foi aprendido ou confirmado
durante o trabalho. O objetivo é que futuras specs e implementações se beneficiem do contexto
acumulado.

**Atualize `.claude/steering/architecture.md` se:**
- Um novo padrão foi adotado (ex: nova forma de organizar módulos, novo padrão de repositório)
- Uma decisão arquitetural foi tomada durante a implementação e não estava documentada
- Um componente, serviço ou integração nova foi criada e vale registrar

**Atualize `.claude/steering/domain-rules.md` se:**
- Uma regra de negócio nova foi descoberta ou clarificada durante a implementação
- Uma regra existente foi refinada (ex: prazo ajustado, condição de exceção adicionada)
- Um conceito de domínio relevante surgiu no work item e ainda não estava documentado

**Como atualizar:**
- Adicione ao final da seção correspondente — não reestruture o arquivo inteiro
- Use o mesmo formato das entradas existentes (`**NOME_DA_REGRA**: descrição`)
- Se nenhuma atualização for relevante, sinalize explicitamente: *"Nenhuma atualização necessária nos arquivos de steering."*

## Passo 15 — Relatório final

Ao concluir, exiba:

```
✓ Implementação concluída — {ID}: {título}

Branch: specforge/{ID} (enviada para o remoto — main/master não foi tocada)
Spec: {origem: arquivo local (já existia) | task "spec - {nome do projeto}" no card {ID} — gravada agora em docs/specs/{ID}-spec.md e commitada junto do código}

O que foi feito:
  + caminho/novo-arquivo.ts          criado
  ~ caminho/arquivo-existente.ts     modificado — {resumo da mudança}
  + caminho/novo-arquivo.test.ts     criado — {nº} casos de teste

Testes e coerência:
  ✓ {N} testes unitários — 100% passaram — cobertura {X}%
  {✓ Nenhuma inconsistência de regras de negócio | ✓ {K} inconsistências corrigidas e testes reexecutados}

Commit e push:
  ✓ {hash do commit} — branch `specforge/{ID}`
  ✓ feat({ID}): {título} — specforge-execute-spec

Critérios de aceite:
  [x] {critério 1}
  [x] {critério 2}
  [ ] {critério 3} — requer validação manual

Base de conhecimento:
  + docs/changelogs/{ID}.md          changelog + evidências de aceite (mesmo arquivo, um único template)
  {✓ Publicado (arquivo completo) no card {ID} | ✗ Falha ao publicar no card — veja mensagem acima}
  {Se a origem foi task do tracker: "✓ Publicado também na task \"spec - {nome do projeto}\" | ✗ Falha ao publicar na task — veja mensagem acima"}
  {Se a origem foi task do tracker: "✓ Task \"spec - {nome do projeto}\" marcada como concluída | ✗ Não foi possível marcar como concluída — estados disponíveis: {lista}"}
  {✓ Task "qa - {nome do projeto}" criada/atualizada, pendente para QA | ✗ Falha ao criar/atualizar a task de QA — veja mensagem acima}
  {✓ Card {ID} movido para "In Code Review" (status não alterado) | ✗ Card não movido — nenhuma coluna correspondente encontrada. Colunas disponíveis: {lista} | ⚠ Card movido, mas via mudança de estado (Linear não separa coluna de status)}
  ~ .claude/steering/architecture.md {atualizado com: X / não atualizado}
  ~ .claude/steering/domain-rules.md {atualizado com: X / não atualizado}

Próximos passos sugeridos:
  1. Revise as mudanças: git diff main...specforge/{ID}
  2. Abra o PR de specforge/{ID} para a branch principal, referenciando {ID}
```

Se algum critério de aceite não puder ser marcado como concluído programaticamente, indique `[ ]` e explique o que precisa de validação manual.

Se o fluxo foi interrompido em algum passo anterior (testes reprovados, push falhou), não exiba este relatório de conclusão — exiba apenas a mensagem de interrupção do passo correspondente.
