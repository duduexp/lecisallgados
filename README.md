# Leci Salgados - Catálogo Online

Sistema de catálogo online para pedidos de salgados com área administrativa.

## Funcionalidades

### Área do Cliente
- 🛒 Catálogo de produtos com 3 categorias
- 📦 17 produtos com imagens
- 🛍️ Carrinho de compras
- 📝 Checkout completo
- 📱 Confirmação via WhatsApp

### Área Administrativa
- 🔐 Login protegido (admin / Fernanda10)
- 📊 Gestão de pedidos
- ✏️ CRUD de produtos
- ⚙️ Configurações do sistema

## Tecnologias

- Next.js 16 + TypeScript
- Prisma ORM
- Tailwind CSS + shadcn/ui
- Zustand

## Deploy na Vercel

### 1. Criar banco de dados (Supabase - Gratuito)

1. Acesse: https://supabase.com
2. Crie uma conta e um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a **Connection string** (URI)
5. Substitua `[YOUR-PASSWORD]` pela senha do banco

### 2. Deploy na Vercel

1. Acesse: https://vercel.com
2. Clique em **Add New** → **Project**
3. Importe o repositório `duduexp/lecisallgados`
4. Configure as variáveis de ambiente:

```
DATABASE_URL=postgresql://postgres:[SENHA]@db.[PROJETO].supabase.co:5432/postgres
```

5. Clique em **Deploy**

### 3. Configurar o banco

Após o deploy, execute o seed para criar os produtos:

1. Vá em **Settings** → **Environment Variables** na Vercel
2. Adicione a variável `DATABASE_URL`
3. Vá em **Deployments** → Selecione o deploy
4. Clique em **Functions** → Execute o seed via terminal:

```bash
npx prisma db push
npx prisma db seed
```

Ou use o Vercel CLI:

```bash
vercel env pull .env.local
npx prisma db push
npx prisma db seed
```

## Desenvolvimento Local

```bash
# Instalar dependências
bun install

# Configurar banco de dados
cp .env.example .env
bun run db:push
bun run db:seed

# Iniciar servidor
bun run dev
```

## Credenciais Admin

- **Usuário:** admin
- **Senha:** Fernanda10

## Contato

- 📞 (31) 9.9984-0982
- 📷 @leci.salgados
- 📍 Rua Sete de Setembro, N° 88 - Vale do Amanhecer - Igarapé MG
