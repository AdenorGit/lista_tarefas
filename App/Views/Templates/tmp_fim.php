<?php 
/**
 * tmp_fim.php
 * 
 * Template responsável por FECHAR as tags <body> e <html> abertas
 * em tmp_head.php.
 * 
 * É o ÚLTIMO include de cada View (home, entrar, cadastro, evento),
 * executado após tmp_footer.php.
 * 
 * Por que existe separado do tmp_footer.php?
 * 
 *   Permite que outras páginas (ex: um PDF, um e-mail HTML, ou uma
 *   view que não queira rodapé) incluam apenas o fechamento das
 *   tags estruturais, sem depender do <footer>. Também facilita
 *   manutenção: se um dia for necessário adicionar scripts globais
 *   (analytics, service worker, hot-reload em dev), eles entram
 *   aqui — um único lugar que afeta TODAS as páginas.
 * 
 * Estrutura completa dos templates:
 *   tmp_head.php    → <!DOCTYPE>, <head>, <body> aberto
 *   tmp_header.php  → <header> com nav
 *   tmp_msg.php     → <div id="msg">
 *   [conteúdo]      → <main>...</main>
 *   tmp_footer.php  → <footer>...</footer>
 *   tmp_fim.php     → </body></html>   ← ESTE ARQUIVO
 */
?>
</body>

</html>