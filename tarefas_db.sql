-- phpMyAdmin SQL Dump
-- version 5.2.2deb1+deb13u1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Tempo de geração: 08/11/2026 às 21:51
-- Versão do servidor: 11.8.6-MariaDB-0+deb13u1 from Debian
-- Versão do PHP: 8.4.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `tarefas_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `t_eventos`
--

CREATE TABLE `t_eventos` (
  `eve_id` int(11) NOT NULL,
  `eve_nome` varchar(255) NOT NULL,
  `eve_dt_evento` date NOT NULL,
  `eve_dt_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `eve_ativo` tinyint(1) NOT NULL DEFAULT 0,
  `eve_fk_usu` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `t_usuarios`
--

CREATE TABLE `t_usuarios` (
  `usu_id` int(11) NOT NULL,
  `usu_nome` varchar(255) NOT NULL,
  `usu_email` varchar(150) NOT NULL,
  `usu_senha` varchar(255) NOT NULL,
  `usu_dt_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `usu_admin` tinyint(1) NOT NULL DEFAULT 0,
  `usu_ativo` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `t_eventos`
--
ALTER TABLE `t_eventos`
  ADD PRIMARY KEY (`eve_id`),
  ADD KEY `fk_eve_usu` (`eve_fk_usu`);

--
-- Índices de tabela `t_usuarios`
--
ALTER TABLE `t_usuarios`
  ADD PRIMARY KEY (`usu_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `t_eventos`
--
ALTER TABLE `t_eventos`
  MODIFY `eve_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `t_usuarios`
--
ALTER TABLE `t_usuarios`
  MODIFY `usu_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `t_eventos`
--
ALTER TABLE `t_eventos`
  ADD CONSTRAINT `fk_eve_usu` FOREIGN KEY (`eve_fk_usu`) REFERENCES `t_usuarios` (`usu_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
