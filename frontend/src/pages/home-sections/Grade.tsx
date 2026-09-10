// Secao da grade de aulas na home. Mostra as abas da semana e as aulas do
// dia escolhido, lendo o que estiver salvo pelo dashboard.

import { useMemo, useState } from "react";
import { slugsUnidades, unidades } from "../../unidades";
import {
  diaDeHoje,
  ordenarPorHora,
  semanaAtual,
  type Dia,
} from "../../grade";
import { carregarGrades } from "../../lib/grade-store";
import "./Grade.css";

function Grade() {
  // Calculo a semana e a grade uma vez so por visita, nao a cada clique.
  const semana = useMemo(() => semanaAtual(), []);
  const grades = useMemo(() => carregarGrades(), []);
  const [dia, setDia] = useState<Dia>(() => diaDeHoje());

  const diaAtual = semana.find((d) => d.chave === dia)!;

  return (
    <section className="grade snap-section" id="grade">
      <div className="grade__eyebrow">AULAS COLETIVAS</div>

      <h2 className="grade__title">
        Encontre a aula que combina com o seu ritmo.
      </h2>

      <div className="grade__text">
        <p>
          As modalidades e os horários variam por unidade. Escolha o dia para
          ver a grade das quatro unidades.
        </p>
      </div>

      <div className="grade__dias" role="tablist" aria-label="Dia da semana">
        {semana.map((d) => (
          <button
            key={d.chave}
            type="button"
            role="tab"
            aria-selected={d.chave === dia}
            className={
              d.chave === dia ? "grade__dia grade__dia--ativo" : "grade__dia"
            }
            onClick={() => setDia(d.chave)}
          >
            <span className="grade__dia-nome">{d.curto}</span>
            <span className="grade__dia-numero">{d.numero}</span>
            {d.hoje && <span className="grade__dia-hoje">hoje</span>}
          </button>
        ))}
      </div>

      <div className="grade__cards">
        {slugsUnidades.map((slug) => {
          const info = unidades[slug];
          const aulas = ordenarPorHora(grades[slug][dia]);

          return (
            <article className="grade__card" key={slug}>
              <div className="grade__card-marca">
                {info.marca.toUpperCase()}
              </div>

              <h3 className="grade__card-title">Unidade {info.nome}</h3>

              <p className="grade__card-text">
                {diaAtual.longo}, dia {diaAtual.numero}
              </p>

              {aulas.length > 0 ? (
                <ul className="grade__aulas">
                  {aulas.map((aula) => (
                    <li className="grade__aula" key={aula.id}>
                      <span className="grade__aula-hora">{aula.hora}</span>
                      <span className="grade__aula-modalidade">
                        {aula.modalidade}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="grade__vazio">
                  Sem aulas coletivas neste dia.
                </p>
              )}

              {unidades[slug].lp ? (
                <a
                  href={unidades[slug].lp}
                  target="_blank"
                  rel="noreferrer"
                  className="grade__card-btn"
                >
                  <span>CONSULTAR ESTA UNIDADE</span>
                  <span aria-hidden="true">→</span>
                </a>
              ) : (
                <span
                  className="grade__card-btn grade__card-btn--inativo"
                  aria-disabled="true"
                >
                  <span>CONSULTAR ESTA UNIDADE</span>
                  <span aria-hidden="true">→</span>
                </span>
              )}
            </article>
          );
        })}
      </div>

      <p className="grade__disclaimer">
        A grade pode sofrer alterações. Confirme a aula e a disponibilidade
        diretamente com a unidade.
      </p>
    </section>
  );
}

export default Grade;
