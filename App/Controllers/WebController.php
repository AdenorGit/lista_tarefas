<?php

namespace App\Controllers;

use App\Models\UsuariosModel;

/**
 * Controller principal da aplicação.
 * 
 * Responsável por receber as requisições roteadas (definidas em router.php)
 * e devolver as respostas adequadas (HTML para páginas, JSON para AJAX).
 * 
 * Organização dos métodos:
 *   - Exibição de páginas: home, entrar, cadastro, novoEvento, editarEvento
 *   - Processamento de formulários/AJAX: login, cadastrar, salvarEvento, concluirEvento, excluirEvento
 *   - Utilitários: sair, verificarLogin, processarAcaoEvento
 */
class WebController
{
    // =================================================================
    //  PÁGINA INICIAL
    // =================================================================

    /**
     * Exibe a página inicial com a lista de eventos do usuário logado.
     * 
     * - Se não estiver autenticado, a View exibirá uma mensagem pedindo login.
     * - Se estiver logado, busca os eventos no banco filtrando pelo usuário.
     * - Aceita o parâmetro de busca "q" (vindo da barra de pesquisa do header).
     */
    public function home()
    {
        $titulo = 'Home';
        $javascript = '<script src="/Assets/Js/home.js" defer></script>';
        $eventos = [];

        // Sanitiza a busca removendo espaços e garantindo que seja string.
        $busca = trim((string)($_GET['q'] ?? ''));

        // Só busca os eventos se o usuário estiver autenticado.
        if (!empty($_SESSION['usuario']['id'])) {
            try {
                $model = new \App\Models\EventosModel();
                $eventos = $model->buscarPorUsuario(
                    (int)$_SESSION['usuario']['id'],
                    $busca
                );
            } catch (\Throwable $e) {
                // Loga o erro, mas não impede a página de carregar.
                // A View exibirá a tabela vazia nesse caso.
                error_log('[home] ' . $e->getMessage());
            }
        }

        include __DIR__ . '/../Views/Web/home.php';
    }


    // =================================================================
    //  AÇÕES AJAX DA TABELA DE EVENTOS (Concluir / Excluir)
    // =================================================================

    /**
     * Alterna o status do evento (Pendente ↔ Concluído).
     * Acionado pelo botão "OK / CONCLUÍDO" da tabela via AJAX.
     */
    public function concluirEvento(): void
    {
        $this->processarAcaoEvento(
            function ($model, $eventoId, $userId) {
                return $model->toggleStatus($eventoId, $userId);
            },
            'Status do evento alterado.'
        );
    }

    /**
     * Exclui um evento permanentemente.
     * Acionado pelo botão "EXCLUIR" da tabela via AJAX.
     */
    public function excluirEvento(): void
    {
        $this->processarAcaoEvento(
            function ($model, $eventoId, $userId) {
                return $model->excluir($eventoId, $userId);
            },
            'Evento excluído com sucesso.'
        );
    }

