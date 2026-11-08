document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formEvento');
    const msgDiv = document.getElementById('msg');
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);
        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    form.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        if (msgDiv) msgDiv.style.display = 'none';

        const dados = new FormData(form);
        
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }

        try {
            const resp = await fetch('/eventos/salvar', {
                method: 'POST',
                body: dados,
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                }
            });

            let json;
            try { json = await resp.json(); }
            catch { throw new Error('Resposta inválida do servidor.'); }

            if (resp.ok && json.ok) {
                mostrarMsg(json.msg || 'Salvo com sucesso!', 'sucesso');
                setTimeout(() => {
                    window.location.href = json.redirect || '/';
                }, 1000);
            } else {
                mostrarMsg(json.msg || 'Erro ao salvar.', 'erro');
            }
        } catch (err) {
            console.error(err);
            mostrarMsg('Erro de comunicação com o servidor.', 'erro');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = 'Salvar Evento'; }
        }
    });
});