# 👥 Admin vs Funcionário — Guia de Permissões

O **Armazém Express** tem **2 papéis de utilizador** dentro de cada empresa: **Administrador** e **Funcionário**. Este documento explica as diferenças de permissões e como gerir a equipa.

---

## 📋 Resumo rápido

| Funcionalidade | 👨‍💼 Admin | 👷 Funcionário |
|---|:---:|:---:|
| Ver dashboard | ✅ | ✅ |
| Consultar stock | ✅ | ✅ |
| Adicionar produtos | ✅ | ✅ |
| Ajustar stock (+/-) | ✅ | ✅ |
| Editar produtos | ✅ | ✅ |
| **Remover produtos** | ✅ | ❌ |
| Criar encomendas | ✅ | ✅ |
| Ver detalhe de encomenda | ✅ | ✅ |
| Atualizar estado de encomenda | ✅ | ✅ |
| Rastrear encomendas | ✅ | ✅ |
| Usar QR Scanner | ✅ | ✅ |
| **Gerir equipa** (criar/remover funcionários) | ✅ | ❌ |
| **Aceder a Definições** (plano, empresa) | ✅ | ❌ |

> **Nota:** A aplicação esconde automaticamente os botões e menus a que o funcionário não tem acesso. O backend também bloqueia as ações (não basta "inspecionar" o HTML para as conseguir fazer).

---

## 👨‍💼 O que pode o Administrador

O administrador é a pessoa que **criou a conta da empresa** (ao subscrever um plano na landing page) ou qualquer utilizador a quem foi **atribuído o papel de admin** posteriormente.

### Responsabilidades exclusivas

1. **Remover produtos do stock** — o botão de lixo só aparece para admins, na tabela de stock, na página de detalhe do produto, e existe ainda uma página dedicada `/app/stock/remove` com seleção múltipla.
2. **Gerir a equipa** (página "Equipa" no sidebar):
   - Ver todos os utilizadores da empresa
   - Criar novos funcionários ou outros administradores
   - Ativar/desativar contas (uma conta desativada não consegue fazer login)
   - Remover contas
3. **Aceder às Definições** (página "Definições"):
   - Ver o plano atual e limites usados (produtos / utilizadores)
   - Ver informação da empresa e data de subscrição
   - Escolher tema claro/escuro

### O que o admin não pode fazer

- **Não pode remover a própria conta** — para evitar bloqueios. Se o único admin quiser sair, terá primeiro de promover outra pessoa a admin.
- **Não pode desativar a própria conta** — mesma razão.
- Na página de Equipa, a conta do próprio admin aparece marcada como "Esta é a sua conta" em vez de mostrar os botões de ação.

---

## 👷 O que pode o Funcionário

O funcionário é qualquer utilizador **criado pelo admin** com papel "employee". Pode fazer **quase tudo** no dia-a-dia do armazém, exceto as ações de gestão.

### O que consegue fazer

- **Operar o stock** — adicionar produtos novos, ajustar quantidades (adicionar/remover unidades), editar detalhes de produtos existentes.
- **Operar encomendas** — criar novas, ver detalhes, atualizar estado (pendente → expedida → em trânsito → entregue), cancelar.
- **Rastrear encomendas** via número de tracking.
- **Usar o QR Scanner** para identificar produtos rapidamente com o telemóvel.
- **Receber notificações** de stock baixo e encomendas expedidas.

### O que NÃO aparece ao funcionário

- Item "Remover Stock" no sidebar
- Item "Equipa" no sidebar
- Item "Definições" no sidebar
- Botão de lixo 🗑️ ao lado dos produtos
- Botão de remoção na página de detalhe do produto

---

## 🔐 Como criar funcionários (passo a passo)

**Pré-requisito:** tens de estar autenticado com uma conta **admin**.

### Passo 1 — Entrar na página "Equipa"

No sidebar à esquerda, na secção **"Administração"** (só visível para admins), clica em **"Equipa"**. Ou acede diretamente a `http://localhost:5173/app/team`.

### Passo 2 — Clicar em "Adicionar funcionário"

No canto superior direito da página, há um botão **"+ Adicionar funcionário"**. Se o botão estiver desativado (cinzento), significa que **atingiste o limite do teu plano**:

