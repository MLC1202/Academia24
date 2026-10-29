# Versões publicadas da Política de Privacidade

Aqui fica uma cópia de cada versão da Política que foi ao ar, com o nome
`AAAA-MM-DD.pdf` (a data da última atualização que consta no documento).
O git guarda o histórico; nunca apague nem sobrescreva uma versão antiga.

## Ao publicar uma versão nova

1. Salve o PDF aqui como `AAAA-MM-DD.pdf`.
2. Copie o mesmo arquivo para `frontend/public/politica-de-privacidade.pdf`.
3. Troque a data nos dois lugares que registram qual texto a pessoa aceitou:
   - `CONSENTIMENTO_VERSAO` em `frontend/src/pages/agendamento/FormAgendamento.tsx`
   - `LEAD_CONSENTIMENTO_VERSAO` em `backend/src/leads.php`

   Se os dois não baterem, o formulário é recusado (erro 409).
4. Publique o front e o backend juntos.
