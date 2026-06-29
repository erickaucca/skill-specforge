# Spec Storage Migration: .claude/specs → docs/spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mover o armazenamento de specs de `.claude/specs/{ID}.md` para `docs/specs/{ID}-spec.md`, criando um comando de migração para projetos existentes.

**Architecture:** Todos os arquivos do projeto são Markdown — não há código compilável nem testes automatizados. As "verificações" de cada task usam `grep` para confirmar que os padrões antigos foram eliminados e os novos estão presentes. Há três camadas a atualizar: os comandos que geram/executam specs, o template de CLAUDE.md injetado em projetos-alvo, e o SKILL.md que documenta a skill.

**Tech Stack:** Markdown, shell grep para verificação.

## Global Constraints

- Novo caminho: `docs/specs/{ID}-spec.md` (sufixo `-spec` no nome do arquivo)
- Caminho antigo: `.claude/specs/{ID}.md`
- O caminho `docs/specs/` é fixo — não configurável
- Nenhuma alteração no conteúdo ou formato das specs, apenas nos caminhos
- Não migrar outros arquivos de `.claude/` além de specs

---

### Task 1: Atualizar specforge-create-spec.md

**Files:**
- Modify: `assets/commands/specforge-create-spec.md`

**Occurrências a mudar (6 linhas):**

| Linha | Antes | Depois |
|-------|-------|--------|
| 152 | `.claude/specs/{ID}.md` (no prompt de confirmação) | `docs/specs/{ID}-spec.md` |
| 157 | `salve em \`.claude/specs/{ID}.md\`` | `salve em \`docs/specs/{ID}-spec.md\`` |
| 205 | `A spec foi salva localmente em .claude/specs/{ID}.md.` | `A spec foi salva localmente em docs/specs/{ID}-spec.md.` |
| 207 | `copie o conteúdo de .claude/specs/{ID}.md` | `copie o conteúdo de docs/specs/{ID}-spec.md` |
| 219 | `✓ Spec salva em .claude/specs/{ID}.md` | `✓ Spec salva em docs/specs/{ID}-spec.md` |
| 232 | `✓ Spec salva em .claude/specs/{ID}.md` | `✓ Spec salva em docs/specs/{ID}-spec.md` |

- [ ] **Step 1: Verificar que o padrão antigo existe (pre-check)**

```bash
grep -n '\.claude/specs/' assets/commands/specforge-create-spec.md
```
Esperado: 6 linhas com o padrão antigo.

- [ ] **Step 2: Aplicar as 6 substituições**

Editar `assets/commands/specforge-create-spec.md`. Cada bloco a substituir:

**Bloco 1 — prompt de confirmação (linha 152):**
```
# antes
> "Spec gerada para {ID}. Deseja salvar em `.claude/specs/{ID}.md`?

# depois
> "Spec gerada para {ID}. Deseja salvar em `docs/specs/{ID}-spec.md`?
```

**Bloco 2 — instrução de salvar (linha 157):**
```
# antes
Após confirmação, salve em `.claude/specs/{ID}.md` (crie o diretório se não existir) e prossiga para o Passo 6.

# depois
Após confirmação, salve em `docs/specs/{ID}-spec.md` (crie o diretório se não existir) e prossiga para o Passo 6.
```

**Blocos 3–4 — mensagem de erro no posting (linhas 205 e 207):**
```
# antes
A spec foi salva localmente em .claude/specs/{ID}.md.

Para publicar manualmente, copie o conteúdo de .claude/specs/{ID}.md

# depois
A spec foi salva localmente em docs/specs/{ID}-spec.md.

Para publicar manualmente, copie o conteúdo de docs/specs/{ID}-spec.md
```

**Bloco 5 — relatório de sucesso (linha 219):**
```
# antes
✓ Spec salva em .claude/specs/{ID}.md

# depois
✓ Spec salva em docs/specs/{ID}-spec.md
```

**Bloco 6 — relatório de falha (linha 232):**
```
# antes
✓ Spec salva em .claude/specs/{ID}.md
✗ Falha ao atualizar o card {ID} — veja instruções acima para envio manual.

# depois
✓ Spec salva em docs/specs/{ID}-spec.md
✗ Falha ao atualizar o card {ID} — veja instruções acima para envio manual.
```

