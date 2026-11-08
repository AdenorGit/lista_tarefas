<?php

namespace App\Controllers;

use App\Models\UsuariosModel;

class WebController
{
    public function home()
    {

        $titulo = 'Home';

        include __DIR__ . '/../Views/Web/home.php';
    }


    public function entrar()
    {
        $titulo = 'Login';
        $javascript = '<script src="/Assets/Js/login.js" defer></script>';

        include __DIR__ . '/../Views/Web/entrar.php';
    }


    public function login(): void
    {
        // === 1. Garante que a sessão está ativa =========================
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // === 2. Cabeçalhos: JSON + bloqueio de CORS =====================
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');

        // Só aceita requisições da mesma origem (mesmo Host)
        $this->validarMesmaOrigem();

        // === 3. Método HTTP =============================================
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            header('Allow: POST');
            $this->jsonErro('Método não permitido.');
        }

        // === 4. Content-Type deve ser JSON ==============================
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') === false) {
            http_response_code(415);
            $this->jsonErro('Content-Type deve ser application/json.');
        }

        // === 5. Lê o corpo JSON =========================================
        $raw  = file_get_contents('php://input');
        $body = json_decode($raw, true);

        if (!is_array($body)) {
            http_response_code(400);
            $this->jsonErro('Corpo da requisição inválido.');
        }

        $email      = trim($body['email']      ?? '');
        $senha      = (string)($body['senha']  ?? '');
        $csrfToken  = $body['csrf_token']
                   ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');

        // === 6. Validação CSRF ==========================================
        if (
            empty($_SESSION['csrf_token']) ||
            empty($csrfToken) ||
            !hash_equals($_SESSION['csrf_token'], $csrfToken)
        ) {
            http_response_code(419);
            $this->jsonErro('Sessão expirada. Recarregue a página e tente novamente.');
        }

        // === 7. Validação básica dos campos =============================
        $email = filter_var($email, FILTER_VALIDATE_EMAIL);
        if (!$email || $senha === '') {
            http_response_code(400);
            $this->jsonErro('E-mail ou senha inválidos.');
        }

        // === 8. Autenticação ============================================
        $usuariosModel = new UsuariosModel();
        $usuario = $usuariosModel->buscarPorEmail($email); // implemente no Model

        // Mensagem genérica para não vazar se o e-mail existe
        if (!$usuario || !password_verify($senha, $usuario['usu_senha'])) {
            http_response_code(401);
            $this->jsonErro('E-mail ou senha inválidos.');
        }

        // === 9. Login OK: regenera sessão e rotaciona CSRF ==============
        session_regenerate_id(true);

        $_SESSION['usuario_id']   = $usuario['usu_id'];
        $_SESSION['usuario_nome'] = $usuario['usu_nome'];
        $_SESSION['usuario_email'] = $usuario['usu_email'];

        // Rotaciona token (boa prática pós-login)
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        // === 10. Resposta de sucesso ====================================
        http_response_code(200);
        echo json_encode([
            'sucesso'  => true,
            'mensagem' => 'Login realizado com sucesso!',
            'redirect' => '/dashboard',
            'usuario'  => [
                'id'    => $usuario['usu_id'],
                'nome'  => $usuario['usu_nome'],
                'email' => $usuario['usu_email'],
            ],
            'csrf_token' => $_SESSION['csrf_token'], // atualiza o front
        ]);
        exit;
    }


    // ================================================================
    // Helpers privados
    // ================================================================

    /**
     * Bloqueia requisições cross-origin por padrão (nega CORS).
     * Permite somente quando o Origin é o mesmo host da requisição.
     */
    private function validarMesmaOrigem(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? null;

        // Sem Origin = navegação direta / curl → não é cross-site
        if ($origin === null) {
            // ainda assim negamos preflight de terceiros por padrão
            return;
        }

        $host   = $_SERVER['HTTP_HOST'] ?? '';
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $esperado = $scheme . '://' . $host;

        if (strcasecmp($origin, $esperado) !== 0) {
            http_response_code(403);
            $this->jsonErro('Origem não permitida.');
        }
        // Requisição same-origin — segue normalmente
    }

    private function jsonErro(string $mensagem, array $extra = []): void
    {
        echo json_encode(array_merge([
            'sucesso'  => false,
            'mensagem' => $mensagem,
        ], $extra));
        exit;
    }


}
