# Nexo — Software sob medida

Site institucional de uma agência de desenvolvimento de software, com apresentação de serviços, processo comercial, perguntas frequentes e formulário de contato com armazenamento persistente.

[Site publicado](https://nexo-software-studio.leonardo-lima31732.chatgpt.site) — o acesso atual é privado e depende das permissões do Sites.

## Recursos

- Layout responsivo, navegação móvel e atalhos para o formulário.
- Identidade visual escura com acentos em verde e imagem original da marca.
- Formulário com validação no cliente e no servidor, estados de envio e confirmação.
- Armazenamento dos contatos no Cloudflare D1 por meio do binding `DB`.
- Identificador de solicitação para evitar duplicatas ao repetir um envio.
- Limite de tamanho do corpo, verificação de origem e campo honeypot.
- Envio alternativo por HTML quando JavaScript está desativado.
- Metadados de SEO, canonical, sitemap e robots.txt.

## Tecnologias

| Parte | Implementação |
| --- | --- |
| Interface | HTML, CSS e JavaScript sem framework |
| Servidor de produção | Cloudflare Worker com módulos ESM |
| Dados | Cloudflare D1; esquema e migrações com Drizzle |
| Build | Node.js; incorpora os arquivos públicos ao Worker |
| Desenvolvimento local | Node.js 24 com SQLite local |
| Testes | `node:test`, `node:assert` e SQLite em memória |
| Integração contínua | GitHub Actions |

## Executar localmente

Requisitos: Git, Node.js 24 e npm. A versão do Node está definida em `.nvmrc`.

Após clonar o repositório, entre na pasta do projeto e execute:

```bash
nvm use
npm ci
npm run dev
```

Abra `http://127.0.0.1:3000`. O comando de desenvolvimento constrói o projeto antes de iniciar. Reinicie o servidor após editar arquivos; não há hot reload.

O formulário local grava em `.local/nexo.sqlite`, ignorado pelo Git. Esse banco é independente dos contatos de produção. Para usar outra porta no macOS/Linux:

```bash
PORT=3001 npm run dev
```

Nenhuma credencial de produção é necessária para desenvolvimento ou CI.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Construir e iniciar o site local com SQLite |
| `npm run check` | Verificar a sintaxe dos arquivos JavaScript |
| `npm test` | Testar validação, persistência, duplicatas e respostas de erro |
| `npm run build` | Gerar Worker, arquivos incorporados e migrações em `dist/` |
| `npm run check:build` | Validar as rotas e os arquivos do Worker compilado; requer build |
| `npm run db:generate` | Gerar migrações após editar o esquema |

Para reproduzir as verificações da CI:

```bash
npm ci
npm run check
npm test
npm run build
npm run check:build
```

Os testes executam as migrações reais em SQLite e adaptam a interface de prepared statements do D1. Não acessam dados de produção nem substituem a verificação do ambiente hospedado.

## Estrutura

| Caminho | Conteúdo |
| --- | --- |
| `public/` | HTML, CSS, JavaScript, imagem, sitemap e robots.txt |
| `worker/index.js` | Rotas HTTP e entrega dos arquivos públicos |
| `worker/contact.js` | Validação e gravação dos contatos |
| `db/schema.ts` | Esquema de dados |
| `drizzle/` | Migrações SQL e metadados versionados |
| `scripts/` | Build, desenvolvimento e verificações |
| `tests/` | Testes automatizados do formulário |
| `.github/workflows/ci.yml` | Pipeline de validação, testes e build |
| `.github/dependabot.yml` | Atualizações semanais de npm e GitHub Actions |
| `.openai/hosting.json` | Identidade do Site e bindings lógicos de produção |
| `dist/` | Saída gerada, ignorada pelo Git |

## GitHub Actions

O workflow **CI** executa em pushes para `main`, pull requests destinados a `main` e acionamento manual pela aba **Actions**.

Etapas: checkout, Node.js 24, instalação com `npm ci`, validação de sintaxe, testes, build e verificação do Worker compilado. Em pushes e execuções manuais, disponibiliza o artefato `nexo-build-<commit>` por 14 dias. O artefato inclui os metadados de hospedagem e as migrações necessários ao pacote.

O workflow usa apenas permissão de leitura do conteúdo, não persiste credenciais no checkout e não requer secrets. O Dependabot propõe atualizações; não há merge automático.

Este pipeline valida e empacota. Ele **não publica automaticamente** no endereço do Site. Não contém credenciais, chamadas privadas simuladas ou uma etapa de deploy incompleta.

Referências das actions utilizadas: [checkout](https://github.com/actions/checkout), [setup-node](https://github.com/actions/setup-node) e [upload-artifact](https://github.com/actions/upload-artifact).

## Formulário e dados

`POST /api/contact` aceita JSON ou `application/x-www-form-urlencoded`. Os campos obrigatórios são `name`, `email` e `message`; a mensagem precisa ter entre 20 e 4.000 caracteres. `company` e `interest` são opcionais.

As solicitações ficam na tabela `contact_requests`: identificador, nome, e-mail, empresa, interesse, mensagem e data de criação. O endpoint não expõe uma listagem pública de contatos. A confirmação é emitida somente após a gravação.

**Não há notificação por e-mail, integração com CRM ou painel administrativo implementados.** Os registros de produção podem ser consultados pelas ferramentas autorizadas de banco de dados do Sites. Uma integração de notificações pode ser adicionada posteriormente com credenciais do provedor escolhido.

## Banco de dados

Edite `db/schema.ts` e execute:

```bash
npm run db:generate
```

Revise o SQL gerado e versione `drizzle/`, incluindo seus metadados. Não reescreva migrações já aplicadas. O servidor local aplica novas migrações em seu próprio SQLite; o Sites aplica as migrações de produção durante a publicação.

## Build e publicação

A hospedagem atual é gerenciada pelo Sites. O arquivo `.openai/hosting.json` preserva a identidade do projeto existente e declara `DB`; ele não contém tokens nem dados de contatos. O build gera `dist/server/index.js`, `dist/server/contact.js` e `dist/.openai/`.

Para atualizar o site hospedado, use o fluxo autorizado do Sites: construir, salvar a versão do código, empacotar e publicar. Um push neste repositório do GitHub, por si só, não atualiza o Site.

O projeto completo não funciona no GitHub Pages, porque o formulário precisa de um Worker e de um banco D1. Hospedar apenas `public/` exibe a interface, mas não fornece `/api/contact`.

Ao alterar o domínio ou reutilizar o projeto para outra agência, atualize a marca, os links canonical/Open Graph, `sitemap.xml` e `robots.txt`. O SEO está preparado no código; indexação pública depende do acesso público e da publicação no domínio final.

## Arquivos que não devem entrar no Git

`.env`, `.env.*`, `.dev.vars*`, `.local/`, `.wrangler/`, dependências, logs e saídas geradas são ignorados. Não adicione tokens, contatos reais ou cópias do banco de produção ao repositório.

## Licença

Nenhuma licença de distribuição foi definida. A publicação do código no GitHub não atribui automaticamente uma licença de código aberto.
