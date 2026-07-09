Implementa as mudanças de código descritas na spec técnica do work item.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Verificar se a spec existe

Verifique se o arquivo `docs/specs/{ID}-spec.md` existe.

**Se não existir:**
> "Spec não encontrada para {ID}. Rode `/specforge-create-spec {ID}` primeiro para gerar a especificação técnica."

Interrompa a execução.

## Passo 2 — Ler a spec completa

Leia `docs/specs/{ID}-spec.md` integralmente. Preste atenção especial em:

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

## Passo 6 — Implementar seguindo o plano

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

A partir daqui, os passos 7 a 12 executam automaticamente, sem confirmação adicional do dev,
na ordem fixa: testes → coerência → correção (se necessário) → reteste → commit → push →
changelog. Essa ordem não pode ser alterada nem pulada.

## Passo 7 — Executar testes unitários e validar cobertura

Execute o comando `{{COMANDO_TEST_COBERTURA}}` documentado em `CLAUDE.md` (testes unitários
com relatório de cobertura). Esta etapa cobre apenas testes unitários — não execute testes de
integração ou e2e. Se `CLAUDE.md` não tiver esse comando preenchido, use `{{COMANDO_TEST_UNITARIO}}`
e sinalize ao dev que a cobertura não pôde ser medida automaticamente.

Leia o resultado do comando para obter quantos testes passaram/falharam e o percentual de
cobertura total e por arquivo.

**Critério de aprovação:** 100% dos testes passam **e** a cobertura total é ≥ 80%.

**Se aprovado:** exiba um resumo (`{N} testes passaram, cobertura {X}%`) e siga para o Passo 8.

**Se reprovado** (algum teste falhou ou cobertura < 80%):

Interrompa o fluxo imediatamente. **Não realize commit.** Exiba:

```
✗ Testes não aprovados — implementação não commitada

Testes que falharam:
  ✗ {arquivo de teste} — {nome do teste}: {motivo da falha}

Arquivos com cobertura insuficiente:
  {caminho/arquivo.ts} — {percentual}% (mínimo: 80%)

Corrija os problemas acima e rode novamente /specforge-execute-spec {ID}.
```

Não prossiga para os passos seguintes.

## Passo 8 — Verificar coerência entre regras de negócio e implementação

Com os testes aprovados, compare a implementação feita (Passo 6) contra:

- `.claude/steering/domain-rules.md`
- Os critérios de aceite (negócio e técnicos) de `docs/specs/{ID}-spec.md`

Procure por inconsistências como: código que contradiz uma regra de negócio documentada,
comportamento que não atende a um critério de aceite do work item, ou validação de domínio
exigida pela spec/steering que ficou ausente.

**Se nenhuma inconsistência for encontrada:**

Exiba `✓ Nenhuma inconsistência entre regras de negócio e implementação.` e siga direto para
o Passo 10 — não reexecute os testes.

**Se inconsistências forem encontradas:**

Liste cada uma (`⚠ {arquivo}: {descrição da inconsistência}`) e siga para o Passo 9.

## Passo 9 — Corrigir inconsistências e reexecutar testes

Este passo só ocorre se o Passo 8 encontrou inconsistências.

1. Corrija exclusivamente as inconsistências identificadas no Passo 8 — corrigir falhas de
   teste que não tenham origem em incoerência de regras de negócio está fora do escopo desta
   etapa
2. Reexecute os testes unitários (mesmo comando do Passo 7), incluindo cobertura, para
   confirmar que a correção não introduziu regressão

**Se os testes passarem com cobertura ≥ 80% após a correção:** exiba um resumo das
inconsistências corrigidas e siga para o Passo 10.

**Se os testes falharem após a correção:** trate como reprovação — use a mesma saída do
Passo 7, deixando explícito que a falha persiste após a correção de incoerência — e
interrompa o fluxo. Não há retentativa automática adicional.

## Passo 10 — Commit

Só execute este passo após testes e coerência validados nos Passos 7–9. Nunca commit antes
disso.

1. Adicione ao stage os arquivos criados, modificados ou removidos na implementação (Passo 6)
   e em eventuais correções do Passo 9
2. Crie o commit com a mensagem exatamente neste padrão, sem variação de tipo:

```
feat({ID}): {título do work item} — specforge-execute-spec
```

## Passo 11 — Push

