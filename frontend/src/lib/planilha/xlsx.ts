// Leitor MINIMO de .xlsx, sem biblioteca, roda so no navegador.
//
// Por que nao usar uma biblioteca (SheetJS)? A versao do npm ("xlsx" 0.18)
// tem falhas de seguranca conhecidas justamente ao ler arquivos maliciosos,
// e a versao corrigida nao fica no npm. Como a nossa planilha e simples
// (uma aba por unidade, uma aula por linha), um leitor proprio pequeno e
// mais seguro e nao pesa nada no site.
//
// Como funciona: um .xlsx e um ZIP com varios XML dentro. Eu:
//   1. abro o ZIP (DecompressionStream, nativo do navegador)
//   2. leio a lista de abas (xl/workbook.xml) e os textos (sharedStrings)
//   3. leio cada aba como uma tabela de linhas x colunas
// O arquivo NUNCA vai pro servidor: so o resultado ja interpretado.
//
// Protecoes: tamanho maximo do arquivo, do conteudo descompactado (contra
// "zip bomb") e do numero de arquivos dentro do ZIP.

export type Celula = string | number | null;
export type Aba = { nome: string; linhas: Celula[][] };

const MAX_ARQUIVO = 2 * 1024 * 1024; // 2 MB
const MAX_DESCOMPACTADO = 20 * 1024 * 1024; // 20 MB somando tudo
const MAX_ENTRADAS = 300;
const MAX_LINHAS = 2000;
const MAX_COLUNAS = 30;

export class ErroPlanilha extends Error {}

type Entrada = { metodo: number; tamanho: number; descompactado: number; inicio: number };

// --- ZIP -------------------------------------------------------------------

