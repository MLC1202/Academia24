-- Detalhes opcionais de cada aula, vindos da planilha: duracao, professor,
-- categoria, estudio e uma observacao curta. Todos podem ficar vazios.
ALTER TABLE aulas
    ADD COLUMN duracao_min SMALLINT UNSIGNED NULL AFTER modalidade,
    ADD COLUMN professor   VARCHAR(60)  NULL AFTER duracao_min,
    ADD COLUMN categoria   VARCHAR(40)  NULL AFTER professor,
    ADD COLUMN estudio     VARCHAR(40)  NULL AFTER categoria,
    ADD COLUMN observacao  VARCHAR(200) NULL AFTER estudio;
