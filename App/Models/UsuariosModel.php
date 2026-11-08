<?php

declare(strict_types=1);

namespace App\Models;

use App\Database\ConnDb;
use PDO;
use PDOException;
use RuntimeException;

class UsuariosModel
{
    private PDO $db;

    public function __construct(?ConnDb $conn = null)
    {
        $conn ??= ConnDb::fromEnv();
        $this->db = $conn->conectar();
    }

    public function buscarPorEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT usu_id, usu_nome, usu_email, usu_senha, usu_admin, usu_ativo
               FROM t_usuarios
              WHERE usu_email = :email
              LIMIT 1'
        );

        try {
            $stmt->execute([':email' => $email]);
            $row = $stmt->fetch();
            return $row ?: null;
        } catch (PDOException $e) {
            error_log('[UsuariosModel] ' . $e->getMessage());
            throw new RuntimeException('Falha ao carregar usuário', previous: $e);
        }
    }

        public function cadastrarUsuario(string $nome, string $email, string $senhaHash): bool
    {
        $sql = 'INSERT INTO t_usuarios 
                    (usu_nome, usu_email, usu_senha, usu_ativo, usu_admin) 
                VALUES 
                    (:nome, :email, :senha, 1, 0)';
        
        $stmt = $this->db->prepare($sql);

        try {
            return $stmt->execute([
                ':nome'  => $nome,
                ':email' => $email,
                ':senha' => $senhaHash
            ]);
        } catch (PDOException $e) {
            error_log('[UsuariosModel::cadastrarUsuario] ' . $e->getMessage());
            throw new RuntimeException('Falha ao cadastrar usuário', previous: $e);
        }
    }
}