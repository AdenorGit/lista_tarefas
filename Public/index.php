<?php

// === HABILITAR ERROS =================================================

    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);




// === INICIAR SESSÃO =================================================

    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    

// === GERAR TOKEN CSRF (NOVO BLOCO) ===================================

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }



    
// === CARREGAR AUTOLOAD ==============================================

    require __DIR__ . '/../vendor/autoload.php';





// === CARREGAR PHPDOTENV =============================================

    $dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
    $dotenv->load();




// === CARREGAR ROTAS =================================================

    require __DIR__ . '/../App/Routers/router.php';





// === TESTE ==========================================================



  