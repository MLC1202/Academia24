// Grade de aulas coletivas. Mostra as abas da semana e as aulas do dia
// escolhido, lendo o que estiver salvo pelo dashboard.
//
// Na pagina /unidades aparece um seletor de unidade logo abaixo dos dias
// (Alphaville vem marcada) e a grade mostra so a unidade escolhida. Na
// subpagina de uma unidade eu passo so o slug dela e o seletor some.
//
// Visual no estilo Apple (skill apple-design): fundo claro, uma cor de
// destaque so (o vermelho), hierarquia feita com tamanho de letra e espaco,
// e movimento discreto porque aqui o cliente veio consultar, nao ver show.
//   - Dias num "segmented control": uma capsula cinza com uma pilula branca
//     que desliza ate o dia escolhido. Setas do teclado tambem trocam.
//   - Unidade numa roleta vertical, igual ao seletor de hora do iPhone:
//     ocupa a altura de uma linha so em destaque, as vizinhas aparecem
//     apagadas em cima e embaixo, e rola com o dedo/mouse/setas.
//   - A unidade vira um card branco unico com o dia inteiro, em colunas.
//     Como cabe tudo, nao existe mais o botao de ampliar / card flutuante.
//   - No dia de hoje, aula que ja passou fica apagada e a proxima ganha a
//     etiqueta "Próxima". Em outro dia a lista aparece normal.

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { slugsUnidades, unidades, type UnidadeSlug } from "../../../data/unidades";
import {
  diaDeHoje,
  ordenarPorHora,
  semanaAtual,
  type Aula,
  type Dia,
} from "../../../data/grade";
import { carregarGrades } from "../../../lib/grade-store";
import "./GradeAulas.css";

type Props = {
  slugs?: UnidadeSlug[];
};

// Unidade que ja vem marcada no seletor.
const PADRAO: UnidadeSlug = "alphaville";

// Altura de cada linha da roleta de unidades (tem que bater com o CSS).
const LINHA = 44;

// Hora atual no mesmo formato da grade ('HH:MM'), pra comparar como texto.
function horaAgora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Setas esquerda/direita (e Home/End) andam pelas opcoes, como nas abas
// nativas. Devolve o novo indice, ou null se a tecla nao e de navegacao.
function proximoIndice(e: KeyboardEvent, indice: number, total: number) {
  const passos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
  if (e.key in passos) return (indice + passos[e.key] + total) % total;
  if (e.key === "Home") return 0;
  if (e.key === "End") return total - 1;
  return null;
}

type ListaProps = {
  aulas: Aula[];
  ehHoje: boolean;
  agora: string;
  proximaId?: string;
};

// Uma lista de aulas com os estados de hoje (passou / proxima).
function ListaAulas({ aulas, ehHoje, agora, proximaId }: ListaProps) {
  return (
    <ul className="grade__aulas">
      {aulas.map((aula) => {
        const passou = ehHoje && aula.hora < agora;
        const ehProxima = aula.id === proximaId;
        const classes = [
          "grade__aula",
          passou ? "grade__aula--passou" : "",
          ehProxima ? "grade__aula--proxima" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <li className={classes} key={aula.id}>
            <span className="grade__aula-hora">{aula.hora}</span>
            <span className="grade__aula-modalidade">
              {/* Nome com barra (Alongamento/Mobilidade) quebra depois da
                  barra, e nao no meio da palavra */}
              {aula.modalidade.split("/").map((parte, i) => (
                <Fragment key={i}>
                  {i > 0 && (
                    <>
                      /<wbr />
                    </>
                  )}
                  {parte}
                </Fragment>
              ))}
            </span>
            {ehProxima && <span className="grade__aula-tag">Próxima</span>}
          </li>
        );
      })}
    </ul>
  );
}

