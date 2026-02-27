-- ============================================================================
-- ARMAZÉM EXPRESS - SQL SERVER DATABASE
-- ============================================================================
-- Script para criar a base de dados e tabelas necessárias
-- Executar em: SQL Server Management Studio
-- ============================================================================

-- 1. CRIAR BASE DE DADOS
-- ============================================================================
CREATE DATABASE ArmazemExpress;

USE ArmazemExpress;

-- 2. CRIAR TABELA DE UTILIZADORES/EMPRESAS
-- ============================================================================
CREATE TABLE Usuarios (
    UsuarioID INT PRIMARY KEY IDENTITY(1,1),
    NomeEmpresa NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    Plano NVARCHAR(50) NOT NULL, -- 'Startup', 'Profissional', 'Empresarial'
    DataRegistro DATETIME DEFAULT GETDATE(),
    Ativo BIT DEFAULT 1,
    DataUltimoLogin DATETIME NULL
);

-- 3. CRIAR TABELA DE PRODUTOS/STOCK
-- ============================================================================
CREATE TABLE Produtos (
    ProdutoID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    Nome NVARCHAR(255) NOT NULL,
    Tipo NVARCHAR(100) NOT NULL,
    Quantidade INT NOT NULL DEFAULT 0,
    QuantidadeMinima INT NOT NULL DEFAULT 10,
    Preco DECIMAL(10, 2) NOT NULL,
    Prateleira NVARCHAR(50) NOT NULL,
    DataAdicao DATETIME DEFAULT GETDATE(),
    DataUltimaAtualizacao DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE
);

-- 4. CRIAR TABELA DE ENCOMENDAS
-- ============================================================================
CREATE TABLE Encomendas (
    EncomendaID INT PRIMARY KEY IDENTITY(1,1),
    UsuarioID INT NOT NULL,
    NumeroEncomenda NVARCHAR(50) NOT NULL UNIQUE,
    NomeDestinatario NVARCHAR(255) NOT NULL,
    Morada NVARCHAR(500) NOT NULL,
    CodigoPostal NVARCHAR(20) NOT NULL,
    Cidade NVARCHAR(100) NOT NULL,
    Pais NVARCHAR(100) NOT NULL,
    Telefone NVARCHAR(20) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    DataEncomenda DATETIME DEFAULT GETDATE(),
    DataEnvio DATETIME NULL,
    Estado NVARCHAR(50) DEFAULT 'Pendente', -- 'Pendente', 'Enviada', 'Em Trânsito', 'Entregue', 'Cancelada'
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID) ON DELETE CASCADE
);

-- 5. CRIAR TABELA DE ITENS DA ENCOMENDA
-- ============================================================================
CREATE TABLE ItensEncomenda (
    ItemID INT PRIMARY KEY IDENTITY(1,1),
    EncomendaID INT NOT NULL,
    ProdutoID INT NOT NULL,
    Quantidade INT NOT NULL,
    PrecoUnitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (EncomendaID) REFERENCES Encomendas(EncomendaID) ON DELETE CASCADE,
    FOREIGN KEY (ProdutoID) REFERENCES Produtos(ProdutoID)
);

-- 6. CRIAR TABELA DE RASTREIO
-- ============================================================================
CREATE TABLE Rastreio (
    RastreioID INT PRIMARY KEY IDENTITY(1,1),
    EncomendaID INT NOT NULL,
    Estado NVARCHAR(50) NOT NULL,
    Localizacao NVARCHAR(255) NOT NULL,
    DataAtualizacao DATETIME DEFAULT GETDATE(),
    Descricao NVARCHAR(500) NULL,
    FOREIGN KEY (EncomendaID) REFERENCES Encomendas(EncomendaID) ON DELETE CASCADE
);

-- 7. CRIAR TABELA DE MOVIMENTAÇÃO DE STOCK
-- ============================================================================
CREATE TABLE MovimentacaoStock (
    MovimentacaoID INT PRIMARY KEY IDENTITY(1,1),
    ProdutoID INT NOT NULL,
    UsuarioID INT NOT NULL,
    TipoMovimento NVARCHAR(50) NOT NULL, -- 'Entrada', 'Saída', 'Ajuste'
    Quantidade INT NOT NULL,
    Motivo NVARCHAR(255) NOT NULL,
    DataMovimento DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (ProdutoID) REFERENCES Produtos(ProdutoID),
    FOREIGN KEY (UsuarioID) REFERENCES Usuarios(UsuarioID)
);

