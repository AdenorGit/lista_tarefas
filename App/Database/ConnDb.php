<?php

declare(strict_types=1);

namespace App\Database;

use PDO;
use PDOException;
use RuntimeException;

final class ConnDb
{
    private ?PDO $conexao = null;

    public function __construct(
        private readonly string $host,
        private readonly string $name,
        private readonly string $user,
        private readonly string $password,
        private readonly int $timeout = 5,
    ) {}

    public static function fromEnv(): self
    {
        $env = static fn (string $key, ?string $default = null): string =>
            $_ENV[$key] ?? (getenv($key) ?: $default)
            ?? throw new RuntimeException("Variável de ambiente '$key' não definida.");

        return new self(
            host:     $env('DB_HOST', 'localhost'),
            name:     $env('DB_NAME'),
            user:     $env('DB_USER'),
            password: $env('DB_PASS'),
            timeout:  (int) $env('DB_TIMEOUT', '5'),
        );
    }

    public function conectar(): PDO
    {
        if ($this->conexao instanceof PDO) {
            return $this->conexao;
        }

        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8mb4',
            $this->host,
            $this->name,
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_TIMEOUT            => $this->timeout,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            return $this->conexao = new PDO($dsn, $this->user, $this->password, $options);
        } catch (PDOException $e) {
            // Preserva a exceção original como $previous para diagnóstico.
            throw new RuntimeException(
                "Falha ao conectar ao banco de dados '{$this->name}' em '{$this->host}'.",
                previous: $e,
            );
        }
    }
}