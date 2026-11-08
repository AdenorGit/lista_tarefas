document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.querySelector('#formLogin');
    const msgDiv    = document.getElementById('msg');
    if (!formLogin) return;

    formLogin.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email      = formLogin.querySelector('#email').value.trim();
        const senha      = formLogin.querySelector('#senha').value;
        const csrfToken  = formLogin.querySelector('#csrf_token').value;

        if (!email || !senha) {
            exibirMensagem('Preencha todos os campos.', 'erro');
            return;
        }

        const botao = formLogin.querySelector('button[type="submit"]');
        const textoOriginal = botao.textContent;
        botao.disabled = true;
        botao.textContent = 'Entrando...';

        try {
            const resposta = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-Token': csrfToken   // header adicional (opcional)
                },
                credentials: 'same-origin',     // envia cookies de sessão
                body: JSON.stringify({ email, senha, csrf_token: csrfToken })
            });

            let dados;
            try {
                dados = await resposta.json();
            } catch {
                throw new Error('Resposta inválida do servidor.');
            }

            if (!resposta.ok) {
                const mensagem = dados.mensagem || dados.message || dados.erro || dados.error
                    || `Erro ${resposta.status}`;
                exibirMensagem(mensagem, 'erro');
                return;
            }

            exibirMensagem(dados.mensagem || 'Login realizado com sucesso!', 'sucesso');
            if (dados.redirect) {
                window.location.href = dados.redirect;
            } else {
                setTimeout(() => window.location.href = '/', 1000);
            }

        } catch (erro) {
            console.error('Erro no login:', erro);
            exibirMensagem(erro.message || 'Erro de conexão. Tente novamente.', 'erro');
        } finally {
            botao.disabled = false;
            botao.textContent = textoOriginal;
        }
    });

    function exibirMensagem(texto, tipo = 'erro') {
        if (!msgDiv) return;
        msgDiv.textContent = texto;
        msgDiv.className = tipo;
        msgDiv.style.display = 'block';
    }
});