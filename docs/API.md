# 🔌 Documentação da API · Armazém Express

> Guia completo da API REST do backend. Explica o que é uma API REST e documenta todos os endpoints.

---

## 📖 Parte 1 — O que é uma API REST?

### A ideia em uma frase
Uma **API** (*Application Programming Interface*) é a "porta de entrada" do backend: um conjunto de endereços (endpoints) que o frontend usa para **pedir** e **enviar** dados. **REST** é o estilo/convenção mais usado para construir essas portas.

### Analogia do restaurante 🍽️
- O **frontend** (a app React) é o **cliente** sentado à mesa.
- A **API** é o **empregado de mesa**.
- A **base de dados** é a **cozinha**.

O cliente não entra na cozinha. Faz um **pedido** ao empregado ("quero a lista de produtos"), o empregado vai à cozinha buscar, e traz a **resposta**. O cliente nunca toca diretamente na comida (dados) — fala sempre através do empregado (API). Isto mantém tudo seguro e organizado.

### Como é feito um pedido (request)
Cada pedido à API tem 4 partes:

1. **Método HTTP** — o *tipo* de ação:
   | Método | Significado | Exemplo |
   |---|---|---|
   | `GET` | **Ler** dados | "dá-me os produtos" |
   | `POST` | **Criar** algo novo | "cria este produto" |
   | `PUT` | **Substituir/editar** | "atualiza este produto" |
   | `PATCH` | **Alterar parte** | "marca como lida" |
   | `DELETE` | **Apagar** | "remove este produto" |

2. **URL (endpoint)** — o endereço: `http://localhost:4000/api/products`

3. **Headers** — informação extra, como o *token* de autenticação:
   `Authorization: Bearer eyJhbGci...`

4. **Body** — os dados enviados (só em POST/PUT/PATCH), em formato **JSON**:
   ```json
   { "name": "Teclado", "price": 29.99 }
   ```

### Como é a resposta (response)
A API responde com:

- **Código de estado HTTP** — diz se correu bem:
  | Código | Significado |
  |---|---|
  | `200 OK` | Correu bem |
  | `201 Created` | Criado com sucesso |
  | `400 Bad Request` | Pedido inválido (faltam dados, formato errado) |
  | `401 Unauthorized` | Não tens login / token inválido |
  | `403 Forbidden` | Tens login, mas não tens permissão |
  | `404 Not Found` | Não existe |
  | `409 Conflict` | Já existe (ex: email duplicado) |
  | `500 Internal Server Error` | Erro no servidor |

- **Body** — os dados de resposta, também em **JSON**.

### O que torna uma API "REST"
- Usa os **métodos HTTP** acima para cada ação.
- Cada "coisa" (produto, encomenda...) é um **recurso** com o seu URL (`/api/products`, `/api/orders`).
- É **stateless**: cada pedido leva tudo o que precisa (incluindo o token). O servidor não "lembra" pedidos anteriores.
- Os dados viajam em **JSON**.

---

## 🔐 Parte 2 — Autenticação (JWT)

A maioria dos endpoints exige **login**. O fluxo é:

1. Fazes `POST /api/auth/login` com email + password.
2. A API devolve um **token JWT** (uma string longa).
3. Em todos os pedidos seguintes, envias esse token no header:
   ```
   Authorization: Bearer <o-teu-token>
   ```
4. O middleware `authenticate` valida o token e identifica quem és e de que empresa.

> O token expira (por defeito em 7 dias). Sem token válido → resposta `401`.

### Níveis de acesso
- 🔓 **Público** — qualquer um (ex: login, listar planos).
- 🔐 **Autenticado** — precisa de token válido.
- 👑 **Admin** — só utilizadores com `role: 'admin'`.
- ⭐ **Feature** — o plano da empresa tem de incluir a funcionalidade (`qr_scanner`, `csv_export`, `activity_log`).

---

## 🌐 Parte 3 — Informação base

