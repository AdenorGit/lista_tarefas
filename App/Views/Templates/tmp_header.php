<?php 
/**
 * tmp_header.php
 * 
 * Template reutilizável para o cabeçalho (barra de navegação).
 * 
 * Incluído em TODAS as Views (home, entrar, cadastro, evento).
 * 
 * Contém três blocos principais:
 *   1. Logo (link para a home)
 *   2. Formulário de pesquisa (envia ?q= via GET para "/")
 *   3. Menu condicional:
 *      - Visitante:  Cadastrar | Entrar
 *      - Logado:     Nome | Novo Evento | Sair
 * 
 * A alternância entre visitante e logado é feita por
 * $_SESSION['usuario'], populada no WebController::login.
 */
?>
<header>
    <nav>
        <!-- 
            BLOCO 1: LOGO
            - Link para "/" (home).
            - O <h3> é usado por semântica (título de seção), mas o CSS
              remove a margem para encaixar na barra.
        -->
        <a href="/">
            <h3>Lista de Eventos</h3>
        </a>

        <!-- 
            BLOCO 2: FORMULÁRIO DE PESQUISA
            
            - action="/"      → envia para a home
            - method="GET"    → o termo vai na URL como ?q=...
                                (GET é correto para buscas: idempotente,
                                não altera estado no servidor, bookmarkável)
            
            - O valor do input é preenchido com $_GET['q'] para que o
              usuário veja o que pesquisou após o submit (UX).
            
            - htmlspecialchars() no value previne XSS caso o usuário
              pesquise algo como <script>alert(1)</script>.
            
            - O name="q" é o parâmetro lido por:
                WebController::home() → $busca = $_GET['q']
                EventosModel::buscarPorUsuario($id, $busca)
        -->
        <form id="formPesquisa" action="/" method="GET">
            <input type="search" name="q" id="inputPesquisa" placeholder="Pesquisar..."
                value="<?= htmlspecialchars($_GET['q'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
            <button type="submit">Pesquisar</button>
        </form>

        <!-- 
            BLOCO 3: MENU CONDICIONAL
            
            A lista muda completamente conforme o estado de autenticação.
            Os dois cenários são mutuamente exclusivos (if/else).
        -->
        <ul>

            <?php 
            // =========================================================
            //  CENÁRIO A: USUÁRIO LOGADO
            //
            //  Mostra:
            //    - Nome do usuário (sem link, apenas identificação)
            //    - "Novo Evento" (rota protegida por verificarLogin)
            //    - "Sair"        (rota que destrói a sessão)
            //
            //  Não mostra "Cadastrar" nem "Entrar" porque não fazem
            //  sentido para quem já está autenticado.
            // =========================================================
            ?>
            <?php if (!empty($_SESSION['usuario'])): ?>

                <!-- 
                    Nome do usuário logado.
                    
                    - htmlspecialchars() previne XSS caso o nome tenha
                      caracteres como <, >, ", ', &.
                      Sem isso, um usuário chamado "<script>..." executaria
                      JS em TODAS as páginas (o header aparece em todas).
                    
                    - A classe "usuario-logado" está no CSS para dar
                      cor cinza clara e alinhamento vertical.
                    
                    - <strong> destaca o nome em branco.
                -->
                <li class="usuario-logado">
                    <span><strong><?= htmlspecialchars($_SESSION['usuario']['nome'], ENT_QUOTES, 'UTF-8') ?></strong></span>
                </li>

                <!-- 
                    Link "Novo Evento".
                    - Rota GET /eventos/novo (protegida por verificarLogin).
                    - Se o usuário não estiver logado e clicar, o Controller
                      redireciona para /entrar.
                -->
                <li>
                    <a href="/eventos/novo">Novo Evento</a>
                </li>

                <!-- 
                    Link "Sair".
                    - Rota GET /sair (destrói sessão + cookie, redireciona
                      para /entrar).
                    - Optamos por GET simples para simplicidade — se um dia
                      o projeto crescer, pode virar POST + CSRF.
                -->
                <li><a href="/sair">Sair</a></li>

            <?php 
            // =========================================================
            //  CENÁRIO B: VISITANTE (NÃO LOGADO)
            //
            //  Mostra:
            //    - "Cadastrar" (criar conta)
            //    - "Entrar"    (fazer login)
            //
            //  Não mostra "Novo Evento" nem "Sair" porque não fazem
            //  sentido para quem não está autenticado.
            // =========================================================
            ?>
            <?php else: ?>

                <!-- Link para o formulário de cadastro de conta -->
                <li>
                    <a href="/cadastro">Cadastrar</a>
                </li>

                <!-- Link para o formulário de login -->
                <li>
                    <a href="/entrar">Entrar</a>
                </li>

            <?php endif; ?>

        </ul>
    </nav>
</header>