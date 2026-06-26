# ⚡ Guia Rápido · Como correr o Armazém Express

> **TL;DR:** Abre 2 terminais, corre os comandos em cada, abre o browser em http://localhost:5173.

---

## 🎯 Primeiros passos (só uma vez)

### 1. Instala o Node.js
Descarrega em [nodejs.org](https://nodejs.org/) (versão LTS).

### 2. Instala o pnpm
Este projeto usa **pnpm** (não npm). Instala uma única vez, em qualquer terminal:
```bash
npm install -g pnpm
```

> ⚠️ **Não uses `npm install` neste projeto.** Ele está configurado para pnpm (tem `pnpm-lock.yaml` e `pnpm-workspace.yaml`). Se usares `npm`, vais ver erros como `Unsupported URL Type "workspace:"` ou `Cannot read properties of null`. Usa sempre `pnpm`.

### 3. Abre o projeto no VS Code
`File` → `Open Folder` → seleciona a pasta `armazemexpress`.

### 4. Abre o terminal integrado
`Ctrl + \`` (tecla à esquerda do 1)

---

## 🚀 Correr o projeto

### Terminal 1: Backend

```bash
cd backend
pnpm install
pnpm seed
pnpm start
```

✅ Deves ver: `🚀 Servidor a correr em http://localhost:4000`

**⚠️ Deixa este terminal aberto!**

---

### Terminal 2: Frontend (novo terminal)

Abre um **segundo terminal** (`+` no canto superior direito do painel do terminal).

```bash
cd frontend
pnpm install
pnpm dev
```

✅ Deves ver: `➜ Local: http://localhost:5173/`

---

### Browser

Abre: **http://localhost:5173**

> 💡 **Atalho:** em vez de abrir terminais à mão, podes fazer duplo-clique no ficheiro **`start.bat`** (arranca backend + frontend + webhook Stripe) ou **`start-dev.bat`** (só backend + frontend).

---

## 💳 Pagamentos (Stripe) — opcional

Só precisas disto se fores testar subscrições/pagamentos. Abre um **terceiro terminal**:

```bash
stripe listen --forward-to localhost:4000/api/billing/webhook
```

Os detalhes completos da configuração Stripe estão no [README.md](./README.md) (secção 4).

---

## 🔑 Entrar na aplicação

Na página de login, clica num dos botões:

- **"Entrar como Admin"** — acesso total
- **"Entrar como Funcionário"** — acesso limitado

Ou introduz manualmente:

| Papel | Email | Password |
|---|---|---|
| Admin | `demo@armazem-express.pt` | `Demo@2025!` |
| Funcionário | `funcionario@armazem-express.pt` | `Trabalhador@2025` |

---

## 🔄 Das próximas vezes (depois do setup)

**Terminal 1:**
```bash
cd backend
pnpm start
```

**Terminal 2:**
```bash
cd frontend
pnpm dev
```

**Browser:** http://localhost:5173

---

## 🆘 Comandos úteis

| O que quero fazer | Comando (pasta) |
|---|---|
| Correr o backend | `pnpm start` (backend/) |
| Correr o frontend | `pnpm dev` (frontend/) |
| Apagar tudo e começar do zero | `pnpm seed --reset` (backend/) |
| Correr os testes | `pnpm test` (backend/) |
| Build de produção | `pnpm build` (frontend/) |

---

## ❓ Erros comuns

**`Unsupported URL Type "workspace:"` ou `Cannot read properties of null`**
→ Estás a usar `npm`. Este projeto usa `pnpm`. Corre `pnpm install` em vez de `npm install`.

**`pnpm` não é reconhecido**
→ Falta instalar o pnpm. Corre `npm install -g pnpm` uma vez e abre um terminal novo.

---

## 📞 Contactos

**Guilherme Silva** · PAP 2025/2026 · Digital Escola Profissional
