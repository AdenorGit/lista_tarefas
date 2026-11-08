<?php 
/**
 * tmp_footer.php
 * 
 * Template reutilizável para o rodapé da aplicação.
 * 
 * Incluído em TODAS as Views (home, entrar, cadastro, evento), logo
 * após o fechamento de <main> e antes de </body></html> (que é
 * fechado em tmp_fim.php).
 * 
 * Estrutura dos templates:
 *   tmp_head.php    → <!DOCTYPE>, <head>, <body> aberto
 *   tmp_header.php  → <header> com nav
 *   tmp_msg.php     → <div id="msg">
 *   [conteúdo]      → <main>...</main>
 *   tmp_footer.php  → <footer>...</footer>   ← ESTE ARQUIVO
 *   tmp_fim.php     → </body></html>
 */
?>
<footer>
    <?php 
    // ----------------------------------------------------------
    //  CONTEÚDO DO RODAPÉ (atualmente vazio)
    //
    //  O <footer> está estruturado e estilizado no CSS, mas sem
    //  conteúdo textual por enquanto. Isso é proposital: o layout
    //  já reserva o espaço vertical, e o CSS (footer { padding,
    //  text-align: center, color: #6b7280, font-size: .85rem })
    //  aplica o estilo mesmo em um footer vazio.
    //
    //  Sugestões de conteúdo futuro:
    //    - Copyright: "© 2026 Lista de Eventos"
    //    - Ano dinâmico: <?= date('Y')
    //    - Nome do autor/empresa
    //    - Links para Termos de Uso / Política de Privacidade
    //    - Versão da aplicação
    //    - Informação de ambiente: "Ambiente: desenvolvimento"
    //
    //  Quando o conteúdo for adicionado, lembre-se de usar
    //  htmlspecialchars() caso venha de variáveis dinâmicas
    //  (proteção contra XSS).
    // ----------------------------------------------------------
    ?>
</footer>