---
description: Triagem de um card (Azure DevOps/Linear) sem perguntas no console — comenta dúvidas no card ou publica uma task "spec" por projeto afetado
argument-hint: <ID do work item>
---

Analisa um card contra os projetos vinculados do workspace. Com dúvidas de negócio: comenta no
card e move para "Triaged / Refinement". Sem dúvidas: gera e revisa a spec de cada projeto afetado
(ciclo interno de correção), publica uma task `spec - {projeto}` por projeto e move para "Ready for
Development". **Nenhuma pergunta no console** — tudo que depende de humano vira comentário no card.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte (única pergunta permitida).

## Passo 1 — Projetos vinculados e usuários de dúvidas

No `CLAUDE.md` da pasta atual (workspace), leia:
- `## Projetos vinculados (specforge)`: nome, pasta, stack, "para que serve" e repositório de cada
  projeto (tabela antiga sem `Stack`/`Para que serve`: trate como vazias). Se o arquivo, a seção
  ou a tabela não existirem: "Nenhum projeto vinculado neste workspace. Rode
  `/specforge-add-project <url>` primeiro." e interrompa.
- `## Usuários para dúvidas (specforge)`, se existir: lista de emails.

## Passo 2 — Card completo via MCP

- **`linear`:** issue pelo ID (ex.: `ENG-1234`): título, descrição, labels, assignee, status,
  critérios de aceite; todos os comentários; todos os anexos.
- **`azure-devops`:** work item pelo ID numérico: título, descrição, acceptance criteria, tags,
  área, iteração; todos os comentários; todos os anexos.
- Anexos: leia o conteúdo quando a ferramenta permitir (texto, imagem, PDF); senão registre nome e URL.
- Nome de ferramenta desconhecido: `list_tools`, filtrando pelo prefixo do MCP.
- Sem MCP de tracker: "Nenhum MCP de work tracker encontrado. Configure o MCP do Linear ou do
  Azure DevOps e tente novamente." e interrompa. Card não encontrado: informe e interrompa.

**Comentários são entrada obrigatória da análise:**
- Se houver `## Dúvidas para construção da spec — specforge-analyzer` de uma execução anterior,
  leia os comentários posteriores e marque cada dúvida como **respondida** (com a resposta) ou
  **sem resposta**. Respostas têm prioridade sobre a descrição original.
- Se houver `## Revisão técnica não convergiu — specforge-analyzer`, use a pendência de cada
  projeto como ponto de partida do `histórico` dele no Passo 6. **Nunca repasse isso ao tech-lead.**

Daqui em diante, "a demanda" = descrição original enriquecida pelas respostas dos comentários.

## Passo 3 — Projetos afetados

Um card pode afetar **mais de um** projeto. Para cada projeto vinculado, leia do diretório de
configuração `.claude/{pasta sem a barra}/`: `CLAUDE.md`, `.claude/steering/architecture.md` e
`.claude/steering/domain-rules.md`. Se `.claude/{pasta}/CLAUDE.md` não existir mas
`{pasta}/CLAUDE.md` existir (formato antigo), use o antigo como diretório de configuração e sinalize
no Passo 9.

