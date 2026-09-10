// Secao "Duvidas": painel com foto a esquerda, perguntas em acordeao a direita.
// Pra mexer nas perguntas e so editar a lista abaixo.

import { useState } from "react";
import "./Duvidas.css";

const perguntas = [
  {
    p: "Qual é a diferença entre 24 Wellness e 24 Health Club?",
    r: "Alphaville utiliza a marca 24 Wellness; Norte, Cambuí e Lagoa utilizam a marca 24 Health Club. Todas fazem parte da mesma rede.",
  },
  {
    p: "Todas as unidades oferecem avaliação física com bioimpedância?",
    r: "Sim. As quatro unidades oferecem avaliação física com bioimpedância. Consulte condições, horários e agendamento.",
  },
  {
    p: "Posso fazer uma aula experimental?",
    r: "Sim. Preencha o formulário desta página, escolha a unidade e aguarde o contato da equipe para combinar o melhor dia e horário.",
  },
  {
    p: "A Rede 24 aceita Wellhub e TotalPass?",
    r: "As unidades aceitam Wellhub a partir do plano Gold e TotalPass a partir do TP5. Consulte regras e disponibilidade na unidade escolhida.",
  },
  {
    p: "Os planos e preços são iguais em todas as unidades?",
    r: "Não necessariamente. Valores, campanhas e condições podem variar conforme a unidade.",
  },
  {
    p: "As unidades possuem estacionamento?",
    r: "Alphaville e Cambuí oferecem serviço de manobrista. A Unidade Norte conta com mais de 80 vagas. Consulte as condições da unidade escolhida.",
  },
  {
    p: "Onde encontro a grade de aulas?",
    r: "A grade é organizada por unidade e pode sofrer alterações. Use a seção “Grade de aulas” e confirme diretamente com a unidade.",
  },
];

function Duvidas() {
  // Guardo os indices abertos: da pra deixar mais de um aberto ao mesmo tempo.
  const [abertas, setAbertas] = useState<number[]>([0]);

  const alternar = (i: number) =>
    setAbertas((atual) =>
      atual.includes(i) ? atual.filter((n) => n !== i) : [...atual, i]
    );

  return (
    <section className="duvidas snap-section" id="duvidas">
      <div className="duvidas__foto">
        <div className="duvidas__intro">
          <p className="duvidas__eyebrow">Dúvidas frequentes</p>

          <h2 className="duvidas__title">
            Antes de escolher
            <br />
            sua unidade.
          </h2>

          <p className="duvidas__subtitle">
            Reunimos as principais informações sobre a Rede 24. Condições
            comerciais, modalidades e disponibilidade podem variar.
          </p>

          <a href="#agendar" className="duvidas__cta">
            Ainda com dúvida? Agende sua aula ↑
          </a>
        </div>
      </div>

      <div className="duvidas__conteudo">
        <ul className="duvidas__lista">
          {perguntas.map((item, i) => {
            const aberta = abertas.includes(i);

            return (
              <li key={item.p} className="duvidas__item">
                <button
                  type="button"
                  className="duvidas__pergunta"
                  aria-expanded={aberta}
                  aria-controls={`duvida-${i}`}
                  onClick={() => alternar(i)}
                >
                  <span>{item.p}</span>
                  <span className="duvidas__sinal" aria-hidden="true">
                    {aberta ? "–" : "+"}
                  </span>
                </button>

                <div
                  id={`duvida-${i}`}
                  className={
                    aberta
                      ? "duvidas__resposta duvidas__resposta--aberta"
                      : "duvidas__resposta"
                  }
                >
                  <p>{item.r}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default Duvidas;
