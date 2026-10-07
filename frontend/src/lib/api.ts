// Conversa com a API: area restrita (login, sessao, salvar a grade) e o
// formulario publico de agendamento (enviarLead, no fim do arquivo).
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
// "campos" vem no 422 do lead: qual campo o servidor recusou.
export class ErroApi extends Error {
  status: number;
  codigo: string;
  detalhe?: string;
  campos?: Record<string, string>;
  constructor(status: number, codigo: string, detalhe?: string, campos?: Record<string, string>) {
    super(codigo);
    this.status = status;
    this.codigo = codigo;
    this.detalhe = detalhe;
    this.campos = campos;
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
      typeof dados.campos === 'object' && dados.campos !== null
        ? (dados.campos as Record<string, string>)
        : undefined,
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

// GET numa rota (ex.: so-admin). Erros viram ErroApi, igual ao enviar().
export async function obter(caminho: string) {
  return chamar(caminho);
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
// (aparelho lembrado pelo "mantenha-me conectado", ou conta sem MFA em dev).
// lembrar: so vale depois que o codigo for aceito (o servidor guarda).
export async function entrar(email: string, senha: string, lembrar = false): Promise<'mfa' | 'ok'> {
  const dados = await enviar('login.php', { email, senha, lembrar });
  return dados.mfa === true ? 'mfa' : 'ok';
}

export async function confirmarCodigo(codigo: string): Promise<void> {
  await enviar('login-mfa.php', { codigo });
}

export async function sair(): Promise<void> {
  await enviar('logout.php');
}

// --- Formulario de agendamento (publico) ------------------------------------

export type Lead = {
  unidade: string;
  periodo: string;
  objetivo: string;
  nome: string;
  menor: string | null; // preenchido = nome, telefone e e-mail sao do responsavel
  telefone: string;
  email: string;
  consentimento: boolean;
  consentimento_versao: string;
  referencia: string; // honeypot: sempre vazio para uma pessoa
};

// Chamado quando o formulario abre: cria a sessao e marca a hora da visita
// no servidor (envio rapido demais depois disso = robo). Erro aqui e
// ignorado; se faltar, o proprio envio avisa.
export async function abrirFormularioLead(): Promise<void> {
  try {
    await chamar('sessao.php');
  } catch {
    /* sem rede agora: o envio tenta de novo */
  }
}

export async function enviarLead(lead: Lead): Promise<void> {
  await enviar('lead.php', lead);
}
