-- Desfaz a 001. APAGA TODOS OS DADOS dessas tabelas: so em dev ou com backup.

ALTER TABLE unidades DROP FOREIGN KEY fk_unidades_grade_ativa;
DROP TABLE IF EXISTS tentativas;
DROP TABLE IF EXISTS cancelamentos;
DROP TABLE IF EXISTS aulas;
DROP TABLE IF EXISTS grade_versoes;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS unidades;
