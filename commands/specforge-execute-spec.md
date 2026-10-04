---
description: Implementa a spec de um work item na branch specforge/{ID} — testes, coerência, commit, push, changelog, task de QA e card em "In Code Review"
argument-hint: <ID do work item>
---

Implementa as mudanças descritas na spec técnica do work item, no projeto da pasta atual.

ID do work item: $ARGUMENTS

Se nenhum ID for informado, pergunte antes de continuar.

**Ordem fixa e inviolável:** confirmar card → branch → implementar → testes → coerência → commit →
push → changelog → tasks/coluna. Perguntas no console só no Passo 1.0 (card não encontrado), no
Passo 3 (aprovar o plano) e em conflito de spec/regra durante a implementação.

## Passo 1 — Card, configuração e spec

### 1.0 — Confirmar o card (obrigatório, sem exceção)

O MCP do tracker é obrigatório **mesmo com spec local**: sem ele não há como garantir que a
branch `specforge/{ID}` fica vinculada a um card real.
- Sem MCP de tracker: "Nenhum MCP de work tracker configurado. Este comando precisa confirmar que
  o card {ID} existe antes de criar a branch e implementar. Configure o MCP do Azure DevOps ou do
  Linear e tente novamente." e pare sem criar branch.
- Busque `{ID}`. Encontrado: confirme o título e siga.
- Não encontrado: pergunte
  `⚠ O card {ID} não foi encontrado no {tracker}. Informe o ID correto do card (ou "cancelar"):`.
  Novo ID confirmado passa a valer para **tudo** (spec, branch, commit, publicações); "cancelar"
  encerra sem alterar nada.

### 1.1 — Diretório de configuração

Se `../.claude/{nome da pasta atual}/CLAUDE.md` existir, `{config}` = `../.claude/{nome da pasta
atual}/` e `{métricas}` = `../.claude/specforge-metricas.md`; senão `{config}` = `.` e
`{métricas}` = `.claude/specforge-metricas.md` (nunca entra no commit). `CLAUDE.md` e `.claude/steering/` vêm de `{config}`; `docs/`
fica sempre na pasta atual.

**Nome do projeto** (usado em 1.2, 9.3 e 9.4): `**Nome:**` em `## Comandos e projeto (specforge)`
de `{config}/CLAUDE.md`; vazio/TODO → nome da pasta atual.

### 1.2 — Localizar a spec

1. **`docs/specs/{ID}-spec.md` existe** (fluxo /specforge-create-spec): se tiver duas ou mais
   ocorrências de `## Projeto: `, é um documento multi-projeto antigo — diga "Verifique se você
   está na pasta do projeto certo (não no workspace)." e pare. Senão, origem = **arquivo local**.
2. **Senão** (fluxo /specforge-analyzer): procure entre as tasks filhas do card a de título exato
   `spec - {nome do projeto}`.
   - Nenhuma: "Nenhuma spec encontrada para {ID} — nem em `docs/specs/{ID}-spec.md`, nem como task
     `spec - {nome do projeto}`. Rode `/specforge-create-spec {ID}` ou `/specforge-analyzer {ID}`
     primeiro." e pare.
   - Mais de uma: liste os IDs e pergunte qual usar.
   - Uma: a descrição dela é a spec. Origem = **task do tracker** (gravada localmente no commit).

## Passo 2 — Contexto

Da spec: solução proposta, arquivos que serão alterados, critérios de aceite técnicos, riscos e
dependências. De `{config}`: `CLAUDE.md` (convenções e comandos), `.claude/steering/architecture.md`
e `.claude/steering/domain-rules.md`. Leia o estado atual de cada arquivo a alterar; para arquivos
novos, um arquivo similar existente para copiar o padrão.

## Passo 3 — Plano e confirmação

Sinalize antes riscos bloqueantes da spec. Apresente:

```
Plano de implementação — {ID}: {título}
Branch: specforge/{ID} (a partir de {branch atual}; nunca em main/master)

Criar:      + caminho — motivo
Modificar:  ~ caminho — o que muda e por quê
Remover:    - caminho — motivo
Ordem:      1. … 2. …
Testes:     + caminho.test — cobre: …   ~ caminho.test — adiciona: …

Depois, automaticamente: testes (≥ 80% de cobertura) → coerência com as regras de negócio →
commit → push → changelog no card. Nada é commitado se os testes falharem.
```

Pergunte "Posso prosseguir com a implementação? Ou deseja ajustar o plano antes?" e não escreva
código antes do sim. Ajustes: atualize e reapresente.

## Passo 4 — Branch `specforge/{ID}`

