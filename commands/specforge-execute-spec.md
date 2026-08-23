Implementa as mudanças de código descritas na spec técnica do work item.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Localizar a spec: arquivo local primeiro, task do tracker como alternativa

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
Busque-a:

1. Leia `CLAUDE.md` deste projeto, seção `## Comandos e projeto (specforge)`, campo `**Nome:**`.
   **Se estiver vazio, ausente ou `<!-- TODO: preencher -->`, use o nome da pasta atual**
   (o diretório onde este comando está rodando) como identificador — precisa ser o mesmo valor
   que o `agent-coordinator` usou para nomear a task.
2. Verifique se há um MCP configurado na sessão (`linear` ou `azure-devops`). **Se nenhum
   estiver disponível:**
   > "Nenhuma spec local encontrada e nenhum MCP de work tracker configurado para buscá-la no card {ID}. Configure o MCP do Linear ou do Azure DevOps, ou rode `/specforge-create-spec {ID}` para gerar a spec localmente."

   Interrompa a execução.
3. Liste as tasks/sub-itens do card {ID} via ferramenta disponível no MCP (Linear: sub-issues;
   Azure DevOps: work items filhos — use `list_tools` se o nome da ferramenta não for óbvio).
4. Procure uma task cujo título seja exatamente `spec - {nome do projeto, do item 1}`.
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

Leia os seguintes arquivos antes de escrever qualquer código:

1. `CLAUDE.md` — convenções gerais, comandos de build e test
2. `.claude/steering/architecture.md` — padrões arquiteturais que devem ser seguidos
3. `.claude/steering/domain-rules.md` — regras de negócio que não podem ser violadas
4. Cada arquivo listado na seção "Arquivos que serão alterados" da spec — leia o estado atual antes de modificar

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

## Passo 13 — Gerar e publicar o changelog

### 13.1 — Changelog local

Crie o arquivo `docs/changelogs/{ID}.md` (crie a pasta `docs/changelogs/` se não existir).

Cada work item tem seu próprio arquivo de changelog — não edite arquivos de outros work items.

```markdown
# {ID} — {título do work item}

**Data:** {data de hoje}
**Tipo:** feat / fix / refactor / chore
**Work item:** {link ou referência}
**Commit:** {hash do commit} (branch `specforge/{ID}`)

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
```

### 13.2 — Publicar changelog no card de origem

Use o MCP já configurado na sessão (`linear` ou `azure-devops` — não crie uma integração
nova) para postar um comentário no card {ID} com o changelog desta execução. Se o nome exato
da ferramenta de comentário não for conhecido, chame `list_tools` e filtre pelo prefixo do
MCP em uso (`linear_` ou `azure_devops_`) para identificá-la.

O corpo do comentário deve começar exatamente com:

```
## Changelog — specforge-execute-spec

**Commit:** {hash do commit} (branch `specforge/{ID}`)

{conteúdo completo de docs/changelogs/{ID}.md}
```

**Se a publicação no card falhar:**

```
✗ Não foi possível publicar o changelog no card {ID}.
Erro: {mensagem de erro retornada pelo MCP}

O changelog foi salvo localmente em docs/changelogs/{ID}.md.
Para publicar manualmente: copie o conteúdo e cole como comentário no card {ID}.
```

Continue para o Passo 14 mesmo em caso de falha na publicação — commit e push já foram
concluídos com sucesso.

## Passo 14 — Gerar e publicar as evidências de atendimento aos critérios de aceite

Este é um artefato separado do changelog (Passo 13) — o changelog é um registro técnico para
quem desenvolve; este é dirigido a **quem faz o QA**, para validar a entrega sem precisar
procurar o dev. Linguagem simples na narrativa (evite jargão de implementação — nomes de
classe, padrão arquitetural, detalhe interno de código); os dados de reprodução (JSON, comandos,
passo a passo) continuam técnicos porque são exatamente o que o QA precisa para reproduzir.

