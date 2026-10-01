// Pagina 404: endereco que nao existe no site (inclusive /unidades/<slug>
// errado). Antes voltava calada pra home; agora explica e oferece caminhos.
//
// O status 404 "de verdade" (pro Google nao indexar endereco errado) vem do
// servidor: o public/.htaccess so responde 200 nas rotas que existem. Aqui
// ainda vai um <meta name="robots" content="noindex"> de reforco.

import { Link } from "react-router-dom";
import Pagina from "../../components/Pagina/Pagina";
import { SEO } from "../../data/seo";
import { useSeo } from "../../lib/useSeo";
import "./NaoEncontradaPage.css";

function NaoEncontradaPage() {
  useSeo(SEO.naoEncontrada);

  return (
    <Pagina>
      <section className="nao-encontrada snap-section">
        <div className="nao-encontrada__inner">
          <p className="nao-encontrada__eyebrow">Erro 404</p>
          <h1 className="nao-encontrada__titulo">
            Essa página
            <br />
            <span>não existe.</span>
          </h1>
          <p className="nao-encontrada__texto">
            O endereço pode ter mudado ou foi digitado errado. Escolha um caminho
            abaixo.
          </p>
          <div className="nao-encontrada__acoes">
            <Link to="/" className="nao-encontrada__btn nao-encontrada__btn--principal">
              Ir para o início
            </Link>
            <Link to="/unidades" className="nao-encontrada__btn">
              Ver unidades
            </Link>
            <Link to="/agendamento" className="nao-encontrada__btn">
              Agendar aula experimental
            </Link>
          </div>
        </div>
      </section>
    </Pagina>
  );
}

export default NaoEncontradaPage;
