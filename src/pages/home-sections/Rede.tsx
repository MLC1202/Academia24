import { useState } from "react";
import "./Rede.css";

const pilares = [
  {
    n: "01",
    titulo: "Estrutura de verdade",
    texto:
      "Unidades amplas, organizadas e preparadas para diferentes objetivos e níveis de treino.",
    foto: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80",
  },
  {
    n: "02",
    titulo: "Equipamentos reconhecidos",
    texto:
      "Parques diversificados com marcas como Life Fitness, Hammer Strength e Technogym, conforme a unidade.",
    foto: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=80",
  },
  {
    n: "03",
    titulo: "Avaliação com bioimpedância",
    texto:
      "Acompanhe composição corporal, percentual de gordura, massa muscular e sua evolução.",
    foto: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80",
  },
  {
    n: "04",
    titulo: "Atendimento próximo",
    texto:
      "Profissionais presentes para acolher, orientar e fazer você se sentir parte da comunidade.",
    foto: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1600&q=80",
  },
];

function Rede() {
  const [ativo, setAtivo] = useState(0);

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
              A Rede 24 reúne unidades com identidades próprias, conectadas pelo
              mesmo compromisso com estrutura, acolhimento e resultado. Em
              Alphaville, a experiência 24 Wellness. Nas unidades Norte, Cambuí
              e Lagoa, a tradição 24 Health Club.
            </p>
            <p>
              Você escolhe a unidade que combina com seu dia a dia. Em todas
              elas, encontra avaliação física com bioimpedância e uma equipe
              pronta para acompanhar sua evolução.
            </p>
          </div>
        </div>

        <div className="rede__accordion">
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
              }}
              aria-expanded={i === ativo}
              onMouseEnter={() => setAtivo(i)}
              onFocus={() => setAtivo(i)}
              onClick={() => setAtivo(i)}
            >
              <span className="rede__painel-n">{p.n}</span>
              <span className="rede__painel-titulo">{p.titulo}</span>
              <span className="rede__painel-texto">{p.texto}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Rede;
