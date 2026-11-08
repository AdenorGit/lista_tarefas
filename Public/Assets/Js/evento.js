/**
 * evento.js
 * 
 * Utilizado na tela de formulário de evento (novo e edição).
 * Captura o submit do #formEvento e envia via AJAX para o endpoint
 * /eventos/salvar, evitando recarregamento da página.
 * 
 * O Controller (WebController::salvarEvento) decide sozinho se a operação
 * é CRIAÇÃO ou EDIÇÃO, checando a presença do campo "id" no POST.
 * Este JS não precisa se preocupar com isso — apenas envia o form.
 * 
 * Em caso de sucesso:
 *   - Exibe mensagem e redireciona para a home após 1s.
 * Em caso de erro:
 *   - Exibe a mensagem retornada pelo servidor em #msg.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências ------------------------------------------------------

    // Formulário de evento (existe tanto em /eventos/novo quanto /eventos/editar/N).
    const form   = document.getElementById('formEvento');
    const msgDiv = document.getElementById('msg');

    // Se não há formulário nesta página, encerra (evita erro em outras views).
    if (!form) return;

    // Botão de submit (para feedback visual durante o envio).
    const btn = form.querySelector('button[type="submit"]');

    // CSRF Token lido da <meta> — o Controller exige em qualquer POST.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';


    // --- Função utilitária de feedback -----------------------------------

    // Exibe mensagem na div #msg com cor adequada (info/erro/sucesso)
    // e rola a página para o topo para que o usuário veja.
    // 
    // Não usa setTimeout para esconder automaticamente, diferente do
    // home.js: aqui a mensagem pode ser útil para o usuário copiar
    // o erro ou entender o que aconteceu antes de tentar de novo.
    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);
        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    // --- Handler do submit -----------------------------------------------

    form.addEventListener('submit', async (ev) => {

        // Impede o envio tradicional (que recarregaria a página).
        ev.preventDefault();

        // Esconde a mensagem anterior para evitar "colagem" visual.
        if (msgDiv) msgDiv.style.display = 'none';

        // --- Prepara o envio ---------------------------------------------
        // 
        // FormData serializa automaticamente TODOS os campos do form,
        // incluindo:
        //   - csrf_token (hidden)
        //   - id (hidden, se for edição)
        //   - nome
        //   - data
        //   - ativo (select na edição, hidden na criação)
        //
        // Por isso o Controller consegue distinguir criação vs edição
        // apenas verificando se o "id" veio no POST.
        const dados = new FormData(form);

        // Feedback visual imediato no botão.
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Salvando...';
        }

        try {
            // --- Requisição AJAX -----------------------------------------
            const resp = await fetch('/eventos/salvar', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin', // Envia o cookie PHPSESSID
                headers: {
                    'X-CSRF-Token':     csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept':           'application/json',
                }
            });

            // O servidor pode retornar HTML em caso de erro fatal (500).
            // O try/catch interno garante que o parse falhe de forma
            // controlada e caia no catch externo com mensagem clara.
            let json;
            try {
                json = await resp.json();
            } catch {
                throw new Error('Resposta inválida do servidor.');
            }

            // --- Trata a resposta ----------------------------------------

            if (resp.ok && json.ok) {
                // Salvo com sucesso (novo ou editado).
                mostrarMsg(json.msg || 'Salvo com sucesso!', 'sucesso');

                // Aguarda 1s para o usuário ler a mensagem antes do redirect.
                setTimeout(() => {
                    window.location.href = json.redirect || '/';
                }, 1000);

            } else {
                // Servidor rejeitou (validação, CSRF, não encontrado, etc.)
                // A mensagem vem do Controller em json.msg.
                mostrarMsg(json.msg || 'Erro ao salvar.', 'erro');
            }

        } catch (err) {
            // Falhas de rede, servidor fora do ar, resposta não-JSON.
            console.error(err);
            mostrarMsg('Erro de comunicação com o servidor.', 'erro');

        } finally {
            // Reabilita o botão em qualquer cenário para permitir nova tentativa.
            // Importante: só restaura o texto se ainda não houve redirect
            // (se houve, a página já mudou).
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Salvar Evento';
            }
        }
    });

});