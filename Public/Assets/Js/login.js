/**
 * login.js
 * 
 * Responsável por interceptar o formulário de login e enviá-lo via AJAX
 * (fetch) para o endpoint /login do Controller, evitando o recarregamento
 * da página. A resposta vem em JSON e é exibida na div #msg.
 * 
 * Fluxo:
 *   1. Intercepta o submit do form
 *   2. Valida campos básicos no cliente (UX)
 *   3. Envia via fetch com CSRF Token
 *   4. Trata sucesso (redirect) ou erro (mensagem na tela)
 * 
 * A validação real SEMPRE ocorre no servidor (WebController::login).
 * O que fazemos aqui é só feedback rápido.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências ------------------------------------------------------

    // Localiza o formulário dentro do container principal.
    // O querySelector é específico para evitar pegar o form de busca do header.
    const form = document.querySelector('#divPrincipal form');
    const msg = document.getElementById('msg');

    // Se a página não tem formulário de login (ex: home), encerra sem erro.
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');

    // Token CSRF lido da <meta> — usado como fallback caso o <input hidden>
    // não esteja presente por algum motivo.
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrf = csrfMeta ? csrfMeta.getAttribute('content') : '';


    // --- Funções de feedback ---------------------------------------------

    // Exibe uma mensagem na div #msg com classe dinâmica (msg-info/erro/sucesso).
    // Se a div não existir, usa alert() como fallback.
    const mostrar = (texto, tipo = 'info') => {
        if (!msg) return alert(texto);
        msg.textContent = texto;
        msg.className = `msg msg-${tipo}`;
        msg.style.display = 'block';
    };

    // Limpa a mensagem antes de uma nova tentativa.
    // Evita que a mensagem antiga "cole" na nova tentativa.
    const limpar = () => {
        if (!msg) return;
        msg.textContent = '';
        msg.style.display = 'none';
        msg.className = 'msg';
    };


    // --- Handler do submit -----------------------------------------------

    form.addEventListener('submit', async (ev) => {

        // Impede o envio tradicional (que recarregaria a página).
        ev.preventDefault();
        limpar();

        // --- Validação básica no cliente ---------------------------------
        // Não substitui a validação do servidor, apenas evita requisição
        // desnecessária se o usuário esqueceu de preencher algo.

        const email = form.querySelector('#email')?.value.trim() ?? '';
        const senha = form.querySelector('#senha')?.value ?? '';

        if (!email || !senha) {
            mostrar('Informe e-mail e senha.', 'erro');
            return;
        }

        // --- Prepara o envio ---------------------------------------------

        // Prefere o token do input hidden (mais explícito), mas usa o
        // da meta como fallback. O Controller aceita ambos:
        // $_POST['csrf_token'] ou header X-CSRF-Token.
        const tokenInput = form.querySelector('#csrf_token')?.value || csrf;

        // FormData é o formato que o PHP entende nativamente como $_POST.
        // Não usamos JSON.stringify porque o Controller lê via $_POST.
        const dados = new FormData();
        dados.append('email', email);
        dados.append('senha', senha);
        dados.append('csrf_token', tokenInput);

        // Feedback visual imediato: desabilita o botão e troca o texto.
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Entrando...';
        }

        try {
            // --- Requisição AJAX -----------------------------------------
            const resp = await fetch('/login', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin', // Envia o cookie PHPSESSID
                headers: {
                    'X-CSRF-Token': tokenInput,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            // O servidor pode responder com HTML (ex: erro fatal PHP 500).
            // Tentamos ler JSON primeiro para garantir que o parse falhe
            // de forma controlada e caia no catch geral.
            let json;
            try {
                json = await resp.json();
            } catch {
                throw new Error('Resposta inválida do servidor.');
            }

            // --- Trata a resposta ----------------------------------------

            if (resp.ok && json.ok) {
                // Login bem-sucedido: mostra mensagem e redireciona após
                // um pequeno atraso para o usuário ler o feedback.
                mostrar(json.msg || 'Login realizado com sucesso.', 'sucesso');
                setTimeout(() => {
                    window.location.href = json.redirect || '/';
                }, 700);
            } else {
                // Servidor rejeitou (credenciais inválidas, inativo, CSRF, etc.)
                // A mensagem vem do Controller em json.msg.
                mostrar(json.msg || 'Falha no login.', 'erro');
            }

        } catch (err) {
            // Falhas de rede, servidor fora do ar, resposta não-JSON, etc.
            console.error(err);
            mostrar('Erro de comunicação com o servidor.', 'erro');

        } finally {
            // Reabilita o botão em qualquer cenário para permitir nova tentativa.
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Entrar';
            }
        }
    });

});