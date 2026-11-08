<?php

declare(strict_types=1);

namespace App\Models;

use App\Database\ConnDb;
use PDO;
use PDOException;
use RuntimeException;

/**
 * Model responsável pelas operações de banco de dados relacionadas a eventos.
 * 
 * Tabela: `t_eventos`
 * Campos: eve_id, eve_nome, eve_dt_evento, eve_dt_criacao, eve_ativo, eve_fk_usu
 * 
 * Regras importantes:
 *   - eve_ativo = 1 → evento PENDENTE (ainda não concluído)
 *   - eve_ativo = 0 → evento CONCLUÍDO
 *   - Toda operação exige eve_fk_usu = $usuarioId. Isso garante que um usuário
 *     NÃO consiga ler, editar ou excluir eventos de outro, mesmo sabendo o ID.
 */
class EventosModel
{
    /**
     * Instância PDO usada em todas as consultas.
     * Injetada no construtor (ou criada automaticamente via ConnDb::fromEnv).
     */
    private PDO $db;

    /**
     * Construtor.
     * 
     * Permite injetar uma conexão existente (útil para testes ou reaproveitamento)
     * ou criar uma nova a partir das variáveis de ambiente.
     * 
     * @param ConnDb|null $conn Conexão opcional (injeção de dependência).
     */
    public function __construct(?ConnDb $conn = null)
    {
        $conn ??= ConnDb::fromEnv();
        $this->db = $conn->conectar();
    }


    // =================================================================
    //  LEITURA
    // =================================================================

    /**
     * Busca todos os eventos de um usuário específico.
     * 
     * Aceita um parâmetro opcional de busca ($busca) que filtra pelo nome
     * do evento (LIKE '%texto%'). Isso permite que a barra de pesquisa
     * do header funcione sem precisar de consultas adicionais.
     * 
     * O SQL é montado dinamicamente, mas os parâmetros são sempre enviados
     * via bind (proteção contra SQL Injection).
     * 
     * @param int         $usuarioId ID do usuário dono dos eventos.
     * @param string|null $busca     Texto a filtrar no nome (opcional).
     * @return array                 Lista de eventos encontrados.
     * @throws RuntimeException       Em caso de falha na consulta.
     */
    public function buscarPorUsuario(int $usuarioId, ?string $busca = null): array
    {
        // Query base — sempre filtra pelo dono do evento.
        $sql = 'SELECT eve_id, eve_nome, eve_dt_evento, eve_ativo 
                  FROM t_eventos 
                 WHERE eve_fk_usu = :usu_id';

        $params = [':usu_id' => $usuarioId];

        // Filtro opcional por nome (só adiciona se o usuário pesquisou algo).
        if ($busca !== null && $busca !== '') {
            $sql .= ' AND eve_nome LIKE :busca';
            $params[':busca'] = '%' . $busca . '%';
        }

        // Ordena cronologicamente pelos mais próximos primeiro.
        $sql .= ' ORDER BY eve_dt_evento ASC';

        $stmt = $this->db->prepare($sql);

        try {
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            error_log('[EventosModel::buscarPorUsuario] ' . $e->getMessage());
            throw new RuntimeException('Falha ao carregar eventos', previous: $e);
        }
    }

    /**
     * Busca um único evento pelo ID.
     * 
     * Utilizado na tela de edição para pré-preencher o formulário.
     * O filtro `eve_fk_usu = :usu_id` garante que o usuário só consiga
     * editar seus próprios eventos. Se tentar acessar o ID de outro
     * usuário, retorna null (a View redireciona para a home).
     * 
     * @param int $eventoId  ID do evento.
     * @param int $usuarioId ID do usuário logado.
     * @return array|null    Dados do evento ou null se não existir/não pertencer.
     * @throws RuntimeException Em caso de falha na consulta.
     */
    public function buscarPorId(int $eventoId, int $usuarioId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT eve_id, eve_nome, eve_dt_evento, eve_ativo 
               FROM t_eventos 
              WHERE eve_id = :eve_id AND eve_fk_usu = :usu_id 
              LIMIT 1'
        );

