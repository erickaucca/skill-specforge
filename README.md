# skill-specforge

Plugin de Claude Code que transforma work items do Azure DevOps ou Linear em specs técnicas e implementações de código.

## O que faz

- Clona e vincula projetos a um workspace a partir da URL do Git
- Lê um card (work item) pelo ID, avalia se há informação suficiente e, se não houver, devolve as dúvidas para o card
- Gera uma especificação técnica estruturada (contexto, solução, arquivos afetados, critérios de aceite)
- Implementa o código descrito na spec respeitando os padrões e regras de domínio do projeto
- Gera (ou mescla, se já existirem) `CLAUDE.md` e os arquivos de steering do projeto-alvo com dados reais

## Pré-requisitos

- [Claude Code](https://claude.ai/code) instalado
- MCP do **Linear** (`linear`) ou **Azure DevOps** (`azure-devops`) configurado na sessão

## Instalação

```bash
claude plugin marketplace add erickaucca/skill-specforge
claude plugin install specforge@erickaucca/skill-specforge
```

`/specforge-add-project`, `/specforge-add-user`, `/specforge-analyzer`, `/specforge-analyzer-all`,
`/specforge-create-spec`, `/specforge-execute-spec` e os 4 sub-agentes já ficam disponíveis
imediatamente após instalar, em qualquer projeto — nada é copiado para dentro do repositório.

## Fluxo de trabalho

### 1. Criar o workspace e vincular projetos

Numa pasta vazia (o workspace), rode para cada repositório que quiser vincular:

```
/specforge-add-project https://github.com/empresa/pedidos-api.git
```

Esse comando clona a branch `main`/`master` do repositório numa subpasta com o nome do projeto,
inicializa a estrutura `.claude/` do projeto clonado — equivalente a rodar
`/specforge-init-project` dentro dele: detecta a stack, gera (ou mescla) os arquivos de steering
com dados reais e o `CLAUDE.md` do projeto — e registra a referência na seção
`## Projetos vinculados (specforge)` do `CLAUDE.md` do workspace: nome, pasta, stack, um resumo
de "para que serve" o projeto, URL do git, branch e data. Essa seção também traz uma instrução
fixa lembrando de ler o `CLAUDE.md` e o `.claude/steering/` de um projeto sempre que for preciso
entendê-lo a fundo.

### 2. Registrar quem responde dúvidas (opcional)

```
/specforge-add-user maria@empresa.com, joao@empresa.com
```

Registra os emails na seção `## Usuários para dúvidas (specforge)` do CLAUDE.md do workspace.
São os usuários do Azure DevOps ou Linear referenciados pelo `/specforge-analyzer` quando comenta
dúvidas num card, para que sejam notificados e possam respondê-las.

### 3. Triar um card e gerar a spec

De dentro do workspace:

```
/specforge-analyzer 1234
```

Lê o card 1234 (descrição, comentários e anexos), identifica qual projeto vinculado é afetado e
avalia se há informação suficiente para gerar a spec com segurança. Se o card já teve uma rodada
anterior de dúvidas, as respostas dadas nos comentários entram na análise com prioridade sobre a
descrição original.

- **Com dúvidas:** comenta no card, em linguagem simples (o público é analista de negócio/produto, não desenvolvedor), quatro blocos — o que entendemos do pedido, o que está sendo pedido para entregar, projetos que o pedido impacta e as dúvidas em aberto — referenciando os usuários registrados via `/specforge-add-user`, se houver, e move o card para **Triaged / Refinement**. Nenhuma spec é gerada nessa execução.
- **Sem dúvidas:** gera a spec, cria uma task **"spec"** no card com o conteúdo gerado — sempre autossuficiente, sem referenciar arquivos do repositório, pastas temporárias ou anexos externos, para que qualquer colaborador consiga executar a partir só do que está na task — cria também as mesmas tasks de desenvolvimento e teste que o `/specforge-create-spec` cria no tracker, e move o card para **Ready for Development**.

Suporta apenas um projeto vinculado por card nesta versão — se o `/specforge-analyzer` não conseguir identificar um único projeto com confiança, ele pergunta qual usar.

Para triar todos os cards da coluna **Backlog** de uma vez:

```
/specforge-analyzer-all
```

Roda o mesmo fluxo do `/specforge-analyzer` para cada card do Backlog, em sequência, até
processar toda a fila lida no início da execução.

Alternativamente, sem passar pela triagem, dentro da pasta de um projeto já vinculado:

```
/specforge-create-spec 1234
```
Busca o work item 1234, analisa os arquivos relevantes do projeto e salva a spec em `docs/specs/1234-spec.md`, publicando-a como comentário no card.

### 4. Implementar a spec

```
/specforge-execute-spec 1234
```
Lê a spec, apresenta um plano de implementação, aguarda confirmação e executa as mudanças. Em seguida roda testes unitários, verifica coerência com as regras de negócio, commita, faz push e publica o changelog no card de origem.

## Como funciona

Ao rodar `/specforge-add-project`, o Claude clona o repositório, inicializa a estrutura `.claude/` dele e registra no CLAUDE.md do workspace o nome, pasta, stack, propósito, URL e branch do projeto.

Ao rodar `/specforge-analyzer`, o Claude conecta ao MCP configurado, lê o card por completo (incluindo comentários e anexos) e compara com a estrutura dos projetos vinculados no workspace para decidir se pode gerar a spec com segurança — se não puder, devolve as perguntas para o card (referenciando os usuários registrados via `/specforge-add-user`) em vez de arriscar uma spec incompleta. `/specforge-analyzer-all` repete esse fluxo para cada card da coluna Backlog, em sequência.

Ao rodar `/specforge-create-spec`, o Claude conecta ao MCP configurado (Linear ou Azure DevOps), extrai título, descrição e critérios de aceite do work item, localiza os arquivos do projeto que serão afetados e produz uma spec técnica. A spec fica em `docs/specs/` e deve ser commitada junto com o código.

Ao rodar `/specforge-execute-spec`, o Claude lê essa spec e os arquivos de steering (arquitetura e regras de domínio), apresenta um plano com os arquivos que serão criados ou modificados e só executa após confirmação. Depois de implementar, o fluxo roda automaticamente: testes unitários com gate de cobertura ≥ 80%, verificação de coerência entre regras de negócio e implementação (com correção e reteste se necessário), commit padronizado, push e publicação do changelog como comentário no card de origem. Nenhum commit ocorre se os testes falharem.

O workflow do GitHub Actions (`claude.yml`) permite acionar o Claude diretamente em issues e PRs mencionando `@claude` em um comentário.

## Como contribuir

Abra uma issue descrevendo o que quer mudar. Você pode mencionar `@claude` no comentário para que o Claude gere a spec e abra um PR automaticamente. Contribuições via PR são bem-vindas.

## Licença

MIT
