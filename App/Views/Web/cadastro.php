<?php 
/**
 * cadastro.php
 * 
 * View do formulário de criação de conta (/cadastro).
 * 
 * Recebe do Controller (WebController::cadastro):
 *   - $titulo     : "Cadastro"
 *   - $javascript : inclusão do cadastro.js via tmp_head
 *   - $_SESSION['csrf_token'] : token anti-CSRF
 * 
 * O submit é interceptado pelo cadastro.js e enviado via AJAX
 * para POST /cadastro (WebController::cadastrar).
 * 
 * Os campos já trazem validação nativa no HTML (required, minlength,
 * maxlength, type="email") para evitar requisições desnecessárias.
 * O servidor revalida TUDO — nunca confie apenas na validação do cliente.
 */

// Includes padrão: <head>, header, div#msg, conteúdo e <footer>.
// A div#msg é usada pelo cadastro.js para exibir feedback.
include __DIR__ . "/../Templates/tmp_head.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_header.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_msg.php"; ?>

<main>
    <div id="divPrincipal">
        <h3>Criar Conta</h3>
        <?php 
        // Título estático — diferente de evento.php, aqui não há
        // alternância entre "criar" e "editar" (só existe criação).
        ?>

        <form id="formCadastro">
            <?php 
            // ------------------------------------------------------
            //  CSRF TOKEN
            //
            //  O WebController::cadastrar valida esse token contra
            //  o da sessão. Sem ele (ou desatualizado), retorna 419.
            //
            //  O cadastro.js também envia o mesmo token no header
            //  X-CSRF-Token (defesa em profundidade).
            //
            //  htmlspecialchars() no value evita quebra de atributo
            //  caso o token contenha caracteres especiais.
            // ------------------------------------------------------
            ?>
            <input type="hidden" name="csrf_token" id="csrf_token" 
                value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">

            <div>
                <label for="nome">Nome completo:</label>
                <?php 
                // type="text"       → campo de texto simples
                // required          → navegador bloqueia envio se vazio
                // minlength="3"     → pelo menos 3 caracteres (mesma regra do servidor)
                // maxlength="100"   → limite alinhado com a coluna do banco (VARCHAR 255)
                //
                // O id="nome" é usado pelo cadastro.js para o form.querySelector.
                ?>
                <input type="text" name="nome" id="nome" required minlength="3" maxlength="100">
            </div>

            <div>
                <label for="email">E-mail:</label>
                <?php 
                // type="email"      → navegador valida o formato (exige @ e domínio)
                // required          → obrigatório
                // maxlength="100"   → limite razoável (a coluna aceita mais,
                //                     mas e-mails reais raramente passam de 100)
                //
                // O servidor revalida com filter_var(FILTER_VALIDATE_EMAIL).
                ?>
                <input type="email" name="email" id="email" required maxlength="100">
            </div>

            <div>
                <label for="senha">Senha:</label>
                <?php 
                // type="password"   → mascara os caracteres digitados
                // required          → obrigatório
                // minlength="6"     → pelo menos 6 caracteres (mesma regra do servidor)
                //
                // O servidor gera o hash com password_hash(PASSWORD_DEFAULT)
                // e nunca armazena a senha em texto puro.
                //
                // O cadastro.js NÃO aplica .trim() na senha (espaços podem
                // ser legítimos em senhas).
                ?>
                <input type="password" name="senha" id="senha" required minlength="6">
            </div>

            <div>
                <label for="confirmar_senha">Confirmar Senha:</label>
                <?php 
                // type="password"   → mascara (mesmo sendo confirmação)
                // required          → obrigatório
                // minlength="6"     → mesma regra da senha principal
                //
                // A validação de "senha === confirmar_senha" NÃO pode ser
                // feita no HTML — o cadastro.js faz essa comparação antes
                // de enviar. O servidor também revalida.
                ?>
                <input type="password" name="confirmar_senha" id="confirmar_senha" required minlength="6">
            </div>

            <button type="submit">Cadastrar</button>
            <?php 
            // O texto "Cadastrar" é alterado para "Cadastrando..." pelo JS
            // durante o envio (feedback visual) e restaurado no finally.
            ?>
        </form>
    </div>
</main>

<?php include __DIR__ . "/../Templates/tmp_footer.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_fim.php"; ?>