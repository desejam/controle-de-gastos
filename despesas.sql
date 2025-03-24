-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 24/03/2025 às 23:44
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `despesas`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `nome_despesa` varchar(255) NOT NULL,
  `categoria` varchar(20) NOT NULL,
  `valor_total` decimal(10,2) NOT NULL,
  `numero_parcelas` int(11) NOT NULL,
  `valor_parcelado` decimal(10,2) NOT NULL,
  `data_adicao` datetime DEFAULT current_timestamp(),
  `data_vencimento` date NOT NULL,
  `forma_pagamento` enum('Pix','Cartão de Crédito') NOT NULL,
  `status_pagamento` enum('Pendente','Pago') NOT NULL DEFAULT 'Pendente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `nome_despesa`, `categoria`, `valor_total`, `numero_parcelas`, `valor_parcelado`, `data_adicao`, `data_vencimento`, `forma_pagamento`, `status_pagamento`) VALUES
(27, 'Micro-ondas', 'Outubro', 1300.00, 6, 216.67, '2025-02-26 00:00:00', '2025-04-20', 'Cartão de Crédito', 'Pago'),
(29, 'Câmera de Segurança', 'Dezembro', 1400.00, 7, 200.00, '2025-02-26 00:00:00', '2025-05-10', 'Pix', 'Pago');

--
-- Acionadores `produtos`
--
DELIMITER $$
CREATE TRIGGER `atualizar_valor_parcelado` BEFORE INSERT ON `produtos` FOR EACH ROW BEGIN
  IF NEW.numero_parcelas > 0 THEN
    SET NEW.valor_parcelado = NEW.valor_total / NEW.numero_parcelas;
  ELSE
    SET NEW.valor_parcelado = NEW.valor_total;
  END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `atualizar_valor_parcelado_update` BEFORE UPDATE ON `produtos` FOR EACH ROW BEGIN
  IF NEW.numero_parcelas > 0 THEN
    SET NEW.valor_parcelado = NEW.valor_total / NEW.numero_parcelas;
  ELSE
    SET NEW.valor_parcelado = NEW.valor_total;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estrutura para tabela `saldo`
--

CREATE TABLE `saldo` (
  `id` int(11) NOT NULL,
  `saldo_total` decimal(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `saldo`
--

INSERT INTO `saldo` (`id`, `saldo_total`) VALUES
(1, 1500.00);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `password`) VALUES
(1, 'vn', '123'),
(2, 'matheus', '123');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `saldo`
--
ALTER TABLE `saldo`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de tabela `saldo`
--
ALTER TABLE `saldo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