- [ ] **Step 3: Verificar que o padrão antigo foi eliminado**

```bash
grep -n '\.claude/specs/' assets/commands/specforge-create-spec.md
```
Esperado: sem resultados.

```bash
grep -c 'docs/specs/{ID}-spec\.md' assets/commands/specforge-create-spec.md
```
Esperado: `6`

- [ ] **Step 4: Commit**

```bash
git add assets/commands/specforge-create-spec.md
git commit -m "feat: move spec storage from .claude/specs/ to docs/specs/ in create-spec command"
```

---

### Task 2: Atualizar specforge-execute-spec.md

**Files:**
- Modify: `assets/commands/specforge-execute-spec.md`

**Occurrências a mudar (3 linhas):**

| Linha | Antes | Depois |
|-------|-------|--------|
| 9 | `.claude/specs/{ID}.md` (Passo 1 — verificar existência) | `docs/specs/{ID}-spec.md` |
| 18 | `.claude/specs/{ID}.md` (Passo 2 — leitura) | `docs/specs/{ID}-spec.md` |
| 43 | `.claude/specs/{ID}.md` (Passo 9 — relatório final, via SKILL.md context) | `docs/specs/{ID}-spec.md` |

- [ ] **Step 1: Pre-check**

```bash
grep -n '\.claude/specs/' assets/commands/specforge-execute-spec.md
```
Esperado: 3 linhas.

- [ ] **Step 2: Aplicar substituições**

**Passo 1 do comando — verificar existência (linha 9):**
```
# antes
Verifique se o arquivo `.claude/specs/{ID}.md` existe.

# depois
Verifique se o arquivo `docs/specs/{ID}-spec.md` existe.
```

**Passo 1 — mensagem de erro (linha 12, texto adjacente):**
```
# antes
> "Spec não encontrada para {ID}. Rode `/specforge-create-spec {ID}` primeiro para gerar a especificação técnica."

# depois — sem alteração, o texto não inclui o caminho
```
*(Esta linha não menciona o caminho — não muda.)*

**Passo 2 — leitura (linha 18):**
```
# antes
Leia `.claude/specs/{ID}.md` integralmente.

# depois
Leia `docs/specs/{ID}-spec.md` integralmente.
```

**Passo 9 — relatório final (linha 43):**
```
# antes
  + .claude/specs/{ID}.md → não aparece no relatório final do execute-spec
```
*(Confirmar lendo as linhas 40–50 antes de editar — o relatório lista changelogs e steering, não o path da spec.)*

Leia as linhas 40–50 de `specforge-execute-spec.md` para confirmar antes de editar.

- [ ] **Step 3: Verificar**

```bash
grep -n '\.claude/specs/' assets/commands/specforge-execute-spec.md
```
Esperado: sem resultados.

```bash
grep -n 'docs/specs/{ID}-spec' assets/commands/specforge-execute-spec.md
```
Esperado: 2 linhas (Passo 1 e Passo 2).

- [ ] **Step 4: Commit**

```bash
git add assets/commands/specforge-execute-spec.md
git commit -m "feat: update spec path to docs/specs/ in execute-spec command"
```

---

### Task 3: Atualizar specforge-init-project.md

**Files:**
- Modify: `assets/commands/specforge-init-project.md`

**Occurrências a mudar (4 linhas):**

| Linha | Seção | Antes | Depois |
|-------|-------|-------|--------|
| 89 | Passo 5 — lista de diretórios | `.claude/specs/` | `docs/specs/` |
| 106 | Passo 6 modo completo — arquivos criados | `  .claude/specs/` | `  docs/specs/` |
| 127 | Passo 6 modo steering — arquivos criados | `  .claude/specs/` | `  docs/specs/` |
| 147 | Passo 6 modo mínimo — arquivos criados | `  .claude/specs/` | `  docs/specs/` |

- [ ] **Step 1: Pre-check**

```bash
grep -n '\.claude/specs' assets/commands/specforge-init-project.md
```
Esperado: 4 linhas.

- [ ] **Step 2: Substituição em Passo 5 (linha 89)**

