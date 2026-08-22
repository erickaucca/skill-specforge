Clona um repositório para dentro do workspace atual, registra a referência no CLAUDE.md da pasta principal e inicializa a estrutura `.claude/` do projeto clonado.

URL do repositório Git: $ARGUMENTS

Se nenhuma URL for informada, pergunte ao dev antes de continuar.

## Passo 1 — Determinar o nome do projeto

Extraia o nome do projeto a partir do último segmento do caminho da URL, sem a extensão `.git`.
Exemplo: `https://github.com/empresa/pedidos-api.git` → `pedidos-api`.

Se já existir uma pasta com esse nome na pasta atual (a pasta principal / workspace), informe o dev e pergunte se deseja usar outro nome ou cancelar a operação. Não sobrescreva uma pasta existente sem confirmação explícita.

## Passo 2 — Clonar o repositório

Clone o repositório para dentro de uma pasta com o nome do projeto, na pasta atual:

```bash
git clone --branch main <url> <nome-do-projeto>
```

Se a branch `main` não existir, tente `master`:

```bash
git clone --branch master <url> <nome-do-projeto>
```

Se nenhuma das duas existir, clone a branch padrão do repositório remoto (`git clone <url> <nome-do-projeto>`, sem `--branch`) e informe ao dev qual branch foi usada.

Se o clone falhar (URL inválida, sem acesso, repositório vazio, etc.), informe o erro retornado pelo Git e interrompa a execução — não crie nem edite o CLAUDE.md da pasta principal nesse caso.

## Passo 3 — Inicializar a estrutura do projeto clonado

Invoque a skill `specforge` para executar o fluxo do `/specforge-init-project`, informando `<nome-do-projeto>/` como o diretório do projeto. Todos os arquivos que esse fluxo lê ou escreve (`CLAUDE.md`, `.claude/steering/architecture.md`, `.claude/steering/domain-rules.md`, `docs/specs/`, `docs/specs/tmp/`, `docs/changelogs/`) são relativos a `<nome-do-projeto>/`.

Aguarde a conclusão do fluxo antes de prosseguir — o Passo 4 usa o que foi detectado aqui (stack) para registrar o projeto no workspace.

## Passo 4 — Registrar o projeto no CLAUDE.md da pasta principal

Este é o CLAUDE.md da pasta atual (workspace) — não confundir com o CLAUDE.md gerado dentro de `<nome-do-projeto>/` no Passo 3.

Antes de registrar, colete:
- **Stack:** leia `<nome-do-projeto>/CLAUDE.md`, seção `## Comandos e projeto (specforge)`, campo `**Stack:**` (gerado no Passo 3). Resuma em poucas palavras (ex.: `Node 20 + React`, `Java 17/Spring`).
- **Para que serve:** leia `<nome-do-projeto>/README.md` (primeiro parágrafo com conteúdo) ou, se não houver README útil, o campo `description` de `package.json`/`pom.xml`. Resuma em **uma frase curta**, em linguagem simples (o que o sistema faz, não como ele é construído). Se nada puder ser inferido, use `<!-- TODO: preencher -->`.

**Se o CLAUDE.md da pasta principal não existir:** crie um novo com o conteúdo mínimo:

```markdown
# CLAUDE.md

Workspace specforge — projetos vinculados via `/specforge-add-project`.

## Projetos vinculados (specforge)

> Seção gerenciada por `/specforge-add-project` — atualizada automaticamente a cada execução.
> Não edite manualmente; para remover um projeto, apague a pasta e a linha correspondente.
>
> Para entender a fundo um projeto abaixo (arquitetura, regras de negócio, convenções de código)
> antes de tomar qualquer decisão técnica sobre ele, leia `{pasta}/CLAUDE.md`,
> `{pasta}/.claude/steering/architecture.md` e `{pasta}/.claude/steering/domain-rules.md`.

| Projeto | Pasta | Stack | Para que serve | Repositório | Branch | Adicionado em |
|---|---|---|---|---|---|---|
| {nome-do-projeto} | `{nome-do-projeto}/` | {stack} | {para que serve} | {url} | {branch usada} | {data de hoje, AAAA-MM-DD} |
```

**Se o CLAUDE.md da pasta principal já existir:**

1. Procure a seção com o cabeçalho exato `## Projetos vinculados (specforge)`.
2. **Se a seção existir:**
   - Se a tabela ainda estiver no formato antigo (sem as colunas `Stack` e `Para que serve`), adicione essas duas colunas à tabela — preenchendo `<!-- TODO: preencher -->` nas linhas já existentes que não puderem ser recalculadas agora — sem remover nenhuma linha existente.
   - Verifique se já existe uma linha da tabela com a mesma pasta (`{nome-do-projeto}/`). Se existir, atualize essa linha (stack, propósito, repositório, branch e data). Se não existir, adicione uma nova linha ao final da tabela.
   - Se a nota sobre ler `{pasta}/.claude/steering/...` (bloco `>` acima da tabela) não existir, acrescente-a ao final do bloco de citação já existente, sem remover o que já está lá.
3. **Se a seção não existir:** acrescente-a ao final do arquivo, com o cabeçalho, a nota e a tabela exatos do bloco acima, contendo a linha do projeto recém-clonado.
4. Nunca edite, mova ou remova qualquer outra seção ou conteúdo já escrito no CLAUDE.md da pasta principal — o merge só adiciona ou atualiza dentro da seção do specforge.

## Passo 5 — Confirmar o que foi feito

Exiba o relatório final:

```
✓ Projeto adicionado — {nome-do-projeto}

Repositório: {url} (branch: {branch usada})
Clonado em: ./{nome-do-projeto}/

CLAUDE.md da pasta principal: {criado | atualizado} com a referência do projeto.

Estrutura .claude/ do projeto:
{resumo retornado pelo fluxo /specforge-init-project no Passo 3}

CLAUDE.md do workspace agora traz: stack, propósito, repositório, branch e pasta deste projeto.

Próximos passos:
  1. Configure o MCP do Azure DevOps ou Linear, se ainda não configurado.
  2. Use /specforge-analyzer [ID] para triar um card e gerar a spec automaticamente, ou
     rode /specforge-create-spec [ID] de dentro de ./{nome-do-projeto}/ para gerar a spec manualmente.
```
