<?php
declare(strict_types=1);

// Teste da conversao Pacto -> aula do site (sem rede, sem banco).
//   docker run --rm -v "$PWD":/app -w /app php:8.3-cli php tests/pacto.php

require __DIR__ . '/../src/log.php';
require __DIR__ . '/../src/pacto.php';

function conferir(bool $ok, string $o_que): void
{
    echo ($ok ? 'ok   ' : 'FALHA ') . $o_que . PHP_EOL;
    if (!$ok) {
        exit(1);
    }
}

$resposta = json_decode(file_get_contents(__DIR__ . '/fixtures/pacto-dia.json'), true, 16, JSON_THROW_ON_ERROR);
$quarta = new DateTimeImmutable('2026-10-28');

$aulas = pacto_converter_dia($resposta, $quarta, 'norte');
conferir(count($aulas) === 9, 'converte as 9 aulas da fixture');
conferir($aulas[0]['modalidade'] === 'Fast Bike' && $aulas[0]['hora'] === '07:00', 'nome vira "Fast Bike"');
conferir($aulas[0]['duracao'] === 30, 'guarda a duracao');
conferir(array_column($aulas, 'hora') === ['07:00', '07:30', '07:30', '08:00', '18:00', '18:45', '19:15', '19:30', '20:00'], 'ordena por hora');
conferir(count(array_unique(array_column($aulas, 'id'))) === 9, 'ids unicos');

$vazio = ['return' => [['periodo' => 'Manhã', 'aulas' => []]]];
conferir(pacto_converter_dia($vazio, $quarta, 'norte') === [], 'dia vazio (feriado) nao quebra');

$suja = $resposta;
$suja['return'][0]['aulas'][0]['descricao'] = '<script>alert(1)</script>';
$suja['return'][0]['aulas'][1]['inicio'] = '25:99';
conferir(count(pacto_converter_dia($suja, $quarta, 'norte')) === 7, 'descarta aula com nome ou hora invalidos');