| | |
|---|---|
| **URL base** | `http://localhost:4000` |
| **Prefixo** | Todas as rotas começam em `/api` |
| **Formato** | JSON (pedido e resposta) |
| **Teste rápido** | [http://localhost:4000/api/health](http://localhost:4000/api/health) |

---

## 📋 Parte 4 — Todos os endpoints

### 🩺 Sistema
| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/health` | 🔓 | Estado do servidor |

---

### 🔑 Autenticação · `/api/auth`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/auth/plans` | 🔓 | Lista os 3 planos (Starter, Business, Enterprise) |
| `POST` | `/api/auth/login` | 🔓 | Login → devolve token + dados do utilizador |
| `POST` | `/api/auth/subscribe` | 🔓 | Subscrição direta (legado, antes do Stripe) |
| `GET` | `/api/auth/me` | 🔐 | Dados do utilizador autenticado + plano |
| `POST` | `/api/auth/change-plan` | 👑 | Mudar plano (legado, sem cobrança) |

**Exemplo — Login:**
```http
POST /api/auth/login
Content-Type: application/json

{ "email": "demo@armazem-express.pt", "password": "Demo@2025!" }
```
Resposta `200`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1, "name": "Administrador Demo", "email": "demo@armazem-express.pt",
    "role": "admin", "companyName": "Demo PME Logística", "companyId": 1, "planId": 2
  }
}
```

---

### 📦 Produtos · `/api/products`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/products` | 🔐 | Lista produtos (filtros: `?search=`, `?category=`, `?status=`) |
| `GET` | `/api/products/:id` | 🔐 | Detalhe de um produto |
| `GET` | `/api/products/stats` | 🔐 | Estatísticas de stock (total, baixo, sem stock, valor) |
| `GET` | `/api/products/categories` | 🔐 | Lista de categorias da empresa |
| `GET` | `/api/products/qr/:code` | ⭐ qr_scanner | Procura produto por código QR |
| `GET` | `/api/products/export` | ⭐ csv_export | Exporta produtos em CSV |
| `POST` | `/api/products` | 🔐 | Cria um produto |
| `PUT` | `/api/products/:id` | 🔐 | Edita um produto |
| `POST` | `/api/products/:id/adjust` | 🔐 | Ajusta o stock (+ entrada / − saída) |
| `DELETE` | `/api/products/:id` | 👑 | Remove um produto |

**Exemplo — Criar produto:**
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Teclado Mecânico",
  "category": "Eletrónica",
  "quantity": 50,
  "min_stock": 10,
  "price": 29.99,
  "shelf": "A-12",
  "supplier": "Logitech"
}
```
> O `sku` e o `qr_code` são gerados automaticamente se não forem fornecidos.

**Exemplo — Ajustar stock:**
```http
POST /api/products/5/adjust
Authorization: Bearer <token>

{ "type": "add", "quantity": 20, "reason": "Reposição fornecedor" }
```

---

### 🚚 Encomendas · `/api/orders`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/orders` | 🔐 | Lista encomendas (filtros: `?search=`, `?status=`) |
| `GET` | `/api/orders/:id` | 🔐 | Detalhe + itens + histórico de tracking |
| `GET` | `/api/orders/stats` | 🔐 | Estatísticas (total, pendentes, em trânsito, entregues) |
| `GET` | `/api/orders/tracking/:code` | 🔐 | Rastrear por número de tracking |
| `GET` | `/api/orders/export` | ⭐ csv_export | Exporta encomendas em CSV |
| `POST` | `/api/orders` | 🔐 | Cria encomenda (valida contactos PT, desconta stock) |
| `POST` | `/api/orders/:id/status` | 🔐 | Atualiza estado (pending → shipped → in_transit → delivered) |

**Exemplo — Criar encomenda:**
```http
POST /api/orders
Authorization: Bearer <token>

{
  "recipient_name": "João Silva",
  "recipient_address": "Rua das Flores, 12",
  "recipient_city": "Porto",
  "recipient_postal_code": "4000-001",
  "recipient_phone": "912345678",
  "recipient_email": "joao@email.pt",
  "items": [{ "product_id": 5, "quantity": 2 }]
}
```
> Valida o telefone (9 dígitos, começa em 2/3/9) e o código postal PT (`XXXX-XXX`). Gera um `tracking_number` único (`AE` + 12 dígitos + `PT`) e desconta o stock automaticamente.

