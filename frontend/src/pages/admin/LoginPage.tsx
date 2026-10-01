// Login da area interna (/admin/login), em duas etapas:
//   1. e-mail + senha
//   2. codigo de 6 digitos do app autenticador (MFA)
// Deu certo -> /admin/dashboard.
//
// Mensagens de erro de proposito vagas ("e-mail ou senha incorretos"):
// a tela nao conta se o e-mail existe.
//
// "Mantenha-me conectado neste aparelho": se marcar, depois do codigo o
// servidor lembra este navegador por 30 dias e nao pede mais o codigo aqui
// (a senha continua sempre). Detalhes em backend/src/aparelho.php.
// Olhinho: mostra/esconde a senha enquanto digita. Volta a esconder ao
// enviar.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { buscarSessao, confirmarCodigo, entrar, ErroApi, SEM_API } from '../../lib/api';
import './DashboardPage.css'; // visual base do .admin
import './LoginPage.css';
import { SEO } from '../../data/seo';
import { useSeo } from '../../lib/useSeo';

type Etapa = 'verificando' | 'senha' | 'codigo';

// Traduz o codigo de erro da API pra uma frase pra dona.
function mensagemDeErro(erro: unknown): string {
  const codigo = erro instanceof ErroApi ? erro.codigo : '';
  switch (codigo) {
    case 'credenciais_invalidas':
      return 'E-mail ou senha incorretos.';
    case 'codigo_invalido':
      return 'Código incorreto ou já usado. Espere o próximo código no app e tente de novo.';
    case 'muitas_tentativas':
      return 'Muitas tentativas erradas. Por segurança, espere 15 minutos.';
    case 'mfa_obrigatorio':
      return 'Esta conta ainda não tem a verificação em duas etapas ativada. Fale com o responsável pelo site.';
    case 'sem_conexao':
      return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
    default:
      return 'Algo deu errado. Tente de novo em instantes.';
  }
}

function LoginPage() {
  useSeo(SEO.admin);
  const navigate = useNavigate();
  // O dashboard manda { expirou: true } quando a sessao venceu no meio do uso.
  const expirou = (useLocation().state as { expirou?: boolean } | null)?.expirou === true;
  const [etapa, setEtapa] = useState<Etapa>('verificando');
  // Na previa (sem API) nao ha login: o painel abre direto.
  const [logado, setLogado] = useState(SEM_API);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState(
    expirou ? 'Sua sessão expirou por segurança. Entre de novo; o que não foi salvo se perdeu.' : '',
  );
  const [enviando, setEnviando] = useState(false);
  const codigoRef = useRef<HTMLInputElement>(null);

  // Ja logado? Vai direto pro painel. Senha ja aceita? Vai pro codigo.
  useEffect(() => {
    if (SEM_API) return;
    buscarSessao()
      .then((s) => {
        if (s.logado) setLogado(true);
        else setEtapa(s.aguardandoMfa ? 'codigo' : 'senha');
      })
      .catch(() => {
        setEtapa('senha');
        setErro(mensagemDeErro(new ErroApi(0, 'sem_conexao')));
      });
  }, []);

  useEffect(() => {
    if (etapa === 'codigo') codigoRef.current?.focus();
  }, [etapa]);

  async function enviarSenha(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try {
      setVerSenha(false);
      const resultado = await entrar(email.trim(), senha, lembrar);
      setSenha(''); // nao fica guardada na memoria da tela
      if (resultado === 'ok') navigate('/admin/dashboard', { replace: true });
      else setEtapa('codigo');
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setEnviando(false);
    }
  }

  async function enviarCodigo(e: FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setErro('');
    try {
      await confirmarCodigo(codigo);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setCodigo('');
      if (err instanceof ErroApi && err.codigo === 'sem_login_pendente') {
        // Passou dos 5 min (ou errou demais): recomeca pela senha.
        setEtapa('senha');
        setErro('O tempo para digitar o código acabou. Entre com a senha de novo.');
      } else {
        setErro(mensagemDeErro(err));
        codigoRef.current?.focus();
      }
    } finally {
      setEnviando(false);
    }
  }

  if (logado) return <Navigate to="/admin/dashboard" replace />;

  return (
    <div className="admin admin--centro">
      <div className="login">
        <p className="admin__eyebrow">Área interna</p>
        <h1 className="login__titulo">
          {etapa === 'codigo' ? 'Código de verificação' : 'Entrar'}
        </h1>

        {etapa === 'verificando' && <p className="login__texto">Verificando…</p>}

        {etapa === 'senha' && (
          <form className="login__form" onSubmit={enviarSenha} noValidate>
            <label className="login__campo">
              <span>E-mail</span>
              <input
                type="email"
                autoComplete="username"
                inputMode="email"
                required
                maxLength={190}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {/* div + label separado: o botao do olhinho nao pode ficar
                dentro do <label> (dois controles no mesmo rotulo). */}
            <div className="login__campo">
              <label htmlFor="login-senha">Senha</label>
              <div className="login__senha">
                <input
                  id="login-senha"
                  type={verSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  maxLength={128}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className="login__olho"
                  aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
                  aria-pressed={verSenha}
                  aria-controls="login-senha"
                  title={verSenha ? 'Esconder senha' : 'Mostrar senha'}
                  onClick={() => setVerSenha((v) => !v)}
                >
                  {verSenha ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c5 0 9 4.5 10 7a13 13 0 0 1-3.2 4.3M6.1 6.2A13 13 0 0 0 2 12c1 2.5 5 7 10 7a10 10 0 0 0 4.6-1.1" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <label className="login__lembrar">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
              />
              <span>
                Mantenha-me conectado neste aparelho
                <small>
                  Por 30 dias, não pede o código do app aqui. Não marque em computador
                  compartilhado.
                </small>
              </span>
            </label>
            {erro && <p className="login__erro" role="alert">{erro}</p>}
            <button className="admin__salvar login__botao" disabled={enviando || !email || !senha}>
              {enviando ? 'Entrando…' : 'Continuar'}
            </button>
          </form>
        )}

        {etapa === 'codigo' && (
          <form className="login__form" onSubmit={enviarCodigo} noValidate>
            <p className="login__texto">
              Abra o app autenticador no celular e digite o código de 6 números da Rede 24.
            </p>
            <label className="login__campo">
              <span>Código</span>
              <input
                ref={codigoRef}
                className="login__codigo"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                value={codigo}
                // So numeros: o resto e descartado enquanto digita.
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
            {erro && <p className="login__erro" role="alert">{erro}</p>}
            <button className="admin__salvar login__botao" disabled={enviando || codigo.length !== 6}>
              {enviando ? 'Verificando…' : 'Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
