<?php include __DIR__ . "/../Templates/tmp_head.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_header.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_msg.php"; ?>

<main>
    <div id="divPrincipal">
        <h3>Criar Conta</h3>
        <form id="formCadastro">
            <input type="hidden" name="csrf_token" id="csrf_token" 
                value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
            
            <div>
                <label for="nome">Nome completo:</label>
                <input type="text" name="nome" id="nome" required minlength="3" maxlength="100">
            </div>

            <div>
                <label for="email">E-mail:</label>
                <input type="email" name="email" id="email" required maxlength="100">
            </div>

            <div>
                <label for="senha">Senha:</label>
                <input type="password" name="senha" id="senha" required minlength="6">
            </div>

            <div>
                <label for="confirmar_senha">Confirmar Senha:</label>
                <input type="password" name="confirmar_senha" id="confirmar_senha" required minlength="6">
            </div>

            <button type="submit">Cadastrar</button>
        </form>
    </div>
</main>

<?php include __DIR__ . "/../Templates/tmp_footer.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_fim.php"; ?>