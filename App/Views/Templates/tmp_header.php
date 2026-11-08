<header>
    <nav>
        <a href="/">
            <h3>Lista de Eventos</h3>
        </a>

        <form id="formPesquisa" action="/" method="GET">
            <input type="search" name="q" id="inputPesquisa" placeholder="Pesquisar..."
                value="<?= htmlspecialchars($_GET['q'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
            <button type="submit">Pesquisar</button>
        </form>

        <ul>
            <?php if (!empty($_SESSION['usuario'])): ?>
                <!-- Área do usuário logado -->
                <li class="usuario-logado">
                    <span><strong><?= htmlspecialchars($_SESSION['usuario']['nome'], ENT_QUOTES, 'UTF-8') ?></strong></span>
                </li>
                <li>
                    <a href="/eventos/novo">Novo Evento</a>
                </li>
                <li><a href="/sair">Sair</a></li>
            <?php else: ?>
                <!-- Área do visitante -->
                <li>
                    <a href="/cadastro">Cadastrar</a>
                </li>
                <li>
                    <a href="/entrar">Entrar</a>
                </li>
            <?php endif; ?>

        </ul>
    </nav>
</header>