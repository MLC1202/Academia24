-- Leads do formulario "Agende sua aula experimental".
--
-- LGPD (minimizacao): guarda so o que a equipe usa pra ligar pra pessoa.
-- Nada de IP, navegador ou localizacao. O rate limit usa a tabela
-- tentativas, que so tem HMAC.
-- Retencao: 6 meses a partir de criado_em. Quem apaga e o
-- bin/limpar-leads.php (Cron Job). Exclusao a pedido: botao no dashboard.

CREATE TABLE leads (
    id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    unidade               VARCHAR(20)  NOT NULL,
    -- Mesmos valores fixos do formulario. Valor fora da lista nem entra.
    periodo               ENUM('manha', 'tarde', 'noite') NOT NULL,
    objetivo              ENUM('saude', 'emagrecimento', 'massamuscular',
                               'condicionamento', 'retomar') NOT NULL,
    nome                  VARCHAR(100) NOT NULL,
    -- So digitos: DDD + numero (10 ou 11). A mascara e coisa da tela.
    telefone              VARCHAR(11)  NOT NULL,
    email                 VARCHAR(254) NOT NULL,
    -- Prova do consentimento: quando aceitou e QUAL texto aceitou.
    -- Se o texto da caixinha mudar, a versao muda junto.
    consentimento_em      TIMESTAMP    NOT NULL,
    consentimento_versao  VARCHAR(20)  NOT NULL,
    -- Andamento do contato, controlado pela dona no dashboard.
    status                ENUM('novo', 'contatado', 'matriculou', 'descartado')
                          NOT NULL DEFAULT 'novo',
    status_em             TIMESTAMP    NULL,
    status_por            INT UNSIGNED NULL,
    criado_em             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Lista do dashboard: por unidade e por status, mais novos primeiro.
    KEY idx_leads_unidade_data (unidade, criado_em),
    KEY idx_leads_status_data (status, criado_em),
    -- Limpeza dos 6 meses.
    KEY idx_leads_criado (criado_em),
    CONSTRAINT fk_leads_unidade FOREIGN KEY (unidade) REFERENCES unidades (slug),
    CONSTRAINT fk_leads_admin FOREIGN KEY (status_por) REFERENCES admins (id) ON DELETE SET NULL,
    -- Ultima barreira, mesmo se um dia o PHP deixar passar algo errado.
    CONSTRAINT ck_leads_telefone CHECK (telefone REGEXP '^[0-9]{10,11}$'),
    CONSTRAINT ck_leads_nome CHECK (CHAR_LENGTH(TRIM(nome)) >= 3),
    CONSTRAINT ck_leads_email CHECK (email LIKE '_%@_%._%')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
