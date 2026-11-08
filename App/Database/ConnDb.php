<?php

declare(strict_types=1);

namespace App\Database;

use PDO;
use PDOException;
use RuntimeException;

/**
 * Classe responsável por gerenciar a conexão com o banco de dados MySQL via PDO.
 * Implementa o padrão Singleton (por instância) para reaproveitar a conexão.
 */
final class ConnDb
{
    /**
     * Armazena a instância ativa da conexão PDO.
     * O valor nulo indica que a conexão ainda não foi estabelecida.
     */
    private ?PDO $conexao = null;

    /**
     * Construtor da classe.
     * Utiliza "Constructor Property Promotion" (PHP 8+) para declarar e inicializar
     * as propriedades de configuração da conexão de forma limpa.
     */
    public function __construct(
        private readonly string $host,
        private readonly string $name,
        private readonly string $user,
        private readonly string $password,
        private readonly int $timeout = 5,
    ) {}

    /**
     * Cria uma instância da classe lendo as configurações a partir de variáveis de ambiente.
     * Útil quando as credenciais vêm de um arquivo .env (via phpdotenv).
     *
     * @throws RuntimeException Se alguma variável obrigatória não estiver definida.
     */
    public static function fromEnv(): self
    {
        // Closure que busca uma variável de ambiente, com fallback para getenv() e valor padrão.
        $env = static fn(string $key, ?string $default = null): string =>
        $_ENV[$key] ?? (getenv($key) ?: $default)
            ?? throw new RuntimeException("Variável de ambiente '$key' não definida.");

        return new self(
            host: $env('DB_HOST', 'localhost'),
            name: $env('DB_NAME'),
            user: $env('DB_USER'),
            password: $env('DB_PASS'),
            timeout: (int) $env('DB_TIMEOUT', '5'),
        );
    }

    /**
     * Estabelece (ou retorna) a conexão com o banco de dados.
     * Se a conexão já existir, retorna a instância atual (evitando reconectar).
     *
     * @return PDO Instância ativa da conexão.
     * @throws RuntimeException Se a conexão falhar.
     */
    public function conectar(): PDO
    {
        // Se a conexão já foi criada anteriormente, reaproveita e retorna.
        if ($this->conexao instanceof PDO) {
            return $this->conexao;
        }

        // Monta o Data Source Name (DSN) para o driver MySQL.
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=utf8mb4',
            $this->host,
            $this->name,
        );

        // Define os atributos de comportamento da conexão PDO.
        $options = [
            // Lança exceções em caso de erro (ao invés de retornar false silenciosamente).
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,

            // Define o modo de retorno padrão como array associativo.
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,

            // Desativa a emulação de prepared statements (usa prepared statements nativos do MySQL).
            // Isso melhora a segurança contra SQL Injection e a performance.
            PDO::ATTR_EMULATE_PREPARES   => false,

            // Define o tempo máximo (em segundos) para tentar conectar.
            PDO::ATTR_TIMEOUT            => $this->timeout,

            // Garante que a conexão use o charset correto desde o início.
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            // Tenta criar a conexão e armazená-la na propriedade.
            return $this->conexao = new PDO($dsn, $this->user, $this->password, $options);
        } catch (PDOException $e) {
            // Em caso de falha, lança uma RuntimeException com mensagem clara.
            // A exceção original é preservada em "previous" para facilitar o diagnóstico
            // (evita expor detalhes sensíveis da credencial ao usuário final).
            throw new RuntimeException(
                "Falha ao conectar ao banco de dados '{$this->name}' em '{$this->host}'.",
                previous: $e,
            );
        }
    }
}
