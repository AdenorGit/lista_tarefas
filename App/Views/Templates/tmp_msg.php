<?php 
/**
 * tmp_msg.php
 * 
 * Template reutilizável para exibição de mensagens de feedback.
 * 
 * Este arquivo é incluído em todas as Views (home, entrar, cadastro, evento)
 * logo após o header. A div #msg é o "alvo" onde os arquivos JavaScript
 * (login.js, cadastro.js, evento.js, home.js) escrevem as mensagens
 * retornadas pelo servidor via AJAX.
 * 
 * Como funciona:
 *   1. O JS define msgDiv.textContent = "mensagem"
 *   2. O JS define msgDiv.className = "msg msg-sucesso|erro|info"
 *   3. O JS define msgDiv.style.display = "block" (para exibir)
 * 
 * A div inicia VAZIA e OCULTA (via CSS: #msg { display: none; }).
 * Ela só aparece quando o JS adiciona conteúdo e classe.
 * 
 * Classes CSS esperadas (definidas em styles.css):
 *   - .msg-info    → azul  (informação neutra)
 *   - .msg-sucesso → verde (ação concluída com sucesso)
 *   - .msg-erro    → vermelho (falha na ação)
 * 
 * A ausência de conteúdo aqui (div vazia) é INTENCIONAL:
 *   - O PHP não escreve mensagens diretamente (tudo é via AJAX)
 *   - Se o JS estiver desabilitado, a div fica invisível
 *     e o fallback do form tradicional exibe erros via flash (futuro).
 */
?>
<div id="msg"></div>