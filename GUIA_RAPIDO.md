# ⚡ Guia Rápido · Como correr o Armazém Express

> **TL;DR:** Abre 2 terminais, corre 3 comandos em cada, abre o browser em http://localhost:5173.

---

## 🎯 Primeiros passos (só uma vez)

### 1. Instala o Node.js
Descarrega em [nodejs.org](https://nodejs.org/) (versão LTS).

### 2. Abre o projeto no VS Code
`File` → `Open Folder` → seleciona a pasta `armazem-express`.

### 3. Abre o terminal integrado
`Ctrl + \`` (tecla à esquerda do 1)

---

## 🚀 Correr o projeto

### Terminal 1: Backend

```bash
cd backend
npm install
npm run seed
npm start
```

✅ Deves ver: `🚀 Servidor a correr em http://localhost:4000`

**⚠️ Deixa este terminal aberto!**

---

### Terminal 2: Frontend (novo terminal)

Abre um **segundo terminal** (`+` no canto superior direito do painel do terminal).

```bash
cd frontend
npm install
npm run dev
```

✅ Deves ver: `➜ Local: http://localhost:5173/`

---

### Browser

Abre: **http://localhost:5173**

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
npm start
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

**Browser:** http://localhost:5173

---

## 🆘 Comandos úteis

| O que quero fazer | Comando (pasta) |
|---|---|
| Correr o backend | `npm start` (backend/) |
| Correr o frontend | `npm run dev` (frontend/) |
| Apagar tudo e começar do zero | `npm run seed -- --reset` (backend/) |
| Correr os testes | `npm test` (backend/) |
| Build de produção | `npm run build` (frontend/) |

---

## 📞 Contactos

**Guilherme Silva** · PAP 2025/2026 · Digital Escola Profissional
