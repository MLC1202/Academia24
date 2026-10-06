-- Desfaz a 008: o desfazer volta a usar "a versao de id menor".
ALTER TABLE grade_versoes
    DROP FOREIGN KEY fk_versoes_anterior,
    DROP COLUMN anterior_id;
