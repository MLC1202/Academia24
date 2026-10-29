<?php
declare(strict_types=1);

// POST /api/admin-atualizar-grade.php   (so admin logado + header X-CSRF-Token)
// Botao "Atualizar agora" do dashboard: busca a grade no Pacto na hora e
// troca o cache do site, em vez de esperar o cache de grades.php vencer.
//
//   200 { ok: true }
//   401 { erro: "nao_autenticado" }
//   403 { erro: "csrf_invalido" }
//   429 { erro: "muitas_tentativas" }
//   502 { erro: "pacto_indisponivel" }  -- o site segue com a grade anterior

require __DIR__ . '/../../src/bootstrap.php';
require __DIR__ . '/../../src/sessao.php';
require __DIR__ . '/../../src/limite.php';
require __DIR__ . '/../../src/pacto.php';

exigir_metodo('POST');
iniciar_sessao();
$adminId = exigir_admin();
exigir_csrf();

// Cada clique faz 28 chamadas ao Pacto: 10 a cada 15 min sobra pra uso
// normal e segura clique repetido ou script.
const JANELA_SEG = 15 * 60;
const MAX_ATUALIZAR = 10;
$chave = 'admin:' . $adminId;
if (tentativas_recentes('atualizar_grade', $chave, JANELA_SEG) >= MAX_ATUALIZAR) {
    bloquear_com_429(JANELA_SEG);
}
registrar_tentativa('atualizar_grade', $chave);

// So troca o cache se a busca der certo: se o Pacto falhar, a copia boa fica.
$geracao = cache_geracao('grades');
try {
    cache_gravar('grades', json_grades_publicas(db()), $geracao);
} catch (RuntimeException | JsonException $e) {
    registrar('erro', 'pacto_falhou', ['admin_id' => $adminId, 'msg' => $e->getMessage()]);
    responder(502, [
        'erro' => 'pacto_indisponivel',
        'detalhe' => 'O Pacto não respondeu. O site continua com a grade anterior; tente de novo em instantes.',
    ]);
}
registrar('info', 'grade_atualizada', ['admin_id' => $adminId]);

responder(200, ['ok' => true]);
