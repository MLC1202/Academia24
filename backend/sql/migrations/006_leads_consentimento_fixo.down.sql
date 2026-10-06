-- Volta a definicao da 005 (sem DEFAULT explicito).
--
-- ATENCAO: em MariaDB ate a 10.9 (explicit_defaults_for_timestamp = OFF),
-- este down RECOLOCA o "ON UPDATE CURRENT_TIMESTAMP" escondido que a 006
-- corrigiu: toda troca de status voltaria a reescrever a data do
-- consentimento (a prova da LGPD). Nao rode em producao sem conferir a
-- versao do banco; se precisar, rode a 006 up de novo logo em seguida.
ALTER TABLE leads
    MODIFY consentimento_em TIMESTAMP NOT NULL;
