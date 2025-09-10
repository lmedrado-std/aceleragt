# Firebase Studio

Este é um aplicativo Next.js criado no Firebase Studio.

Para começar, dê uma olhada em `src/app/page.tsx`.

## Configuração do Ambiente

### Variáveis de Ambiente

Para rodar este projeto corretamente, você precisa configurar as variáveis de ambiente.

**1. Desenvolvimento Local:**

-   Crie um arquivo chamado `.env.local` na raiz do projeto.
-   Adicione a sua string de conexão do banco de dados (PostgreSQL local ou uma branch de desenvolvimento do Neon) neste arquivo:

    ```
    DATABASE_URL="postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO"
    ```

    O arquivo `.env.local` é ignorado pelo Git, então suas credenciais estarão seguras.

**2. Produção:**

-   No painel do seu serviço de hospedagem (ex: Vercel, Firebase App Hosting), vá para as configurações do projeto.
-   Encontre a seção "Environment Variables" (Variáveis de Ambiente).
-   Adicione a variável `DATABASE_URL` com a string de conexão do seu banco de dados Neon de produção.

## Como Publicar e Usar

Para publicar seu aplicativo e começar a usá-lo online, o processo geralmente envolve dois passos principais: compilar o projeto para produção e, em seguida, implantá-lo em um serviço de hospedagem como o Firebase App Hosting.

### 1. Compilar o Projeto (Build)

Antes de publicar, você precisa criar uma versão otimizada do seu aplicativo. Você pode fazer isso executando o seguinte comando no terminal do seu projeto:

```bash
npm run build
```

Este comando criará uma pasta `build` ou `.next` com todos os arquivos estáticos e otimizados prontos para serem publicados.

### 2. Publicar no Firebase (Deploy)

Com o projeto já configurado para o Firebase App Hosting, você pode publicá-lo usando a Firebase CLI (Command Line Interface).

Se você ainda não tem a CLI instalada, pode instalá-la com o comando:

```bash
npm install -g firebase-tools
```

Depois de instalar e fazer login na sua conta Google (`firebase login`), navegue até a pasta do seu projeto no terminal e execute o comando para publicar:

```bash
firebase deploy
```

Após a conclusão, o terminal mostrará a URL onde seu aplicativo está publicado e acessível para todos!
# aceleracatu
# aceleracatu
# aceleracatu
