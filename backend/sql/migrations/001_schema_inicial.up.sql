-- Schema inicial: unidades, admins, grade (com versoes), cancelamentos e
-- tentativas (rate limit). Compativel com MariaDB e MySQL 8.

CREATE TABLE unidades (
    slug            VARCHAR(20)  NOT NULL,
    nome            VARCHAR(80)  NOT NULL,
    -- Qual versao da grade o site mostra. Rollback de upload = apontar de
    -- volta pra versao anterior.
    grade_ativa_id  INT UNSIGNED NULL,
    PRIMARY KEY (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admins (
    id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    email            VARCHAR(190)  NOT NULL,
    -- password_hash() (Argon2id/bcrypt). Nunca a senha.
    senha_hash       VARCHAR(255)  NOT NULL,
    -- Segredo do TOTP criptografado com sodium. NULL = MFA ainda nao ativado.
    mfa_segredo      VARBINARY(255) NULL,
    ativo            TINYINT(1)    NOT NULL DEFAULT 1,
    criado_em        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login_em  TIMESTAMP     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cada upload/edicao cria uma versao nova; a antiga fica guardada.
CREATE TABLE grade_versoes (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    unidade     VARCHAR(20)  NOT NULL,
    origem      ENUM('upload', 'edicao', 'seed') NOT NULL,
    criada_por  INT UNSIGNED NULL,
    criada_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Permite a FK composta abaixo (versao ativa tem que ser da mesma unidade).
    UNIQUE KEY uq_versoes_unidade_id (unidade, id),
    KEY idx_versoes_unidade_data (unidade, criada_em),
    CONSTRAINT fk_versoes_unidade FOREIGN KEY (unidade) REFERENCES unidades (slug),
    CONSTRAINT fk_versoes_admin FOREIGN KEY (criada_por) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- O banco garante que a grade ativa de Alphaville e uma versao de Alphaville.
ALTER TABLE unidades
    ADD CONSTRAINT fk_unidades_grade_ativa
    FOREIGN KEY (slug, grade_ativa_id) REFERENCES grade_versoes (unidade, id);

CREATE TABLE aulas (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    versao_id   INT UNSIGNED NOT NULL,
    -- ENUM na ordem da semana: ORDER BY dia ja sai seg..dom.
    dia         ENUM('seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom') NOT NULL,
    hora        TIME         NOT NULL,
    modalidade  VARCHAR(60)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_aulas_versao_dia_hora (versao_id, dia, hora),
    CONSTRAINT fk_aulas_versao FOREIGN KEY (versao_id) REFERENCES grade_versoes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cancelamento vale para UMA data real (so aquela semana). Nao aponta pra
-- aulas.id porque um upload novo recria as aulas.
CREATE TABLE cancelamentos (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    unidade     VARCHAR(20)  NOT NULL,
    data        DATE         NOT NULL,
    hora        TIME         NOT NULL,
    modalidade  VARCHAR(60)  NOT NULL,
    criado_por  INT UNSIGNED NULL,
    criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_cancelamento (unidade, data, hora, modalidade),
    CONSTRAINT fk_cancel_unidade FOREIGN KEY (unidade) REFERENCES unidades (slug),
    CONSTRAINT fk_cancel_admin FOREIGN KEY (criado_por) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate limit (login, lead, upload). Guarda so o HMAC do IP/e-mail, nunca o
-- dado cru (LGPD). Linhas antigas sao apagadas pela propria rotina.
CREATE TABLE tentativas (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    acao        VARCHAR(20)  NOT NULL,
    chave_hash  BINARY(32)   NOT NULL,
    criado_em   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tentativas_busca (acao, chave_hash, criado_em),
    KEY idx_tentativas_limpeza (criado_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO unidades (slug, nome) VALUES
    ('alphaville', 'Alphaville'),
    ('norte', 'Norte'),
    ('cambui', 'Cambuí'),
    ('lagoa', 'Lagoa');