---

### 👥 Equipa · `/api/users` (só admin 👑)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/users` | Lista os utilizadores da empresa |
| `POST` | `/api/users` | Cria um funcionário (password gerada automaticamente) |
| `PATCH` | `/api/users/:id/toggle` | Ativa/desativa uma conta |
| `DELETE` | `/api/users/:id` | Remove um utilizador |

---

### 📊 Dashboard · `/api/dashboard`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `GET` | `/api/dashboard` | 🔐 | Agregados: stats, gráficos, stock baixo, encomendas recentes, sugestões de reposição |
| `GET` | `/api/dashboard/search` | 🔐 | Pesquisa global (produtos + encomendas) |
| `GET` | `/api/dashboard/activity` | 👑 ⭐ activity_log | Registo de atividade da empresa |
| `GET` | `/api/dashboard/notifications` | 🔐 | Lista de notificações |
| `PATCH` | `/api/dashboard/notifications/:id/read` | 🔐 | Marca uma notificação como lida |
| `PATCH` | `/api/dashboard/notifications/read-all` | 🔐 | Marca todas como lidas |

---

### 💳 Faturação (Stripe) · `/api/billing`

| Método | Endpoint | Acesso | Descrição |
|---|---|---|---|
| `POST` | `/api/billing/checkout` | 🔓 | Inicia o checkout de uma nova subscrição (devolve URL do Stripe) |
| `GET` | `/api/billing/session/:id` | 🔓 | Verifica o estado de uma sessão de pagamento |
| `POST` | `/api/billing/change-plan` | 👑 | Muda de plano com cobrança proporcional (proration) |
| `POST` | `/api/billing/cancel` | 👑 | Cancela a subscrição no fim do ciclo |
| `POST` | `/api/billing/webhook` | 🤖 Stripe | Recebe eventos do Stripe (usa raw body para validar a assinatura) |

> Detalhes da configuração do Stripe no [README.md](../README.md) (secção 4).

---

## 🏗️ Parte 5 — Como a API está organizada (arquitetura)

### Onde vive o código
```
backend/src/
├── server.js          → arranca o Express e liga todas as rotas
├── routes/            → os endpoints (auth, products, orders, users, dashboard, billing)
├── middleware/auth.js → valida o JWT, verifica admin e funcionalidades do plano
├── database/db.js     → cria as tabelas SQLite
└── utils/             → validações (PT) e geradores (SKU, tracking, password)
```

### Multi-tenancy (várias empresas, dados isolados) 🏢
Cada empresa só vê os **seus** dados. Como? Todas as queries são filtradas por `company_id`, que vem **do token JWT** — não é o utilizador que o escolhe. Assim, a Empresa A nunca consegue ver os produtos da Empresa B, mesmo que adivinhe os IDs.

### Middleware (filtros antes de chegar ao endpoint)
Cada pedido passa por "guardas" antes de executar:
1. `authenticate` → o token é válido? Quem és?
2. `requireAdmin` → és admin? (só nalguns endpoints)
3. `requireFeature('...')` → o teu plano inclui esta funcionalidade?

Se algum falhar, a API responde logo com `401` ou `403` e não chega a executar a ação.

---

## 🧪 Parte 6 — Como testar a API

**1. No browser (só GET públicos):**
Abre [http://localhost:4000/api/health](http://localhost:4000/api/health)

**2. Pela própria aplicação:**
O frontend (http://localhost:5173) já usa a API em todas as páginas. Abre as *DevTools* do browser (F12) → separador **Network** → vês os pedidos à API a acontecer ao vivo.

**3. Com `curl` (terminal):**
```bash
# Login (guarda o token devolvido)
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"demo@armazem-express.pt\",\"password\":\"Demo@2025!\"}"

# Usar o token para listar produtos
curl http://localhost:4000/api/products \
  -H "Authorization: Bearer COLA_AQUI_O_TOKEN"
```

**4. Com Postman / Thunder Client:** importa os endpoints acima e testa visualmente.

---

**Desenvolvido por Guilherme Silva · PAP 2025/2026 · Digital Escola Profissional**