-- 8. CRIAR ÍNDICES PARA MELHOR PERFORMANCE
-- ============================================================================
CREATE INDEX IDX_Usuarios_Email ON Usuarios(Email);
CREATE INDEX IDX_Produtos_UsuarioID ON Produtos(UsuarioID);
CREATE INDEX IDX_Encomendas_UsuarioID ON Encomendas(UsuarioID);
CREATE INDEX IDX_Encomendas_Estado ON Encomendas(Estado);
CREATE INDEX IDX_Rastreio_EncomendaID ON Rastreio(EncomendaID);
CREATE INDEX IDX_MovimentacaoStock_ProdutoID ON MovimentacaoStock(ProdutoID);

-- 9. INSERIR DADOS DE TESTE
-- ============================================================================
-- Inserir utilizador de teste
INSERT INTO Usuarios (NomeEmpresa, Email, PasswordHash, Plano, Ativo)
VALUES 
    ('Empresa Teste Lda.', 'teste@armazem.pt', 'hashed_password_123', 'Profissional', 1),
    ('Logística Express', 'logistica@express.pt', 'hashed_password_456', 'Empresarial', 1);

-- Inserir produtos de teste
INSERT INTO Produtos (UsuarioID, Nome, Tipo, Quantidade, QuantidadeMinima, Preco, Prateleira)
VALUES 
    (1, 'Parafuso M8', 'Hardware', 500, 50, 0.50, 'A1'),
    (1, 'Corrente 10mm', 'Hardware', 100, 20, 5.00, 'A2'),
    (1, 'Porca M8', 'Hardware', 300, 30, 0.30, 'A3'),
    (2, 'Caixa Papelão 20x20', 'Embalagem', 1000, 100, 0.80, 'B1'),
    (2, 'Fita Adesiva', 'Embalagem', 200, 50, 2.00, 'B2');

-- Inserir encomenda de teste
INSERT INTO Encomendas (UsuarioID, NumeroEncomenda, NomeDestinatario, Morada, CodigoPostal, Cidade, Pais, Telefone, Email, Estado)
VALUES 
    (1, 'ENC-001-2025', 'João Silva', 'Rua da Paz, 123', '1000-001', 'Lisboa', 'Portugal', '912345678', 'joao@email.com', 'Enviada'),
    (1, 'ENC-002-2025', 'Maria Santos', 'Avenida Brasil, 456', '4000-001', 'Porto', 'Portugal', '923456789', 'maria@email.com', 'Pendente');

-- Inserir itens da encomenda
INSERT INTO ItensEncomenda (EncomendaID, ProdutoID, Quantidade, PrecoUnitario)
VALUES 
    (1, 1, 50, 0.50),
    (1, 2, 10, 5.00),
    (2, 3, 100, 0.30);

-- Inserir rastreio
INSERT INTO Rastreio (EncomendaID, Estado, Localizacao, Descricao)
VALUES 
    (1, 'Enviada', 'Armazém Lisboa', 'Encomenda preparada e enviada'),
    (1, 'Em Trânsito', 'Centro de Distribuição Porto', 'Encomenda em trânsito para destino final'),
    (2, 'Pendente', 'Armazém Lisboa', 'Encomenda aguardando processamento');

-- 10. CRIAR VIEWS ÚTEIS
-- ============================================================================
-- View: Resumo de Stock por Utilizador
CREATE VIEW vw_ResumoStock AS
SELECT 
    u.UsuarioID,
    u.NomeEmpresa,
    COUNT(p.ProdutoID) AS TotalProdutos,
    SUM(p.Quantidade) AS QuantidadeTotalStock,
    SUM(CASE WHEN p.Quantidade < p.QuantidadeMinima THEN 1 ELSE 0 END) AS ProdutosStockBaixo,
    SUM(CASE WHEN p.Quantidade = 0 THEN 1 ELSE 0 END) AS ProdutosSemStock
FROM Usuarios u
LEFT JOIN Produtos p ON u.UsuarioID = p.UsuarioID
GROUP BY u.UsuarioID, u.NomeEmpresa;