function lerEntradasZip(dados: DataView): Map<string, Entrada> {
  // O "indice" do ZIP fica no fim: procuro a assinatura 0x06054b50.
  let fim = -1;
  for (let i = dados.byteLength - 22; i >= Math.max(0, dados.byteLength - 66000); i--) {
    if (dados.getUint32(i, true) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new ErroPlanilha('O arquivo não é um .xlsx válido.');

  const total = dados.getUint16(fim + 10, true);
  if (total > MAX_ENTRADAS) throw new ErroPlanilha('Arquivo complexo demais.');
  let pos = dados.getUint32(fim + 16, true);
  const decoder = new TextDecoder();
  const entradas = new Map<string, Entrada>();

  for (let n = 0; n < total; n++) {
    if (pos + 46 > dados.byteLength || dados.getUint32(pos, true) !== 0x02014b50) {
      throw new ErroPlanilha('O arquivo não é um .xlsx válido.');
    }
    const metodo = dados.getUint16(pos + 10, true);
    const tamanho = dados.getUint32(pos + 20, true);
    const descompactado = dados.getUint32(pos + 24, true);
    const lenNome = dados.getUint16(pos + 28, true);
    const lenExtra = dados.getUint16(pos + 30, true);
    const lenComent = dados.getUint16(pos + 32, true);
    const local = dados.getUint32(pos + 42, true);
    const nome = decoder.decode(new Uint8Array(dados.buffer, dados.byteOffset + pos + 46, lenNome));

    // O cabecalho local tem nome/extra proprios: os dados comecam depois dele.
    if (local + 30 > dados.byteLength || dados.getUint32(local, true) !== 0x04034b50) {
      throw new ErroPlanilha('O arquivo não é um .xlsx válido.');
    }
    const inicio = local + 30 + dados.getUint16(local + 26, true) + dados.getUint16(local + 28, true);
    entradas.set(nome, { metodo, tamanho, descompactado, inicio });
    pos += 46 + lenNome + lenExtra + lenComent;
  }
  return entradas;
}

async function extrair(buffer: ArrayBuffer, e: Entrada): Promise<string> {
  if (e.inicio + e.tamanho > buffer.byteLength) throw new ErroPlanilha('Arquivo corrompido.');
  const bruto = new Uint8Array(buffer, e.inicio, e.tamanho);
  if (e.metodo === 0) return new TextDecoder().decode(bruto);
  if (e.metodo !== 8) throw new ErroPlanilha('Compactação não suportada.');

  // Descompacta em partes e para se passar do limite (zip bomb).
  const leitor = new Blob([bruto]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const partes: Uint8Array<ArrayBuffer>[] = [];
  let lidos = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    lidos += value.byteLength;
    if (lidos > MAX_DESCOMPACTADO) {
      await leitor.cancel();
      throw new ErroPlanilha('Arquivo grande demais.');
    }
    partes.push(new Uint8Array(value));
  }
  return new TextDecoder().decode(await new Blob(partes).arrayBuffer());
}

// --- XML -------------------------------------------------------------------

function xml(texto: string): Document {
  const doc = new DOMParser().parseFromString(texto, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new ErroPlanilha('Arquivo corrompido.');
  return doc;
}

// Pega elementos pelo nome local, ignorando prefixo de namespace.
function filhos(no: Document | Element, nome: string): Element[] {
  return Array.from(no.getElementsByTagNameNS('*', nome));
}

// "B5" -> coluna 1 (A = 0).
function coluna(ref: string): number {
  let n = 0;
  for (const c of ref.replace(/\d+$/, '')) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

function textoDe(el: Element): string {
  // Texto pode vir partido em varios <t> (formatacao no meio da celula).
  return filhos(el, 't').map((t) => t.textContent ?? '').join('');
}

// --- Leitura -----------------------------------------------------------------

export async function lerXlsx(arquivo: File): Promise<Aba[]> {
  if (arquivo.size > MAX_ARQUIVO) throw new ErroPlanilha('Arquivo maior que 2 MB.');
  const buffer = await arquivo.arrayBuffer();
  const entradas = lerEntradasZip(new DataView(buffer));

  let somaDescompactada = 0;
  const abrir = async (caminho: string) => {
    const e = entradas.get(caminho);
    if (!e) return null;
    somaDescompactada += e.descompactado;
    if (somaDescompactada > MAX_DESCOMPACTADO) throw new ErroPlanilha('Arquivo grande demais.');
    return extrair(buffer, e);
  };

  const workbook = await abrir('xl/workbook.xml');
  const rels = await abrir('xl/_rels/workbook.xml.rels');
  if (!workbook || !rels) throw new ErroPlanilha('O arquivo não é um .xlsx válido.');

  // Textos compartilhados: celulas de texto guardam so o indice daqui.
  const sharedXml = await abrir('xl/sharedStrings.xml');
  const textos = sharedXml ? filhos(xml(sharedXml), 'si').map(textoDe) : [];

  const alvos = new Map(
    filhos(xml(rels), 'Relationship').map((r) => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']),
  );

  const abas: Aba[] = [];
  for (const sheet of filhos(xml(workbook), 'sheet')) {
    const nome = sheet.getAttribute('name') ?? '';
    const rid =
      sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ??
      sheet.getAttribute('r:id');
    let alvo = alvos.get(rid) ?? '';
    alvo = alvo.startsWith('/') ? alvo.slice(1) : `xl/${alvo}`;
    const conteudo = await abrir(alvo);
    if (!conteudo) continue;

    const linhas: Celula[][] = [];
    // O atributo r (endereco: linha "5", celula "B5") e opcional no formato:
    // alguns geradores omitem. Sem ele, vale a posicao (logo depois da
    // anterior), como o Excel faz.
    let proximaLinha = 0;
    for (const row of filhos(xml(conteudo), 'row')) {
      const attrLinha = row.getAttribute('r');
      const r = attrLinha ? Number(attrLinha) - 1 : proximaLinha;
      proximaLinha = r + 1;
      if (!(r >= 0 && r < MAX_LINHAS)) continue;
      const linha: Celula[] = [];
      let proximaCol = 0;
      for (const c of filhos(row, 'c')) {
        const attrCol = c.getAttribute('r');
        const col = attrCol ? coluna(attrCol) : proximaCol;
        proximaCol = col + 1;
        if (col < 0 || col >= MAX_COLUNAS) continue;
        const tipo = c.getAttribute('t');
        const v = filhos(c, 'v')[0]?.textContent ?? null;
        let valor: Celula = null;
        if (tipo === 's') valor = v === null ? null : (textos[Number(v)] ?? null);
        else if (tipo === 'inlineStr') valor = textoDe(c);
        else if (tipo === 'str' || tipo === 'b' || tipo === 'e') valor = v;
        else if (v !== null && v !== '') valor = Number(v);
        linha[col] = valor;
      }
      linhas[r] = linha;
    }
    abas.push({ nome, linhas });
  }
  return abas;
}
