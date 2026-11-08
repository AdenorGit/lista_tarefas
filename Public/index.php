<?php

// =====================================================================
//  ARQUIVO DE ENTRADA (ENTRY POINT)
//  Todas as requisições HTTP que chegam ao servidor passam por aqui.
//  Este arquivo é responsável por:
//    1. Configurar a exibição de erros (desenvolvimento)
//    2. Iniciar a sessão do usuário
//    3. Gerar o token CSRF
//    4. Carregar o autoload do Composer
//    5. Carregar as variáveis de ambiente (.env)
//    6. Delegar o roteamento para o Router
// =====================================================================


// === HABILITAR ERROS =================================================
//  ATENÇÃO: em produção, deve estar tudo em 0 (desligado).
//  Exibir erros em produção vaza caminhos internos, consultas SQL
//  e detalhes de infraestrutura que facilitam ataques.

ini_set('display_errors', 1);         // Mostra os erros na tela
ini_set('display_startup_errors', 1); // Mostra erros de inicialização do PHP
error_reporting(E_ALL);               // Reporta todos os níveis de erro


// === INICIAR SESSÃO =================================================
//  Verifica se a sessão já está ativa antes de chamar session_start().
//  Evita o aviso "session already started" caso outro arquivo já
//  tenha iniciado a sessão antes.

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


// === GERAR TOKEN CSRF ===============================================
//  Gera um token único por sessão (32 bytes = 64 caracteres hex).
//  O token é incluído em todos os formulários via <input type="hidden">
//  e validado pelo Controller em todo POST. Isso impede ataques CSRF
//  (requisições forjadas por outro site em nome do usuário logado).
//
//  O "empty(...)" evita regenerar o token a cada requisição, o que
//  quebraria formulários já abertos em outra aba.
//  Após o login bem-sucedido, o token É regenerado (session_regenerate_id
//  + novo csrf_token), invalidando o antigo.

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}


// === CARREGAR AUTOLOAD ==============================================
//  Carrega as classes do Composer e as classes do projeto definidas
//  via PSR-4 no composer.json ("App\" => "App/").
//
//  A partir daqui, podemos usar "new \App\Controllers\WebController()"
//  sem precisar usar require manualmente.
//
//  ATENÇÃO: o caminho é '../vendor/autoload.php' porque este arquivo
//  está em Public/ e o vendor/ está na raiz do projeto (um nível acima).

require __DIR__ . '/../vendor/autoload.php';


// === CARREGAR PHPDOTENV =============================================
//  Carrega as variáveis do arquivo .env (na raiz do projeto).
//  Essas variáveis (DB_HOST, DB_NAME, DB_USER, DB_PASS, etc.) são
//  consumidas pelo ConnDb::fromEnv() para conectar ao banco.
//
//  "createImmutable" impede que o código altere as variáveis em runtime
//  (proteção contra sobrescrita maliciosa).
//  "dirname(__DIR__)" sobe um nível (de Public/ para raiz).

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->load();


// === CARREGAR ROTAS =================================================
//  Importa o arquivo que define todas as rotas da aplicação.
//  O router.php já executa $router->run() no final, então a partir
//  daqui a requisição é processada e a resposta é enviada ao cliente.
//
//  Nada depois desta linha é executado (a menos que o Router não
//  encontre correspondência e caia na página 404 padrão).

require __DIR__ . '/../App/Routers/router.php';


// === TESTE ==========================================================
//  (Bloco reservado para testes futuros.)