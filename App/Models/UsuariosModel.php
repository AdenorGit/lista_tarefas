<?php

declare(strict_types=1);

namespace App\Models;

use App\Database\ConnDb;
use PDO;
use PDOException;
use RuntimeException;

/**
 * Model responsável pelas operações de banco de dados relacionadas a usuários.
 * 
 * Tabela: `t_usuarios`
 * Campos: usu_id, usu_nome, usu_email, usu_senha, usu_admin, usu_ativo, usu_dt_criacao
 * 
 * Encapsula toda a comunicação com o banco referente a usuários, mantendo o
 * Controller isolado de detalhes de SQL.
 */
class UsuariosModel
{
    /**
     * Instância PDO usada em todas as consultas.
     * É injetada no construtor (ou criada automaticamente via ConnDb::fromEnv).
     */
    private PDO $db;

    /**
     * Construtor.
     * 
     * Permite injetar uma conexão existente (útil para testes ou reaproveitamento)
     * ou, caso não seja informada, cria uma nova instância a partir das variáveis
     * de ambiente (DB_HOST, DB_NAME, DB_USER, DB_PASS).
     * 
     * @param ConnDb|null $conn Conexão opcional (injeção de dependência).
     */
    public function __construct(?ConnDb $conn = null)
    {
        $conn ??= ConnDb::fromEnv();
        $this->db = $conn->conectar();
    }

    /**
     * Busca um usuário pelo e-mail.
     * 
     * Utilizado em dois contextos:
     *   1. No login, para recuperar o hash da senha e validar via password_verify.
     *   2. No cadastro, para verificar se o e-mail já está em uso.
     * 
     * Retorna null se não encontrar nenhum registro.
     * Utiliza prepared statement (proteção contra SQL Injection).
     * 
     * @param string $email E-mail a pesquisar.
     * @return array|null    Dados do usuário (ou null se não existir).
     * @throws RuntimeException Em caso de falha na consulta.
     */
    public function buscarPorEmail(string $email): ?array
    {
        // Prepared statement com parâmetro nomeado (:email).
        $stmt = $this->db->prepare(
            'SELECT usu_id, usu_nome, usu_email, usu_senha, usu_admin, usu_ativo
               FROM t_usuarios
              WHERE usu_email = :email
              LIMIT 1'
        );

        try {
            $stmt->execute([':email' => $email]);
            $row = $stmt->fetch();

            // Retorna null explicitamente se não houver resultado,
            // para que o Controller possa tratar com uma simples checagem.
            return $row ?: null;
        } catch (PDOException $e) {
            // Loga a mensagem original (útil para debug) e relança como RuntimeException
            // para que o Controller saiba que houve falha de infraestrutura.
            error_log('[UsuariosModel] ' . $e->getMessage());
            throw new RuntimeException('Falha ao carregar usuário', previous: $e);
        }
    }

    /**
     * Cadastra um novo usuário no banco.
     * 
     * Observações importantes:
     *   - A senha recebida JÁ DEVE vir criptografada (hash) do Controller.
     *     O Model NÃO aplica password_hash — isso é responsabilidade da camada de cima.
     *   - Define usu_ativo = 1 (usuário ativo por padrão) e usu_admin = 0 (não-admin).
     *   - Usa prepared statement para evitar SQL Injection.
     * 
     * @param string $nome      Nome completo do usuário.
     * @param string $email     E-mail único do usuário.
     * @param string $senhaHash Hash gerado por password_hash().
     * @return bool             True em caso de sucesso.
     * @throws RuntimeException Em caso de falha na inserção.
     */
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
                ':senha' => $senhaHash,
            ]);
        } catch (PDOException $e) {
            error_log('[UsuariosModel::cadastrarUsuario] ' . $e->getMessage());
            throw new RuntimeException('Falha ao cadastrar usuário', previous: $e);
        }
    }
}