function GradeAulas({ slugs = slugsUnidades }: Props) {
  const unica = slugs.length === 1;

  // Calculo a semana e a grade uma vez so por visita, nao a cada clique.
  const semana = useMemo(() => semanaAtual(), []);
  const grades = useMemo(() => carregarGrades(), []);
  const [dia, setDia] = useState<Dia>(() => diaDeHoje());
  const [unidade, setUnidade] = useState<UnidadeSlug>(() =>
    slugs.includes(PADRAO) ? PADRAO : slugs[0],
  );
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Roleta: "centro" e a linha que esta no meio agora (muda enquanto rola,
  // so pro destaque); "unidade" so troca quando a rolagem para, pra grade
  // nao ficar piscando a cada linha que passa.
  const rodaRef = useRef<HTMLDivElement>(null);
  const paradaRef = useRef<number | undefined>(undefined);
  const [centro, setCentro] = useState(() => slugs.indexOf(unidade));

  // Ao abrir, a roleta ja comeca parada na unidade padrao.
  useEffect(() => {
    const roda = rodaRef.current;
    if (roda) roda.scrollTop = slugs.indexOf(unidade) * LINHA;
    return () => window.clearTimeout(paradaRef.current);
    // so na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const girarPara = (i: number) => {
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rodaRef.current?.scrollTo({ top: i * LINHA, behavior: suave ? "smooth" : "auto" });
  };

  const onRolarRoda = () => {
    const roda = rodaRef.current;
    if (!roda) return;
    const i = Math.min(slugs.length - 1, Math.max(0, Math.round(roda.scrollTop / LINHA)));
    setCentro(i);
    window.clearTimeout(paradaRef.current);
    paradaRef.current = window.setTimeout(() => setUnidade(slugs[i]), 120);
  };

  const indice = semana.findIndex((d) => d.chave === dia);
  const diaAtual = semana[indice];
  const ehHoje = diaAtual.hoje;
  const agora = ehHoje ? horaAgora() : "";

  const onTecladoDias = (e: KeyboardEvent<HTMLDivElement>) => {
    const novo = proximoIndice(e, indice, semana.length);
    if (novo === null) return;
    e.preventDefault();
    setDia(semana[novo].chave);
    abasRef.current[novo]?.focus();
  };

  // Setas cima/baixo (e Home/End) giram a roleta.
  const onTecladoRoda = (e: KeyboardEvent<HTMLDivElement>) => {
    const passos: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 };
    let novo: number;
    if (e.key in passos) novo = Math.min(slugs.length - 1, Math.max(0, centro + passos[e.key]));
    else if (e.key === "Home") novo = 0;
    else if (e.key === "End") novo = slugs.length - 1;
    else return;
    e.preventDefault();
    girarPara(novo);
  };

  const info = unidades[unidade];
  const aulas = ordenarPorHora(grades[unidade][dia]);
  const proximaId = ehHoje ? aulas.find((a) => a.hora >= agora)?.id : undefined;

  return (
    <section className="grade snap-section" id="grade">
      <div className="grade__eyebrow">AULAS COLETIVAS</div>

      <h2 className="grade__title">
        Encontre a aula que combina com o seu ritmo.
      </h2>

      <div className="grade__text">
        <p>
          {unica
            ? `Escolha o dia para ver as aulas coletivas da unidade ${info.nome}.`
            : "As modalidades e os horários variam por unidade. Escolha o dia e a unidade para ver a grade."}
        </p>
      </div>

      <div
        className={unica ? "grade__dias" : "grade__dias grade__dias--com-roleta"}
        role="tablist"
        aria-label="Dia da semana"
        onKeyDown={onTecladoDias}
        style={{ "--idx": indice, "--total": semana.length } as CSSProperties}
      >
        {/* A pilula branca que desliza atras do dia escolhido */}
        <span className="grade__dias-pilula" aria-hidden="true" />

        {semana.map((d, i) => (
          <button
            key={d.chave}
            ref={(el) => {
              abasRef.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={d.chave === dia}
            aria-controls="grade-cards"
            tabIndex={d.chave === dia ? 0 : -1}
            className={
              d.chave === dia ? "grade__dia grade__dia--ativo" : "grade__dia"
            }
            onClick={() => setDia(d.chave)}
          >
            <span className="grade__dia-nome">{d.curto}</span>
            <span className="grade__dia-numero">{d.numero}</span>
            {/* Hoje = pontinho vermelho embaixo do numero */}
            {d.hoje && (
              <span className="grade__dia-hoje">
                <span className="grade__sr">hoje</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Seletor de unidade: roleta vertical estilo iPhone, ao lado dos dias */}
      {!unica && (
        <div className="grade__roleta">
          {/* Faixa cinza do meio: marca a linha escolhida */}
          <span className="grade__roleta-faixa" aria-hidden="true" />
          <div
            ref={rodaRef}
            className="grade__roleta-roda"
            role="listbox"
            aria-label="Unidade"
            aria-activedescendant={`grade-unidade-${slugs[centro]}`}
            tabIndex={0}
            onScroll={onRolarRoda}
            onKeyDown={onTecladoRoda}
          >
            {slugs.map((slug, i) => (
              <div
                key={slug}
                id={`grade-unidade-${slug}`}
                role="option"
                aria-selected={i === centro}
                className={
                  i === centro
                    ? "grade__roleta-item grade__roleta-item--ativo"
                    : "grade__roleta-item"
                }
                onClick={() => girarPara(i)}
              >
                <span className="grade__roleta-marca">{unidades[slug].marca}</span>
                <span className="grade__roleta-nome">{unidades[slug].nome}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        id="grade-cards"
        role="tabpanel"
        aria-label={`${info.nome}, ${diaAtual.longo}, dia ${diaAtual.numero}`}
        className="grade__cards"
      >
        <article className="grade__card">
          <header className="grade__card-topo">
            <div className="grade__card-marca">{info.marca}</div>
            <h3 className="grade__card-title">{info.nome}</h3>
            <p className="grade__card-text">
              {ehHoje ? "Hoje" : diaAtual.longo}, {diaAtual.numero}
              {aulas.length > 0 && ` · ${aulas.length} ${aulas.length === 1 ? "aula" : "aulas"}`}
            </p>
          </header>

          {/* A key com dia + unidade faz a lista entrar de novo (fade) ao trocar */}
          {aulas.length > 0 ? (
            <ListaAulas
              key={`${unidade}-${dia}`}
              aulas={aulas}
              ehHoje={ehHoje}
              agora={agora}
              proximaId={proximaId}
            />
          ) : (
            <p className="grade__vazio" key={`${unidade}-${dia}`}>
              Sem aulas coletivas neste dia.
            </p>
          )}

          <div className="grade__card-acoes">
            <Link
              to={`/agendamento?unidade=${unidade}`}
              className="grade__card-btn grade__card-btn--cheio"
            >
              Agendar aula experimental
            </Link>
            {!unica && (
              <Link to={`/unidades/${unidade}`} className="grade__card-btn">
                Ver unidade
                <span aria-hidden="true" className="grade__card-seta">
                  ›
                </span>
              </Link>
            )}
          </div>
        </article>
      </div>

      <p className="grade__disclaimer">
        A grade pode sofrer alterações. Confirme a aula e a disponibilidade
        diretamente com a unidade.
      </p>
    </section>
  );
}

export default GradeAulas;
