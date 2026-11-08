<?php 
/**
 * entrar.php
 * 
 * View do formulário de login (/entrar).
 * 
 * Não recebe variáveis especiais do Controller além de:
 *   - $_SESSION['csrf_token'] : token anti-CSRF
 *   - $titulo                 : "Login" (definido em WebController::entrar)
 *   - $javascript             : inclusão do login.js via tmp_head
 * 
 * O submit é interceptado pelo login.js e enviado via AJAX para
 * POST /login (WebController::login). Se o JS falhar ou estiver
 * desabilitado, o form cai no envio tradicional — por isso o
 * <form method="post"> está presente (fallback nativo).
 */

// Includes padrão: <head>, header, div#msg, conteúdo e <footer>.
// A div#msg é usada pelo login.js para exibir sucesso/erro.
include __DIR__ . "/../Templates/tmp_head.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_header.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_msg.php"; ?>


<main>
    <div id="divPrincipal">
        <?php 
        // ----------------------------------------------------------
        //  FORMULÁRIO DE LOGIN
        //
        //  "method='post'" é um fallback: se o JS estiver desabilitado
        //  ou falhar, o navegador envia tradicionalmente para /login.
        //  O login.js intercepta o submit e envia via fetch quando
        //  o JS está disponível.
        //
        //  Não há "action" explícito — o form envia para a URL atual
        //  (/entrar), mas como o login.js chama POST /login via fetch,
        //  a action não é realmente usada.
        // ----------------------------------------------------------
        ?>
        <form method="post">

            <?php 
            // ------------------------------------------------------
            //  CSRF TOKEN
            //
            //  O WebController::login valida esse token contra o da
            //  sessão. Sem ele (ou desatualizado), retorna 419.
            //
            //  O login.js também envia o mesmo token no header
            //  X-CSRF-Token (defesa em profundidade).
            //
            //  htmlspecialchars() no value evita quebra de atributo
            //  caso o token contenha caracteres especiais (raro em
            //  hex, mas é boa prática).
            // ------------------------------------------------------
            ?>
            <input type="hidden" name="csrf_token" id="csrf_token" 
                value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">

            <div>
                <label for="email">E-mail:</label>
                <?php 
                // type="email" faz o navegador validar o formato
                // (exige "@" e domínio). O servidor revalida com
                // filter_var(FILTER_VALIDATE_EMAIL).
                //
                // O id="email" é usado pelo login.js para ler o valor
                // via form.querySelector('#email').
                ?>
                <input type="email" name="email" id="email">
            </div>

            <div>
                <label for="senha">Senha</label>
                <?php 
                // type="password" mascara o texto digitado.
                // O id="senha" é usado pelo login.js.
                //
                // Obs: o atributo "required" NÃO está presente —
                // a validação é feita no login.js (campos vazios
                // disparam "Informe e-mail e senha"). Se quiser
                // fallback nativo quando JS estiver desabilitado,
                // adicione required em ambos os campos.
                ?>
                <input type="password" name="senha" id="senha">
            </div>

            <button type="submit">Entrar</button>
            <?php 
            // O texto "Entrar" é alterado para "Entrando..." pelo JS
            // durante o envio (feedback visual) e restaurado no finally.
            ?>
        </form>
    </div>
</main>

<?php include __DIR__ . "/../Templates/tmp_footer.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_fim.php"; ?>