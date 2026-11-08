<?php

namespace App\Controllers;

use App\Models\UsuariosModel;

class WebController
{
    public function home()
    {
        $titulo = 'Home';
        $javascript = '<script src="/Assets/Js/home.js" defer></script>';
        $eventos = [];
        $busca = trim((string)($_GET['q'] ?? ''));

        // Se o usuário estiver logado, busca os eventos dele
        if (!empty($_SESSION['usuario']['id'])) {
            try {
                $model = new \App\Models\EventosModel();
                $eventos = $model->buscarPorUsuario((int)$_SESSION['usuario']['id'], $busca);
            } catch (\Throwable $e) {
                error_log('[home] ' . $e->getMessage());
            }
        }

        include __DIR__ . '/../Views/Web/home.php';
    }

    // --- Ações AJAX para os botões da tabela ---

    public function concluirEvento(): void
    {
        $this->processarAcaoEvento(function ($model, $eventoId, $userId) {
            return $model->toggleStatus($eventoId, $userId);
        }, 'Status do evento alterado.');
    }

    public function excluirEvento(): void
    {
        $this->processarAcaoEvento(function ($model, $eventoId, $userId) {
            return $model->excluir($eventoId, $userId);
        }, 'Evento excluído com sucesso.');
    }

    // Método auxiliar para não repetir código nas duas ações acima
    private function processarAcaoEvento(callable $acao, string $mensagemSucesso): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // 1. Verifica Login
        if (empty($_SESSION['usuario']['id'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Faça login novamente.']);
            return;
        }

        // 2. Verifica Método
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        // 3. Verifica CSRF
        $tokenEnviado = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if (!hash_equals($_SESSION['csrf_token'] ?? '', (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // 4. Recebe ID
        $eventoId = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        if (!$eventoId) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'ID do evento inválido.']);
            return;
        }

        // 5. Executa
        try {
            $model = new \App\Models\EventosModel();
            $sucesso = $acao($model, $eventoId, (int)$_SESSION['usuario']['id']);

            if ($sucesso) {
                echo json_encode(['ok' => true, 'msg' => $mensagemSucesso]);
            } else {
                http_response_code(404);
                echo json_encode(['ok' => false, 'msg' => 'Evento não encontrado ou você não tem permissão.']);
            }
        } catch (\Throwable $e) {
            error_log('[processarAcaoEvento] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno no servidor.']);
        }
    }

    public function entrar()
    {
        $titulo = 'Login';
        $javascript = '<script src="/Assets/Js/login.js" defer></script>';
        include __DIR__ . '/../Views/Web/entrar.php';
    }

