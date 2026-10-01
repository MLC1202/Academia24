// Conversa com a area restrita da API (login, sessao, e depois o salvar da
// grade). O site publico nao usa isto -- so o /admin.
//
// Seguranca, do lado do navegador:
//  - O cookie de sessao e HttpOnly: este codigo NUNCA ve nem guarda ele.
//    O navegador manda sozinho (mesmo dominio).
//  - Todo POST leva o token CSRF no header X-CSRF-Token. Busco o token
//    fresco antes de cada POST (ele muda no login), entao nada fica velho.
//  - Nada de senha/codigo em localStorage, console ou URL.

// No GitHub Pages (previa) nao existe backend.
export const SEM_API = import.meta.env.VITE_SEM_API === '1';

const BASE = `${import.meta.env.BASE_URL}api`;
const TEMPO_LIMITE_MS = 15_000;

export type Sessao = {
  logado: boolean;
  aguardandoMfa: boolean;
  email: string | null;
};

// Erro com o codigo que a API mandou (ex.: "credenciais_invalidas").
// "detalhe" e a frase que o servidor manda quando recusa um dado
// (ex.: "Terça, aula 3: horário inválido.").
export class ErroApi extends Error {
  status: number;
  codigo: string;
  detalhe?: string;
  constructor(status: number, codigo: string, detalhe?: string) {
    super(codigo);
    this.status = status;
    this.codigo = codigo;
    this.detalhe = detalhe;
  }
}

async function lerJson(resposta: Response): Promise<Record<string, unknown>> {
  try {
    const dados: unknown = await resposta.json();
    return typeof dados === 'object' && dados !== null ? (dados as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function chamar(caminho: string, init: RequestInit = {}) {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/${caminho}`, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', ...init.headers },
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
    });
  } catch {
    throw new ErroApi(0, 'sem_conexao');
  }
  const dados = await lerJson(resposta);
  if (!resposta.ok) {
    throw new ErroApi(
      resposta.status,
      typeof dados.erro === 'string' ? dados.erro : 'erro_interno',
      typeof dados.detalhe === 'string' ? dados.detalhe : undefined,
    );
  }
  return dados;
}

async function tokenCsrf(): Promise<string> {
  const dados = await chamar('sessao.php');
  if (typeof dados.csrf !== 'string') throw new ErroApi(0, 'erro_interno');
  return dados.csrf;
}

export async function buscarSessao(): Promise<Sessao> {
  const dados = await chamar('sessao.php');
  return {
    logado: dados.logado === true,
    aguardandoMfa: dados.aguardando_mfa === true,
    email: typeof dados.email === 'string' ? dados.email : null,
  };
}

export async function enviar(caminho: string, corpo: unknown = {}) {
  const token = await tokenCsrf();
  return chamar(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify(corpo),
  });
}

// --- Login em duas etapas ---------------------------------------------------

// Devolve 'mfa' se a senha foi aceita e falta o codigo, ou 'ok' se ja entrou
// (so acontece em dev, em conta sem MFA).
export async function entrar(email: string, senha: string): Promise<'mfa' | 'ok'> {
  const dados = await enviar('login.php', { email, senha });
  return dados.mfa === true ? 'mfa' : 'ok';
}

export async function confirmarCodigo(codigo: string): Promise<void> {
  await enviar('login-mfa.php', { codigo });
}

export async function sair(): Promise<void> {
  await enviar('logout.php');
}
