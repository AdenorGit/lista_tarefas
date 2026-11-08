<?php

// =====================================================================
//  ARQUIVO DE ROTAS
//  Centraliza a definição de todas as URLs da aplicação.
//  Utiliza a biblioteca "bramus/router" para mapear URLs aos métodos
//  do WebController.
// =====================================================================


// === INSTANCIAR ROTEADOR ============================================

// Cria uma nova instância do roteador.
$router = new \Bramus\Router\Router();

// Define o caminho base das rotas. "/" indica que a aplicação
// roda na raiz do domínio (ex: http://192.168.122.18:8000/).
$router->setBasePath('/');

// Define o namespace padrão dos Controllers. Assim, quando escrevemos
// 'WebController@home', o roteador entende que é
// \App\Controllers\WebController::home().
$router->setNamespace('\App\Controllers');


// === ROTAS PÚBLICAS (MÉTODO GET) ====================================
//  Utilizadas para EXIBIR páginas. Não alteram estado no servidor.
//  Podem ser acessadas via link, barra de endereço ou navegação normal.

// Página inicial. Exibe a tabela de eventos do usuário logado
// (ou uma mensagem de boas-vindas se não estiver autenticado).
$router->get('/', 'WebController@home');

// Exibe o formulário de login.
$router->get('/entrar', 'WebController@entrar');

// Exibe o formulário de criação de nova conta de usuário.
$router->get('/cadastro', 'WebController@cadastro');

// Exibe o formulário de criação de um NOVO evento (em branco).
$router->get('/eventos/novo', 'WebController@novoEvento');

// Exibe o formulário de EDIÇÃO de um evento existente.
// A expressão regular "(\d+)" captura o ID numérico da URL
// (ex: /eventos/editar/5 → passa "5" como argumento para o método).
$router->get('/eventos/editar/(\d+)', 'WebController@editarEvento');

// Encerra a sessão do usuário (logout) e redireciona para /entrar.
$router->get('/sair', 'WebController@sair');


// === ROTAS DE AÇÃO (MÉTODO POST) ====================================
//  Utilizadas para PROCESSAR dados enviados por formulários (via AJAX
//  ou submit tradicional). Alteram estado no servidor (criam, atualizam
//  ou excluem registros). São protegidas por CSRF Token.

// Autentica o usuário a partir do e-mail e senha.
$router->post('/login', 'WebController@login');

// Cria um novo usuário no banco de dados (cadastro de conta).
$router->post('/cadastro', 'WebController@cadastrar');

// Alterna o status do evento (Pendente ↔ Concluído).
// Chamado via AJAX pelo botão "OK / CONCLUÍDO" na home.
$router->post('/eventos/concluir', 'WebController@concluirEvento');

// Exclui um evento do banco de dados.
// Chamado via AJAX pelo botão "EXCLUIR" na home.
$router->post('/eventos/excluir', 'WebController@excluirEvento');

// Salva um evento (cria novo OU atualiza existente).
// O próprio Controller decide o que fazer verificando se o
// campo "id" foi enviado ou não no POST.
$router->post('/eventos/salvar', 'WebController@salvarEvento');


// === EXECUTAR ROTAS =================================================
//  Processa a requisição atual e despacha para o Controller correto.
//  Deve ser a última instrução do arquivo.
$router->run();
