Implementa as mudanças de código descritas na spec técnica do work item.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte ao dev antes de continuar.

## Passo 1 — Verificar se a spec existe

Verifique se o arquivo `.claude/specs/{ID}.md` existe.

**Se não existir:**
> "Spec não encontrada para {ID}. Rode `/specforge-create-spec {ID}` primeiro para gerar a especificação técnica."

Interrompa a execução.

## Passo 2 — Ler a spec completa

Leia `.claude/specs/{ID}.md` integralmente. Preste atenção especial em:

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

## Passo 7 — Gerar o changelog da implementação

Crie o arquivo `docs/changelogs/{ID}.md` (crie a pasta `docs/changelogs/` se não existir).

Cada work item tem seu próprio arquivo de changelog — não edite arquivos de outros work items.

```markdown
# {ID} — {título do work item}

**Data:** {data de hoje}
**Tipo:** feat / fix / refactor / chore
**Work item:** {link ou referência}

## O que mudou

- {descrição objetiva da mudança 1}
- {descrição objetiva da mudança 2}

## Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `caminho/arquivo1.ts` | criado / modificado / removido |
| `caminho/arquivo2.ts` | criado / modificado / removido |

## Critérios de aceite

- [x] {critério 1}
- [x] {critério 2}
- [ ] {critério 3} — requer validação manual
```

## Passo 8 — Atualizar a base de conhecimento em `.claude/steering/`

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

## Passo 9 — Relatório final

Ao concluir, exiba:

```
✓ Implementação concluída — {ID}: {título}

O que foi feito:
  + caminho/novo-arquivo.ts          criado
  ~ caminho/arquivo-existente.ts     modificado — {resumo da mudança}
  + caminho/novo-arquivo.test.ts     criado — {nº} casos de teste

Critérios de aceite:
  [x] {critério 1}
  [x] {critério 2}
  [ ] {critério 3} — requer validação manual

Base de conhecimento:
  + docs/changelogs/{ID}.md          changelog criado
  ~ .claude/steering/architecture.md {atualizado com: X / não atualizado}
  ~ .claude/steering/domain-rules.md {atualizado com: X / não atualizado}

Próximos passos sugeridos:
  1. Rode os testes: {comando de test do CLAUDE.md}
  2. Revise as mudanças: git diff
  3. Abra o PR referenciando {ID}
```

Se algum critério de aceite não puder ser marcado como concluído programaticamente, indique `[ ]` e explique o que precisa de validação manual.
