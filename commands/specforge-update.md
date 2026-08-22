Percorre todos os projetos vinculados no workspace e re-executa o fluxo do `/specforge-init-project` (modo merge) em cada um — propaga atualizações da skill (novos campos do `CLAUDE.md`, novas convenções de steering) para todos os projetos de uma vez, sem precisar entrar manualmente em cada pasta.

Este comando não recebe argumentos. Rode-o na pasta workspace depois de atualizar o plugin (`claude plugin update specforge@...`), para que os projetos já vinculados herdem o que mudou.

## Passo 1 — Ler os projetos vinculados no workspace

Leia o CLAUDE.md da pasta atual (workspace) e localize a seção `## Projetos vinculados (specforge)`.

**Se o CLAUDE.md não existir, ou a seção não existir, ou a tabela estiver vazia:**
> "Nenhum projeto vinculado neste workspace. Rode `/specforge-add-project <url>` primeiro."

Interrompa a execução.

Caso contrário, monte a lista de projetos vinculados (nome e pasta) a partir da tabela.

## Passo 2 — Atualizar cada projeto

Para **cada projeto** da lista, na ordem em que aparecem na tabela:

1. **Se a pasta do projeto não existir mais** (ex.: apagada manualmente fora do specforge): registre isso como erro para aquele projeto ("pasta não encontrada — remova a linha da tabela em `## Projetos vinculados (specforge)` se o projeto não existe mais") e siga para o próximo — não interrompa o comando inteiro por causa de um projeto ausente.
2. Caso contrário, invoque a skill `specforge` para executar o fluxo do `/specforge-init-project`, informando `{pasta do projeto}/` como o diretório do projeto — o mesmo mecanismo que `/specforge-add-project` já usa ao clonar um projeto novo. Como o projeto já tem `CLAUDE.md` e `.claude/steering/`, isso sempre roda em **modo merge**: detecta a seção gerenciada pelo specforge no `CLAUDE.md`, recalcula os itens atuais (stack, banco de dados, comandos de build/test/lint, etc.) e adiciona só o que estiver faltando ou mudou — nunca reescreve nada que o time tenha escrito em outras seções do `CLAUDE.md`, nem entradas de steering que não estejam em conflito com o código atual.
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
| {nome} | ✗ Erro: {mensagem} |

{Se houver erros:}
⚠ {K} projeto(s) com erro — veja acima. Corrija manualmente (ou remova o projeto da tabela) e rode /specforge-update novamente se necessário.
```
