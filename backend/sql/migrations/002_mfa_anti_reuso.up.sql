-- MFA: guarda o ultimo "passo" de 30 s ja usado no login, pra o mesmo
-- codigo de 6 digitos nao servir duas vezes (se alguem espiar o codigo
-- enquanto a dona digita, ele ja nao vale mais).
ALTER TABLE admins
    ADD COLUMN mfa_ultimo_passo BIGINT UNSIGNED NULL AFTER mfa_segredo;
