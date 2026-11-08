<?php 
/**
 * evento.php
 * 
 * View única para CRIAÇÃO e EDIÇÃO de eventos.
 * 
 * Recebe do Controller (WebController::novoEvento / editarEvento):
 *   - $evento : array com os dados do evento (só em edição) ou null (novo)
 * 
 * O Controller decide qual variável enviar:
 *   - novoEvento()     → $evento = null → formulário vazio
 *   - editarEvento($id)→ $evento = [...] → formulário pré-preenchido
 * 
 * O mesmo endpoint (/eventos/salvar) processa ambos os casos —
 * a decisão é feita no Controller verificando se o "id" veio no POST.
 */

include __DIR__ . "/../Templates/tmp_head.php"; 
include __DIR__ . "/../Templates/tmp_header.php"; 
include __DIR__ . "/../Templates/tmp_msg.php";

// =============================================================
//  PREPARAÇÃO DAS VARIÁVEIS DE ESTADO
//
//  $isEdicao é a "chave" de toda a lógica desta view:
//    - Define o título (<h3>)
//    - Define se o <input hidden id> aparece
//    - Define se o <select ativo> aparece (edição) ou o hidden (novo)
//
//  Os valores ($evId, $evNome, $evData, $evAtivo) são calculados
//  uma única vez no topo para evitar condicionais repetitivos no HTML.
// =============================================================

$isEdicao = !empty($evento['eve_id']);

// ID do evento — vazio em criação, numérico em edição.
// O (int) garante tipo inteiro (proteção contra SQL injection
// caso alguém manipule o formulário).
$evId     = $isEdicao ? (int)$evento['eve_id'] : '';

// Nome do evento — htmlspecialchars evita XSS caso o nome contenha
// caracteres como <, >, ", ', &. Sem isso, um evento chamado
// "<script>alert(1)</script>" executaria JS ao abrir o form.
$evNome   = $isEdicao ? htmlspecialchars($evento['eve_nome'], ENT_QUOTES, 'UTF-8') : '';

// Data: em edição usa a do banco (YYYY-MM-DD);
// em criação, sugere a data de hoje (o formato do input type="date"
// é sempre YYYY-MM-DD).
$evData   = $isEdicao ? $evento['eve_dt_evento'] : date('Y-m-d');

// Status: em edição reflete o banco; em criação sempre 1 (Pendente).
// A semântica: 1 = Pendente (OK), 0 = Concluído.
$evAtivo  = $isEdicao ? (int)$evento['eve_ativo'] : 1;
?>

<main>
    <div id="divPrincipal">
        <!-- Título muda conforme o modo (Novo vs Editar) -->
        <h3><?= $isEdicao ? 'Editar Evento' : 'Novo Evento' ?></h3>

        <form id="formEvento">

            <?php 
            // ------------------------------------------------------
            //  CSRF TOKEN (obrigatório em todos os POSTs)
            //
            //  O WebController::salvarEvento valida esse token contra
            //  o da sessão. Sem ele, o servidor retorna 419.
            //
            //  O mesmo token também é enviado no header X-CSRF-Token
            //  pelo evento.js (defesa em profundidade).
            // ------------------------------------------------------
            ?>
            <input type="hidden" name="csrf_token" id="csrf_token"
                value="<?= htmlspecialchars($_SESSION['csrf_token'] ?? '', ENT_QUOTES, 'UTF-8') ?>">

            <?php 
            // ------------------------------------------------------
            //  ID DO EVENTO (somente em edição)
            //
            //  É a presença deste campo no POST que diz ao Controller
            //  se deve atualizar (id presente) ou criar (id ausente).
            //
            //  Em criação ele NÃO aparece — o Controller cai no branch
            //  de INSERT.
            // ------------------------------------------------------
            ?>
            <?php if ($isEdicao): ?>
                <input type="hidden" name="id" id="id" value="<?= $evId ?>">
            <?php endif; ?>

            <div>
                <label for="nome">Descrição do Evento:</label>
                <input type="text" name="nome" id="nome" required minlength="3"
                    value="<?= $evNome ?>" placeholder="Ex: Reunião de Equipe">
                <?php 
                // "required" e "minlength=3" fazem validação NATIVA
                // no navegador — o submit é bloqueado se o campo estiver
                // vazio ou tiver menos de 3 caracteres. O servidor
                // revalida (nunca confie só no cliente).
                ?>
            </div>

            <div>
                <label for="data">Data do Evento:</label>
                <input type="date" name="data" id="data" required value="<?= $evData ?>">
                <?php 
                // type="date" mostra um seletor nativo de calendário e
                // garante o formato YYYY-MM-DD no envio. O servidor valida
                // com DateTime::createFromFormat para garantir integridade.
                ?>
            </div>

            <?php 
            // ------------------------------------------------------
            //  CAMPO "ATIVO" (STATUS)
            //
            //  Muda drasticamente entre edição e criação:
            //
            //  - EDIÇÃO: <select> permite ao usuário alternar entre
            //    "Pendente (OK)" e "Concluído".
            //
            //  - CRIAÇÃO: <input type="hidden" value="1"> garante que
            //    todo evento novo nasça como Pendente — o usuário não
            //    tem como escolher "Concluído" na hora de criar.
            //
            //  Esse hidden é essencial: sem ele, o Controller receberia
            //  $_POST['ativo'] = null e cairia no fallback 1 (que é o
            //  comportamento desejado), mas enviar o valor explícito
            //  torna o fluxo mais previsível e auto-documentado.
            // ------------------------------------------------------
            ?>
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

            <?php 
            // ------------------------------------------------------
            //  AÇÕES DO FORMULÁRIO
            //
            //  - "Salvar Evento": submit interceptado pelo evento.js
            //    → envia via AJAX para /eventos/salvar
            //
            //  - "Cancelar": <a> para "/" (volta para a home).
            //    Não é <button type="button"> porque queremos navegação
            //    real, e o <a> já faz isso nativamente.
            //
            //  O style inline com "flex-direction: row" sobrescreve a
            //  regra global "form > div { flex-direction: column }",
            //  alinhando o botão e o link na mesma linha.
            // ------------------------------------------------------
            ?>
            <div style="flex-direction: row; gap: 1rem; margin-top: 1.5rem;">
                <button type="submit">Salvar Evento</button>
                <a href="/" style="padding: .6rem 1.2rem; color: #4b5563; text-decoration: none;">Cancelar</a>
            </div>
        </form>
    </div>
</main>

<?php include __DIR__ . "/../Templates/tmp_footer.php"; ?>
<?php include __DIR__ . "/../Templates/tmp_fim.php"; ?>