-- View: Encomendas Pendentes
CREATE VIEW vw_EncomendasPendentes AS
SELECT 
    e.EncomendaID,
    e.NumeroEncomenda,
    u.NomeEmpresa,
    e.NomeDestinatario,
    e.DataEncomenda,
    COUNT(ie.ItemID) AS TotalItens
FROM Encomendas e
JOIN Usuarios u ON e.UsuarioID = u.UsuarioID
LEFT JOIN ItensEncomenda ie ON e.EncomendaID = ie.EncomendaID
WHERE e.Estado = 'Pendente'
GROUP BY e.EncomendaID, e.NumeroEncomenda, u.NomeEmpresa, e.NomeDestinatario, e.DataEncomenda;

-- View: Histórico de Movimentação de Stock
CREATE VIEW vw_HistoricoMovimentacao AS
SELECT 
    ms.MovimentacaoID,
    p.Nome AS NomeProduto,
    ms.TipoMovimento,
    ms.Quantidade,
    ms.Motivo,
    ms.DataMovimento,
    u.NomeEmpresa
FROM MovimentacaoStock ms
JOIN Produtos p ON ms.ProdutoID = p.ProdutoID
JOIN Usuarios u ON ms.UsuarioID = u.UsuarioID
ORDER BY ms.DataMovimento DESC;

-- 11. CRIAR STORED PROCEDURES
-- ============================================================================
-- SP: Atualizar Stock após Encomenda
CREATE PROCEDURE sp_AtualizarStockEncomenda
    @EncomendaID INT
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        -- Atualizar stock para cada item da encomenda
        UPDATE p
        SET p.Quantidade = p.Quantidade - ie.Quantidade
        FROM Produtos p
        INNER JOIN ItensEncomenda ie ON p.ProdutoID = ie.ProdutoID
        WHERE ie.EncomendaID = @EncomendaID;

        -- Registar movimentação de stock
        INSERT INTO MovimentacaoStock (ProdutoID, UsuarioID, TipoMovimento, Quantidade, Motivo, DataMovimento)
        SELECT 
            ie.ProdutoID,
            e.UsuarioID,
            'Saída',
            ie.Quantidade,
            'Encomenda #' + e.NumeroEncomenda,
            GETDATE()
        FROM ItensEncomenda ie
        JOIN Encomendas e ON ie.EncomendaID = e.EncomendaID
        WHERE ie.EncomendaID = @EncomendaID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- SP: Adicionar Novo Produto
CREATE PROCEDURE sp_AdicionarProduto
    @UsuarioID INT,
    @Nome NVARCHAR(255),
    @Tipo NVARCHAR(100),
    @Quantidade INT,
    @QuantidadeMinima INT,
    @Preco DECIMAL(10, 2),
    @Prateleira NVARCHAR(50)
AS
BEGIN
    BEGIN TRANSACTION
    BEGIN TRY
        INSERT INTO Produtos (UsuarioID, Nome, Tipo, Quantidade, QuantidadeMinima, Preco, Prateleira)
        VALUES (@UsuarioID, @Nome, @Tipo, @Quantidade, @QuantidadeMinima, @Preco, @Prateleira);

        -- Registar movimentação de stock
        INSERT INTO MovimentacaoStock (ProdutoID, UsuarioID, TipoMovimento, Quantidade, Motivo)
        VALUES (SCOPE_IDENTITY(), @UsuarioID, 'Entrada', @Quantidade, 'Produto adicionado ao sistema');

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- 12. MENSAGEM DE SUCESSO
-- ============================================================================
PRINT '✓ Base de dados Armazém Express criada com sucesso!';
PRINT '✓ Tabelas criadas: Usuarios, Produtos, Encomendas, ItensEncomenda, Rastreio, MovimentacaoStock';
PRINT '✓ Views criadas: vw_ResumoStock, vw_EncomendasPendentes, vw_HistoricoMovimentacao';
PRINT '✓ Stored Procedures criadas: sp_AtualizarStockEncomenda, sp_AdicionarProduto';
PRINT '✓ Dados de teste inseridos com sucesso!';
PRINT '';
PRINT 'Próximos passos:';
PRINT '1. Conectar a aplicação à base de dados';
PRINT '2. Testar as funcionalidades de login e registro';
PRINT '3. Implementar as APIs de gestão de stock';
