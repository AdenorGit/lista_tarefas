<?php include __DIR__ . "/../Templates/tmp_head.php"; ?>
<?php include __DIR__ . "/../Templates/tmp_header.php"; ?>
<?php include __DIR__ . "/../Templates/tmp_msg.php"; ?>

<?php
// Define os valores padrão
$isEdicao = !empty($evento['eve_id']);
$evId     = $isEdicao ? (int)$evento['eve_id'] : '';
$evNome   = $isEdicao ? htmlspecialchars($evento['eve_nome'], ENT_QUOTES, 'UTF-8') : '';
$evData   = $isEdicao ? $evento['eve_dt_evento'] : date('Y-m-d');
$evAtivo  = $isEdicao ? (int)$evento['eve_ativo'] : 1;
?>

<main>
    <div id="divPrincipal">
        <h3><?= $isEdicao ? 'Editar Evento' : 'Novo Evento' ?></h3>

        <form id="formEvento">
            <input type="hidden" name="csrf_token" id="csrf_token"
                value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">

            <?php if ($isEdicao): ?>
                <input type="hidden" name="id" id="id" value="<?= $evId ?>">
            <?php endif; ?>

            <div>
                <label for="nome">Descrição do Evento:</label>
                <input type="text" name="nome" id="nome" required minlength="3"
                    value="<?= $evNome ?>" placeholder="Ex: Reunião de Equipe">
            </div>

            <div>
                <label for="data">Data do Evento:</label>
                <input type="date" name="data" id="data" required value="<?= $evData ?>">
            </div>

            <?php if ($isEdicao): ?>
                <div>
                    <label for="ativo">Status:</label>
                    <select name="ativo" id="ativo">
                        <!-- O valor 1 é Pendente (OK), o valor 0 é Concluído -->
                        <option value="1" <?= $evAtivo === 1 ? 'selected' : '' ?>>Pendente (OK)</option>
                        <option value="0" <?= $evAtivo === 0 ? 'selected' : '' ?>>Concluído</option>
                    </select>
                </div>
            <?php else: ?>
                <!-- Para novos eventos, força o envio do valor 1 (Pendente) -->
                <input type="hidden" name="ativo" id="ativo" value="1">
            <?php endif; ?>

            <div style="flex-direction: row; gap: 1rem; margin-top: 1.5rem;">
                <button type="submit">Salvar Evento</button>
                <a href="/" style="padding: .6rem 1.2rem; color: #4b5563; text-decoration: none;">Cancelar</a>
            </div>
        </form>
    </div>
</main>

<?php include __DIR__ . "/../Templates/tmp_footer.php"; ?>
<?php include __DIR__ . "/../Templates/tmp_fim.php"; ?>