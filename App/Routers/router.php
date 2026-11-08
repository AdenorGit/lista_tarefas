<?php

// === INSTANCIAR ROTEADOR ============================================

    $router = new \Bramus\Router\Router();
    $router->setBasePath('/');  // força a raiz
    $router->setNamespace('\App\Controllers');


// === ROTAS PÚBLICAS =================================================

    $router->get('/', 'WebController@home');
    $router->get('/entrar', 'WebController@entrar');
    $router->get('/cadastro', 'WebController@cadastro');
    $router->get('/eventos/novo', 'WebController@novoEvento');
    $router->get('/eventos/editar/(\d+)', 'WebController@editarEvento');
    $router->get('/sair', 'WebController@sair');

    $router->post('/login', 'WebController@login');
    $router->post('/cadastro', 'WebController@cadastrar');
    $router->post('/eventos/concluir', 'WebController@concluirEvento');
    $router->post('/eventos/excluir', 'WebController@excluirEvento');
    $router->post('/eventos/salvar', 'WebController@salvarEvento');

// === EXECUTAR ROTAS =================================================

    $router->run();