Nunca implemente em `main`/`master` nem na branch padrão do remoto (`git remote show origin`).
Já está em `specforge/{ID}` → siga; existe localmente → `git checkout specforge/{ID}`; senão →
`git checkout -b specforge/{ID}`. Se ainda estiver numa branch principal, pare e avise.

## Passo 5 — Implementar

- Siga os padrões existentes (imports, nomes, organização, classes vs. funções); não introduza
  padrões novos.
- Regra de `domain-rules.md` conflitando com a spec, ou decisão da spec que pareça errada:
  aponte e pergunte antes de desviar.
- Crie testes no framework já usado, cobrindo ao menos os critérios de aceite técnicos.
- Fora do escopo da spec: só relate, não corrija.

Daqui em diante tudo roda sem confirmação, na ordem fixa.

## Passo 6 — Testes unitários e cobertura

Rode o comando de teste com cobertura de `{config}/CLAUDE.md` (sem ele: o de teste unitário, e
avise que a cobertura não foi medida). Só unitários — nada de integração/e2e.
**Aprovado:** todos passam **e** cobertura total ≥ 80% → `{N} testes passaram, cobertura {X}%`.
**Reprovado:** registre a métrica (Passo 10.1) e pare **sem commit**:

```
✗ Testes não aprovados — implementação não commitada
Falharam: ✗ {arquivo} — {teste}: {motivo}
Cobertura insuficiente: {arquivo} — {X}% (mínimo 80%)
As mudanças ficam em specforge/{ID} (não commitadas). Corrija e rode /specforge-execute-spec {ID}.
```

## Passo 7 — Coerência com as regras de negócio

Compare a implementação com `domain-rules.md` e com os critérios de aceite da spec (regra
contrariada, critério não atendido, validação de domínio ausente).
- Nada encontrado: `✓ Nenhuma inconsistência entre regras de negócio e implementação.` → Passo 8.
- Encontrado: liste `⚠ {arquivo}: {inconsistência}`, corrija **só** essas inconsistências e
  rode de novo os testes do Passo 6. Passou → Passo 8. Falhou → saída do Passo 6 (indicando que
  falhou após a correção), registre a métrica (Passo 10.1) e pare, sem nova tentativa.

## Passo 8 — Commit e push

Confirme que está em `specforge/{ID}`.
1. Origem = task do tracker: grave a descrição da task em `docs/specs/{ID}-spec.md`.
2. Stage dos arquivos implementados/corrigidos (e da spec, se gravada agora) e commit com
   exatamente `feat({ID}): {título do work item} — specforge-execute-spec`.
3. `git push -u origin specforge/{ID}`. Sucesso: guarde o hash. Falha: registre a métrica (Passo 10.1) e pare com
   ```
   ✗ Push falhou — commit feito localmente em specforge/{ID}, mas não enviado
   Motivo: {erro do git}
   Resolva, rode git push -u origin specforge/{ID} e poste docs/changelogs/{ID}.md no card {ID} manualmente.
   ```

## Passo 9 — Changelog, evidências e tracker

Falhas de MCP neste passo são registradas no relatório e **nunca interrompem**. Todo comentário
recebe o **arquivo completo** (nunca uma seção). Idempotência: comentário com o mesmo cabeçalho
ou task com o mesmo título → atualize; senão, crie.

### 9.1 — `docs/changelogs/{ID}.md` (template fixo, nesta ordem)

**Nunca invente dado de reprodução:** todo exemplo vem dos testes reais desta implementação, com
os mesmos valores. Critério sem teste automatizado é marcado como tal.

```markdown
# {ID} — {título do work item}

**Data:** {hoje}
**Tipo:** feat / fix / refactor / chore
**Work item:** {referência}
**Commit:** {hash} (branch `specforge/{ID}`)

### O que foi implementado
{3-6 frases simples: o que mudou para quem usa o sistema}

## O que mudou
- {mudança}

## Arquivos alterados
| Arquivo | Alteração |
|---|---|
| `caminho` | criado / modificado / removido |

## Testes
- Testes executados: {N} (todos passaram)
- Cobertura obtida: {X}%
- Inconsistências de regras de negócio corrigidas: {nenhuma / lista}

## Critérios de aceite
- [x] {critério}
- [ ] {critério} — requer validação manual

### Evidências por critério de aceite
{Um bloco por item de "Casos obrigatórios a cobrir" da spec (ou, na falta, "Critérios de aceite técnicos"):}

#### {critério em linguagem simples}
- **O que foi testado:** {dado/quando/então em 1-2 frases simples}
- **Como reproduzir:** {passos numerados com valores reais do teste — API: método, rota, JSON de
  entrada e resposta (status + JSON); job/fila: gatilho e resultado/log esperado; procedure:
  chamada com parâmetros e resultado; biblioteca: chamada e retorno}
- **Resultado:** ✓ Coberto por teste automatizado (`arquivo.test`, caso "{nome}") | ⚠ Sem teste automatizado — validação manual do QA

{Se o relatório de cobertura detalhar por arquivo: arquivos desta implementação abaixo de 100%.}
```