```
# antes
- `.claude/specs/` — onde as specs técnicas serão salvas

# depois
- `docs/specs/` — onde as specs técnicas serão salvas
```

- [ ] **Step 3: Substituição nos três relatórios do Passo 6 (linhas 106, 127, 147)**

Cada ocorrência é idêntica: `  .claude/specs/` (com dois espaços de indentação).

```
# antes (linha 106)
  .claude/specs/

# depois
  docs/specs/
```

Repita para linhas 127 e 147.

- [ ] **Step 4: Verificar**

```bash
grep -n '\.claude/specs' assets/commands/specforge-init-project.md
```
Esperado: sem resultados.

```bash
grep -n 'docs/spec' assets/commands/specforge-init-project.md
```
Esperado: 4 linhas.

- [ ] **Step 5: Commit**

```bash
git add assets/commands/specforge-init-project.md
git commit -m "feat: update init-project to create docs/specs/ instead of .claude/specs/"
```

---

### Task 4: Atualizar CLAUDE.template.md e SKILL.md

**Files:**
- Modify: `assets/templates/CLAUDE.template.md`
- Modify: `SKILL.md`

**CLAUDE.template.md** — 2 ocorrências:

| Linha | Antes | Depois |
|-------|-------|--------|
| 56 | `implementa o que está em \`.claude/specs/{ID}.md\`` | `implementa o que está em \`docs/specs/{ID}-spec.md\`` |
| 58 | `Specs geradas ficam em \`.claude/specs/\`` | `Specs geradas ficam em \`docs/specs/\`` |

**SKILL.md** — 3 ocorrências:

| Linha | Seção | Antes | Depois |
|-------|-------|-------|--------|
| 21 | init-project passo 4 | `\`.claude/specs/\` e \`docs/changelogs/\`` | `\`docs/specs/\` e \`docs/changelogs/\`` |
| 33 | create-spec passo 4 | `\`.claude/specs/{ID}.md\`` | `\`docs/specs/{ID}-spec.md\`` |
| 43 | execute-spec passo 1 | `\`.claude/specs/{ID}.md\`` | `\`docs/specs/{ID}-spec.md\`` |

- [ ] **Step 1: Pre-check**

```bash
grep -n '\.claude/specs' assets/templates/CLAUDE.template.md SKILL.md
```
Esperado: 5 linhas (2 no template + 3 no SKILL.md).

- [ ] **Step 2: Editar CLAUDE.template.md (linhas 56 e 58)**

```
# antes (linha 56)
- `/specforge-execute-spec [ID]` — implementa o que está em `.claude/specs/{ID}.md`

# depois
- `/specforge-execute-spec [ID]` — implementa o que está em `docs/specs/{ID}-spec.md`
```

```
# antes (linha 58)
Specs geradas ficam em `.claude/specs/` — commite junto com o código da implementação.

# depois
Specs geradas ficam em `docs/specs/` — commite junto com o código da implementação.
```

- [ ] **Step 3: Editar SKILL.md (linhas 21, 33, 43)**

```
# antes (linha 21)
4. Cria os diretórios `.claude/specs/` e `docs/changelogs/`

# depois
4. Cria os diretórios `docs/specs/` e `docs/changelogs/`
```

```
# antes (linha 33)
4. Salva a spec em `.claude/specs/{ID}.md` após confirmação do dev

# depois
4. Salva a spec em `docs/specs/{ID}-spec.md` após confirmação do dev
```

```
# antes (linha 43)
1. Lê `.claude/specs/{ID}.md`

# depois
1. Lê `docs/specs/{ID}-spec.md`
```

- [ ] **Step 4: Verificar**

```bash
grep -n '\.claude/specs' assets/templates/CLAUDE.template.md SKILL.md
```
Esperado: sem resultados.

```bash
grep -c 'docs/spec' assets/templates/CLAUDE.template.md SKILL.md
```
Esperado: `assets/templates/CLAUDE.template.md:2` e `SKILL.md:3`.

- [ ] **Step 5: Commit**

```bash
git add assets/templates/CLAUDE.template.md SKILL.md
git commit -m "feat: update path references to docs/specs/ in template and SKILL.md"
```

