<?php 
/**
 * home.php
 * 
 * View da página inicial da aplicação.
 * 
 * Recebe do Controller (WebController::home):
 *   - $eventos : array com os eventos do usuário logado (ou vazio)
 *   - $_GET['q'] : termo de busca (opcional, vindo da barra de pesquisa)
 * 
 * O PHP desta view NÃO acessa o banco — apenas itera sobre dados já
 * preparados pelo Controller. A lógica de busca/filtro fica no Model.
 * 
 * Estrutura condicional:
 *   1. Usuário NÃO logado  → mensagem pedindo login
 *   2. Logado, sem eventos → mensagem "nenhum evento..."
 *   3. Logado com eventos  → renderiza a tabela
 */

// Includes padrão: <head>, header, div#msg, conteúdo e <footer>.
// A div#msg é usada pelo home.js para exibir feedback das ações AJAX.
include __DIR__ . "/../Templates/tmp_head.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_header.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_msg.php"; ?>

<main>
    <div id="divPrincipal">
        <h3>Eventos</h3>

        <?php 
        // =============================================================
        //  AVISO DE PESQUISA ATIVA
        //  Exibe o termo pesquisado e um botão "Limpar pesquisa".
        //  Só aparece se houver "?q=" na URL.
        //
        //  Uso de htmlspecialchars() para evitar XSS caso o usuário digite
        //  algo como <script>alert(1)</script> na busca.
        // =============================================================
        ?>
        <?php if (!empty($_GET['q'])): ?>
            <div style="margin-bottom: 1rem; padding: .75rem; background: #eff6ff; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span>Resultados para: <strong><?= htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8') ?></strong></span>
                <a href="/" style="font-size: .85rem;">Limpar pesquisa</a>
            </div>
        <?php endif; ?>


        <?php 
        // =============================================================
        //  CASO 1: USUÁRIO NÃO LOGADO
        //  Exibe convite para login. A tabela de eventos NÃO é exibida
        //  (privacidade — visitantes não veem eventos de ninguém).
        // =============================================================
        ?>
        <?php if (empty($_SESSION['usuario'])): ?>
            <p style="text-align: center; color: #6b7280; padding: 2rem 0;">
                Faça <a href="/entrar">login</a> para visualizar seus eventos.
            </p>


        <?php 
        // =============================================================
        //  CASO 2: USUÁRIO LOGADO, MAS SEM EVENTOS
        //  
        //  O bloco diferencia dois cenários:
        //    a) Sem eventos porque a busca não retornou nada
        //    b) Sem eventos porque o usuário ainda não cadastrou nenhum
        //
        //  Isso melhora o feedback: o usuário entende POR QUE está vazio.
        // =============================================================
        ?>
        <?php elseif (empty($eventos)): ?>
            <p style="text-align: center; color: #6b7280; padding: 2rem 0;">
                <?php if (!empty($_GET['q'])): ?>
                    Nenhum evento encontrado para a sua pesquisa.
                <?php else: ?>
                    Nenhum evento cadastrado ainda.
                <?php endif; ?>
            </p>


        <?php 
        // =============================================================
        //  CASO 3: USUÁRIO LOGADO COM EVENTOS
        //  Renderiza a tabela com todos os eventos do usuário.
        //
        //  Cada linha é identificada por id="linha-{id}" para que o
        //  home.js possa remover a linha do DOM após a exclusão via AJAX
        //  sem recarregar a página.
        // =============================================================
        ?>
        <?php else: ?>
            <div class="tabelaEventos">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>DESCRIÇÃO DO EVENTO</th>
                            <th>DATA DO EVENTO</th>
                            <th>CONCLUÍDO</th>
                            <th>EDITAR</th>
                            <th>EXCLUIR</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($eventos as $evento): ?>

                            <?php 
                            // -------------------------------------------------
                            //  PREPARAÇÃO DOS DADOS DE CADA LINHA
                            //
                            //  eve_ativo = 0 → Concluído
                            //  eve_ativo = 1 → Pendente (OK)
                            //
                            //  eve_dt_evento vem no formato YYYY-MM-DD do banco
                            //  e é reformatado para DD/MM/YYYY (padrão brasileiro).
                            // -------------------------------------------------
                                $concluido     = (int)$evento['eve_ativo'] === 0;
                                $dataFormatada = date('d/m/Y', strtotime($evento['eve_dt_evento']));
                            ?>

                            <tr id="linha-<?= $evento['eve_id'] ?>">
                                <!-- ID do evento (numérico, sem risco de XSS) -->
                                <td><?= $evento['eve_id'] ?></td>

                                <!-- Nome do evento:
                                     htmlspecialchars() impede XSS caso o
                                     nome contenha <, >, ", ', & etc. -->
                                <td><?= htmlspecialchars($evento['eve_nome'], ENT_QUOTES, 'UTF-8') ?></td>

                                <!-- Data já formatada no padrão brasileiro -->
                                <td><?= $dataFormatada ?></td>

                                <!-- 
                                    BOTÃO CONCLUIR
                                    - A classe "concluido" é adicionada se o evento
                                      já estiver finalizado (eve_ativo = 0).
                                    - O CSS usa essa classe para mostrar em verde.
                                    - data-id carrega o ID para o JS enviar no AJAX.
                                    - O texto alterna entre "OK" e "CONCLUÍDO".
                                -->
                                <td>
                                    <button type="button" 
                                            class="btn-concluir <?= $concluido ? 'concluido' : '' ?>" 
                                            data-id="<?= $evento['eve_id'] ?>">
                                        <?= $concluido ? 'CONCLUÍDO' : 'OK' ?>
                                    </button>
                                </td>

                                <!-- 
                                    BOTÃO EDITAR
                                    - É um <a> (link) e não um <button>, porque
                                      navega para uma página (GET).
                                    - Estilizado inline como botão para consistência.
                                    - O ID vem da URL e é capturado pela regex
                                      da rota: /eventos/editar/(\d+)
                                -->
                                <td>
                                    <a href="/eventos/editar/<?= $evento['eve_id'] ?>" class="btn-editar" style="display:inline-block; padding: 0.35rem 0.7rem; border: 1px solid #d1d5db; background: #f9fafb; border-radius: 6px; cursor: pointer; font-size: 0.82rem; color: inherit; text-decoration: none;">
                                        EDITAR
                                    </a>
                                </td>

                                <!-- 
                                    BOTÃO EXCLUIR
                                    - type="button" evita submit acidental.
                                    - data-id identifica o evento para o AJAX.
                                    - O home.js intercepta o clique, pede confirmação
                                      e remove a linha via fade-out após sucesso.
                                -->
                                <td>
                                    <button type="button" class="btn-excluir" data-id="<?= $evento['eve_id'] ?>">
                                        EXCLUIR
                                    </button>
                                </td>
                            </tr>

                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>

    </div>
</main>

<?php include __DIR__ . "/../Templates/tmp_footer.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_fim.php"; ?>