document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('#divPrincipal form');
    const msg  = document.getElementById('msg');
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrf = csrfMeta ? csrfMeta.getAttribute('content') : '';

    const mostrar = (texto, tipo = 'info') => {
        if (!msg) return alert(texto);
        msg.textContent = texto;
        msg.className = `msg msg-${tipo}`;
        msg.style.display = 'block';
    };

    const limpar = () => {
        if (!msg) return;
        msg.textContent = '';
        msg.style.display = 'none';
        msg.className = 'msg';
    };

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        limpar();

        const email = form.querySelector('#email')?.value.trim() ?? '';
        const senha = form.querySelector('#senha')?.value ?? '';

        if (!email || !senha) {
            mostrar('Informe e-mail e senha.', 'erro');
            return;
        }

        // O controller lê o token via $_POST['csrf_token'] (e header como fallback)
        const tokenInput = form.querySelector('#csrf_token')?.value || csrf;

        const dados = new FormData();
        dados.append('email', email);
        dados.append('senha', senha);
        dados.append('csrf_token', tokenInput);

        if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

        try {
            const resp = await fetch('/login', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': tokenInput,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            let json;
            try { json = await resp.json(); }
            catch { throw new Error('Resposta inválida do servidor.'); }

            if (resp.ok && json.ok) {
                mostrar(json.msg || 'Login realizado com sucesso.', 'sucesso');
                setTimeout(() => {
                    window.location.href = json.redirect || '/';
                }, 700);
            } else {
                mostrar(json.msg || 'Falha no login.', 'erro');
            }
        } catch (err) {
            console.error(err);
            mostrar('Erro de comunicação com o servidor.', 'erro');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Entrar'; }
        }
    });
});