/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});/**
 * home.js
 * 
 * Responsável pelas interações AJAX da página inicial:
 *   - Botão "OK / CONCLUÍDO": alterna o status do evento (Pendente ↔ Concluído)
 *   - Botão "EXCLUIR": remove o evento (com confirmação)
 * 
 * Ambos os botões usam data-id para identificar o evento e enviam
 * o CSRF Token no corpo e no header (defesa em profundidade).
 * 
 * Todas as respostas vêm em JSON do Controller (WebController).
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Captura de referências globais ----------------------------------

    // Lê o CSRF Token da <meta name="csrf-token"> gerada no tmp_head.php.
    // Esse token é o mesmo presente na sessão do servidor.
    const csrfMeta  = document.querySelector('meta[name="csrf-token"]');
    const csrfToken = csrfMeta ? csrfMeta.getAttribute('content') : '';

    // Div global onde as mensagens de feedback são exibidas.
    // É o mesmo #msg usado pelo login e cadastro.
    const msgDiv = document.getElementById('msg');


    // --- Função utilitária de exibição de mensagens ----------------------
    // 
    // Centraliza a lógica de mostrar mensagens de erro/sucesso.
    // Se o #msg não existir (por algum motivo), usa alert() como fallback.
    // Aplica uma classe CSS (msg-info, msg-erro, msg-sucesso) para colorir.
    // Também rola a página para o topo e esconde a mensagem após 4s.

    const mostrarMsg = (texto, tipo = 'info') => {
        if (!msgDiv) return alert(texto);

        msgDiv.textContent = texto;
        msgDiv.className = `msg msg-${tipo}`;
        msgDiv.style.display = 'block';

        // Rola a janela até o topo para que o usuário veja a mensagem.
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Esconde a mensagem após 4 segundos (feedback não-bloqueante).
        setTimeout(() => {
            msgDiv.style.display = 'none';
        }, 4000);
    };


    // --- Função genérica de requisição POST ------------------------------
    //
    // Envia o ID do evento e o CSRF Token para o endpoint indicado.
    // Usada tanto por "Concluir" quanto por "Excluir", evitando duplicação.
    //
    // Headers importantes:
    //   - X-CSRF-Token:        valida a origem da requisição
    //   - X-Requested-With:    identifica como AJAX (o PHP pode usar isso)
    //   - Accept: application/json  força resposta em JSON
    //
    // "credentials: 'same-origin'" garante que o cookie de sessão
    // (PHPSESSID) seja enviado junto — sem ele, o PHP não reconhece
    // o usuário logado e retorna 401.

    const enviarRequisicao = async (url, eventoId) => {
        const dados = new FormData();
        dados.append('id', eventoId);
        dados.append('csrf_token', csrfToken);

        const resp = await fetch(url, {
            method: 'POST',
            body: dados,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            }
        });

        return await resp.json();
    };


    // =================================================================
    //  AÇÃO 1: CONCLUIR / DESFAZER
    // =================================================================
    //
    // Alterna o status do evento no banco via /eventos/concluir.
    // Otimista: atualiza o botão na hora, sem recarregar a página.

    const botoesConcluir = document.querySelectorAll('.btn-concluir');

    botoesConcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.getAttribute('data-id');
            const originalText = btn.textContent;

            // Feedback imediato: desabilita e mostra spinner textual.
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/concluir', id);

                if (json.ok) {
                    // Alterna o visual do botão no cliente.
                    // A lógica é a mesma do servidor: se já está concluído,
                    // volta para "OK"; senão, marca como "CONCLUÍDO".
                    const isConcluido = btn.classList.contains('concluido');
                    if (isConcluido) {
                        btn.classList.remove('concluido');
                        btn.textContent = 'OK';
                    } else {
                        btn.classList.add('concluido');
                        btn.textContent = 'CONCLUÍDO';
                    }

                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (ex: 404 - evento não pertence ao usuário)
                    btn.textContent = originalText;
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                // Falha de rede ou resposta não-JSON (ex: 500 que retornou HTML)
                console.error(err);
                btn.textContent = originalText;
                mostrarMsg('Erro de comunicação.', 'erro');
            } finally {
                // Reabilita o botão em qualquer caso.
                btn.disabled = false;
            }
        });
    });


    // =================================================================
    //  AÇÃO 2: EXCLUIR
    // =================================================================
    //
    // Remove o evento via /eventos/excluir.
    // Pede confirmação ao usuário e remove a linha com efeito de fade.

    const botoesExcluir = document.querySelectorAll('.btn-excluir');

    botoesExcluir.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Confirmação obrigatória — exclusão é irreversível.
            if (!confirm('Tem certeza que deseja excluir este evento?')) return;

            const id     = btn.getAttribute('data-id');
            const linha  = document.getElementById(`linha-${id}`);

            // Feedback visual imediato
            btn.disabled = true;
            btn.textContent = '...';

            try {
                const json = await enviarRequisicao('/eventos/excluir', id);

                if (json.ok) {
                    // Remove a linha com transição suave (opacidade → 0)
                    // e, após 300ms, remove o nó da tabela.
                    if (linha) {
                        linha.style.transition = 'opacity 0.3s';
                        linha.style.opacity = '0';
                        setTimeout(() => linha.remove(), 300);
                    }
                    mostrarMsg(json.msg, 'sucesso');
                } else {
                    // Servidor rejeitou (não encontrado, sem permissão, etc.)
                    btn.disabled = false;
                    btn.textContent = 'EXCLUIR';
                    mostrarMsg(json.msg, 'erro');
                }
            } catch (err) {
                console.error(err);
                btn.disabled = false;
                btn.textContent = 'EXCLUIR';
                mostrarMsg('Erro de comunicação.', 'erro');
            }
        });
    });

});