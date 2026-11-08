document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastro');
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

        const nome = form.querySelector('#nome')?.value.trim() ?? '';
        const email = form.querySelector('#email')?.value.trim() ?? '';
        const senha = form.querySelector('#senha')?.value ?? '';
        const confirmar = form.querySelector('#confirmar_senha')?.value ?? '';
        const tokenInput = form.querySelector('#csrf_token')?.value || csrf;

        if (senha !== confirmar) {
            mostrar('As senhas não conferem.', 'erro');
            return;
        }

        const dados = new FormData();
        dados.append('nome', nome);
        dados.append('email', email);
        dados.append('senha', senha);
        dados.append('confirmar_senha', confirmar);
        dados.append('csrf_token', tokenInput);

        if (btn) { btn.disabled = true; btn.textContent = 'Cadastrando...'; }

        try {
            const resp = await fetch('/cadastro', {
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
                mostrar(json.msg || 'Cadastro realizado com sucesso!', 'sucesso');
                form.reset();
                
                // Redireciona após 1.5 segundos
                setTimeout(() => {
                    window.location.href = json.redirect || '/entrar';
                }, 1500);
            } else {
                mostrar(json.msg || 'Erro ao cadastrar.', 'erro');
            }
        } catch (err) {
            console.error(err);
            mostrar('Erro de comunicação com o servidor.', 'erro');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Cadastrar'; }
        }
    });
});