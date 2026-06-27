# 🚀 Pôr o Armazém Express online

O projeto tem duas partes que vão para sítios diferentes:

| Parte | Plataforma | Porquê |
|-------|-----------|--------|
| **Frontend** (React + Vite) | **Vercel** | Especializada em sites; gratuita |
| **Backend** (Express + SQLite) | **Render** | Corre Node e tem ficheiros (a base de dados) |

> Tudo isto é **gratuito**. Vais precisar de uma conta na Vercel e outra no Render — entra com o teu GitHub nas duas.

A ordem importa: **primeiro o backend** (para teres o URL dele), **depois o frontend**.

---

## Parte 1 — Backend no Render

1. Vai a **https://render.com** → entra com o GitHub.
2. **New +** → **Web Service** → escolhe o repositório `armazem-express`.
3. Preenche assim:
   - **Name:** `armazem-express-api` (ou o que quiseres)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run seed && npm start`
   - **Instance Type:** `Free`
4. Em **Environment Variables**, adiciona:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (uma frase longa aleatória — inventa, ex.: `armazem-pap-2026-xKp9...`)
   - `JWT_EXPIRES_IN` = `7d`
5. **Create Web Service** e espera o deploy terminar (~2-3 min).
6. No fim ficas com um URL tipo **`https://armazem-express-api.onrender.com`**.
   Testa: abre `https://...onrender.com/api/health` → deve responder `{"status":"ok",...}`.

📌 **Copia esse URL** — vais precisar dele já a seguir.

> 💡 Em vez dos passos 2-4 podes usar o **Blueprint**: New + → **Blueprint** → escolhe o repo (ele lê o `render.yaml`). Depois só defines o `FRONTEND_URL` no fim.

---

## Parte 2 — Frontend na Vercel

1. Vai a **https://vercel.com** → entra com o GitHub.
2. **Add New… → Project** → importa o repositório `armazem-express`.
3. Configura:
   - **Root Directory:** `frontend`  ← muito importante (clica em *Edit* e escolhe `frontend`)
   - **Framework Preset:** Vite (deteta sozinho)
4. Abre **Environment Variables** e adiciona:
   - **Name:** `VITE_API_URL`
   - **Value:** o URL do backend **com `/api` no fim**, ex.:
     `https://armazem-express-api.onrender.com/api`
5. **Deploy** e espera (~1 min).
6. Ficas com um URL tipo **`https://armazem-express.vercel.app`** — esse é o teu site! 🎉

---

## Parte 3 — Ligar os dois (só se usares o Stripe)

O pagamento Stripe precisa de saber o endereço do frontend para os redirects:

1. No **Render** → o teu serviço → **Environment** → adiciona/edita:
   - `FRONTEND_URL` = `https://armazem-express.vercel.app` (o teu URL da Vercel)
2. (Opcional) Se quiseres pagamentos a funcionar online, adiciona também as chaves Stripe:
   `STRIPE_SECRET_KEY`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_BUSINESS`, `STRIPE_PRICE_ENTERPRISE`.
3. O Render reinicia sozinho ao guardar.

> Sem chaves Stripe o site funciona à mesma — só os botões de pagamento é que ficam indisponíveis (mostram um aviso). Para a PAP não é preciso.

---

## Credenciais de demonstração (já vêm carregadas)

- **Admin:** `demo@armazem-express.pt` / `Demo@2025!`
- **Funcionário:** `funcionario@armazem-express.pt` / `Trabalhador@2025`

---

## ⚠️ Coisas a saber sobre o plano gratuito

- **O backend "adormece":** no plano free do Render, o servidor desliga após ~15 min sem uso. O **primeiro acesso depois disso demora ~30-50 segundos** a acordar (a página fica à espera). É normal.
- **A base de dados reinicia:** quando o backend adormece e acorda, os dados criados durante a demonstração **voltam aos dados de demonstração** (o `seed` corre de novo). Ou seja, é ótimo para mostrar, mas não guarda alterações a longo prazo.
- **Para dados permanentes** seria preciso um disco persistente (Render Disk, plano pago) ou uma base de dados externa (PostgreSQL). Para a PAP, o atual chega.

---

## Resumo rápido

```
Backend (Render)   →  https://armazem-express-api.onrender.com
Frontend (Vercel)  →  https://armazem-express.vercel.app
                       (com VITE_API_URL a apontar para o backend + /api)
```

Sempre que fizeres `git push`, **ambos** reconstroem e atualizam automaticamente. ✅
