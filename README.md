# 📦 Armazém Express

> **Sistema de Gestão de Armazém (WMS) moderno para PMEs portuguesas**

PAP de **Guilherme Silva** (nº 2223243) · Digital Escola Profissional · Técnico de Gestão e Programação de Sistemas Informáticos · 2025/2026

> ⚡ **Só queres correr o projeto depressa?** Consulta o [GUIA_RAPIDO.md](./GUIA_RAPIDO.md)

---

## ✨ O que é

O **Armazém Express** é uma aplicação web completa que permite a pequenas e médias empresas gerirem o seu armazém de forma moderna, substituindo folhas de Excel e gestão no papel. Oferece:

- 🏢 **Modelo SaaS multi-tenant** — cada empresa tem os seus dados isolados
- 💳 **3 planos de subscrição** (Starter, Business, Enterprise) com diferentes limites
- 📊 **Dashboard em tempo real** com gráficos e alertas
- 📦 **Gestão de stock** completa (adicionar, remover, ajustar, consultar)
- 🚚 **Expedição de encomendas** com validação PT e rastreio
- 📱 **QR Scanner** via câmara do telemóvel
- 👥 **Gestão de equipa** (admin + funcionários)
- 🌓 **Modo escuro/claro**, 100% responsivo
- 🎨 **Design premium** com animações Framer Motion

---

## 🛠️ Stack Tecnológica

### Backend
- **Node.js** + **Express** 4.x (ES Modules)
- **SQLite** com `better-sqlite3` (rápido, síncrono)
- **JWT** (autenticação) + **bcryptjs** (passwords)
- **Morgan** (logging)

### Frontend
- **React 18** + **Vite 5**
- **Tailwind CSS 3** (com dark mode e tema personalizado)
- **Framer Motion 11** (animações)
- **React Router 6**
- **Axios** + **React Hot Toast**
- **Recharts** (gráficos)
- **Lucide React** (ícones)
- **BarcodeDetector API** nativa (leitura de QR)

---

## 🚀 Como executar (passo-a-passo)

### Pré-requisitos

Antes de começar, precisas de ter instalado:

