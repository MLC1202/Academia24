-- Nota do Google de cada unidade, digitada pela equipe no painel (o site nao
-- consulta o Google: a API deles e paga e exige cartao). Uma linha por
-- unidade; a nota atual substitui a anterior. Os valores iniciais sao os que
-- estavam escritos no codigo das LPs.

CREATE TABLE avaliacoes_google (
    unidade        VARCHAR(20)  NOT NULL,
    nota           DECIMAL(2,1) NOT NULL,
    atualizado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    atualizado_por INT UNSIGNED NULL,
    PRIMARY KEY (unidade),
    CONSTRAINT ck_avaliacoes_nota CHECK (nota BETWEEN 1.0 AND 5.0),
    CONSTRAINT fk_avaliacoes_unidade FOREIGN KEY (unidade) REFERENCES unidades (slug),
    CONSTRAINT fk_avaliacoes_admin FOREIGN KEY (atualizado_por) REFERENCES admins (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO avaliacoes_google (unidade, nota) VALUES
    ('alphaville', 4.5),
    ('norte', 4.5),
    ('cambui', 4.9),
    ('lagoa', 4.9);
