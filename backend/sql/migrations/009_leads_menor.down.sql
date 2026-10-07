-- Desfaz a 009. ATENCAO: apaga o nome dos menores ja gravados; os leads
-- continuam, mas sem a marca de que eram de responsavel.
ALTER TABLE leads
    DROP CONSTRAINT ck_leads_menor,
    DROP COLUMN menor;
