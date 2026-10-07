-- Agendamento para menor de 18 anos.
--
-- Uma coluna so: NULL = a propria pessoa vai fazer a aula; preenchida = o
-- lead e do responsavel legal e aqui fica o primeiro nome do menor. Com uma
-- coluna nao existe estado contraditorio (ex.: "menor = sim" sem nome).
-- LGPD (Art. 14 e minimizacao): so o primeiro nome, nada de idade ou
-- documento. Nome, telefone e e-mail do lead passam a ser do responsavel.

ALTER TABLE leads
    ADD COLUMN menor VARCHAR(50) NULL AFTER nome,
    ADD CONSTRAINT ck_leads_menor
        CHECK (menor IS NULL OR CHAR_LENGTH(TRIM(menor)) >= 2);
