// Gerador MINIMO de .xlsx (uma aba), sem biblioteca -- mesmo motivo do
// leitor (xlsx.ts): a lib "xlsx" do npm tem falhas conhecidas.
//
// Um .xlsx e um ZIP com alguns XML dentro. Aqui eu monto esses XML e um ZIP
// "sem compressao" (cabe folgado: 10 mil leads ficam em poucos MB).
//
// Seguranca (formula de Excel): toda celula de texto e gravada como TEXTO
// (inlineStr), que o Excel nunca executa. E se o texto comecar com = + - @
// a celula ainda leva o estilo "quotePrefix" (o mesmo de digitar ' antes no
// Excel): continua texto mesmo se alguem editar a celula depois.

export type Valor = string | number | Date | null;
export type Coluna = { titulo: string; largura: number };
export type Aba = { nome: string; colunas: Coluna[]; linhas: Valor[][] };

// Estilos (indices de cellXfs em styles.xml)
const ESTILO_CABECALHO = 1;
const ESTILO_TEXTO_PROTEGIDO = 2;
const ESTILO_DATA = 3;

const COMECA_COMO_FORMULA = /^[=+\-@\t\r]/;

// Tira caracteres de controle que o XML nao aceita (o arquivo abriria
// corrompido): tudo abaixo do espaco, menos tab e quebras de linha.
function semControle(t: string): string {
  let saida = '';
  for (const ch of t) {
    const c = ch.codePointAt(0) ?? 0;
    if ((c >= 0x20 && c !== 0xfffe && c !== 0xffff) || c === 0x09 || c === 0x0a || c === 0x0d) saida += ch;
  }
  return saida;
}

function xmlTexto(t: string): string {
  return semControle(t)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 0 -> A, 25 -> Z, 26 -> AA
function letraColuna(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

// Data -> numero de serie do Excel, no horario de Brasilia (o Excel nao tem
// fuso: guarda "dia/mes/ano hora" como numero de dias desde 30/12/1899).
function serieExcel(d: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, Number(x.value)]),
  );
  const local = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return (local - Date.UTC(1899, 11, 30)) / 86_400_000;
}

function celula(valor: Valor, ref: string, cabecalho: boolean): string {
  if (valor === null || valor === '') return '';
  if (valor instanceof Date) {
    return `<c r="${ref}" s="${ESTILO_DATA}"><v>${serieExcel(valor)}</v></c>`;
  }
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? `<c r="${ref}"><v>${valor}</v></c>` : '';
  }
  const estilo = cabecalho ? ESTILO_CABECALHO : COMECA_COMO_FORMULA.test(valor) ? ESTILO_TEXTO_PROTEGIDO : 0;
  return `<c r="${ref}" t="inlineStr"${estilo ? ` s="${estilo}"` : ''}><is><t xml:space="preserve">${xmlTexto(valor)}</t></is></c>`;
}

function xmlAba(aba: Aba): string {
  const ultima = letraColuna(aba.colunas.length - 1);
  const todas = [aba.colunas.map((c) => c.titulo), ...aba.linhas];
  const linhas = todas
    .map((linha, r) => {
      const cels = linha.map((v, c) => celula(v, `${letraColuna(c)}${r + 1}`, r === 0)).join('');
      return `<row r="${r + 1}">${cels}</row>`;
    })
    .join('');
  const cols = aba.colunas
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.largura}" customWidth="1"/>`)
    .join('');
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    // Cabecalho fixo ao rolar
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    '</sheetView></sheetViews>' +
    `<cols>${cols}</cols>` +
    `<sheetData>${linhas}</sheetData>` +
    // Setinha de filtro em cada coluna do cabecalho
    `<autoFilter ref="A1:${ultima}${todas.length}"/>` +
    '</worksheet>'
  );
}

const ESTILOS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy hh:mm"/></numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="4">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" quotePrefix="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

function arquivos(aba: Aba): [string, string][] {
  const nome = xmlTexto(aba.nome.slice(0, 31));
  const ultima = letraColuna(aba.colunas.length - 1);
  const total = aba.linhas.length + 1;
  return [
    [
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    ],
    [
      '_rels/.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        '</Relationships>',
    ],
    [
      'xl/workbook.xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        `<sheets><sheet name="${nome}" sheetId="1" r:id="rId1"/></sheets>` +
        '<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">' +
        `'${nome.replace(/'/g, "''")}'!$A$1:$${ultima}$${total}</definedName></definedNames>` +
        '</workbook>',
    ],
    [
      'xl/_rels/workbook.xml.rels',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        '</Relationships>',
    ],
    ['xl/styles.xml', ESTILOS],
    ['xl/worksheets/sheet1.xml', xmlAba(aba)],
  ];
}

// --- ZIP sem compressao ("stored") -------------------------------------------

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of dados) c = TABELA_CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(entradas: [string, string][]): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const agora = new Date();
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1);
  const dia = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();

  const locais: Uint8Array[] = [];
  const centrais: Uint8Array[] = [];
  let posicao = 0;

  for (const [nome, texto] of entradas) {
    const n = enc.encode(nome);
    const d = enc.encode(texto);
    const crc = crc32(d);

    const local = new Uint8Array(30 + n.length);
    const vl = new DataView(local.buffer);
    vl.setUint32(0, 0x04034b50, true);
    vl.setUint16(4, 20, true); // versao minima
    vl.setUint16(6, 0x0800, true); // nomes em UTF-8
    vl.setUint16(8, 0, true); // sem compressao
    vl.setUint16(10, hora, true);
    vl.setUint16(12, dia, true);
    vl.setUint32(14, crc, true);
    vl.setUint32(18, d.length, true);
    vl.setUint32(22, d.length, true);
    vl.setUint16(26, n.length, true);
    local.set(n, 30);

    const central = new Uint8Array(46 + n.length);
    const vc = new DataView(central.buffer);
    vc.setUint32(0, 0x02014b50, true);
    vc.setUint16(4, 20, true);
    vc.setUint16(6, 20, true);
    vc.setUint16(8, 0x0800, true);
    vc.setUint16(10, 0, true);
    vc.setUint16(12, hora, true);
    vc.setUint16(14, dia, true);
    vc.setUint32(16, crc, true);
    vc.setUint32(20, d.length, true);
    vc.setUint32(24, d.length, true);
    vc.setUint16(28, n.length, true);
    vc.setUint32(42, posicao, true);
    central.set(n, 46);

    locais.push(local, d);
    centrais.push(central);
    posicao += local.length + d.length;
  }

  const tamCentral = centrais.reduce((s, c) => s + c.length, 0);
  const fim = new Uint8Array(22);
  const vf = new DataView(fim.buffer);
  vf.setUint32(0, 0x06054b50, true);
  vf.setUint16(8, entradas.length, true);
  vf.setUint16(10, entradas.length, true);
  vf.setUint32(12, tamCentral, true);
  vf.setUint32(16, posicao, true);

  const partes = [...locais, ...centrais, fim];
  const saida = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let o = 0;
  for (const p of partes) {
    saida.set(p, o);
    o += p.length;
  }
  return saida;
}

export function gerarXlsx(aba: Aba): Blob {
  return new Blob([zip(arquivos(aba))], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Faz o navegador baixar o arquivo (nada vai pro servidor).
export function baixarArquivo(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