---

### Task 5: Criar specforge-migrate-specs.md

**Files:**
- Create: `assets/commands/specforge-migrate-specs.md`
- Modify: `SKILL.md` (adicionar seção do novo comando)
- Modify: `assets/templates/CLAUDE.template.md` (mencionar o comando de migração)

Este é o comando de migração para projetos que já usam a versão anterior do specforge.

- [ ] **Step 1: Criar o arquivo do comando**

Criar `assets/commands/specforge-migrate-specs.md` com o conteúdo abaixo:

```markdown
Migra specs técnicas de `.claude/specs/` para `docs/specs/`.

Execute este comando uma vez por projeto para migrar specs geradas por versões
anteriores do specforge. Operação idempotente — pode ser executada mais de uma
vez sem duplicar arquivos ou gerar erros.

## Passo 1 — Verificar se há specs para migrar

Verifique se o diretório `.claude/specs/` existe e contém arquivos `.md`:

- **Se `.claude/specs/` não existe ou está vazio:** Exiba "Nenhuma spec encontrada em `.claude/specs/` — nada a migrar." e encerre.
- **Se `.claude/specs/` existe e tem arquivos `.md`:** Liste os arquivos encontrados e prossiga.

## Passo 2 — Criar o diretório de destino

Se `docs/specs/` não existir, crie o diretório.

## Passo 3 — Mover os arquivos

Para cada arquivo `{ID}.md` encontrado em `.claude/specs/`:

1. Verifique se `docs/specs/{ID}-spec.md` já existe:
   - **Se já existe:** Pule este arquivo e registre: `↷ {ID}-spec.md — já existe em docs/specs/, ignorado`
   - **Se não existe:** Copie o conteúdo de `.claude/specs/{ID}.md` para `docs/specs/{ID}-spec.md` e registre: `✓ {ID}.md → docs/specs/{ID}-spec.md`

## Passo 4 — Verificar integridade

Após processar todos os arquivos, para cada arquivo efetivamente copiado (não ignorado):

1. Confirme que `docs/specs/{ID}-spec.md` existe e tem conteúdo
2. **Se algum arquivo falhar:** Interrompa. Não prossiga para o Passo 5 até que o erro seja resolvido. Informe:
   > "Falha ao verificar `docs/specs/{ID}-spec.md`. Verifique permissões e espaço em disco antes de continuar."

## Passo 5 — Remover `.claude/specs/`

Somente após confirmar a integridade de todos os arquivos:

1. Delete cada arquivo `.md` de `.claude/specs/`
2. Delete o diretório `.claude/specs/` (se vazio após a remoção dos arquivos)

Se `.claude/specs/` contiver arquivos que não são `.md` (improvável, mas possível), preserve o diretório e informe o dev sobre os arquivos não migrados.

## Passo 6 — Verificar coerência das specs migradas

Para cada spec em `docs/specs/`, verifique se as decisões técnicas e domínios referenciados ainda estão alinhados com o estado atual do projeto:

1. Leia `.claude/steering/domain-rules.md` e `.claude/steering/architecture.md` (se existirem)
2. Leia `CLAUDE.md` (se existir)
3. Para cada spec em `docs/specs/`, identifique:
   - Conceitos de domínio ou regras de negócio mencionados
   - Componentes, módulos ou padrões arquiteturais citados
4. Compare com os arquivos lidos:
   - **Alinhado:** conceito/componente existe ou é consistente com os steering files atuais
   - **Divergente:** conceito/componente não encontrado, renomeado ou contraditório com o estado atual

Se não existirem steering files, pule esta etapa e registre: "Steering files ausentes — coerência não verificada."

## Passo 7 — Relatório final

**Quando houve migração:**

```
✓ Migração concluída

Arquivos processados:
  ✓ {ID}.md → docs/specs/{ID}-spec.md
  ↷ {ID2}-spec.md — já existia em docs/specs/, ignorado

Removidos:
  ✗ .claude/specs/ (diretório removido)

Coerência das specs:
  ✓ {ID}-spec.md — alinhado com steering atual
  ⚠ {ID2}-spec.md — "{conceito X}" não encontrado nos steering files atuais

