// Secao "A Rede": os 4 pilares em acordeao.
// As 4 fotos ficam em public/imagens/rede/. Estrutura e equipamentos sao
// fotos reais da academia; bioimpedancia e de banco de imagens e
// atendimento foi montada (foto de banco + fundo da unidade, rostos
// trocados e camiseta com a logo Health Club). Foto nova: mesmo nome, mesma pasta.
//
// O BASE_URL e o caminho onde o site esta hospedado ('/' na Hostinger,
// '/Academia24/' no GitHub Pages). Sem ele a foto da 404 no Pages.
//
// NO CELULAR (ate 900px) os cartoes ficam empilhados no mesmo lugar, presos
// na tela (position: sticky) dentro de um trilho mais alto que ela. Conforme o
// cliente rola, o proximo cartao sobe de baixo POR CIMA do anterior, que
// vai clareando ate sumir (mesma ideia do site da Smart Fit). Depois do 04 a moldura solta e
// a pagina segue pra proxima secao.
// O Rede.tsx so calcula --p (0 = cartao 01 no lugar, 3 = cartao 04) e o
// CSS faz o resto.
// NO COMPUTADOR (acima de 900px) e a galeria elastica: o painel sob o mouse
// abre (4 partes contra 1), a foto faz um zoom suave, os vizinhos escurecem e
// mostram o titulo na vertical. So CSS: o React so marca qual esta ativo.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import "./Rede.css";

const pilares = [
  {
    n: "01",
    titulo: "Estrutura de verdade",
    texto:
      "Unidades amplas, organizadas e preparadas para diferentes objetivos e níveis de treino.",
    foto: `${import.meta.env.BASE_URL}imagens/rede/estrutura.webp`,
    // Enquadramento so quando fugir do padrao (o CSS ancora embaixo).
    posicao: "center center",
  },
  {
    n: "02",
    titulo: "Equipamentos reconhecidos",
    texto:
      "Parques diversificados com marcas como Life Fitness, Hammer Strength e Technogym, conforme a unidade.",
    foto: `${import.meta.env.BASE_URL}imagens/rede/equipamentos.webp`,
  },
  {
    n: "03",
    titulo: "Avaliação com bioimpedância",
    texto:
      "Acompanhe composição corporal, percentual de gordura, massa muscular e sua evolução.",
    foto: `${import.meta.env.BASE_URL}imagens/rede/bioimpedancia.webp`,
    // Foto vertical (3:4) num painel deitado: o corte pega do ombro ate as
    // maos, com a tela da balanca no meio.
    posicao: "center 28%",
  },
  {
    n: "04",
    titulo: "Atendimento próximo",
    texto:
      "Profissionais presentes para acolher, orientar e fazer você se sentir parte da comunidade.",
    foto: `${import.meta.env.BASE_URL}imagens/rede/atendimento.webp`,
    // Foto vertical: sobe o corte pra mostrar o rosto do professor.
    posicao: "center 36%",
  },
];

const MOBILE = "(max-width: 900px)";

const ULTIMO = pilares.length - 1;

// Progresso do trilho (0 a 1) -> posicao na pilha (0 a ULTIMO). Linear: cada
// cartao gasta uma tela de rolagem, sem pausa (como no site da Smart Fit).
const paraPosicao = (progresso: number) => progresso * ULTIMO;

function Rede() {
  const [ativo, setAtivo] = useState(0);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const molduraRef = useRef<HTMLDivElement>(null);

  // Quanto do trilho ja foi rolado (0 a 1) enquanto a moldura esta presa.
  const medir = () => {
    const trilho = trilhoRef.current;
    const moldura = molduraRef.current;
    if (!trilho || !moldura) return null;
    const t = trilho.getBoundingClientRect();
    const m = moldura.getBoundingClientRect();
    const total = t.height - m.height;
    if (total <= 0) return null;
    return { t, m, total, rolado: m.top - t.top };
  };

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".snap-container");
    const mq = window.matchMedia(MOBILE);
    // Com animacao ligada a rolagem o proprio CSS move os cartoes (Rede.css).
    if (!container || CSS.supports("animation-timeline", "view()")) return;

    let frame = 0;
    const atualizar = () => {
      if (!mq.matches) molduraRef.current?.style.removeProperty("--p");
      frame = 0;
      if (!mq.matches) return;
      const med = medir();
      if (!med) return;
      const progresso = Math.min(Math.max(med.rolado / med.total, 0), 1);
      const p = paraPosicao(progresso);
      molduraRef.current?.style.setProperty("--p", p.toFixed(4));
      setAtivo(Math.round(p));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(atualizar);
    };

    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    mq.addEventListener("change", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, []);

  // Toque no computador/tablet abre o painel. No celular quem manda e a rolagem.
  const abrir = (i: number) => {
    if (!window.matchMedia(MOBILE).matches) setAtivo(i);
  };

  return (
    <section className="rede snap-section" id="a-rede">
      <div className="rede__inner">
        <p className="rede__eyebrow">Quatro unidades, uma mesma essência</p>

        <div className="rede__head">
          <h2 className="rede__title">
            Uma rede feita para
            <br />
            caber na sua vida.
          </h2>

          <div className="rede__text">
            <p>
              Nossas unidades têm identidades próprias, conectadas pelo mesmo
              compromisso com estrutura, acolhimento e resultado. Em Alphaville,
              a experiência 24 Wellness. Nas unidades Norte, Cambuí e Lagoa, a
              tradição 24 Health Club.
            </p>
            <p>
              Você escolhe a unidade que combina com seu dia a dia. Em todas
              elas, encontra avaliação física com bioimpedância e uma equipe
              pronta para acompanhar sua evolução.
            </p>
          </div>
        </div>

        {/* O trilho so tem altura extra no celular; no computador e neutro. */}
        <div
          className="rede__trilho"
          ref={trilhoRef}
          style={{ "--rede-passos": pilares.length } as CSSProperties}
        >
        <div className="rede__accordion" ref={molduraRef}>
          {pilares.map((p, i) => (
            <button
              key={p.n}
              type="button"
              className={
                i === ativo
                  ? "rede__painel rede__painel--ativo"
                  : "rede__painel"
              }
              style={{
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,.8), rgba(0,0,0,.3)), url(${p.foto})`,
                backgroundPosition: p.posicao,
                "--i": i,
              } as CSSProperties}
              aria-expanded={i === ativo}
              onMouseEnter={() => setAtivo(i)}
              onFocus={() => setAtivo(i)}
              onClick={() => abrir(i)}
            >
              <span
                className="rede__painel-foto"
                aria-hidden="true"
                style={{ backgroundImage: `url(${p.foto})`, backgroundPosition: p.posicao }}
              />
              <span className="rede__painel-n">{p.n}</span>
              <span className="rede__painel-titulo">{p.titulo}</span>
              <span className="rede__painel-texto">{p.texto}</span>
              <span className="rede__painel-vertical" aria-hidden="true">
                {p.titulo}
              </span>
            </button>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}

export default Rede;