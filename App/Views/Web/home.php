<?php include __DIR__ . "/../Templates/tmp_head.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_header.php"; ?>

<?php include __DIR__ . "/../Templates/tmp_msg.php"; ?>

<main>
    <div id="divPrincipal">
        <h3>Eventos</h3>
        
        <?php if (!empty($_GET['q'])): ?>
            <!-- Aviso de pesquisa ativa -->
            <div style="margin-bottom: 1rem; padding: .75rem; background: #eff6ff; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                <span>Resultados para: <strong><?= htmlspecialchars($_GET['q'], ENT_QUOTES, 'UTF-8') ?></strong></span>
                <a href="/" style="font-size: .85rem;">Limpar pesquisa</a>
            </div>
        <?php endif; ?>

        <?php if (empty($_SESSION['usuario'])): ?>
            <!-- 1. Usuário NÃO logado -->
            <p style="text-align: center; color: #6b7280; padding: 2rem 0;">
                Faça <a href="/entrar">login</a> para visualizar seus eventos.
            </p>

        <?php elseif (empty($eventos)): ?>
            <!-- 2. Usuário logado, mas a lista de eventos está vazia -->
            <p style="text-align: center; color: #6b7280; padding: 2rem 0;">
                <?php if (!empty($_GET['q'])): ?>
                    Nenhum evento encontrado para a sua pesquisa.
                <?php else: ?>
                    Nenhum evento cadastrado ainda.
                <?php endif; ?>
            </p>

        <?php else: ?>
            <!-- 3. Usuário logado E com eventos para mostrar -->
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
                                $concluido = (int)$evento['eve_ativo'] === 0; 
                                $dataFormatada = date('d/m/Y', strtotime($evento['eve_dt_evento']));
                            ?>
                            <tr id="linha-<?= $evento['eve_id'] ?>">
                                <td><?= $evento['eve_id'] ?></td>
                                <td><?= htmlspecialchars($evento['eve_nome'], ENT_QUOTES, 'UTF-8') ?></td>
                                <td><?= $dataFormatada ?></td>
                                
                                <!-- Botão Concluir -->
                                <td>
                                    <button type="button" 
                                            class="btn-concluir <?= $concluido ? 'concluido' : '' ?>" 
                                            data-id="<?= $evento['eve_id'] ?>">
                                        <?= $concluido ? 'CONCLUÍDO' : 'OK' ?>
                                    </button>
                                </td>
                                
                                <!-- Botão Editar -->
                                <td>
                                    <a href="/eventos/editar/<?= $evento['eve_id'] ?>" class="btn-editar" style="display:inline-block; padding: 0.35rem 0.7rem; border: 1px solid #d1d5db; background: #f9fafb; border-radius: 6px; cursor: pointer; font-size: 0.82rem; color: inherit; text-decoration: none;">
                                        EDITAR
                                    </a>
                                </td>
                                
                                <!-- Botão Excluir -->
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