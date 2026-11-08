<?php

declare(strict_types=1);

namespace App\Models;

use App\Database\ConnDb;
use PDO;
use PDOException;
use RuntimeException;

class EventosModel
{
    private PDO $db;

    public function __construct(?ConnDb $conn = null)
    {
        $conn ??= ConnDb::fromEnv();
        $this->db = $conn->conectar();
    }

    // Busca os eventos de um usuário específico
        public function buscarPorUsuario(int $usuarioId, ?string $busca = null): array
    {
        $sql = 'SELECT eve_id, eve_nome, eve_dt_evento, eve_ativo 
                  FROM t_eventos 
                 WHERE eve_fk_usu = :usu_id';
        
        $params = [':usu_id' => $usuarioId];

        if ($busca !== null && $busca !== '') {
            $sql .= ' AND eve_nome LIKE :busca';
            $params[':busca'] = '%' . $busca . '%';
        }

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

    // Alterna o status (concluído/pendente)
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

    // Exclui o evento
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

        // Busca os dados de um único evento (para a tela de edição)
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
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('[EventosModel::buscarPorId] ' . $e->getMessage());
            throw new RuntimeException('Falha ao carregar evento', previous: $e);
        }
    }

    // Cria um novo evento
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
                ':usu_id' => $usuarioId
            ]);
        } catch (PDOException $e) {
            error_log('[EventosModel::criar] ' . $e->getMessage());
            throw new RuntimeException('Falha ao criar evento', previous: $e);
        }
    }

    // Atualiza um evento existente
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
                ':usu_id' => $usuarioId
            ]);
            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log('[EventosModel::atualizar] ' . $e->getMessage());
            throw new RuntimeException('Falha ao atualizar evento', previous: $e);
        }
    }
}