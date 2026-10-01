-- Volta a definicao da 005 (sem DEFAULT explicito).
ALTER TABLE leads
    MODIFY consentimento_em TIMESTAMP NOT NULL;
