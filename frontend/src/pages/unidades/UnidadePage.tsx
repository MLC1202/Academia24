// /unidades/<slug>: a LP de cada unidade.
//
// Historico: as subpaginas sairam em 01/10/2026 (tudo foi pra /unidades e os
// botoes levavam pras LPs do Lovable, em outros dominios). Em 18/11/2026 a
// dona pediu as LPs dentro do site, iguais as antigas, pra pessoa nao sair
// do endereco. As 4 usam o mesmo layout (TemplateRede) e os textos de
// lp/conteudo.ts.

import { useParams } from "react-router-dom";
import Pagina from "../../components/Pagina/Pagina";
import { ehSlugUnidade, type UnidadeSlug } from "../../data/unidades";
import { SEO_LP } from "../../data/seo";
import { useSeo } from "../../lib/useSeo";
import { LPS_REDE } from "../lp/conteudo";
import TemplateRede from "../lp/TemplateRede";
import NaoEncontradaPage from "../naoEncontrada/NaoEncontradaPage";

function LpUnidade({ slug }: { slug: UnidadeSlug }) {
  useSeo(SEO_LP[slug]);
  return (
    <Pagina>
      <TemplateRede lp={LPS_REDE[slug]} slug={slug} />
    </Pagina>
  );
}

function UnidadePage() {
  const { slug } = useParams();
  if (!ehSlugUnidade(slug)) return <NaoEncontradaPage />;
  // key: trocar de uma LP pra outra remonta tudo (rolagem e <details> zerados).
  return <LpUnidade key={slug} slug={slug} />;
}

export default UnidadePage;
