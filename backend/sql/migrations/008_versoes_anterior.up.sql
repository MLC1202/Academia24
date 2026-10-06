-- "Desfazer" volta no tempo (B3).
--
-- Antes, desfazer pegava a versao de id imediatamente menor. Com isso,
-- v10 -> desfaz -> v9 -> edita -> v11 -> desfaz voltava pra v10, justamente
-- a que tinha sido desfeita. Agora cada versao guarda qual estava no ar
-- quando ela foi criada (anterior_id), e o desfazer volta pra essa.
--
-- ON DELETE SET NULL: quando a limpeza de versoes antigas apaga a anterior,
-- o desfazer simplesmente para ali, em vez de quebrar.

ALTER TABLE grade_versoes
    ADD COLUMN anterior_id INT UNSIGNED NULL AFTER criada_em,
    ADD CONSTRAINT fk_versoes_anterior FOREIGN KEY (anterior_id)
        REFERENCES grade_versoes (id) ON DELETE SET NULL;

-- Versoes que ja existem: mesma regra de antes (a de id menor da unidade),
-- que e o melhor palpite sem o historico de quem estava no ar.
UPDATE grade_versoes v
  JOIN (SELECT a.id,
               (SELECT MAX(b.id) FROM grade_versoes b
                 WHERE b.unidade = a.unidade AND b.id < a.id) AS anterior
          FROM grade_versoes a) calc ON calc.id = v.id
   SET v.anterior_id = calc.anterior;