Envie o commit para o branch remoto que rastreia o branch atual.

**Se o push for bem-sucedido:** registre o hash do commit (`git rev-parse HEAD`) e o nome do
branch, e siga para o Passo 12.

**Se o push falhar** (conflito, permissão, rede ou outro motivo):

Interrompa o fluxo. Exiba:

```
✗ Push falhou — commit realizado localmente, mas não enviado

Motivo: {mensagem de erro retornada pelo git}

O commit está salvo localmente. Para reenviar manualmente:
  1. Resolva o motivo acima (ex.: git pull --rebase, verifique permissões/rede)
  2. Rode: git push
  3. Após o push, poste o changelog manualmente no card {ID} usando docs/changelogs/{ID}.md
```

Não prossiga para o Passo 12.

## Passo 12 — Gerar e publicar o changelog

### 12.1 — Changelog local

Crie o arquivo `docs/changelogs/{ID}.md` (crie a pasta `docs/changelogs/` se não existir).

Cada work item tem seu próprio arquivo de changelog — não edite arquivos de outros work items.

```markdown
# {ID} — {título do work item}

**Data:** {data de hoje}
**Tipo:** feat / fix / refactor / chore
**Work item:** {link ou referência}
**Commit:** {hash do commit} (branch `{branch}`)

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
- Inconsistências de regras de negócio corrigidas: {nenhuma / lista do Passo 9}

## Critérios de aceite

- [x] {critério 1}
- [x] {critério 2}
- [ ] {critério 3} — requer validação manual
```

### 12.2 — Publicar changelog no card de origem

Use o MCP já configurado na sessão (`linear` ou `azure-devops` — não crie uma integração
nova) para postar um comentário no card {ID} com o changelog desta execução. Se o nome exato
da ferramenta de comentário não for conhecido, chame `list_tools` e filtre pelo prefixo do
MCP em uso (`linear_` ou `azure_devops_`) para identificá-la.

O corpo do comentário deve começar exatamente com:

```
## Changelog — specforge-execute-spec

**Commit:** {hash do commit} (branch `{branch}`)

{conteúdo completo de docs/changelogs/{ID}.md}
```

**Se a publicação no card falhar:**

```
✗ Não foi possível publicar o changelog no card {ID}.
Erro: {mensagem de erro retornada pelo MCP}

O changelog foi salvo localmente em docs/changelogs/{ID}.md.
Para publicar manualmente: copie o conteúdo e cole como comentário no card {ID}.
```

Continue para o Passo 13 mesmo em caso de falha na publicação — commit e push já foram
concluídos com sucesso.

## Passo 13 — Atualizar a base de conhecimento em `.claude/steering/`

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

## Passo 14 — Relatório final

Ao concluir, exiba:

```
✓ Implementação concluída — {ID}: {título}

O que foi feito:
  + caminho/novo-arquivo.ts          criado
  ~ caminho/arquivo-existente.ts     modificado — {resumo da mudança}
  + caminho/novo-arquivo.test.ts     criado — {nº} casos de teste

Testes e coerência:
  ✓ {N} testes unitários — 100% passaram — cobertura {X}%
  {✓ Nenhuma inconsistência de regras de negócio | ✓ {K} inconsistências corrigidas e testes reexecutados}

Commit e push:
  ✓ {hash do commit} — branch `{branch}`
  ✓ feat({ID}): {título} — specforge-execute-spec

Critérios de aceite:
  [x] {critério 1}
  [x] {critério 2}
  [ ] {critério 3} — requer validação manual

Base de conhecimento:
  + docs/changelogs/{ID}.md          changelog criado
  {✓ Changelog publicado no card {ID} | ✗ Falha ao publicar no card — veja mensagem acima}
  ~ .claude/steering/architecture.md {atualizado com: X / não atualizado}
  ~ .claude/steering/domain-rules.md {atualizado com: X / não atualizado}

Próximos passos sugeridos:
  1. Revise as mudanças: git diff HEAD~1
  2. Abra o PR referenciando {ID}
```

Se algum critério de aceite não puder ser marcado como concluído programaticamente, indique `[ ]` e explique o que precisa de validação manual.

Se o fluxo foi interrompido em algum passo anterior (testes reprovados, push falhou), não exiba este relatório de conclusão — exiba apenas a mensagem de interrupção do passo correspondente.
