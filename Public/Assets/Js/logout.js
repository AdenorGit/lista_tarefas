document.addEventListener('DOMContentLoaded', () => {
    const link = document.getElementById('linkSair');
    if (!link) return;

    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrf = csrfMeta ? csrfMeta.getAttribute('content') : '';

    link.addEventListener('click', async (ev) => {
        ev.preventDefault();

        if (!confirm('Deseja realmente sair?')) return;

        const dados = new FormData();
        dados.append('csrf_token', csrf);

        try {
            const resp = await fetch('/sair', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            let json;
            try { json = await resp.json(); }
            catch { throw new Error('Resposta inválida do servidor.'); }

            if (resp.ok && json.ok) {
                window.location.href = json.redirect || '/entrar';
            } else {
                alert(json.msg || 'Falha ao sair.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de comunicação com o servidor.');
        }
    });
});