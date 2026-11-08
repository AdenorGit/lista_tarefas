/**
 * cadastro.js
 * 
 * Utilizado na tela de criação de conta (/cadastro).
 * Intercepta o submit do #formCadastro e envia via AJAX para
 * o endpoint POST /cadastro (WebController::cadastrar).
 * 
 * Diferenças em relação ao login.js:
 *   - Valida se as senhas coincidem ANTES de enviar (UX)
 *   - Envia 4 campos (nome, email, senha, confirmar_senha) em vez de 2
 *   - Em caso de sucesso, reseta o form antes de redirecionar
 *   - Timeout de redirect maior (1.5s) para o usuário ler a mensagem
 * 
 * A validação do servidor (WebController::cadastrar) continua sendo
 * a única confiável. O que fazemos aqui é apenas evitar requisições
 * desnecessárias e melhorar a experiência do usuário.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Referências ------------------------------------------------------

    // Formulário de cadastro (presente apenas em /cadastro).
    const form = document.getElementById('formCadastro');
    const msg  = document.getElementById('msg');

    // Se a página atual não tem formulário de cadastro, encerra.
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');

    // Token CSRF da <meta> — exigido pelo Controller em qualquer POST.
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrf     = csrfMeta ? csrfMeta.getAttribute('content') : '';


    // --- Funções de feedback ---------------------------------------------

    // Exibe uma mensagem com classe de cor dinâmica (msg-info/sucesso/erro).
    // Usa alert() como fallback se a #msg não existir na página.
    const mostrar = (texto, tipo = 'info') => {
        if (!msg) return alert(texto);
        msg.textContent   = texto;
        msg.className     = `msg msg-${tipo}`;
        msg.style.display = 'block';
    };

    // Limpa a mensagem antes de uma nova tentativa.
    const limpar = () => {
        if (!msg) return;
        msg.textContent   = '';
        msg.style.display = 'none';
        msg.className     = 'msg';
    };


    // --- Handler do submit -----------------------------------------------

    form.addEventListener('submit', async (ev) => {

        // Impede o envio tradicional (que recarregaria a página).
        ev.preventDefault();
        limpar();

        // --- Captura dos valores ----------------------------------------
        // 
        // O operador "?." (optional chaining) evita erro se algum campo
        // não existir por algum motivo. ".trim()" remove espaços em branco
        // das pontas (evita " joao@email.com " virar usuário inexistente).
        // Senhas NÃO levam trim — espaços podem ser parte da senha.
        const nome      = form.querySelector('#nome')?.value.trim() ?? '';
        const email     = form.querySelector('#email')?.value.trim() ?? '';
        const senha     = form.querySelector('#senha')?.value ?? '';
        const confirmar = form.querySelector('#confirmar_senha')?.value ?? '';

        // Fallback do CSRF: input hidden do form, senão meta.
        const tokenInput = form.querySelector('#csrf_token')?.value || csrf;

        // --- Validação mínima no cliente ---------------------------------
        // 
        // Apenas a checagem de confirmação de senha. As demais validações
        // (nome mínimo, e-mail válido, senha mínima) já estão nos
        // atributos HTML (required, minlength, type="email"), então o
        // navegador bloqueia o submit antes mesmo de chegar aqui.
        // 
        // O servidor revalida tudo — esta é apenas uma camada de UX.
        if (senha !== confirmar) {
            mostrar('As senhas não conferem.', 'erro');
            return;
        }

        // --- Prepara o envio ---------------------------------------------
        // 
        // FormData é o formato que o PHP lê como $_POST.
        // NÃO usamos JSON.stringify — o Controller espera $_POST['nome'],
        // $_POST['email'], etc.
        const dados = new FormData();
        dados.append('nome', nome);
        dados.append('email', email);
        dados.append('senha', senha);
        dados.append('confirmar_senha', confirmar);
        dados.append('csrf_token', tokenInput);

        // Feedback visual imediato no botão.
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Cadastrando...';
        }

        try {
            // --- Requisição AJAX -----------------------------------------
            const resp = await fetch('/cadastro', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin', // Envia o cookie PHPSESSID
                headers: {
                    'X-CSRF-Token':     tokenInput,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept':           'application/json',
                },
            });

            // O servidor pode retornar HTML em erro fatal (500).
            // O try/catch interno garante que o parse falhe de forma
            // controlada e caia no catch externo.
            let json;
            try {
                json = await resp.json();
            } catch {
                throw new Error('Resposta inválida do servidor.');
            }

            // --- Trata a resposta ----------------------------------------

            if (resp.ok && json.ok) {
                // Cadastro bem-sucedido (201 ou 200 com { ok: true }).
                mostrar(json.msg || 'Cadastro realizado com sucesso!', 'sucesso');

                // Limpa o formulário imediatamente.
                // Evita que a senha fique visível se o usuário cancelar
                // o redirect (ex: fechando a aba antes do setTimeout).
                form.reset();

                // Aguarda 1.5s para o usuário ler a mensagem antes do redirect.
                // Esse tempo é maior que o do login (700ms) porque o cadastro
                // é uma ação "mais importante" e o feedback merece ser lido.
                setTimeout(() => {
                    window.location.href = json.redirect || '/entrar';
                }, 1500);

            } else {
                // Servidor rejeitou (e-mail duplicado, validação, CSRF, etc.)
                // A mensagem específica vem do Controller em json.msg.
                mostrar(json.msg || 'Erro ao cadastrar.', 'erro');
            }

        } catch (err) {
            // Falhas de rede, servidor fora do ar, resposta não-JSON.
            console.error(err);
            mostrar('Erro de comunicação com o servidor.', 'erro');

        } finally {
            // Reabilita o botão para permitir nova tentativa.
            // Em caso de sucesso, isso é inofensivo — o redirect vai
            // acontecer em 1.5s e trocar a página.
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Cadastrar';
            }
        }
    });

});