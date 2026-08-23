# skill-specforge

Plugin de Claude Code que transforma work items do Azure DevOps ou Linear em specs técnicas e implementações de código.

## O que faz

- Clona e vincula projetos a um workspace a partir da URL do Git
- Lê um card (work item) pelo ID, avalia se há informação suficiente — inclusive consultando o banco de dados do projeto, somente leitura, quando disponível — e, se não houver, devolve as dúvidas para o card
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

`/specforge-add-project`, `/specforge-add-user`, `/specforge-update`, `/specforge-analyzer`,
`/specforge-analyzer-all`, `/specforge-create-spec`, `/specforge-execute-spec` e os 4 sub-agentes
já ficam disponíveis imediatamente após instalar, em qualquer projeto — nada é copiado para
dentro do repositório.

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

### 3. Manter os projetos vinculados atualizados (quando o plugin for atualizado)

Sempre que o plugin for atualizado (`claude plugin update specforge@...`), rode na pasta workspace:

```
/specforge-update
```

Percorre todos os projetos da tabela `## Projetos vinculados (specforge)` e re-executa o fluxo
do `/specforge-init-project` em cada um (sempre em modo merge — só adiciona o que estiver
faltando ou mudou, nunca reescreve o que o time já escreveu). É como novidades da skill (por
exemplo, o campo "Banco de dados" adicionado recentemente) chegam aos projetos que já estavam
vinculados antes da atualização, sem precisar entrar manualmente em cada pasta.

### 4. Triar um card e gerar a spec

De dentro do workspace:

```
/specforge-analyzer 1234
```

Lê o card 1234 (descrição, comentários e anexos), identifica **todos** os projetos vinculados que
são afetados — pode ser um só ou vários ao mesmo tempo — e avalia se há informação suficiente
para gerar a spec com segurança. Se o card já teve uma rodada anterior de dúvidas, as respostas
dadas nos comentários entram na análise com prioridade sobre a descrição original.

**Roda do início ao fim sem nenhuma pergunta no console.** Tudo que precisa de decisão humana —
falta de informação, ambiguidade sobre qual projeto é afetado — vira comentário no card, nunca
uma pergunta esperando resposta na tela.

Se um projeto tiver um banco de dados declarado no seu `CLAUDE.md` (campo preenchido pelo
`/specforge-init-project`) e um MCP correspondente estiver disponível na sessão, o analyzer — e
os sub-agentes `agent-developer`/`agent-qa` na hora de gerar a spec — podem consultá-lo para
reduzir dúvidas que a documentação sozinha não resolveria. O acesso é **sempre somente leitura**:
nunca insere, altera ou apaga nada, mas pode consultar qualquer estrutura ou dado que o acesso
permitir. Sem MCP de banco configurado, isso é pulado silenciosamente — nunca interrompe o fluxo.

Se `.claude/steering/architecture.md` do projeto tiver a seção "Requisitos técnicos obrigatórios
por tipo de mudança" (gerada pelo `/specforge-init-project`, com um requisito concreto por
critério — escalabilidade, observabilidade, cobertura, segurança — para cada categoria de mudança:
API, job assíncrono, procedure de banco, biblioteca interna), a spec já é desenhada em
conformidade com o requisito da categoria certa, e a revisão de qualidade avalia contra esse
requisito específico em vez de um checklist genérico — evitando reprovar, por exemplo, uma
procedure de banco por não ter healthcheck de API.

- **Com dúvidas de negócio:** comenta no card, em linguagem simples (o público é analista de negócio/produto, não desenvolvedor), quatro blocos — o que entendemos do pedido, o que está sendo pedido para entregar, projetos que o pedido impacta e as dúvidas em aberto — referenciando os usuários registrados via `/specforge-add-user`, se houver, e move o card para **Triaged / Refinement**. Nenhuma spec é gerada nessa execução.
- **Sem dúvidas:** gera e revisa a spec de cada projeto afetado, um ciclo por projeto: `agent-developer` propõe, `agent-qa` gera os testes, `agent-tech-lead` revisa contra os 4 critérios. **Se o tech-lead reprovar, isso nunca vira comentário no card** — o motivo da reprovação volta como contexto extra para o `agent-developer`/`agent-qa` refazerem a solução, numa nova rodada de revisão, repetindo até aprovar (ou até uma proteção operacional de 10 rodadas, para não deixar a execução rodando indefinidamente se os agentes ficarem oscilando entre dois problemas — caso raro, não uma política de tentativas). O `agent-tech-lead` nunca recebe o histórico de rodadas anteriores: cada avaliação dele é independente, para não reprovar de novo por inércia nem aprovar por complacência.
- **No caso raro de a proteção de 10 rodadas ser atingida** em algum projeto: comenta no card a última pendência registrada e move para **Triaged / Refinement** (mesmo destino das dúvidas de negócio) — sinal de que provavelmente precisa de uma decisão humana.
- **Com todos os projetos aprovados:** cria (ou atualiza) **uma task por projeto** no card — título `spec - {nome do projeto}`, cada uma com a spec completa e autossuficiente daquele projeto (solução técnica, plano de testes e critérios de aceite, sem referenciar arquivos do repositório, pastas temporárias ou anexos externos) — e move o card para **Ready for Development**. **Nenhum arquivo é gravado localmente nesta etapa** — uma task por projeto (em vez de uma só consolidando tudo) é o que permite devs diferentes pegarem projetos diferentes do mesmo card e rodarem `/specforge-execute-spec` em paralelo, sem depender de ninguém commitar um arquivo antes: é o próprio `/specforge-execute-spec`, rodado depois de dentro de cada projeto, que busca o conteúdo direto da task correspondente no tracker e só então grava a cópia local, junto do commit da implementação. Ao contrário do `/specforge-create-spec`, não cria tasks adicionais de desenvolvimento/teste no tracker: cada task de spec já é completa por si só.