**Regra crítica — nunca invente dados de reprodução.** Todo exemplo de request/response,
comando, entrada ou saída esperada precisa vir dos testes reais escritos e executados no
Passo 7/8 desta implementação — reaproveite os mesmos valores que os testes usam. Se um critério
de aceite não tiver teste automatizado correspondente, diga isso explicitamente em vez de
inventar uma evidência.

### 14.1 — Montar o documento de evidências

```markdown
## Evidências de aceite — specforge-execute-spec

**Work item:** {link ou referência}
**Commit:** {hash do commit} (branch `specforge/{ID}`)

---

### O que foi implementado

{3-6 frases em linguagem simples: o que mudou para quem usa o sistema — comportamento
observável, não como foi codificado. Baseie-se no "Contexto"/"Solução proposta" da spec e no que
foi de fato implementado no Passo 7.}

---

### Evidências por critério de aceite

{Repita o bloco abaixo para cada critério de "Estratégia de testes" > "Casos obrigatórios a
cobrir" da spec (Passo 2) — são os mesmos critérios já mapeados pelo agent-qa em formato
dado/quando/então. Se a spec não tiver essa seção detalhada, use os itens de "Critérios de
aceite técnicos" no lugar.}

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

---

### Cobertura de testes

Cobertura total desta implementação: **{X}%** (gate mínimo do specforge: 80%)

{Se o relatório de cobertura do Passo 8 detalhar por arquivo, liste os arquivos tocados por esta
implementação com cobertura abaixo de 100%, para o QA saber onde vale reforçar teste manual. Se
não houver detalhamento por arquivo disponível, omita esta lista e mantenha só o total.}
```

### 14.2 — Publicar

**Determine o destino pela origem da spec identificada no Passo 1:**
- **Origem foi task do tracker:** publique como comentário **na mesma task** (`spec - {nome do projeto}`) usada no Passo 1 — não no card pai. É o local que quem faz QA daquele projeto específico está acompanhando.
- **Origem foi arquivo local** (fluxo `/specforge-create-spec`, sem task): publique como comentário no **card {ID}** (mesmo destino do changelog).

Use o MCP já configurado (`linear` ou `azure-devops`). Se o nome exato da ferramenta de
comentário não for conhecido, chame `list_tools` e filtre pelo prefixo do MCP em uso.

**Verificação de idempotência antes de postar:** liste os comentários do destino determinado
acima e procure um que comece com `## Evidências de aceite — specforge-execute-spec`.
- **Se encontrar:** atualize esse comentário com o conteúdo atual.
- **Se não encontrar:** crie um novo comentário.

**Se a publicação falhar:**
```
✗ Não foi possível publicar as evidências de aceite em {task "spec - {nome do projeto}" | card {ID}}.
Erro: {mensagem de erro retornada pelo MCP}

O conteúdo gerado está disponível acima nesta sessão — copie e cole manualmente se necessário.
```

Continue para o Passo 15 mesmo em caso de falha na publicação.

## Passo 15 — Atualizar a base de conhecimento em `.claude/steering/`

Após cada implementação, atualize os arquivos de steering com o que foi aprendido ou confirmado durante o trabalho. O objetivo é que futuras specs e implementações se beneficiem do contexto acumulado.

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

## Passo 16 — Relatório final

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
  + docs/changelogs/{ID}.md          changelog criado
  {✓ Changelog publicado no card {ID} | ✗ Falha ao publicar no card — veja mensagem acima}
  {✓ Evidências de aceite publicadas em {task "spec - {nome do projeto}" | card {ID}} | ✗ Falha ao publicar — veja mensagem acima}
  ~ .claude/steering/architecture.md {atualizado com: X / não atualizado}
  ~ .claude/steering/domain-rules.md {atualizado com: X / não atualizado}

Próximos passos sugeridos:
  1. Revise as mudanças: git diff main...specforge/{ID}
  2. Abra o PR de specforge/{ID} para a branch principal, referenciando {ID}
```

Se algum critério de aceite não puder ser marcado como concluído programaticamente, indique `[ ]` e explique o que precisa de validação manual.

Se o fluxo foi interrompido em algum passo anterior (testes reprovados, push falhou), não exiba este relatório de conclusão — exiba apenas a mensagem de interrupção do passo correspondente.