### 9.2 — Comentário no card

`## Changelog e evidências de aceite — specforge-execute-spec`, `**Commit:** {hash} (branch
`specforge/{ID}`)` e o arquivo completo. Falhou: avise que o conteúdo está em
`docs/changelogs/{ID}.md` para colar manualmente.

### 9.3 — Task de spec (só se a origem foi a task do tracker)

Mesmo comentário na task `spec - {nome do projeto}`; depois mude o estado dela para o equivalente
a concluído (igual, ou contendo "done", "closed", "concluíd", "complet", "fechad"). Sem estado
correspondente: registre com a lista disponível.

### 9.4 — Task `qa - {nome do projeto}` (sempre)

Existe: atualize a descrição com o arquivo completo **sem mudar o estado**. Não existe: crie como
filha do card, no estado padrão/pendente. Este comando **nunca** a conclui.

### 9.5 — Card para "In Code Review" (sem alterar o status)

- **azure-devops:** altere só `System.BoardColumn` (nunca `System.State`) para a coluna igual a
  "In Code Review" ou, senão, contendo "code review"/"revisão de código".
- **linear:** coluna = workflow state; mova para o equivalente e avise no relatório que o estado
  mudou porque o Linear não separa coluna de status.
- Sem coluna correspondente: registre com a lista disponível.

## Passo 10 — Steering

Em `{config}/.claude/steering/`, acrescente ao fim da seção correspondente, no formato existente
(uma linha por entrada, `**NOME**: descrição`), só o que esta implementação ensinou:
- `architecture.md`: padrão adotado, decisão arquitetural ou componente/integração nova;
- `domain-rules.md`: regra de negócio nova, refinada ou conceito de domínio novo.

**Armadilhas conhecidas:** se a spec errou em algo que a implementação revelou — arquivo, símbolo
ou rota citado que não existia, regra de negócio contrariada (Passo 7), teste que falhou por
premissa errada da spec, desvio necessário do plano — acrescente em `architecture.md`, na seção
`## Armadilhas conhecidas (specforge)` (crie no fim do arquivo se faltar), uma linha por item:
`- **{tema}**: {o que a spec supôs} → {o que é verdade no projeto} ({ID})`. Os próximos
developers leem essa seção como restrição. Não repita item já registrado.

Nada relevante: "Nenhuma atualização necessária nos arquivos de steering."

## Passo 10.1 — Métricas

Acrescente uma linha em `{métricas}` (se não existir, crie com o cabeçalho
`| Data | Comando | ID | Projeto | Resultado | Rodadas | Critérios reprovados | Observação |` e a
linha separadora): comando `execute-spec`, resultado `implementado | testes reprovados | push
falhou`, rodadas `—`, e na observação: testes na 1ª execução (passaram/falharam), inconsistências
corrigidas (N), desvios do plano (N) e armadilhas registradas (N).

## Passo 11 — Relatório

Só se nada interrompeu antes (senão, apenas a mensagem da interrupção):

```
✓ Implementação concluída — {ID}: {título}
Branch: specforge/{ID} (enviada; main/master intocada)
Spec: {arquivo local | task "spec - {projeto}" — gravada em docs/specs/{ID}-spec.md no commit}

Arquivos: + criado · ~ modificado — {resumo} · + teste — {N} casos
Testes: ✓ {N} unitários, 100% passaram, cobertura {X}% · {✓ sem inconsistências | ✓ {K} corrigidas}
Commit: ✓ {hash} — feat({ID}): {título} — specforge-execute-spec
Critérios de aceite: [x] … / [ ] … — requer validação manual

Tracker:
  {✓ | ✗} changelog no card {ID}
  {se task: ✓ | ✗ comentário na task spec; ✓ concluída | ✗ estados disponíveis: {lista}}
  {✓ task "qa - {projeto}" criada/atualizada, pendente | ✗ falha}
  {✓ card em "In Code Review" (status inalterado) | ⚠ via mudança de estado (Linear) | ✗ colunas disponíveis: {lista}}
Steering: architecture.md {atualizado: … | sem mudanças} · domain-rules.md {idem} · {N} armadilha(s) registrada(s)

Próximos passos: git diff main...specforge/{ID} e abra o PR de specforge/{ID} referenciando {ID}.
```
