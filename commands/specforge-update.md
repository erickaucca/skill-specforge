Percorre todos os projetos vinculados no workspace e re-executa o fluxo completo do `/specforge-init-project` em cada um — na prática quase sempre em modo merge (os projetos vinculados normalmente já têm `CLAUDE.md`/steering, gerados quando foram adicionados via `/specforge-add-project`), mas também cobre o caso raro de um projeto na tabela sem nenhuma configuração ainda (o próprio `/specforge-init-project` detecta isso e cria a estrutura do zero, como faria pra um projeto novo) — propaga atualizações da skill (novos campos do `CLAUDE.md`, novas convenções de steering) para todos os projetos de uma vez, sem precisar entrar manualmente em cada pasta.

Este comando não recebe argumentos. Rode-o na pasta workspace depois de atualizar o plugin (`claude plugin update specforge@...`), para que os projetos já vinculados herdem o que mudou.

## Passo 1 — Ler os projetos vinculados no workspace

Leia o CLAUDE.md da pasta atual (workspace) e localize a seção `## Projetos vinculados (specforge)`.

**Se o CLAUDE.md não existir, ou a seção não existir, ou a tabela estiver vazia:**
> "Nenhum projeto vinculado neste workspace. Rode `/specforge-add-project <url>` primeiro."

Interrompa a execução.

Caso contrário, monte a lista de projetos vinculados (nome e pasta) a partir da tabela.

## Passo 2 — Atualizar cada projeto

Para **cada projeto** da lista, na ordem em que aparecem na tabela:

1. **Se a pasta do projeto não existir mais** (ex.: apagada manualmente fora do specforge): registre isso como erro para aquele projeto ("pasta não encontrada — remova a linha da tabela em `## Projetos vinculados (specforge)` e apague `.claude/{pasta sem a barra}/` se o projeto não existe mais, para não deixar configuração órfã que poderia ser reaproveitada por engano se o nome for reutilizado depois") e siga para o próximo — não interrompa o comando inteiro por causa de um projeto ausente.
2. Caso contrário, invoque a skill `specforge` para executar o fluxo **completo** do `/specforge-init-project` (não apenas a variante de merge) — o próprio init-project determina o modo certo (completo, steering ou merge) sozinho a partir do que encontrar, exatamente como faria com um projeto novo. Informe **os mesmos dois diretórios que `/specforge-add-project` já usa**: diretório do projeto = `{pasta do projeto}/` (código, `docs/specs/`, `docs/changelogs/`) e diretório de configuração = `.claude/{pasta do projeto sem a barra}/`.

   Três cenários possíveis, todos tratados pelo próprio fluxo do init-project sem intervenção adicional deste comando:
   - **Caso comum — configuração já existe no novo local:** `CLAUDE.md`/`.claude/steering/` já estão em `.claude/{pasta do projeto sem a barra}/` (gravados quando o projeto foi adicionado via `/specforge-add-project`). Roda em modo merge: detecta a seção gerenciada pelo specforge no `CLAUDE.md`, recalcula os itens atuais (stack, banco de dados, comandos de build/test/lint, etc.) e adiciona só o que estiver faltando ou mudou — nunca reescreve nada que o time tenha escrito em outras seções do `CLAUDE.md`, nem entradas de steering que não estejam em conflito com o código atual.
   - **Exceção — projeto vinculado antes desta mudança de versão:** se `.claude/{pasta do projeto sem a barra}/CLAUDE.md` não existir mas `{pasta do projeto}/CLAUDE.md` existir (gerado dentro do próprio projeto por uma execução anterior, de antes da configuração passar a morar fora do repositório), trate esse `{pasta do projeto}/CLAUDE.md` e o `.claude/steering/` correspondente como a base do merge desta vez, e grave o resultado já no novo local (`.claude/{pasta do projeto sem a barra}/`) — não apague os arquivos antigos de dentro do projeto automaticamente (podem estar commitados); apenas sinalize no relatório final que a configuração deste projeto migrou de local e que os arquivos antigos podem ser removidos manualmente do repositório do projeto depois de confirmado que o novo local está correto.
   - **Caso raro — nenhuma configuração em lugar nenhum:** se nem `.claude/{pasta do projeto sem a barra}/CLAUDE.md` nem `{pasta do projeto}/CLAUDE.md` existirem (ex.: a linha da tabela foi adicionada manualmente sem passar por `/specforge-add-project`, ou os arquivos foram apagados depois), o init-project detecta "Modo completo" sozinho e gera `CLAUDE.md`/`.claude/steering/` do zero no diretório de configuração — o mesmo resultado que `/specforge-add-project` produziria para um projeto novo. Sinalize esse caso como "criado" (não "atualizado") no relatório final.
3. Registre o resumo retornado pelo fluxo (o que foi criado, atualizado ou já estava em dia) para o relatório final.

Não há limite de quantos projetos são processados numa única execução — ao contrário do `/specforge-analyzer-all`, cada projeto aqui é só análise de arquivos locais do repositório, não uma chamada de LLM cara por card do tracker.

## Passo 3 — Relatório final

Exiba um resumo por projeto e o total:

```
✓ /specforge-update concluído

{N} projeto(s) processado(s):

| Projeto | Resultado |
|---|---|
| {nome} | ✓ Atualizado — {resumo curto, ex.: "campo Banco de dados adicionado; 2 regras de steering novas"} |
| {nome} | ✓ Sem alterações — já estava em dia |
| {nome} | ✓ Criado do zero — projeto não tinha nenhuma configuração specforge; `CLAUDE.md`/steering gerados agora em `.claude/{pasta}/` |
| {nome} | ⚠ Migrado — configuração movida de dentro do projeto para `.claude/{pasta}/`; remova manualmente `CLAUDE.md`/`.claude/steering/` antigos de dentro do repositório do projeto quando confirmar que o novo local está correto |
| {nome} | ✗ Erro: {mensagem} |

{Se houver erros:}
⚠ {K} projeto(s) com erro — veja acima. Corrija manualmente (ou remova o projeto da tabela) e rode /specforge-update novamente se necessário.
```
