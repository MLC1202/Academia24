-- "Mantenha-me conectado neste aparelho": por 30 dias o navegador marcado
-- nao pede o codigo do MFA (a senha continua sendo pedida sempre).
--
-- Como funciona (padrao "seletor + validador"):
--   cookie a24_aparelho = seletor:validador (aleatorios, so no navegador)
--   banco = seletor + SHA-256 do validador (nunca o validador)
-- Se o banco vazar, nao da pra montar um cookie valido. O seletor acha a
-- linha; o validador e conferido com hash_equals (tempo constante).
--
-- Some tudo da conta quando a senha muda ou o MFA liga/desliga.
-- DATETIME (nao TIMESTAMP) de proposito: sem "ON UPDATE" escondido.
-- Datas sempre em UTC (a conexao usa time_zone +00:00).

CREATE TABLE dispositivos_confiaveis (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_id        INT UNSIGNED NOT NULL,
    seletor         BINARY(12)   NOT NULL,
    validador_hash  BINARY(32)   NOT NULL,
    criado_em       DATETIME     NOT NULL,
    expira_em       DATETIME     NOT NULL,
    ultimo_uso_em   DATETIME     NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_dispositivos_seletor (seletor),
    KEY idx_dispositivos_admin (admin_id, expira_em),
    CONSTRAINT fk_dispositivos_admin FOREIGN KEY (admin_id) REFERENCES admins (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
