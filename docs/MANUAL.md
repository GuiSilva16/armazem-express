# Manual de Utilizador — Armazém Express

**Sistema de Gestão de Armazém (WMS) para PMEs**
PAP · Guilherme Silva · Técnico de Gestão e Programação de Sistemas Informáticos

> 💡 Ao longo deste manual, os marcadores `📷 [Imagem: ...]` indicam onde deves inserir uma captura de ecrã no relatório final.

---

## Índice
1. [Introdução](#1-introdução)
2. [Aceder à aplicação](#2-aceder-à-aplicação)
3. [Painel principal (Dashboard)](#3-painel-principal-dashboard)
4. [Gestão de stock](#4-gestão-de-stock)
5. [Encomendas e expedição](#5-encomendas-e-expedição)
6. [Rastreio público](#6-rastreio-público)
7. [Relatórios](#7-relatórios)
8. [Equipa](#8-equipa)
9. [Fornecedores e reposição](#9-fornecedores-e-reposição)
10. [Definições](#10-definições)
11. [Leitor de QR](#11-leitor-de-qr)
12. [Perfis e permissões](#12-perfis-e-permissões)
13. [Perguntas frequentes](#13-perguntas-frequentes)

---

## 1. Introdução

O **Armazém Express** é uma aplicação web que ajuda pequenas e médias empresas a gerir o seu armazém: produtos, stock, encomendas, expedições e rastreio — tudo num só sítio, em tempo real, substituindo as folhas de Excel.

**Principais funcionalidades:**
- Gestão de produtos com SKU e código QR
- Controlo de stock com alertas de rutura
- Criação e expedição de encomendas com validação portuguesa
- Rastreio público de encomendas (sem necessidade de login)
- Relatórios com gráficos e previsão de rutura
- Gestão de equipa e planos de subscrição

---

## 2. Aceder à aplicação

1. Abre o site no browser:
   - **Online:** `https://armazem-express.vercel.app`
   - **Local:** `http://localhost:5173`
2. Na página inicial, clica em **"Entrar"**.
3. Introduz o **email** e a **palavra-passe**.
4. (Opcional) Marca **"Manter sessão iniciada"**.

> 📷 [Imagem: página de login]

**Credenciais de demonstração:**

| Perfil | Email | Palavra-passe |
|--------|-------|---------------|
| Administrador | `demo@armazem-express.pt` | `Demo@2025!` |
| Funcionário | `funcionario@armazem-express.pt` | `Trabalhador@2025` |

> Na primeira entrada aparece um **ecrã de boas-vindas** com um resumo das funcionalidades.

**Esqueceu-se da palavra-passe?** Clique em *"Esqueci-me da palavra-passe?"* e introduza o email. Receberá **um email com um link** (válido durante 1 hora) que abre uma página para definir uma nova palavra-passe. Por segurança, o login bloqueia temporariamente após várias tentativas falhadas.

---

## 3. Painel principal (Dashboard)

É o primeiro ecrã após o login. Mostra uma visão geral do armazém:

- **Cartões de estatísticas:** total de produtos, em stock, stock baixo, sem stock, encomendas, valor em inventário.
- **Saúde do inventário:** medidor circular com a percentagem de produtos saudáveis.
- **Ações rápidas:** atalhos para adicionar produto, nova encomenda, etc.
- **Alertas:** produtos sem stock, stock baixo e encomendas por processar.
- **Movimento de stock:** gráfico das entradas/saídas, com comparação face ao período anterior e filtro de 7 ou 30 dias.
- **Top produtos por valor** e **distribuição por categoria**.

> 📷 [Imagem: dashboard completo]

Podes ainda **exportar o dashboard em PDF** e **copiar um resumo** através dos botões no topo.

---

## 4. Gestão de stock

Menu lateral → **Stock**.

### 4.1 Adicionar um produto
1. Clica em **"Adicionar"** (ou no atalho do dashboard).
2. Preenche: nome, categoria, quantidade, stock mínimo, **preço de venda**, **preço de custo**, **validade** e **lote** (opcionais), prateleira e **fornecedor** (lista).
3. Clica em **"Guardar"**. O sistema gera automaticamente um **SKU** e um **código QR**.

> 💰 O **preço de custo** permite calcular a **margem de lucro** e o valor do inventário a custo (visíveis no dashboard).
> 📅 A **validade** ativa alertas de produtos a expirar (úteis para perecíveis).

> 📷 [Imagem: formulário de adicionar produto]

### 4.2 Ajustar quantidade
Na ficha do produto, usa **"Adicionar stock"** ou **"Remover stock"**, indicando a quantidade e o motivo. Cada movimento fica registado no histórico.

### 4.3 Importar produtos por CSV
1. Em Stock, clica em **"Importar"**.
2. Clica em **"Descarregar modelo"** para obteres o ficheiro de exemplo.
3. Preenche o CSV e volta a carregá-lo.
4. O sistema valida e adiciona os produtos em massa.

### 4.4 Produtos favoritos
Clica na **estrela** ⭐ de um produto para o fixar no topo da lista.

### 4.5 Etiquetas QR e PDF
- **"Etiquetas"** — imprime etiquetas com o QR dos produtos.
- **"Exportar PDF"** — gera um relatório de inventário com logótipo, totais e gráfico.

> 📷 [Imagem: lista de stock com etiquetas QR]

---

## 5. Encomendas e expedição

Menu lateral → **Encomendas** / **Enviar**.

1. Clica em **"Nova encomenda"**.
2. Preenche os dados do destinatário (nome, morada, cidade, **código postal** e **telefone** — validados ao formato português).
3. Adiciona os produtos e as quantidades.
4. Ao guardar, o **stock é descontado automaticamente** e é gerado um **número de rastreio**.

> 📷 [Imagem: criação de encomenda]

Os estados de uma encomenda evoluem: **Pendente → Expedida → Em trânsito → Entregue**.

### 5.1 Devoluções
Na ficha de uma encomenda, o botão **"Registar devolução"** marca-a como **Devolvida** e **repõe automaticamente o stock** dos produtos que tinham sido descontados.

---

## 6. Rastreio público

Qualquer pessoa pode acompanhar uma encomenda **sem fazer login**:

1. Aceder a `https://armazem-express.vercel.app/track`
2. Introduzir o **número de rastreio**.
3. Ver o estado atual, a linha do tempo e a informação da entrega (o nome do destinatário aparece parcialmente oculto, por privacidade).

> 📷 [Imagem: página de rastreio público]

---

## 7. Relatórios

Menu lateral → **Relatórios**.

- Gráficos de **movimento de stock**, **distribuição por categoria**, **top produtos por valor** e **estados das encomendas**.
- **Previsão de rutura:** estima em quantos dias cada produto vai esgotar, com base no consumo recente.
- Filtro de período **7 / 30 dias** e botão para **exportar em PDF**.

> 📷 [Imagem: página de relatórios com gráficos]

---

## 8. Equipa

Menu lateral → **Equipa** (apenas administradores).

- Ver a lista de utilizadores da empresa.
- **Adicionar funcionários** (o sistema gera uma palavra-passe segura).
- Ativar/desativar contas.
- Exportar a lista em PDF.

> O número de utilizadores está limitado pelo plano de subscrição.

---

## 9. Fornecedores e reposição

### 9.1 Fornecedores
Menu lateral → **Fornecedores** (admin).

- Ver todos os fornecedores, com o número de produtos associados a cada um.
- **Adicionar / editar** fornecedores (nome, email, telefone, NIF, morada, notas).
- Ao criar um produto, pode associá-lo a um fornecedor da lista.

> 📷 [Imagem: página de fornecedores]

### 9.2 Reposição (encomendas de compra)
Menu lateral → **Reposição** (admin).

1. A coluna **"Sugestões de reposição"** mostra os produtos com **stock baixo**, com uma quantidade sugerida.
2. Clica em **"Adicionar"** para os juntar à nova encomenda de compra.
3. Escolhe o **fornecedor**, ajusta quantidades e custos, e clica em **"Criar encomenda de compra"**.
4. Quando a mercadoria chega, clica em **"Rececionar"** — o **stock é reposto automaticamente** e fica registado no histórico de movimentos.

> Isto fecha o ciclo com a *previsão de rutura*: passa de "vai faltar" para "repor com um clique".

> 📷 [Imagem: página de reposição]

---

## 10. Definições

Menu lateral → **Definições**.

- **Plano atual:** consumo de produtos/utilizadores e funcionalidades incluídas.
- **Dados da empresa:** morada, código postal, telefone e **NIF** — aparecem no cabeçalho dos relatórios PDF.
- **Logótipo da empresa:** carrega uma imagem que substitui o logótipo padrão nos PDFs.
- **Faturação:** histórico de faturas Stripe e acesso ao portal de gestão (admin).
- **Aparência:** alternar entre **modo claro** e **modo escuro**.
- **Mudar de plano:** fazer upgrade/downgrade da subscrição.

> 📷 [Imagem: definições — dados da empresa e logótipo]

---

## 11. Leitor de QR

Menu lateral → **QR Scanner**.

Permite ler o código QR de um produto através da **câmara do telemóvel/computador** e abrir diretamente a respetiva ficha.

---

## 12. Perfis e permissões

| Ação | Administrador | Funcionário |
|------|:---:|:---:|
| Ver dashboard e stock | ✅ | ✅ |
| Adicionar/editar produtos | ✅ | ✅ |
| Criar encomendas e registar devoluções | ✅ | ✅ |
| Ver fornecedores | ✅ | ✅ |
| Gerir fornecedores e reposições | ✅ | ❌ |
| Gerir equipa | ✅ | ❌ |
| Dados da empresa e faturação | ✅ | ❌ |
| Mudar de plano | ✅ | ❌ |
| Eliminar produtos | ✅ | ❌ |

---

## 13. Perguntas frequentes

**O site demora a abrir na primeira vez.**
No alojamento gratuito, o servidor "adormece" após ~15 minutos sem uso. O primeiro acesso seguinte pode demorar ~50 segundos a responder. Depois fica rápido.

**Esqueci-me da palavra-passe.**
Na página de login, clica em *"Esqueci-me da palavra-passe?"* e introduz o teu email — recebes um link por email para definir uma nova. Em alternativa, o administrador da empresa também pode repor a conta.

**Os dados de demonstração reaparecem.**
No ambiente de demonstração, a base de dados é reposta com dados de exemplo quando o servidor reinicia.

**Posso instalar no telemóvel?**
Sim. A aplicação é uma **PWA** — no browser do telemóvel, escolhe "Adicionar ao ecrã principal".

---

*Armazém Express — Manual de Utilizador · © Guilherme Silva*