Para triar a fila da coluna **Backlog**:

```
/specforge-analyzer-all
```

Roda o mesmo fluxo do `/specforge-analyzer` para até **3 cards** do Backlog por execução (limite
fixo, mesmo com fila maior — rode de novo para continuar).

Alternativamente, sem passar pela triagem, dentro da pasta de um projeto já vinculado:

```
/specforge-create-spec 1234
```
Busca o work item 1234, analisa os arquivos relevantes do projeto e salva a spec em `docs/specs/1234-spec.md`, publicando-a como comentário no card.

### 5. Implementar a spec

Rode de dentro do projeto (nunca da pasta workspace):

```
/specforge-execute-spec 1234
```
Antes de tudo, confirma via MCP que o card 1234 existe de verdade no tracker configurado — se não encontrar, pergunta no console qual ID correto usar (ou cancela); sem essa confirmação não cria branch nem implementa nada, então o MCP passa a ser obrigatório mesmo para specs geradas localmente pelo `/specforge-create-spec`. Depois busca a spec em `docs/specs/1234-spec.md` se o arquivo já existir localmente; senão, busca pela task `spec - {nome do projeto}` no card 1234 (fluxo do `/specforge-analyzer`, modo `task` — nesse caso o arquivo local só é gravado depois, junto do commit, nunca antes). Apresenta um plano de implementação (incluindo a branch que vai usar) e aguarda confirmação. **Nunca implementa direto em `main`/`master`**: cria (ou reutiliza) a branch `specforge/1234` a partir da branch atual antes de tocar em qualquer arquivo. Em seguida executa as mudanças, roda testes unitários, verifica coerência com as regras de negócio, commita (incluindo a spec, se veio da task) e faz push **dessa branch** (`specforge/1234`) para o remoto. Grava um único arquivo local, `docs/changelogs/1234.md`, sempre no mesmo template, com duas seções: o **changelog** técnico e as **evidências de aceite** (em linguagem simples para o QA — resumo do que foi entregue, evidência e passo a passo de reprodução por critério de aceite com dados reais dos testes, e a cobertura obtida). Publica as duas seções separadamente: o changelog como comentário no card de origem, e as evidências na mesma task de spec (ou no card, se a spec veio do fluxo `/specforge-create-spec`). Abrir o PR de `specforge/1234` para a branch principal continua manual. Se um card afetou mais de um projeto, rode este comando separadamente dentro de cada um — cada projeto tem sua própria task de spec, então devs diferentes podem rodar isso em paralelo em projetos diferentes do mesmo card.

## Como funciona

Ao rodar `/specforge-add-project`, o Claude clona o repositório, inicializa a estrutura `.claude/` dele e registra no CLAUDE.md do workspace o nome, pasta, stack, propósito, URL e branch do projeto.

Ao rodar `/specforge-analyzer`, o Claude conecta ao MCP configurado, lê o card por completo (incluindo comentários e anexos) e compara com a estrutura de todos os projetos vinculados no workspace para decidir se pode gerar a spec com segurança — se não puder, devolve as perguntas para o card (referenciando os usuários registrados via `/specforge-add-user`) em vez de arriscar uma spec incompleta. Nunca pergunta nada no console. `/specforge-analyzer-all` repete esse fluxo para até 3 cards da coluna Backlog por execução.

Ao rodar `/specforge-create-spec`, o Claude conecta ao MCP configurado (Linear ou Azure DevOps), extrai título, descrição e critérios de aceite do work item, localiza os arquivos do projeto que serão afetados e produz uma spec técnica. A spec fica em `docs/specs/` e deve ser commitada junto com o código.

Ao rodar `/specforge-execute-spec`, o Claude busca a spec (local, se já existir, ou na task correspondente do tracker) e os arquivos de steering (arquitetura e regras de domínio), apresenta um plano com os arquivos que serão criados ou modificados e só executa após confirmação. Depois de implementar, o fluxo roda automaticamente: testes unitários com gate de cobertura ≥ 80%, verificação de coerência entre regras de negócio e implementação (com correção e reteste se necessário), commit padronizado (gravando a spec localmente também, se ela veio da task), push, publicação do changelog (técnico) e das evidências de aceite (para o QA, com passo a passo de reprodução por critério baseado nos testes reais). Nenhum commit ocorre se os testes falharem.

O workflow do GitHub Actions (`claude.yml`) permite acionar o Claude diretamente em issues e PRs mencionando `@claude` em um comentário.

## Como contribuir

Abra uma issue descrevendo o que quer mudar. Você pode mencionar `@claude` no comentário para que o Claude gere a spec e abra um PR automaticamente. Contribuições via PR são bem-vindas.

## Licença

MIT
