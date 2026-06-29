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