    /**
     * Método auxiliar para centralizar as validações de segurança comuns
     * às ações da tabela (Concluir e Excluir). Evita duplicação de código.
     *
     * Valida em ordem:
     *   1. Sessão ativa (usuário logado)
     *   2. Método HTTP é POST
     *   3. CSRF Token válido
     *   4. ID do evento é um inteiro válido
     *   5. Executa a ação recebida (callback)
     *
     * @param callable $acao            Função a executar (recebe Model, ID e UserID).
     * @param string   $mensagemSucesso Mensagem devolvida ao cliente em caso de sucesso.
     */
    private function processarAcaoEvento(callable $acao, string $mensagemSucesso): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // 1. Verifica se o usuário está logado.
        if (empty($_SESSION['usuario']['id'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Faça login novamente.']);
            return;
        }

        // 2. Só aceita POST (protege contra ações via link/prefetch).
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        // 3. Verifica o CSRF Token (enviado no corpo ou no header).
        //    "hash_equals" evita timing attacks.
        $tokenEnviado = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        if (!hash_equals($_SESSION['csrf_token'] ?? '', (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // 4. Valida o ID (garante que seja um inteiro).
        $eventoId = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        if (!$eventoId) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'ID do evento inválido.']);
            return;
        }

        // 5. Executa a ação. Se o Model devolver false, o evento
        //    provavelmente não existe ou não pertence ao usuário.
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


    // =================================================================
    //  LOGIN
    // =================================================================

    /**
     * Exibe o formulário de login.
     */
    public function entrar()
    {
        $titulo = 'Login';
        $javascript = '<script src="/Assets/Js/login.js" defer></script>';
        include __DIR__ . '/../Views/Web/entrar.php';
    }

    /**
     * Processa o login via AJAX.
     * 
     * Valida:
     *   - CORS (apenas a origem autorizada)
     *   - Método POST
     *   - CSRF Token
     *   - E-mail e senha
     * 
     * Em caso de sucesso:
     *   - Regenera o ID da sessão (previne Session Fixation)
     *   - Armazena dados básicos do usuário na sessão
     *   - Rotaciona o CSRF Token (o antigo deixa de valer)
     */
    public function login(): void
    {
        // --- CORS / cabeçalhos ---------------------------------------------
        // Restringe a origem para evitar CSRF entre sites.
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

        // Responde ao "preflight" do navegador (CORS).
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            return;
        }

        // --- Método --------------------------------------------------------
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        // --- CSRF ----------------------------------------------------------
        $tokenEnviado = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $tokenSessao  = $_SESSION['csrf_token'] ?? '';

        if ($tokenSessao === '' || !hash_equals($tokenSessao, (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // --- Entrada -------------------------------------------------------
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

        // --- Autenticação --------------------------------------------------
        try {
            $model   = new UsuariosModel();
            $usuario = $model->buscarPorEmail($email);
        } catch (\Throwable $e) {
            error_log('[login] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno. Tente novamente.']);
            return;
        }

        // Mensagem genérica (não revela se o e-mail existe — evita enumeração).
        if ($usuario === null || !password_verify($senha, $usuario['usu_senha'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'msg' => 'Credenciais inválidas.']);
            return;
        }

        // Bloqueia usuários desativados.
        if ((int)$usuario['usu_ativo'] !== 1) {
            http_response_code(403);
            echo json_encode(['ok' => false, 'msg' => 'Usuário inativo. Procure o administrador.']);
            return;
        }

        // --- Sessão --------------------------------------------------------
        // Regenera o ID para evitar Session Fixation.
        session_regenerate_id(true);

        // Armazena apenas os dados básicos do usuário (NUNCA a senha).
        $_SESSION['usuario'] = [
            'id'    => (int)$usuario['usu_id'],
            'nome'  => $usuario['usu_nome'],
            'email' => $usuario['usu_email'],
            'admin' => (int)$usuario['usu_admin'],
        ];

        // Gera um novo token CSRF (o da tela de login não vale mais).
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        echo json_encode([
            'ok'       => true,
            'msg'      => 'Login realizado com sucesso.',
            'user'     => $_SESSION['usuario'],
            'redirect' => '/',
        ]);
    }


    // =================================================================
    //  CADASTRO DE USUÁRIO
    // =================================================================

    /**
     * Exibe o formulário de cadastro de usuário.
     */
    public function cadastro()
    {
        $titulo = 'Cadastro';
        $javascript = '<script src="/Assets/Js/cadastro.js" defer></script>';
        include __DIR__ . '/../Views/Web/cadastro.php';
    }

    /**
     * Processa o cadastro de um novo usuário via AJAX.
     * 
     * Valida CORS, método, CSRF, nome, e-mail e senha.
     * Verifica se o e-mail já existe antes de inserir.
     * Criptografa a senha com password_hash.
     */
    public function cadastrar(): void
    {
        // --- CORS / cabeçalhos ---------------------------------------------
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

        // --- Método --------------------------------------------------------
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            http_response_code(405);
            echo json_encode(['ok' => false, 'msg' => 'Método não permitido.']);
            return;
        }

        // --- CSRF ----------------------------------------------------------
        $tokenEnviado = $_POST['csrf_token'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
        $tokenSessao  = $_SESSION['csrf_token'] ?? '';

        if ($tokenSessao === '' || !hash_equals($tokenSessao, (string)$tokenEnviado)) {
            http_response_code(419);
            echo json_encode(['ok' => false, 'msg' => 'Sessão expirada. Recarregue a página.']);
            return;
        }

        // --- Entrada e Validação -------------------------------------------
        $nome            = trim((string)($_POST['nome'] ?? ''));
        $email           = trim((string)($_POST['email'] ?? ''));
        $senha           = (string)($_POST['senha'] ?? '');
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

        // --- Banco de Dados ------------------------------------------------
        try {
            $model = new UsuariosModel();

            // Impede e-mails duplicados.
            if ($model->buscarPorEmail($email) !== null) {
                http_response_code(409); // Conflict
                echo json_encode(['ok' => false, 'msg' => 'Este e-mail já está cadastrado.']);
                return;
            }

            // Nunca armazena senha em texto puro.
            $hashSenha = password_hash($senha, PASSWORD_DEFAULT);

            $model->cadastrarUsuario($nome, $email, $hashSenha);

            echo json_encode([
                'ok'       => true,
                'msg'      => 'Conta criada com sucesso! Redirecionando para o login...',
                'redirect' => '/entrar',
            ]);
        } catch (\Throwable $e) {
            error_log('[cadastrar] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno ao cadastrar. Tente novamente.']);
        }
    }


    // =================================================================
    //  FORMULÁRIO DE EVENTO (Novo / Editar / Salvar)
    // =================================================================

    /**
     * Exibe o formulário de CRIAÇÃO de um novo evento.
     * A variável $evento fica nula, e a View se encarrega de exibir os campos vazios.
     */
    public function novoEvento(): void
    {
        $this->verificarLogin(); // Bloqueia acesso sem autenticação.

        $titulo = 'Novo Evento';
        $javascript = '<script src="/Assets/Js/evento.js" defer></script>';
        $evento = null;

        include __DIR__ . '/../Views/Web/evento.php';
    }

    /**
     * Exibe o formulário de EDIÇÃO de um evento existente.
     * Busca o evento pelo ID no banco e garante que pertence ao usuário.
     * Se não encontrar, redireciona para a home.
     *
     * @param int $id ID do evento capturado pela regex da rota.
     */
    public function editarEvento(int $id): void
    {
        $this->verificarLogin();
        $usuarioId = (int)$_SESSION['usuario']['id'];

        try {
            $model  = new \App\Models\EventosModel();
            $evento = $model->buscarPorId($id, $usuarioId);

            // Se o evento não existe ou pertence a outro usuário, volta.
            if (!$evento) {
                header('Location: /');
                exit;
            }
        } catch (\Throwable $e) {
            // Em caso de erro, também volta para evitar tela quebrada.
            header('Location: /');
            exit;
        }

        $titulo = 'Editar Evento';
        $javascript = '<script src="/Assets/Js/evento.js" defer></script>';

        include __DIR__ . '/../Views/Web/evento.php';
    }

    /**
     * Salva um evento (cria novo OU atualiza existente).
     * 
     * A decisão é feita pela presença do campo "id" no POST:
     *   - "id" preenchido → atualiza
     *   - "id" ausente    → cria
     */
    public function salvarEvento(): void
    {
        header('Content-Type: application/json; charset=utf-8');

        // --- Segurança básica: Login, Método, CSRF ------------------------
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

        // --- Captura e validação dos dados --------------------------------
        $id     = filter_input(INPUT_POST, 'id', FILTER_VALIDATE_INT);
        $nome   = trim((string)($_POST['nome'] ?? ''));
        $data   = trim((string)($_POST['data'] ?? ''));

        // CORREÇÃO: se 'ativo' veio no POST (edição), respeita o valor.
        // Se não veio (novo evento), assume 1 (Pendente).
        // O formulário de criação envia um <input type="hidden" value="1">
        // justamente para tornar esse comportamento previsível.
        $ativo  = isset($_POST['ativo']) ? (int)$_POST['ativo'] : 1;
        $userId = (int)$_SESSION['usuario']['id'];

        if (strlen($nome) < 3) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'O nome do evento deve ter pelo menos 3 caracteres.']);
            return;
        }