- Plano **Starter**: até 2 utilizadores
- Plano **Business**: até 10 utilizadores
- Plano **Enterprise**: sem limite

Nesse caso, precisas de fazer upgrade do plano ou remover um utilizador existente.

### Passo 3 — Preencher os dados

Abre-se uma janela com 3 campos:

1. **Nome completo** — ex: "João Silva"
2. **Email** — ex: `joao@minhaempresa.pt` (será o login dele)
3. **Permissões** — escolhe entre:
   - **"Funcionário (operar stock e encomendas)"** — para a maioria dos casos
   - **"Administrador (acesso total)"** — só para pessoas de confiança que precisem de gerir a equipa

Clica em **"Criar utilizador"**.

### Passo 4 — Guardar e partilhar a password gerada

⚠️ **Este passo é crítico.** Aparece um ecrã com:

- ✅ Confirmação "Conta criada com sucesso"
- Email do utilizador (para confirmares)
- **Password gerada** — 14 caracteres com maiúsculas, minúsculas, números e símbolos

**A password só é mostrada UMA VEZ.** Se fechares o ecrã sem a copiar, terás de remover o utilizador e criá-lo de novo (porque as passwords são guardadas encriptadas com bcrypt, ninguém consegue lê-las depois de serem criadas).

👉 Clica em **"📋 Copiar password"** e partilha as credenciais com o funcionário através de um canal seguro:
- ✉️ Email pessoal dele
- 📱 WhatsApp / Signal
- 💬 Verbalmente em pessoa

### Passo 5 — O funcionário faz login

O funcionário vai a `http://localhost:5173/login` (ou ao endereço onde a aplicação estiver instalada) e entra com:
- O email que lhe deste
- A password gerada que lhe partilhaste

Depois do primeiro login, **recomendamos que o admin acompanhe o funcionário** a alterar a password (funcionalidade prevista para versão futura — atualmente a password mantém-se tal como gerada).

---

## 🔄 Gerir funcionários existentes

Na mesma página "Equipa", cada utilizador aparece num card com:

### Ativar / Desativar conta

Usa o botão **"Desativar"** para bloquear temporariamente o acesso de um funcionário (por exemplo, férias prolongadas, suspensão). A conta **fica intacta** mas ele não consegue fazer login. Podes **"Ativar"** quando quiseres.

### Remover conta permanentemente

O botão 🗑️ remove **permanentemente** a conta. A ação **não pode ser desfeita** — se o funcionário voltar, terás de criar uma conta nova.

**Importante:** mesmo removendo um funcionário, os produtos e encomendas que ele criou **permanecem** no sistema (apenas o rasto do "created_by" fica como referência órfã).

---

## 🛡️ Segurança

- **Passwords encriptadas com bcrypt** (12 rounds) — nem mesmo o admin consegue ver a password dos funcionários.
- **Sessões JWT com expiração de 7 dias** — depois disto, é necessário fazer login de novo.
- **Rate limiting no backend** — impede ataques de força bruta.
- **Multi-tenancy estrita** — cada empresa só vê os seus dados; cada pedido à API é validado contra o `company_id` do utilizador autenticado.
- **Verificação dupla de permissões** — o frontend esconde botões e o backend bloqueia as ações com o middleware `requireAdmin`.

---

## ❓ FAQ

**P: Posso ter mais do que um admin na mesma empresa?**
R: Sim! Basta criar um utilizador com papel "Administrador". Útil para partilhar responsabilidades de gestão.

**P: E se me esquecer da password de admin?**
R: Como esta é uma PAP de demonstração, a funcionalidade de recuperação de password ainda não está implementada. A solução é aceder à base de dados SQLite diretamente e fazer reset (ou executar `npm run seed -- --reset` para repor o estado inicial).

**P: O funcionário pode promover-se a admin?**
R: Não. Apenas um admin pode alterar o papel de outro utilizador. Atualmente isso é feito removendo e recriando a conta com o novo papel (a edição direta do papel será adicionada numa versão futura).

**P: Existe histórico de quem fez o quê?**
R: Sim. A tabela `stock_movements` regista quem fez cada alteração de stock (com `user_id`). A tabela `orders` regista quem criou cada encomenda no campo `created_by`.

---

**Desenvolvido por Guilherme Silva · PAP 2025/2026**
