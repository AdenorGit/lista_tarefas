/**
 * logout.js
 * 
 * Intercepta o clique no link "Sair" do header para enviar um POST
 * protegido por CSRF em vez de fazer uma simples navegação GET.
 * 
 * Motivação (se mantido em uso):
 *   - Logout via GET é vulnerável a CSRF (um <img src="/sair"> em outro
 *     site deslogaria o usuário).
 *   - POST + CSRF elimina esse risco, exigindo confirmação do usuário
 *     e o token correto.
 * 
 * Se o projeto optou por usar apenas <a href="/sair">, este arquivo
 * pode ser removido — o Controller já trata o GET de forma simples.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências ------------------------------------------------------

    // Link "Sair" (só existe no header quando o usuário está logado).
    const link = document.getElementById('linkSair');

    // Se a página não tem o link (ex: usuário deslogado), nada a fazer.
    if (!link) return;

    // CSRF Token lido da <meta name="csrf-token">.
    // Necessário para o POST em /sair ser aceito pelo Controller.
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrf = csrfMeta ? csrfMeta.getAttribute('content') : '';


    // --- Handler do clique -----------------------------------------------

    link.addEventListener('click', async (ev) => {

        // Impede a navegação para "#" (comportamento padrão do <a>).
        ev.preventDefault();

        // --- Confirmação -------------------------------------------------
        // Como o logout é destrutivo para a sessão, pedimos confirmação.
        if (!confirm('Deseja realmente sair?')) return;

        // --- Prepara o envio ---------------------------------------------
        // Enviamos o CSRF Token no corpo E no header (defesa em profundidade).
        const dados = new FormData();
        dados.append('csrf_token', csrf);

        try {
            // --- Requisição AJAX -----------------------------------------
            const resp = await fetch('/sair', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin', // Envia o cookie PHPSESSID
                headers: {
                    'X-CSRF-Token': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            // O servidor pode retornar HTML (fatal error), então garantimos
            // que o parse falhe de forma controlada.
            let json;
            try {
                json = await resp.json();
            } catch {
                throw new Error('Resposta inválida do servidor.');
            }

            // --- Trata a resposta ----------------------------------------

            if (resp.ok && json.ok) {
                // Logout bem-sucedido: redireciona para /entrar.
                // O Controller retorna { ok: true, redirect: '/entrar' }.
                window.location.href = json.redirect || '/entrar';
            } else {
                // Servidor rejeitou (ex: 419 - CSRF inválido, 401 - não logado).
                // Usa alert() porque não há div #msg visível no header.
                alert(json.msg || 'Falha ao sair.');
            }

        } catch (err) {
            // Falhas de rede, servidor fora do ar, resposta não-JSON.
            console.error(err);
            alert('Erro de comunicação com o servidor.');
        }
    });

});