Próximos passos:
  1. Revise os alertas de coerência (se houver) e atualize as specs divergentes
  2. Commite as mudanças: git add docs/specs/ && git rm -r .claude/specs/
```

**Quando nada foi migrado (todas as specs já estavam em docs/specs/):**

```
✓ Nenhuma ação necessária — specs já estão em docs/specs/
```

**Quando `.claude/specs/` não existia:**

```
✓ Nenhuma spec encontrada em .claude/specs/ — nada a migrar.
```
```

- [ ] **Step 2: Adicionar a seção do novo comando em SKILL.md**

Adicionar ao final de SKILL.md, antes de `## Dependências de MCP`:

```markdown
### /specforge-migrate-specs

Migra specs de `.claude/specs/` para `docs/specs/` para projetos que usavam a versão anterior:

1. Detecta arquivos `.md` em `.claude/specs/`
2. Copia cada `{ID}.md` para `docs/specs/{ID}-spec.md` (pula se já existir)
3. Remove `.claude/specs/` após confirmar integridade de todos os arquivos
4. Verifica coerência das specs migradas com os steering files atuais

Execute uma vez por projeto ao atualizar o specforge para esta versão.
```

- [ ] **Step 3: Mencionar o comando de migração no CLAUDE.template.md**

Adicionar linha após a lista de comandos no CLAUDE.template.md (após a linha do `/specforge-execute-spec`):

```markdown
# antes
- `/specforge-execute-spec [ID]` — implementa o que está em `docs/specs/{ID}-spec.md`

# depois
- `/specforge-execute-spec [ID]` — implementa o que está em `docs/specs/{ID}-spec.md`
- `/specforge-migrate-specs` — migra specs antigas de `.claude/specs/` para `docs/specs/` (execute uma vez se atualizou o specforge)
```

- [ ] **Step 4: Verificar o arquivo criado**

```bash
# Confirma que o arquivo existe
ls assets/commands/specforge-migrate-specs.md

# Confirma a presença das seções obrigatórias
grep -c '## Passo' assets/commands/specforge-migrate-specs.md
```
Esperado: `7` (Passos 1–7).

```bash
# Confirma que SKILL.md agora tem 4 seções de comando
grep -c '### /' SKILL.md
```
Esperado: `4`.

- [ ] **Step 5: Commit**

```bash
git add assets/commands/specforge-migrate-specs.md SKILL.md assets/templates/CLAUDE.template.md
git commit -m "feat: add specforge-migrate-specs command for .claude/specs → docs/spec migration"
```

---

## Self-Review

### Spec coverage

| Cenário | Task que cobre |
|---------|---------------|
| Cenário 1: nova spec salva em `docs/specs/{ID}-spec.md` | Tasks 1, 2, 3, 4 |
| Cenário 2: migração de `.claude/specs/` para `docs/specs/` | Task 5 (Passos 1–5 e 7) |
| Cenário 3: coerência após migração | Task 5 (Passo 6) |
| Cenário 4: pasta `docs/specs/` criada automaticamente | Task 1 (Passo 2 do create-spec já instrui criar o dir) + Task 5 (Passo 2) |
| Nenhum arquivo criado em `.claude/` (Cenário 1) | Tasks 1–4 (`.claude/specs/` removido de todas as instruções de escrita) |
| Remoção de `.claude/specs/` só após confirmação (restrição) | Task 5 (Passos 4–5) |
| Operação idempotente (restrição) | Task 5 (Passo 3 — skip se já existe) |
| DoD: sem regressão no fluxo atual | Tasks 1–4 (substituição cirúrgica de path, sem alterar lógica) |

### Gaps identificados

- **execute-spec linha 43**: grep nos testes da Task 2 assumiu que a linha 43 tem `.claude/specs/` — confirmar lendo o arquivo antes de editar (indicado no Step 2 da Task 2).
- **CLAUDE.template.md Step 3 da Task 5**: a linha adicionada para `/specforge-migrate-specs` precisa manter indentação consistente com as linhas vizinhas.

### Placeholder scan

Nenhum "TBD", "TODO" ou "fill in details" detectado.
