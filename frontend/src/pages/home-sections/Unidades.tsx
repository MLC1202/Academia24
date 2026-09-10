// Secao das 4 unidades na home, em zigue-zague.
// Os textos ficam aqui mesmo; foto e link da LP vem de src/unidades.ts.

import { unidades as infoUnidades } from "../../unidades";
import "./Unidades.css";

const unidades = [
  {
    n: "01",
    marca: "24 Wellness",
    nome: "Alphaville",
    frase: "Conforto, performance e bem-estar.",
    descricao:
      "Loja de roupas fitness, loja de suplementos, massoterapia e ambiente familiar.",
    destaques: [
      "1.800 m²",
      "Life Fitness e Hammer Strength",
      "Ambientes climatizados",
      "Valet",
    ],
    endereco: "Alameda Grajaú, 525 · Alphaville Industrial · Barueri",
    horarios: "Seg–Sex 05h–23h · Sáb 07h–15h · Dom/feriados 08h–14h",
    local: "Barueri · SP",
    lp: infoUnidades.alphaville.lp,
    foto: infoUnidades.alphaville.foto,
  },
  {
    n: "02",
    marca: "24 Health Club",
    nome: "Norte",
    frase: "Espaço e liberdade para evoluir.",
    descricao:
      "Salão amplo com circulação natural de ar, salas coletivas climatizadas e equipamentos Life Fitness e Technogym.",
    destaques: [
      "Mais de 3.000 m²",
      "Mais de 80 vagas de estacionamento",
      "Mais de 20 anos na região",
      "Abre às 4h de segunda a sexta",
    ],
    endereco: "Rua Maria Cândida, 468 · Vila Guilherme · São Paulo",
    horarios: "Seg–Sex 04h–23h · Sáb 07h–15h · Dom/feriados 08h–14h",
    local: "Vila Guilherme · São Paulo",
    lp: infoUnidades.norte.lp,
    foto: infoUnidades.norte.foto,
  },
  {
    n: "03",
    marca: "24 Health Club",
    nome: "Cambuí",
    frase: "Premium sem ser impessoal.",
    descricao:
      "Estrutura acolhedora e climatizada, com novos equipamentos Hack Squat 35° e cadeira abdutora articulada.",
    destaques: [
      "Mais de 1.200 m²",
      "Life Fitness e Hammer Strength",
      "11 anos no Cambuí",
      "Valet",
    ],
    endereco: "Rua Santa Cruz, 299 · Cambuí · Campinas",
    horarios: "Seg–Sex 05h–23h · Sáb 07h–15h · Dom/feriados 08h–14h",
    local: "Campinas · SP",
    lp: infoUnidades.cambui.lp,
    foto: infoUnidades.cambui.foto,
  },
  {
    n: "04",
    marca: "24 Health Club",
    nome: "Lagoa",
    frase: "Estrutura à altura dos seus objetivos.",
    descricao:
      "Estrutura completa e uma rotina de treino com conforto, orientação e praticidade.",
    destaques: [
      "Musculação completa",
      "Área de cardio",
      "Aulas coletivas",
      "Avaliação com bioimpedância",
    ],
    endereco: "Av. Dr. Heitor Penteado, 1740 · Campinas",
    horarios: "Consulte a unidade para confirmar os horários vigentes.",
    local: "Campinas · SP",
    lp: infoUnidades.lagoa.lp,
    foto: infoUnidades.lagoa.foto,
  },
];

function Unidades() {
  return (
    <section className="unidades snap-section" id="unidades">
      <div className="unidades__inner">
        <header className="unidades__head">
          <p className="unidades__eyebrow">Encontre a sua 24</p>

          <h2 className="unidades__title">
            <span className="unidades__title-destaque">Quatro unidades.</span>
            <br />
            Uma experiência para cada rotina.
            <br />
          </h2>

          <div className="unidades__intro">
            <p>
              Compare os diferenciais e escolha a unidade mais próxima ou mais
              alinhada ao
              <strong> seu jeito de treinar.</strong>
            </p>
          </div>
        </header>

        <div className="unidades__lista">
          {unidades.map((u, i) => (
            <article
              key={u.n}
              className={i % 2 === 0 ? "unidade" : "unidade unidade--invertida"}
            >
              <div
                className="unidade__foto"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,.15)), url(${u.foto})`,
                }}
              >
                <span className="unidade__foto-n">{u.n}</span>
                <span className="unidade__foto-local">{u.local}</span>
              </div>

              <div className="unidade__conteudo">
                <p className="unidade__marca">
                  {u.marca} · Unidade {u.n}
                </p>

                <h3 className="unidade__nome">{u.nome}</h3>

                <p className="unidade__frase">{u.frase}</p>

                <p className="unidade__descricao">{u.descricao}</p>

                <ul className="unidade__destaques">
                  {u.destaques.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>

                <dl className="unidade__dados">
                  <div>
                    <dt>Endereço</dt>
                    <dd>{u.endereco}</dd>
                  </div>
                  <div>
                    <dt>Horários</dt>
                    <dd>{u.horarios}</dd>
                  </div>
                </dl>

                <div className="unidade__acoes">
                  {u.lp ? (
                    <a
                      className="unidade__link"
                      href={u.lp}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>Conhecer unidade</span>
                      <span className="unidade__link-seta" aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  ) : (
                    <span
                      className="unidade__link unidade__link--inativo"
                      aria-disabled="true"
                    >
                      <span>Conhecer unidade</span>
                      <span className="unidade__link-seta" aria-hidden="true">
                        ↗
                      </span>
                    </span>
                  )}

                  <a
                    className="unidade__link unidade__link--grade"
                    href="#grade"
                  >
                    <span>Ver grade de aulas</span>
                    <span className="unidade__link-seta" aria-hidden="true">
                      ↓
                    </span>
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Unidades;
