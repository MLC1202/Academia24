# Backend

Ainda não implementado. O front já está pronto para conversar com ele.

## O que precisa existir

Um endpoint para a **grade de aulas**, para que o que é editado em
`/admin/dashboard` apareça para os visitantes. Hoje a grade fica no
`localStorage` do navegador — serve para desenvolver, não serve em
produção.

O front chama isso em um lugar só: `frontend/src/lib/grade-store.ts`.

```
GET  /api/grades.php   -> Grades
POST /api/grades.php   { unidade, grade }
```

`unidade` é sempre `alphaville` | `norte` | `cambui` | `lagoa`.
O formato de `Grades` está em `frontend/src/grade.ts`.

## Formulário de agendamento

A seção de agendamento da home já existe e valida os campos, mas ainda não
envia nada: o `submeter()` em `frontend/src/components/Agendamento.tsx` só
registra no console. Falta decidir para onde o lead vai.

## Ao implementar

- Validar tudo de novo no servidor: o front valida, mas dá para burlar.
- Usar prepared statements — nunca concatenar SQL.
- Nada de credencial de banco no front. O arquivo `.env` fica aqui.
- O dashboard em `/admin/dashboard` vai precisar de autenticação de
  verdade antes de liberar a edição.
