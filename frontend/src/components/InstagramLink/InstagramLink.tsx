// Iconezinho do Instagram que leva pro perfil da unidade.
// Recebe o @ sem o "@" (ex.: "academia24healthclub.cambui"), vindo de
// src/data/unidades.ts. Se o @ estiver vazio nao renderiza nada — assim da
// pra ir preenchendo as unidades aos poucos sem aparecer link quebrado.

import "./InstagramLink.css";

type Props = {
  usuario: string;
  unidade: string; // so pro texto do leitor de tela
  className?: string;
};

function InstagramLink({ usuario, unidade, className }: Props) {
  const limpo = usuario.trim().replace(/^@/, "");
  if (!limpo) return null;

  return (
    <a
      className={className ? `insta ${className}` : "insta"}
      href={`https://www.instagram.com/${encodeURIComponent(limpo)}/`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Instagram da unidade ${unidade} (@${limpo})`}
      title={`@${limpo}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle className="insta__ponto" cx="17.4" cy="6.6" r="1.1" />
      </svg>
    </a>
  );
}

export default InstagramLink;