Inclua um projeto sempre que houver correspondência razoável entre a demanda e seu
domínio/stack/arquitetura, ou quando o card citar o sistema. **Na dúvida, inclua.** Nunca pergunte
qual projeto usar. Nenhum projeto identificado → registre como dúvida no Passo 4 ("Não
conseguimos identificar a qual sistema esse pedido se refere — pode indicar qual sistema deve ser
alterado?").

### Banco de dados (opcional, somente leitura)

Para cada projeto afetado com `**Banco de dados:**` preenchido em `## Comandos e projeto
(specforge)` do seu `CLAUDE.md` (vazio, ausente ou TODO → pule; não adivinhe):
1. Procure nesta sessão uma ferramenta MCP para esse tipo de banco (ex.: SQL Server →
   `mssql`/`sqlserver`; PostgreSQL → `postgres`). Nenhuma → pule em silêncio, sem erro nem aviso.
2. **Somente leitura, sem exceção:** `SELECT`, `SHOW`, `DESCRIBE`, `EXPLAIN` e consultas de
   metadado. Nunca `INSERT`/`UPDATE`/`DELETE`/`MERGE`/DDL/`GRANT`/`REVOKE` nem procedures com
   escrita. Na dúvida se algo é seguro, não execute.
3. Use o que descobrir (estrutura e dados reais) nos Passos 4–6; prevalece sobre o steering.

## Passo 4 — A informação está 100% completa?

Com base nos Passos 2–3, verifique:
- Problema claro e não ambíguo (já com os esclarecimentos)
- Critérios de aceite explícitos ou claramente inferíveis
- Escopo identificável em cada projeto afetado (ou dúvida de projeto do Passo 3)
- Sem contradições entre título, descrição, comentários e anexos
- Riscos, dependências e decisões de negócio resolvidos
- Anexos citados foram encontrados e lidos
- Toda dúvida de execução anterior respondida de forma clara e completa (resposta parcial mantém
  a dúvida, reescrita para o que ainda falta)

Liste cada dúvida, objetiva e em **linguagem de negócio** (sem arquivos, classes, tabelas,
frameworks, "endpoint", "payload") — quem responde são analistas de negócio/produto. Pergunte
sobre regra, comportamento esperado ou decisão, nunca sobre implementação. Sem dúvidas → Passo 6.

## Passo 5 — Há dúvidas: comentar e mover para "Triaged / Refinement"

Nada é perguntado no console; o fluxo termina aqui e uma execução futura lê as respostas.

### Comentário

Tudo em linguagem de negócio, exatamente estes blocos:

```
## Dúvidas para construção da spec — specforge-analyzer

**O que entendemos do pedido**
{2-4 frases}

**O que está sendo pedido para entregar**
{1-3 frases: o que muda para quem usa o sistema}

**Projetos que este pedido impacta**
{nome do projeto + "para que serve" do CLAUDE.md do workspace (vazio/TODO: 1 frase simples);
nenhum projeto: "Ainda não identificamos com segurança qual sistema este pedido afeta — ver dúvida abaixo."}

**Dúvidas em aberto**
{lista numerada}
```

**Menção aos usuários registrados** (se houver) — menção nativa, não email em texto:
- **azure-devops:** resolva cada email na ferramenta de identidade do MCP (ex.: `search_identity`)
  para obter o GUID e o nome de exibição; insira ao final, uma por linha,
  `<a href="#" data-vss-mention="version:2.0,{GUID}">@{Nome}</a>` e poste o comentário em
  **formato HTML** (se postado como texto, ninguém é notificado).
- **linear:** resolva o `id` do usuário pelo email e use a forma de menção que a ferramenta de
  comentário documenta.
- Só para emails cuja resolução falhou de fato: ao final, `---` e
  `Necessita resposta de: {emails}`.

**Idempotência:** se já existe um comentário iniciando com o mesmo cabeçalho, atualize-o; se a
atualização não existir ou falhar, crie um novo com `> Atualização de comentário anterior — ID
{comment_id}` logo após o cabeçalho.

### Mover o card

Liste os estados/colunas do board e escolha por nome, **nunca perguntando**: igual a "Triaged /
Refinement" (ignorando caixa e espaços) ou, senão, contendo "triag" ou "refin". Não encontrou → não
mova e registre no Passo 9 com a lista de estados disponíveis. Falha de MCP: informe e siga para o
Passo 9. **Não prossiga para o Passo 6.**

## Passo 6 — Sem dúvidas: gerar e revisar a spec de cada projeto

Nunca comenta nem move o card: reprovação do tech-lead é ciclo interno desta execução.

Para cada projeto afetado, de forma independente: crie `{projeto}/docs/specs/tmp/`, inicie
`histórico` vazio e `rodada = 1`, e repita até `APROVADO` ou até concluir a rodada 5. Em todos os
despachos, `{projeto}` é a pasta do repositório e `{config}` o diretório de configuração
(`.claude/{pasta}/` ou o antigo), sempre informados juntos.

Bloco comum de contexto (`{card}`):
```
- ID do work item: {ID}
- Título: {título}
- Descrição: {demanda: descrição já enriquecida pelos comentários}
- Critérios de aceite: {se houver}
- Diretório do projeto: {projeto}/
- Diretório de configuração: {config}/
```

1. **`specforge-agent-developer`** com `{card}` + `MCP configurado: {linear | azure-devops}` +
   `Achados de consulta ao banco de dados: {resumo do Passo 3, se houver}` e:
   - Rodada 1: nada mais (solução completa).
   - Rodada ≥ 2: `Modo: correção`, `Pendências desta rodada: {"O que precisa ser corrigido" da
     última revisão}` e `Já corrigido antes (não reintroduzir): {títulos das pendências das
     rodadas anteriores}`.

   Confira que `{projeto}/docs/specs/tmp/{ID}-solution.md` existe. Guarde a linha `Cenários
   afetados: sim|não` da resposta (rodada ≥ 2).
2. **`specforge-agent-qa`** com `{card}` + `Achados de consulta ao banco de dados` — **na rodada 1
   sempre; na rodada ≥ 2 só se** o developer respondeu `Cenários afetados: sim`, a pendência citar
   testes/cobertura, ou `{ID}-test-scenarios.md` não existir. Na rodada ≥ 2 inclua `Modo: correção`
   e `Pendências desta rodada`. Confira que `{ID}-test-scenarios.md` existe.
3. **`specforge-agent-tech-lead`** com `{card}` + os dois documentos. **Nunca inclua histórico,
   pendências nem o número da rodada** — cada avaliação é independente.
4. Leia o status em `{ID}-spec-reviewed.md`:
   - `APROVADO` → projeto concluído.
   - `REPROVADO` → anexe ao `histórico` os critérios reprovados e "O que precisa ser corrigido";
     `rodada += 1` e volte ao item 1.

Arquivo esperado não criado numa rodada = reprovação dessa rodada. Após a rodada 5 sem aprovação,
marque o projeto como **não convergiu** (proteção de custo, não política de tentativas).

Todos `APROVADO` → Passo 8. Algum "não convergiu" → Passo 7.

## Passo 7 — Caso raro: revisão técnica não convergiu

Comente no card (menções e idempotência iguais ao Passo 5):

```
## Revisão técnica não convergiu — specforge-analyzer

**Projetos que não atingiram aprovação após 5 rodadas automáticas de correção**
{nomes dos projetos}

**Última pendência registrada, por projeto**

### {nome do projeto}
{critérios reprovados e o que precisava mudar na última rodada — conteúdo completo, sem citar arquivos}

---
O specforge tentou corrigir automaticamente por 5 rodadas (developer → qa → tech-lead) sem
aprovação em todos os critérios — normalmente indica algo que precisa de decisão humana. Revise e
rode /specforge-analyzer {ID} novamente depois do ajuste.
```

Mova para "Triaged / Refinement" como no Passo 5. **Não prossiga para o Passo 8.**

## Passo 8 — Publicar as tasks "spec" e mover para "Ready for Development"

Despache `specforge-agent-coordinator` **uma vez** para todos os projetos:

```
Contexto para esta execução:
- ID do work item: {ID}
- Título: {título}
- Descrição: {demanda}
- Critérios de aceite: {se houver}
- MCP configurado: {linear | azure-devops}
- Modo de publicação: task
- Nome base da task: spec
- Projetos:
  - Diretório: {projeto}/
    Diretório de configuração: {config}/
    Documentos: {projeto}/docs/specs/tmp/{ID}-spec-reviewed.md, {ID}-solution.md, {ID}-test-scenarios.md
  - {um item por projeto}
```

Ele publica uma task `spec - {projeto}` autossuficiente por projeto, sem gravar nada localmente.
Falha em algum projeto não impede mover o card. Depois, mova para o estado/coluna igual a "Ready
for Development" ou, senão, contendo "ready" e "dev" (mesmas regras do Passo 5). Falha ao mover:
informe sem desfazer nada.

## Passo 9 — Relatório final

Antes de tudo, para cada projeto ainda no formato antigo:
`⚠ {projeto} — configuração specforge ainda dentro do repositório. Rode /specforge-update no workspace para migrar para .claude/{pasta}/.`

**Parou no Passo 5:**
```
⚠ Dúvidas identificadas — {ID}: {título}
{N} dúvida(s) publicada(s) como comentário no card.
{Por usuário: "{email} — ✓ menção nativa | ✗ texto (motivo)"}
{Card movido para: Triaged / Refinement | ✗ Card não movido — estados disponíveis: {lista}}
Próximo passo: alguém responde no card e roda /specforge-analyzer {ID} novamente.
```

**Parou no Passo 7:**
```
✗ Revisão técnica não convergiu — {ID}: {título}
Projetos: {projeto — APROVADO em N rodada(s) | NÃO CONVERGIU}
{Resumo da última pendência de cada projeto que não convergiu}
{Comentário publicado/atualizado | ✗ falha}
{Usuários e movimentação do card, como acima}
Próximo passo: revisar manualmente e rodar /specforge-analyzer {ID} novamente.
```

**Concluiu o Passo 8:**
```
✓ Fluxo concluído — {ID}: {título}

| Projeto | Task | Rodadas até aprovar | Status |
|---|---|---|---|
| {projeto} | spec - {projeto} | {N} | ✓ criada/atualizada | ✗ falha |

{Card movido para: Ready for Development | ✗ Card não movido — estados disponíveis: {lista}}
Próximo passo: cada dev roda /specforge-execute-spec {ID} dentro do seu projeto.
```