        try {
            $stmt->execute([':eve_id' => $eventoId, ':usu_id' => $usuarioId]);
            $row = $stmt->fetch();

            // Normaliza o retorno: null em vez de false.
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('[EventosModel::buscarPorId] ' . $e->getMessage());
            throw new RuntimeException('Falha ao carregar evento', previous: $e);
        }
    }


    // =================================================================
    //  ESCRITA (Criar / Atualizar / Excluir / Toggle)
    // =================================================================

    /**
     * Cria um novo evento.
     * 
     * O parâmetro $ativo vem do Controller já tratado:
     *   - Novo evento → 1 (Pendente)
     *   - Edição com status alterado → 0 (Concluído) ou 1 (Pendente)
     * 
     * @param string $nome      Nome/descrição do evento.
     * @param string $data      Data no formato YYYY-MM-DD.
     * @param int    $ativo     1 = pendente, 0 = concluído.
     * @param int    $usuarioId ID do usuário dono do evento.
     * @return bool              True em caso de sucesso.
     * @throws RuntimeException  Em caso de falha na inserção.
     */
    public function criar(string $nome, string $data, int $ativo, int $usuarioId): bool
    {
        $stmt = $this->db->prepare(
            'INSERT INTO t_eventos (eve_nome, eve_dt_evento, eve_ativo, eve_fk_usu) 
             VALUES (:nome, :data, :ativo, :usu_id)'
        );

        try {
            return $stmt->execute([
                ':nome'   => $nome,
                ':data'   => $data,
                ':ativo'  => $ativo,
                ':usu_id' => $usuarioId,
            ]);
        } catch (PDOException $e) {
            error_log('[EventosModel::criar] ' . $e->getMessage());
            throw new RuntimeException('Falha ao criar evento', previous: $e);
        }
    }

    /**
     * Atualiza um evento existente.
     * 
     * O WHERE inclui `eve_fk_usu = :usu_id`, o que impede que um usuário
     * altere eventos de outro, mesmo passando o ID correto pela URL.
     * 
     * Retorna true se a linha foi efetivamente alterada (rowCount > 0).
     * Se o usuário enviar os mesmos dados (sem mudança), retorna false
     * — comportamento esperado pelo Controller.
     * 
     * @param int    $eventoId  ID do evento.
     * @param string $nome      Novo nome.
     * @param string $data      Nova data (YYYY-MM-DD).
     * @param int    $ativo     1 = pendente, 0 = concluído.
     * @param int    $usuarioId ID do usuário logado.
     * @return bool              True se ao menos 1 linha foi alterada.
     * @throws RuntimeException  Em caso de falha na atualização.
     */
    public function atualizar(int $eventoId, string $nome, string $data, int $ativo, int $usuarioId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE t_eventos 
                SET eve_nome = :nome, eve_dt_evento = :data, eve_ativo = :ativo 
              WHERE eve_id = :eve_id AND eve_fk_usu = :usu_id'
        );

        try {
            $stmt->execute([
                ':nome'   => $nome,
                ':data'   => $data,
                ':ativo'  => $ativo,
                ':eve_id' => $eventoId,
                ':usu_id' => $usuarioId,
            ]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('[EventosModel::atualizar] ' . $e->getMessage());
            throw new RuntimeException('Falha ao atualizar evento', previous: $e);
        }
    }

    /**
     * Alterna o status do evento (Pendente ↔ Concluído).
     * 
     * Usa a função SQL IF() para inverter o valor diretamente no banco,
     * evitando uma consulta extra (SELECT) seguida de UPDATE.
     * 
     * Equivalente a:
     *   UPDATE t_eventos SET eve_ativo = NOT eve_ativo WHERE ...
     * 
     * O filtro `eve_fk_usu = :usu_id` garante que só o dono pode alterar.
     * 
     * @param int $eventoId  ID do evento.
     * @param int $usuarioId ID do usuário logado.
     * @return bool          True se a linha foi alterada.
     * @throws RuntimeException Em caso de falha.
     */
    public function toggleStatus(int $eventoId, int $usuarioId): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE t_eventos 
                SET eve_ativo = IF(eve_ativo = 1, 0, 1) 
              WHERE eve_id = :eve_id AND eve_fk_usu = :usu_id'
        );

        try {
            $stmt->execute([':eve_id' => $eventoId, ':usu_id' => $usuarioId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('[EventosModel::toggleStatus] ' . $e->getMessage());
            throw new RuntimeException('Falha ao atualizar evento', previous: $e);
        }
    }

    /**
     * Exclui um evento.
     * 
     * O WHERE inclui `eve_fk_usu = :usu_id` para impedir que um usuário
     * exclua o evento de outro. Se o ID não pertencer ao usuário logado,
     * rowCount() será 0 e o Controller devolverá "não encontrado".
     * 
     * @param int $eventoId  ID do evento.
     * @param int $usuarioId ID do usuário logado.
     * @return bool          True se a linha foi removida.
     * @throws RuntimeException Em caso de falha.
     */
    public function excluir(int $eventoId, int $usuarioId): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM t_eventos 
              WHERE eve_id = :eve_id AND eve_fk_usu = :usu_id'
        );

        try {
            $stmt->execute([':eve_id' => $eventoId, ':usu_id' => $usuarioId]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('[EventosModel::excluir] ' . $e->getMessage());
            throw new RuntimeException('Falha ao excluir evento', previous: $e);
        }
    }
}
