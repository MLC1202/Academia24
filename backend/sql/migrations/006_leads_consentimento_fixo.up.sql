-- Correcao da 005: deixa EXPLICITO que consentimento_em nao muda sozinho.
--
-- Em MariaDB/MySQL mais antigos (explicit_defaults_for_timestamp = OFF,
-- padrao do MariaDB ate a 10.9), a PRIMEIRA coluna TIMESTAMP NOT NULL sem
-- DEFAULT ganha "ON UPDATE CURRENT_TIMESTAMP" escondido. Ai, toda troca de
-- status reescreveria a data do consentimento -- e ela e a prova da LGPD.
-- No MariaDB 11.4 do Docker isso nao acontece, mas a versao da Hostinger
-- ainda nao foi confirmada. Com DEFAULT explicito, nenhum servidor coloca
-- o ON UPDATE.

ALTER TABLE leads
    MODIFY consentimento_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
