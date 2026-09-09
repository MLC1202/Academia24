import { useState } from 'react';
import './Rede.css';

const pilares = [
  {
    n: '01',
    titulo: 'Estrutura de verdade',
    texto:
      'Unidades amplas, organizadas e preparadas para diferentes objetivos e níveis de treino.',
  },
  {
    n: '02',
    titulo: 'Equipamentos reconhecidos',
    texto:
      'Parques diversificados com marcas como Life Fitness, Hammer Strength e Technogym, conforme a unidade.',
  },
  {
    n: '03',
    titulo: 'Avaliação com bioimpedância',
    texto:
      'Acompanhe composição corporal, percentual de gordura, massa muscular e sua evolução.',
  },
  {
    n: '04',
    titulo: 'Atendimento próximo',
    texto:
      'Profissionais presentes para acolher, orientar e fazer você se sentir parte da comunidade.',
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
                i === ativo ? 'rede__painel rede__painel--ativo' : 'rede__painel'
              }
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