    public function login(): void
    {
        // --- CORS / cabeçalhos -------------------------------------------------
        // AJAX é feito para a mesma origem; restringimos o Origin por segurança.
        $originPermitido = 'http://192.168.122.18:8000';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($origin !== '' && $origin !== $originPermitido) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'msg' => 'Origem não permitida.']);
            return;
        }

        if ($origin === $originPermitido) {
            header("Access-Control-Allow-Origin: $originPermitido");
            header('Access-Control-Allow-Credentials: true');
        }

        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
        header('Vary: Origin');
        header('Content-Type: application/json; charset=utf-8');

        // Preflight
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            return;
        }

        // --- Método -----------------------------------------------------------
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        // --- CSRF -------------------------------------------------------------
        $tokenEnviado   = $_POST['csrf_token']  ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $tokenSessao    = $_SESSION['csrf_token'] ?? '';

        if ($tokenSessao === '' || !hash_equals($tokenSessao, (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // --- Entrada ----------------------------------------------------------
        $email = trim((string)($_POST['email'] ?? ''));
        $senha = (string)($_POST['senha'] ?? '');

        if ($email === '' || $senha === '') {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'Informe e-mail e senha.']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'E-mail inválido.']);
            return;
        }

        // --- Autenticação -----------------------------------------------------
        try {
            $model   = new UsuariosModel();
            $usuario = $model->buscarPorEmail($email);
        } catch (\Throwable $e) {
            error_log('[login] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno. Tente novamente.']);
            return;
        }

        // Mensagem genérica (não revela se o e-mail existe)
        if ($usuario === null || !password_verify($senha, $usuario['usu_senha'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'msg' => 'Credenciais inválidas.']);
            return;
        }

        if ((int)$usuario['usu_ativo'] !== 1) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'msg' => 'Usuário inativo. Procure o administrador.']);
            return;
        }

        // --- Sessão -----------------------------------------------------------
        session_regenerate_id(true);

        $_SESSION['usuario'] = [
            'id'    => (int)$usuario['usu_id'],
            'nome'  => $usuario['usu_nome'],
            'email' => $usuario['usu_email'],
            'admin' => (int)$usuario['usu_admin'],
        ];

        // Novo token pós-login
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        echo json_encode([
            'ok'    => true,
            'msg'   => 'Login realizado com sucesso.',
            'user'  => $_SESSION['usuario'],
            'redirect' => '/',
        ]);
    }


    public function cadastro()
    {
        $titulo = 'Cadastro';
        $javascript = '<script src="/Assets/Js/cadastro.js" defer></script>';
        include __DIR__ . '/../Views/Web/cadastro.php';
    }

    public function cadastrar(): void
    {
        // --- CORS / cabeçalhos -------------------------------------------------
        $originPermitido = 'http://192.168.122.18:8000';
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($origin !== '' && $origin !== $originPermitido) {
            http_response_code(403);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['ok' => false, 'msg' => 'Origem não permitida.']);
            return;
        }

        if ($origin === $originPermitido) {
            header("Access-Control-Allow-Origin: $originPermitido");
            header('Access-Control-Allow-Credentials: true');
        }

        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Requested-With');
        header('Vary: Origin');
        header('Content-Type: application/json; charset=utf-8');

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            return;
        }

        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        // --- CSRF -------------------------------------------------------------
        $tokenEnviado = $_POST['csrf_token']    ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $tokenSessao  = $_SESSION['csrf_token'] ?? '';

        if ($tokenSessao === '' || !hash_equals($tokenSessao, (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // --- Entrada e Validação ----------------------------------------------
        $nome  = trim((string)($_POST['nome'] ?? ''));
        $email = trim((string)($_POST['email'] ?? ''));
        $senha = (string)($_POST['senha'] ?? '');
        $confirmar_senha = (string)($_POST['confirmar_senha'] ?? '');

        if ($nome === '' || strlen($nome) < 3) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'O nome deve ter pelo menos 3 caracteres.']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'E-mail inválido.']);
            return;
        }

        if (strlen($senha) < 6) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'A senha deve ter no mínimo 6 caracteres.']);
            return;
        }

        if ($senha !== $confirmar_senha) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'As senhas não conferem.']);
            return;
        }

        // --- Banco de Dados ---------------------------------------------------
        try {
            $model = new UsuariosModel();

            // Verifica se o e-mail já existe
            if ($model->buscarPorEmail($email) !== null) {
                http_response_code(409); // Conflict
                echo json_encode(['ok' => false, 'msg' => 'Este e-mail já está cadastrado.']);
                return;
            }

            // Criptografa a senha
            $hashSenha = password_hash($senha, PASSWORD_DEFAULT);

            // Cadastra no banco
            $model->cadastrarUsuario($nome, $email, $hashSenha);

            echo json_encode([
                'ok' => true,
                'msg' => 'Conta criada com sucesso! Redirecionando para o login...',
                'redirect' => '/entrar'
            ]);
        } catch (\Throwable $e) {
            error_log('[cadastrar] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno ao cadastrar. Tente novamente.']);
        }
    }

    public function novoEvento(): void
    {
        $this->verificarLogin(); // Impede acesso se não estiver logado

        $titulo = 'Novo Evento';
        $javascript = '<script src="/Assets/Js/evento.js" defer></script>';
        $evento = null; // Nulo indica que é um cadastro novo

        include __DIR__ . '/../Views/Web/evento.php';
    }

    public function editarEvento(int $id): void
    {
        $this->verificarLogin();
        $usuarioId = (int)$_SESSION['usuario']['id'];

        try {
            $model = new \App\Models\EventosModel();
            $evento = $model->buscarPorId($id, $usuarioId);

            if (!$evento) {
                header('Location: /');
                exit;
            }
        } catch (\Throwable $e) {
            header('Location: /');
            exit;
        }

        $titulo = 'Editar Evento';
        $javascript = '<script src="/Assets/Js/evento.js" defer></script>';

        include __DIR__ . '/../Views/Web/evento.php';
    }

    public function salvarEvento(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // Validações de segurança básicas (Login, Método, CSRF)
        if (empty($_SESSION['usuario']['id'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada.']);
            return;
        }

        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        $tokenEnviado = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if (!hash_equals($_SESSION['csrf_token'] ?? '', (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // Captura e valida dados
        // $id     = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        // $nome   = trim((string)($_POST['nome'] ?? ''));
        // $data   = trim((string)($_POST['data'] ?? ''));
        // $ativo  = filter_input(INPUT_POST, 'ativo', FILTER_VALIDATE_INT) === 1 ? 1 : 0;
        // $userId = (int)$_SESSION['usuario']['id'];

        // Captura e valida dados
        $id     = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        $nome   = trim((string)($_POST['nome'] ?? ''));
        $data   = trim((string)($_POST['data'] ?? ''));

        // CORREÇÃO:
        // Se o campo 'ativo' foi enviado (mesmo que seja '0'), usa ele.
        // Se NÃO foi enviado (novo evento), assume 1 (Pendente).
        $ativo = isset($_POST['ativo']) ? (int)$_POST['ativo'] : 1;

        $userId = (int)$_SESSION['usuario']['id'];

        if (strlen($nome) < 3) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'O nome do evento deve ter pelo menos 3 caracteres.']);
            return;
        }

        // Valida formato da data (YYYY-MM-DD)
        $d = \DateTime::createFromFormat('Y-m-d', $data);
        if (!$d || $d->format('Y-m-d') !== $data) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'Data inválida.']);
            return;
        }

        try {
            $model = new \App\Models\EventosModel();

            if ($id) {
                // Edição
                $sucesso = $model->atualizar($id, $nome, $data, $ativo, $userId);
                $msg = 'Evento atualizado com sucesso.';
            } else {
                // Criação
                $sucesso = $model->criar($nome, $data, $ativo, $userId);
                $msg = 'Evento criado com sucesso.';
            }

            if ($sucesso) {
                echo json_encode(['ok' => true, 'msg' => $msg, 'redirect' => '/']);
            } else {
                http_response_code(400);
                echo json_encode(['ok' => false, 'msg' => 'Não foi possível salvar o evento (sem alterações ou não encontrado).']);
            }
        } catch (\Throwable $e) {
            error_log('[salvarEvento] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno ao salvar evento.']);
        }
    }

    // Método auxiliar de proteção
    private function verificarLogin(): void
    {
        if (empty($_SESSION['usuario']['id'])) {
            header('Location: /entrar');
            exit;
        }
    }

    public function sair(): void
    {
        // Limpa os dados da sessão
        $_SESSION = [];

        // Remove o cookie da sessão no navegador
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                [
                    'expires'  => time() - 42000,
                    'path'     => $params['path'],
                    'domain'   => $params['domain'],
                    'secure'   => $params['secure'],
                    'httponly' => $params['httponly'],
                    'samesite' => $params['samesite'] ?? 'Lax',
                ]
            );
        }

        // Destrói a sessão no servidor
        session_destroy();

        // Redireciona o navegador para a tela de login
        header('Location: /entrar');
        exit;
    }
}