1. **Node.js 18 ou superior** — descarrega em [nodejs.org](https://nodejs.org/) (escolhe a versão LTS)
2. **Um editor de código** — recomenda-se o [VS Code](https://code.visualstudio.com/)
3. **Um terminal** — o que vem com o VS Code (Ctrl + \` para abrir) ou o terminal do teu sistema operativo

Para confirmar que o Node está instalado, abre o terminal e escreve:
```bash
node --version
```
Deves ver algo como `v20.x.x`. Se aparecer erro, reinstala o Node.js.

### Opcional: instalar pnpm (recomendado)

O projeto funciona com **npm** (que vem automaticamente com o Node) ou **pnpm** (mais rápido). Para instalar pnpm, abre o terminal e corre **uma única vez** no teu computador:

```bash
npm install -g pnpm
```

> **Se não quiseres instalar pnpm**, sem problemas — em todos os comandos seguintes, substitui `pnpm` por `npm run` (ex: `pnpm dev` → `npm run dev`). A única exceção é `pnpm install` que fica `npm install` (sem o `run`).

---

### 1️⃣ Extrair o projeto e abrir no VS Code

1. Extrai o `.zip` para uma pasta à tua escolha (ex: `Documentos/PAP/`)
2. Abre o VS Code
3. Menu `File` → `Open Folder` → seleciona a pasta `armazem-express`
4. Dentro do VS Code, abre o terminal integrado: `Ctrl + \`` (ou menu `Terminal` → `New Terminal`)

---

### 2️⃣ Arrancar o Backend (primeiro terminal)

No terminal do VS Code, **entra na pasta do backend** e corre os comandos:

```bash
cd backend
```

**Instalar as dependências** (só precisas de fazer isto uma vez, demora 30-60 segundos):
```bash
pnpm install
```

**Criar a base de dados com dados de demonstração** (só fazes isto na primeira vez):
```bash
pnpm seed
```
Vais ver mensagens como:
```
✓ Planos criados
✓ Empresa demo criada
✓ Utilizadores criados
✓ 15 produtos criados
✓ 5 encomendas criadas
✓ Base de dados inicializada com sucesso
```

**Arrancar o servidor:**
```bash
pnpm start
```

Se tudo correr bem, vês um banner ASCII e a mensagem:
```
🚀 Servidor a correr em http://localhost:4000
```

✅ **Deixa este terminal aberto.** O servidor tem de estar sempre a correr enquanto usas a aplicação.

---

### 3️⃣ Arrancar o Frontend (segundo terminal — novo!)

Abre **outro terminal** dentro do VS Code sem fechar o primeiro. Podes fazer isso clicando no `+` no canto superior direito do terminal, ou com `Ctrl + Shift + \``.

No novo terminal:

```bash
cd frontend
```

**Instalar as dependências** (também só uma vez, demora 1-2 minutos):
```bash
pnpm install
```

**Arrancar a aplicação:**
```bash
pnpm dev
```

Vês algo como:
```
  VITE v5.4.8  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.xxx:5173/
  ➜  press h + enter to show help
```

---

### 4️⃣ Configurar Stripe (pagamentos em modo de teste)

Os pagamentos das subscrições usam **Stripe em modo de teste** — não move dinheiro real, mas o fluxo é o mesmo de produção. Esta secção é opcional: se só quiseres usar a app com as credenciais demo, podes saltar para o passo 5️⃣. **Sem Stripe, novas subscrições e mudanças de plano não funcionam.**

#### A) Criar conta Stripe e produtos

1. Cria conta gratuita em **[dashboard.stripe.com/register](https://dashboard.stripe.com/register)** (não precisas de validar negócio nem dar IBAN para test mode)
2. Confirma que estás em **Test mode** (toggle no topo do dashboard, geralmente cor laranja)
3. Vai a **Product catalog → + Add product** e cria 3 produtos:

   | Nome | Valor | Período | Moeda |
   |---|---|---|---|
   | Starter | 19.99 | Mensal (Recorrente) | EUR |
   | Business | 49.99 | Mensal (Recorrente) | EUR |
   | Enterprise | 99.99 | Mensal (Recorrente) | EUR |

4. Em cada produto criado, copia o **Price ID** (formato `price_1...`) — está dentro do produto, na secção "Pricing"
5. Em **Developers → API keys**, copia a **Secret key** (formato `sk_test_...`)

#### B) Preencher o `.env`

Abre `backend/.env` e cola os valores nas linhas correspondentes:

```env
FRONTEND_URL=http://localhost:5173

STRIPE_SECRET_KEY=sk_test_...        # cola aqui a tua secret key
STRIPE_WEBHOOK_SECRET=               # deixa vazio por agora — preenchido no passo D)

STRIPE_PRICE_STARTER=price_1...      # Price ID do plano Starter
STRIPE_PRICE_BUSINESS=price_1...     # Price ID do plano Business
STRIPE_PRICE_ENTERPRISE=price_1...   # Price ID do plano Enterprise
```

> ⚠️ A `STRIPE_SECRET_KEY` é secreta — **nunca** a partilhes no GitHub, Discord, etc. O `.env` já está no `.gitignore`.

#### C) Instalar Stripe CLI (uma vez só)

A Stripe CLI é necessária para receber webhooks no teu computador (eventos como "pagamento confirmado").

**Windows:**
1. Descarrega `stripe_X.Y.Z_windows_x86_64.zip` em [github.com/stripe/stripe-cli/releases](https://github.com/stripe/stripe-cli/releases)
2. Extrai o `stripe.exe` para `C:\stripe\`
3. Adiciona `C:\stripe` ao **PATH**:
   - Tecla Windows → "variáveis de ambiente" → "Editar as variáveis de ambiente do sistema" → "Variáveis de Ambiente…"
   - Em "Variáveis do utilizador", seleciona `Path` → Editar → Novo → cola `C:\stripe` → OK
4. Fecha **todos** os terminais abertos e abre um novo. Confirma com:
   ```bash
   stripe --version
   ```

**Mac:** `brew install stripe/stripe-cli/stripe` · **Linux:** ver instruções no link acima.

#### D) Login na Stripe CLI

Faz isto **uma vez** (e novamente a cada **90 dias**, quando o token expira):

```bash
stripe login
```

Pressiona Enter, autoriza no browser (botão "Allow access") e volta ao terminal. Pronto.

#### E) Arrancar o webhook listener

**Sempre que arrancares o projeto**, abre um terminal dedicado ao webhook (deixa-o a correr em paralelo com o backend e frontend):

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

Ao arrancar, mostra:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

**Na primeira vez** que correres este comando, copia o `whsec_...` e cola no `.env` em `STRIPE_WEBHOOK_SECRET=`. Grava o ficheiro e **reinicia o backend** (Ctrl+C no terminal do backend e `pnpm start` outra vez).

> 💡 O `whsec_` é estável **por máquina/conta** — nas próximas vezes que correres `stripe listen`, vai mostrar o mesmo valor e já não precisas de o atualizar no `.env`. Só se mudares de PC ou rotacionares a chave.

#### F) Testar um pagamento

Com tudo a correr (backend + frontend + `stripe listen`), vai a [http://localhost:5173](http://localhost:5173), escolhe um plano, preenche email/empresa → és redirecionado para Stripe Checkout.

**Cartão de teste** (não cobra nada):
- Número: `4242 4242 4242 4242`
- Validade: qualquer data futura (ex: `12/30`)
- CVC: qualquer (ex: `123`)
- Código postal: qualquer (ex: `1000-001`)

Após pagar, o webhook cria a empresa, redireciona para `/payment/success` e mostra-te email + password gerada.

**Outros cartões úteis para testar erros:** [stripe.com/docs/testing](https://docs.stripe.com/testing) (recusa, autenticação 3DS, etc.)

#### G) Mudança de plano com proration

No dashboard da app, em **Definições → Planos disponíveis**, ao mudar de plano a Stripe cobra automaticamente apenas a **diferença pro-rata** (não o valor total). Exemplo: subir de Starter (19.99€) para Business (49.99€) a meio do mês cobra ~15€, e os meses seguintes ficam a 49.99€.

---

### 5️⃣ Abrir a aplicação no browser

Abre o browser (Chrome recomendado) e vai a:

**👉 http://localhost:5173**

Deves ver a landing page do Armazém Express. Clica em **"Entrar"** no canto superior direito e usa as credenciais de demonstração (em baixo).

---

### ⚡ Atalho: arrancar tudo de uma vez (Windows)

Para evitar abrir 3 terminais à mão, há dois scripts na raiz do projeto:

- **`start.bat`** — arranca **backend + frontend + Stripe webhook** (modo demonstração / PAP)
- **`start-dev.bat`** — arranca **só backend + frontend** (trabalho do dia-a-dia, sem testar pagamentos)

Faz duplo-clique no ficheiro ou corre no terminal:
```bash
.\start.bat
```

Cada serviço abre numa janela própria. Para parar tudo, fecha as janelas.

---

### 📝 Resumo dos comandos mais usados

Se preferires arrancar manualmente, precisas de **3 terminais a correr ao mesmo tempo**:

**Terminal 1 — Backend:**
```bash
cd backend
pnpm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
pnpm dev
```

**Terminal 3 — Webhook Stripe** (apenas necessário se fores testar pagamentos):
```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

E abrir **http://localhost:5173** no browser.

> 🔑 **Lembrete:** O `stripe login` expira a cada **90 dias**. Se vires o erro `please run "stripe login" again`, basta correr `stripe login` outra vez e autorizar no browser. O `.env` e o `whsec_` mantêm-se válidos.

---

### ❓ Problemas comuns

**Erro `ELIFECYCLE Command failed with exit code 1` ao correr `pnpm seed` ou `pnpm start`**
→ Nas versões recentes do pnpm, pacotes com scripts nativos (como `better-sqlite3`) ficam bloqueados à espera de aprovação. Resolve-se correndo **uma vez** na pasta `backend`:
```bash
pnpm approve-builds
```
No menu interativo, seleciona `better-sqlite3` (barra de espaço) e confirma com `Enter` + `y`. Depois faz `pnpm install` novamente e os comandos `pnpm seed` / `pnpm start` passam a funcionar. Em alternativa, podes usar `npm install` em vez de `pnpm install`, já que o `npm` não exige esta aprovação.

**Erro "port 4000 is already in use"**
→ Já tens outro programa a usar essa porta. Fecha outras aplicações Node ou muda a porta em `backend/.env`.

**Erro ao instalar `better-sqlite3`**
→ Em Windows, precisas de ferramentas de build. Corre: `npm install --global windows-build-tools` (como administrador). Em Mac: `xcode-select --install`.

**Página em branco ou erros "failed to fetch"**
→ Confirma que o **backend está a correr** no primeiro terminal. Sem backend, o frontend não funciona.

**Quero apagar todos os dados e começar do zero**
→ Corre no backend: `pnpm seed -- --reset` (apaga tudo e recria os dados demo).

**Erro `Stripe não está configurado no servidor` ao tentar subscrever**
→ Falta a `STRIPE_SECRET_KEY` no `.env` do backend. Vê o passo 4️⃣ acima.

**Pagamento concluído mas a empresa não é criada / página de sucesso fica em loading**
→ O webhook não está a chegar ao backend. Confirma que tens o `stripe listen --forward-to localhost:4000/api/billing/webhook` a correr em terminal próprio, e que o `STRIPE_WEBHOOK_SECRET` no `.env` corresponde ao `whsec_...` mostrado pela CLI. Se mudaste o `.env`, **reinicia o backend**.

**`stripe login` deixou de funcionar / pede para autenticar de novo**
→ O token expira a cada 90 dias. Corre `stripe login` outra vez e autoriza no browser.

**`stripe : The term 'stripe' is not recognized` no PowerShell**
→ O PATH não foi atualizado no terminal atual. Fecha **todos** os terminais e abre um novo. Se persistir, fecha e reabre o VS Code.

---

## 🔑 Credenciais de demonstração

Após correr `pnpm seed`, tens duas contas prontas a usar:

| Papel | Email | Password |
|---|---|---|
| **Administrador** | `demo@armazem-express.pt` | `Demo@2025!` |
| **Funcionário** | `funcionario@armazem-express.pt` | `Trabalhador@2025` |

Ou clica nos botões **"Entrar como Admin"** / **"Entrar como Funcionário"** na página de login — preenchem automaticamente os campos.

A empresa demo ("Demo PME Logística") tem:
- 15 produtos de exemplo em 6 categorias
- 5 encomendas com histórico de rastreio
- Plano Business ativo

---

## 📱 Funcionalidades principais

### 🎨 Landing Page
- Hero animado com mock dashboard
- Secção de funcionalidades (6 cards)
- Secção "Como funciona" (3 passos)
- Planos com preços (carregados dinamicamente do backend)
- Secção ODS (Objetivos de Desenvolvimento Sustentável)
- CTA final + footer

### 🔐 Subscrição (Stripe)
A landing page permite escolher um plano e iniciar a subscrição via **Stripe Checkout** em modo de teste:
- O utilizador preenche email + nome da empresa e é redirecionado para a página de pagamento da Stripe
- Após confirmar o pagamento (cartão de teste `4242 4242 4242 4242`), o webhook do Stripe avisa o backend
- O backend cria a empresa, gera uma password forte de 14 caracteres e regista a subscrição
- O utilizador é redirecionado para `/payment/success` onde vê as credenciais (mostradas UMA vez, copy-to-clipboard)
- O **upgrade/downgrade** de plano nas definições é processado pela Stripe com **proration automática** (cobra só a diferença pro-rata)

### 📊 Dashboard
- Banner de boas-vindas com gradiente
- 8 StatCards (stock + encomendas)
- Gráfico de área: movimentos de stock nos últimos 7 dias
- Gráfico de pizza: distribuição por categoria
- Lista de produtos com stock baixo
- Lista de encomendas recentes

### 📦 Gestão de Stock
- Pesquisa por nome/SKU/descrição
- Filtros por categoria e estado (em stock / baixo / sem stock)
- Tabela desktop + cards mobile
- Criação com validação completa (nome, categoria, quantidade, preço, prateleira)
- Detalhe do produto com:
  - +/- stock (adicionar/remover unidades)
  - Edição inline
  - QR Code com download/impressão
  - Histórico completo de movimentos
  - Remoção (admin)

### 🚚 Encomendas
- Lista em grid com cards visuais
- Filtros por estado e pesquisa
- Envio com:
  - Validação de telefone PT (9 dígitos, começa em 2/3/9)
  - Validação de código postal PT (formato XXXX-XXX)
  - Validação de nome (só letras + acentos)
  - Email opcional
  - Carrinho com stock-aware (não permite exceder disponível)
  - Desconto automático do stock
  - Geração de tracking number (AE + 12 dígitos + PT)
- Detalhe com:
  - Stepper animado de progresso
  - Timeline de eventos de rastreio
  - Atualização de estado (pending → shipped → in_transit → delivered)
  - Cancelamento disponível

### 🔍 Tracking
- Pesquisa pública por número de tracking
- Visualização do progresso em stepper
- Histórico completo de localizações

### 📸 QR Scanner
- Usa a câmara traseira do telemóvel
- Deteta QR via **BarcodeDetector API** nativa
- Fallback: introdução manual de código
- Mostra produto identificado com stock atual
- Link direto para os detalhes

### 👥 Equipa (Admin)
- Lista de utilizadores da empresa
- Criação de funcionários com password gerada
- Ativar/desativar contas
- Remoção
- Respeita limites do plano

### ⚙️ Definições
- Plano atual com barras de progresso (produtos usados / limite)
- Funcionalidades incluídas
- Info da empresa
- Troca de tema (claro/escuro)

---

## 🎨 Identidade Visual

- **Vermelho:** `#e63946` (primário)
- **Amarelo:** `#f4b01d` (secundário)
- **Fontes:** Space Grotesk (display) · Inter (corpo) · JetBrains Mono (mono)

Cores retiradas diretamente do logotipo da empresa. Paleta completa em `frontend/tailwind.config.js`.

---

## 🏗️ Arquitetura

### Multi-tenancy
Cada empresa (`companies`) tem os seus próprios produtos, encomendas, utilizadores, categorias e notificações — tudo filtrado por `company_id` em cada query. Um JWT válido contém o `companyId` que é usado automaticamente em todas as rotas.

### Base de dados (SQLite)
10 tabelas relacionais com foreign keys:
- `plans` — planos de subscrição
- `companies` — empresas clientes
- `users` — utilizadores (admin/employee)
- `categories` — categorias por empresa
- `products` — produtos com SKU e QR code
- `orders` + `order_items` — encomendas
- `tracking_events` — histórico de rastreio
- `stock_movements` — auditoria de movimentos
- `notifications` — sistema de avisos

### API REST
Todas as rotas prefixadas com `/api/`:
- `/auth` — login, plans, me, change-plan (legacy)
- `/billing` — checkout (Stripe), session, change-plan (com proration), cancel, webhook
- `/products` — CRUD + ajuste + QR lookup + stats
- `/orders` — CRUD + tracking + atualização de estado
- `/users` — gestão de equipa (admin)
- `/dashboard` — agregados + notificações

---

## 📁 Estrutura de ficheiros

```
armazem-express/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.js              # Init SQLite + tabelas
│   │   │   └── seed.js            # Dados de demonstração
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT + requireAdmin
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   ├── users.js
│   │   │   └── dashboard.js
│   │   ├── utils/
│   │   │   ├── generators.js      # Password, SKU, QR, tracking
│   │   │   └── validators.js      # Validações PT
│   │   └── server.js              # Express app
│   ├── .env                       # Variáveis de ambiente
│   └── package.json
└── frontend/
    ├── public/
    │   └── logo.png               # Logotipo
    ├── src/
    │   ├── components/            # AppLayout, Logo, ui.jsx, LoadingScreen
    │   ├── context/               # AuthContext, ThemeContext
    │   ├── lib/                   # api.js (axios), format.js
    │   ├── pages/                 # 13 páginas
    │   ├── App.jsx                # Rotas
    │   ├── main.jsx               # Entry point
    │   └── index.css              # Tailwind + estilos
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🧪 Scripts úteis

### Backend
```bash
pnpm start              # Arranca servidor (ou npm start)
pnpm dev                # Arranca com nodemon (reload automático)
pnpm seed               # Cria dados demo
pnpm seed -- --reset    # Apaga e recria a BD
pnpm test               # Corre os testes automatizados
pnpm test:watch         # Testes em modo watch
```

### Frontend
```bash
pnpm dev                # Dev server (5173)
pnpm build              # Build para produção
pnpm preview            # Preview da build
```

---

## ✅ Testes automatizados

O backend tem uma suite de testes com **Vitest** que cobre:

- **Validadores** (`tests/validators.test.js`): email, telefone PT, código postal PT, nome, password forte, números positivos
- **Geradores** (`tests/validators.test.js`): password forte, tracking number, SKU, QR code
- **API** (`tests/api.test.js`):
  - `/auth/plans` retorna planos
  - `/auth/login` rejeita credenciais erradas
  - `/auth/me` requer token válido
  - `/products` CRUD completo + validações
  - `/products/:id/adjust` adiciona e remove stock corretamente
  - `/products/:id/adjust` bloqueia remoções que excedam o stock
  - `/orders` valida telefone e código postal PT
  - `/orders` desconta stock automaticamente após criação

Para correr:
```bash
cd backend
pnpm test
```

---

## 📚 Documentação adicional

Além deste README, o projeto inclui documentação na pasta `docs/`:

- **`docs/diagrama-er.svg`** / **`docs/diagrama-er.png`** — Diagrama Entidade-Relação da base de dados (todas as 10 tabelas e relações)
- **`docs/ADMIN_VS_FUNCIONARIO.md`** — Guia completo de permissões e como criar funcionários

---

## 🎓 Alinhamento com ODS

O projeto está alinhado com os Objetivos de Desenvolvimento Sustentável da ONU:
- **ODS 8** (Trabalho digno e crescimento económico) — automatiza tarefas repetitivas
- **ODS 9** (Indústria, Inovação e Infraestrutura) — modernização digital das PMEs
- **ODS 12** (Consumo e Produção Responsáveis) — gestão precisa evita desperdício

---

## 📜 Licença

Projeto da **PAP** (Prova de Aptidão Profissional) 2025/2026.

---

**Desenvolvido por Guilherme Silva · 2026**
