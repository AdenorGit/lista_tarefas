# 📅 Lista de Eventos

Aplicação web desenvolvida em **PHP puro** para gerenciamento de eventos pessoais. Cada usuário pode se cadastrar, autenticar-se e gerenciar sua própria lista de eventos (criar, editar, concluir e excluir), com isolamento total entre contas.

O projeto foi construído seguindo o padrão **MVC** (Model-View-Controller), com foco em **segurança** (CSRF, hash de senhas, prepared statements) e **experiência do usuário** (AJAX, feedback em tempo real, layout responsivo).

---

## 🚀 Tecnologias utilizadas

| Categoria | Tecnologia |
|---|---|
| **Linguagem** | PHP 8.1+ |
| **Arquitetura** | MVC (Model-View-Controller) |
| **Banco de dados** | MySQL / MariaDB (via PDO) |
| **Gerenciador de dependências** | Composer |
| **Roteamento** | [bramus/router](https://github.com/bramus/router) `^1.6` |
| **Variáveis de ambiente** | [vlucas/phpdotenv](https://github.com/vlucas/phpdotenv) `^5.7` |
| **Frontend** | HTML5, CSS3 (Flexbox), JavaScript (Fetch API) |
| **Servidor de testes** | PHP Built-in Server (`php -S`) |

---

## ✨ Funcionalidades

### 👤 Autenticação
- ✅ Cadastro de usuário com validação de nome, e-mail e senha
- ✅ Confirmação de senha no cliente e no servidor
- ✅ Login com `password_verify()` (hash bcrypt)
- ✅ Logout seguro (destrói sessão e cookie)
- ✅ Bloqueio de usuários inativos (`usu_ativo = 0`)
- ✅ Regeneração de ID de sessão após login (previne *session fixation*)

### 📝 Eventos
- ✅ Listagem de eventos por usuário logado
- ✅ Criação de novo evento
- ✅ Edição de evento existente
- ✅ Alternar status entre **Pendente** e **Concluído** (via AJAX)
- ✅ Exclusão de evento com confirmação (via AJAX)
- ✅ Busca por nome de evento (`?q=termo`)
- ✅ Isolamento total: cada usuário vê apenas seus próprios eventos

### 🎨 Interface
- ✅ Layout responsivo (mobile-friendly)
- ✅ Feedback visual em tempo real (`div#msg`) sem recarregar a página
- ✅ Botões de ação com estado visual (concluído em verde)
- ✅ Menu adaptativo (visitante vs. logado)
- ✅ Pesquisa preservada na URL (bookmarkável)

---

## 🔒 Segurança implementada

| Recurso | Implementação |
|---|---|
| **SQL Injection** | PDO com `prepared statements` (`ATTR_EMULATE_PREPARES = false`) |
| **XSS** | `htmlspecialchars()` em toda saída dinâmica |
| **CSRF** | Token em `<meta>`, `<input hidden>` e header `X-CSRF-Token` |
| **Session Fixation** | `session_regenerate_id(true)` após login |
| **Senhas em texto puro** | ❌ Nunca — sempre `password_hash()` com `PASSWORD_DEFAULT` |
| **Enumeração de e-mails** | Mensagem genérica em login ("Credenciais inválidas") |
| **Logout CSRF** | Logout por `GET` simples (risco aceitável para uso interno; pode migrar para POST) |
| **Isolamento de dados** | Todas as queries filtram por `usu_id` do usuário logado |
| **Exposição de erros** | Logados em `error_log`, mas não exibidos ao usuário |

---

## 📂 Estrutura de diretórios

lista_eventos/
│
├── App/
│ ├── Controllers/
│ │ └── WebController.php # Controller principal (todas as rotas)
│ │
│ ├── Models/
│ │ ├── EventosModel.php # CRUD de eventos
│ │ └── UsuariosModel.php # CRUD de usuários
│ │
│ ├── Database/
│ │ └── ConnDb.php # Conexão PDO (singleton por instância)
│ │
│ ├── Routers/
│ │ └── router.php # Definição de todas as rotas
│ │
│ └── Views/
│ ├── Web/
│ │ ├── home.php # Lista de eventos
│ │ ├── entrar.php # Formulário de login
│ │ ├── cadastro.php # Formulário de cadastro
│ │ └── evento.php # Formulário de novo/editar evento
│ │
│ └── Templates/
│ ├── tmp_head.php # <head>, metatags, CSS, JS
│ ├── tmp_header.php # Navegação com busca e menu
│ ├── tmp_msg.php # div#msg (feedback AJAX)
│ ├── tmp_footer.php # <footer>
│ └── tmp_fim.php # </body></html>
│
├── Public/
│ ├── index.php # Entry point (front controller)
│ ├── .htaccess # Rewrite para Apache (produção)
│ │
│ └── Assets/
│ ├── Css/
│ │ └── styles.css # Estilos globais
│ ├── Js/
│ │ ├── home.js # AJAX de concluir/excluir eventos
│ │ ├── login.js # AJAX de login
│ │ ├── cadastro.js # AJAX de cadastro
│ │ └── evento.js # AJAX de salvar evento
│ └── Img/
│ └── Ico/
│ └── favico.ico
│
├── vendor/ # Dependências do Composer (gitignored)
│
├── .env # Credenciais (gitignored)
├── .env.example # Template do .env
├── .gitignore
├── composer.json
├── composer.lock
└── README.md


---

## ⚙️ Instalação

### Pré-requisitos

- **PHP 8.1+** com extensões `pdo`, `pdo_mysql`, `mbstring`
- **Composer** ([download](https://getcomposer.org/))
- **MySQL 5.7+** ou **MariaDB 10.3+**

### Passo a passo

**1. Clone o repositório**

```bash
git clone https://github.com/adenor/lista_tarefas.git
cd lista_tarefas

composer install

cp .env.example .env

DB_HOST=localhost
DB_NAME=tarefas_db
DB_USER=seu_usuario
DB_PASS=sua_senha

CREATE DATABASE tarefas_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tarefas_db;

-- Tabela de usuários
CREATE TABLE t_usuarios (
    usu_id         INT AUTO_INCREMENT PRIMARY KEY,
    usu_nome       VARCHAR(100) NOT NULL,
    usu_email      VARCHAR(100) NOT NULL UNIQUE,
    usu_senha      VARCHAR(255) NOT NULL,
    usu_dt_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usu_admin      TINYINT(1) NOT NULL DEFAULT 0,
    usu_ativo      TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- Tabela de eventos
CREATE TABLE t_eventos (
    eve_id          INT AUTO_INCREMENT PRIMARY KEY,
    eve_nome        VARCHAR(255) NOT NULL,
    eve_dt_evento   DATE NOT NULL,
    eve_dt_criacao  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    eve_ativo       TINYINT(1) NOT NULL DEFAULT 1,
    eve_fk_usu      INT NOT NULL,
    CONSTRAINT fk_eve_usu
        FOREIGN KEY (eve_fk_usu)
        REFERENCES t_usuarios(usu_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

php -S 0.0.0.0:8000 -t Public Public/router.php

http://localhost:8000