        // Valida o formato de data YYYY-MM-DD rigorosamente.
        // Isso evita que datas como "2024-13-45" passem.
        $d = \DateTime::createFromFormat('Y-m-d', $data);
        if (!$d || $d->format('Y-m-d') !== $data) {
            http_response_code(422);
            echo json_encode(['ok' => false, 'msg' => 'Data inválida.']);
            return;
        }

        // --- Persistência -------------------------------------------------
        try {
            $model = new \App\Models\EventosModel();

            if ($id) {
                // Edição
                $sucesso = $model->atualizar($id, $nome, $data, $ativo, $userId);
                $msg     = 'Evento atualizado com sucesso.';
            } else {
                // Criação
                $sucesso = $model->criar($nome, $data, $ativo, $userId);
                $msg     = 'Evento criado com sucesso.';
            }

            if ($sucesso) {
                echo json_encode(['ok' => true, 'msg' => $msg, 'redirect' => '/']);
            } else {
                // Geralmente ocorre quando o UPDATE não alterou nada
                // (mesmos dados) ou o evento não pertence ao usuário.
                http_response_code(400);
                echo json_encode([
                    'ok'  => false,
                    'msg' => 'Não foi possível salvar o evento (sem alterações ou não encontrado).',
                ]);
            }
        } catch (\Throwable $e) {
            error_log('[salvarEvento] ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['ok' => false, 'msg' => 'Erro interno ao salvar evento.']);
        }
    }


    // =================================================================
    //  UTILITÁRIOS
    // =================================================================

    /**
     * Verifica se há um usuário logado.
     * Se não houver, redireciona para a tela de login e encerra a execução.
     * Usado em páginas que exigem autenticação (ex: novoEvento, editarEvento).
     */
    private function verificarLogin(): void
    {
        if (empty($_SESSION['usuario']['id'])) {
            header('Location: /entrar');
            exit;
        }
    }

    /**
     * Encerra a sessão do usuário (logout).
     * 
     * Etapas:
     *   1. Esvazia os dados da sessão em memória
     *   2. Remove o cookie PHPSESSID do navegador (expira no passado)
     *   3. Destrói o arquivo de sessão no servidor
     *   4. Redireciona para a tela de login
     */
    public function sair(): void
    {
        // 1. Esvazia os dados da sessão em memória.
        $_SESSION = [];

        // 2. Invalida o cookie no navegador (expira no passado).
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

        // 3. Apaga o arquivo de sessão do servidor.
        session_destroy();

        // 4. Redireciona o navegador para o login.
        header('Location: /entrar');
        exit;
    }
}
