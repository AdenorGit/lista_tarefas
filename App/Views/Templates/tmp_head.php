<?php 
/**
 * tmp_head.php
 * 
 * Template reutilizável para o topo do HTML (<head> + abertura do <body>).
 * 
 * Incluído em TODAS as Views (home, entrar, cadastro, evento) como
 * primeira coisa do arquivo. O <head> é fechado em tmp_header.php
 * (que abre <header> e depois o <body> continua sendo preenchido).
 * 
 * Variáveis esperadas do Controller (opcionais):
 *   - $titulo     : string com o título da página (tag <title>)
 *   - $javascript : string HTML com <script src="..."> a ser incluído
 *                   (cada Controller define o seu script específico)
 * 
 * Variáveis globais lidas de $_SESSION:
 *   - $_SESSION['csrf_token'] : token anti-CSRF (usado na <meta>)
 */
?>
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <?php 
    // ----------------------------------------------------------
    //  CHARSET
    //  "UTF-8" garante suporte a acentos (ã, ç, é, etc.)
    //  Deve ser a PRIMEIRA meta tag declarada para evitar
    //  problemas de renderização com caracteres especiais.
    // ----------------------------------------------------------
    ?>
    <meta charset="UTF-8">

    <?php 
    // ----------------------------------------------------------
    //  VIEWPORT
    //  Controla como a página é exibida em dispositivos móveis.
    //  "width=device-width" faz a largura da página igual à largura
    //  do dispositivo (sem isso, mobile renderiza com zoom-out).
    //  "initial-scale=1.0" define o zoom inicial em 100%.
    // ----------------------------------------------------------
    ?>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <?php 
    // ----------------------------------------------------------
    //  TÍTULO DINÂMICO
    //  $titulo é definido em cada método do WebController:
    //    - home()       → "Home"
    //    - entrar()     → "Login"
    //    - cadastro()   → "Cadastro"
    //    - novoEvento() → "Novo Evento"
    //    - editarEvento()→ "Editar Evento"
    //
    //  O operador "??" (null coalescing) evita erro se $titulo
    //  não estiver definido — exibe string vazia como fallback.
    // ----------------------------------------------------------
    ?>
    <title><?= $titulo ?? "" ?></title>

    <?php 
    // ----------------------------------------------------------
    //  FAVICON
    //  Ícone exibido na aba do navegador.
    //  "shortcut icon" é a forma antiga, mantida por compatibilidade.
    //  O caminho "/Assets/..." é absoluto (raiz do domínio) —
    //  funciona de qualquer página, independente da URL atual.
    // ----------------------------------------------------------
    ?>
    <link rel="shortcut icon" href="/Assets/Img/Ico/favico.ico" type="image/x-icon">

    <?php 
    // ----------------------------------------------------------
    //  FOLHA DE ESTILOS GLOBAL
    //  Um único CSS para toda a aplicação (styles.css).
    //  O caminho absoluto "/Assets/..." evita quebra em rotas
    //  aninhadas como /eventos/editar/5.
    // ----------------------------------------------------------
    ?>
    <link rel="stylesheet" href="/Assets/Css/styles.css">

    <?php 
    // ----------------------------------------------------------
    //  JAVASCRIPT ESPECÍFICO DA PÁGINA
    //
    //  Cada método do Controller define a variável $javascript
    //  com a tag <script> apropriada:
    //    - home()       → home.js
    //    - entrar()     → login.js
    //    - cadastro()   → cadastro.js
    //    - evento()     → evento.js
    //
    //  O atributo "defer" (dentro da tag definida pelo Controller)
    //  garante que o script só execute após o HTML ser parseado.
    //  Por isso os JS podem usar document.getElementById('msg')
    //  sem erro de "null".
    //
    //  O operador "??" evita erro se a variável não estiver definida
    //  (páginas que não precisam de JS).
    // ----------------------------------------------------------
    ?>
    <?= $javascript ?? '' ?>

    <?php 
    // ----------------------------------------------------------
    //  CSRF TOKEN EM <meta>
    //
    //  Permite que os scripts JavaScript (login.js, cadastro.js,
    //  evento.js, home.js) leiam o token via:
    //      document.querySelector('meta[name="csrf-token"]')
    //  e o enviem no header X-CSRF-Token nas requisições AJAX.
    //
    //  O mesmo token também está no <input type="hidden"> dos
    //  formulários (defesa em profundidade). O JavaScript pode
    //  enviar em ambos os lugares.
    //
    //  htmlspecialchars() no content evita quebra do atributo
    //  caso o token contenha caracteres especiais (improvável em
    //  hex, mas é boa prática).
    //
    //  O "??" garante fallback vazio caso a sessão ainda não tenha
    //  token (raro, mas acontece em requisições antes do index.php).
    // ----------------------------------------------------------
    ?>
    <meta name="csrf-token" content="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">

</head>

<?php 
// ----------------------------------------------------------
//  ABERTURA DO <body>
//
//  O <body> é aberto AQUI, mas o conteúdo real começa em
//  tmp_header.php (que renderiza a barra de navegação).
//
//  Estrutura completa da página:
//    tmp_head.php    → <!DOCTYPE>, <head>, <body> aberto
//    tmp_header.php  → <header> com nav
//    tmp_msg.php     → <div id="msg"> (feedback AJAX)
//    [conteúdo]      → main, tabelas, formulários
//    tmp_footer.php  → <footer>
//    tmp_fim.php     → </body></html>
// ----------------------------------------------------------
?>
<body>