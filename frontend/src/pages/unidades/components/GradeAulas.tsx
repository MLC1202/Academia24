// Grade de aulas coletivas. Mostra as abas da semana e as aulas do dia
// escolhido, lendo o que estiver salvo pelo dashboard.
//
// Na pagina /unidades aparece a grade das 4. Na subpagina de uma unidade eu
// passo so o slug dela e a grade vira um card unico.
//
// Visual no estilo Apple (skill apple-design): fundo claro, uma cor de
// destaque so (o vermelho), hierarquia feita com tamanho de letra e espaco,
// e movimento discreto porque aqui o cliente veio consultar, nao ver show.
//   - Dias num "segmented control": uma capsula cinza com uma pilula branca
//     que desliza ate o dia escolhido. Setas do teclado tambem trocam o dia.
//   - Cada unidade e um card branco arredondado com a lista de aulas.
//   - No dia de hoje, aula que ja passou fica apagada e a proxima ganha a
//     etiqueta "Próxima". Em outro dia a lista aparece normal.
//   - No celular os cards viram um carrossel de lado (arrasta pro lado),
//     em vez de 4 listas empilhadas.
//   - Com as 4 unidades lado a lado, cada card mostra so LIMITE aulas (hoje:
//     a partir da proxima; outros dias: as primeiras). O botao de ampliar
//     abre o dia inteiro num card flutuante (<dialog>), em duas colunas e
//     separado em Manha / Tarde / Noite. Esc ou clicar fora fecha.
//   - Na subpagina de uma unidade (card unico) a lista ja vem completa.

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
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

// Quantas aulas cada card mostra quando as 4 unidades aparecem juntas.
const LIMITE = 4;

// Hora atual no mesmo formato da grade ('HH:MM'), pra comparar como texto.
function horaAgora() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Recorte do card: hoje comeca na proxima aula (se sobrar pouca coisa,
// completa com as ultimas que ja passaram); nos outros dias, as primeiras.
function recorte(aulas: Aula[], ehHoje: boolean, agora: string) {
  if (aulas.length <= LIMITE) return aulas;
  if (!ehHoje) return aulas.slice(0, LIMITE);
  const i = aulas.findIndex((a) => a.hora >= agora);
  const inicio = i === -1 ? aulas.length - LIMITE : Math.min(i, aulas.length - LIMITE);
  return aulas.slice(inicio, inicio + LIMITE);
}

const periodos = [
  { nome: "Manhã", ate: "12:00" },
  { nome: "Tarde", ate: "18:00" },
  { nome: "Noite", ate: "24:00" },
];

type ListaProps = {
  aulas: Aula[];
  ehHoje: boolean;
  agora: string;
  // id da proxima aula do dia inteiro (pode nem estar nesta lista)
  proximaId?: string;
  className?: string;
};

// Uma lista de aulas com os estados de hoje (passou / proxima).
function ListaAulas({
  aulas,
  ehHoje,
  agora,
  proximaId,
  className = "grade__aulas",
}: ListaProps) {
  return (
    <ul className={className}>
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
  const abasRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Unidade aberta no card flutuante (null = fechado).
  const [aberta, setAberta] = useState<UnidadeSlug | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // O <dialog> nativo ja prende o foco la dentro e fecha com Esc.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (aberta && !d.open) {
      d.showModal();
      // Hoje: ja abre rolado ate a proxima aula (no celular a lista e longa).
      const corpo = d.querySelector<HTMLElement>(".grade__modal-corpo");
      const proxima = d.querySelector<HTMLElement>(".grade__aula--proxima");
      if (corpo && proxima && corpo.scrollHeight > corpo.clientHeight) {
        corpo.scrollTop =
          proxima.getBoundingClientRect().top -
          corpo.getBoundingClientRect().top -
          corpo.clientHeight / 3;
      }
    }
    if (!aberta && d.open) d.close();
  }, [aberta]);

  // Clique no fundo escuro (fora do card) fecha.
  const cliqueNoFundo = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) setAberta(null);
  };

  const indice = semana.findIndex((d) => d.chave === dia);
  const diaAtual = semana[indice];
  const ehHoje = diaAtual.hoje;
  const agora = ehHoje ? horaAgora() : "";

  // Setas esquerda/direita (e Home/End) andam pelos dias, como nas abas
  // nativas. O foco vai junto pra quem navega pelo teclado.
  const onTeclado = (e: KeyboardEvent<HTMLDivElement>) => {
    const passos: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let novo: number;
    if (e.key in passos) novo = (indice + passos[e.key] + semana.length) % semana.length;
    else if (e.key === "Home") novo = 0;
    else if (e.key === "End") novo = semana.length - 1;
    else return;
    e.preventDefault();
    setDia(semana[novo].chave);
    abasRef.current[novo]?.focus();
  };

  return (
    <section className="grade snap-section" id="grade">
      <div className="grade__eyebrow">AULAS COLETIVAS</div>

      <h2 className="grade__title">
        Encontre a aula que combina com o seu ritmo.
      </h2>

      <div className="grade__text">
        <p>
          {unica
            ? `Escolha o dia para ver as aulas coletivas da unidade ${unidades[slugs[0]].nome}.`
            : "As modalidades e os horários variam por unidade. Escolha o dia para ver a grade das quatro unidades."}
        </p>
      </div>

      <div
        className="grade__dias"
        role="tablist"
        aria-label="Dia da semana"
        onKeyDown={onTeclado}
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

      <div
        id="grade-cards"
        role="tabpanel"
        aria-label={`${diaAtual.longo}, dia ${diaAtual.numero}`}
        className={unica ? "grade__cards grade__cards--unica" : "grade__cards"}
      >
        {slugs.map((slug) => {
          const info = unidades[slug];
          const aulas = ordenarPorHora(grades[slug][dia]);
          const visiveis = unica ? aulas : recorte(aulas, ehHoje, agora);
          const escondidas = aulas.length - visiveis.length;
          const proximaId = ehHoje ? aulas.find((a) => a.hora >= agora)?.id : undefined;

          return (
            <article className="grade__card" key={slug}>
              <header className="grade__card-topo">
                <div className="grade__card-marca">{info.marca}</div>
                <h3 className="grade__card-title">{info.nome}</h3>
                <p className="grade__card-text">
                  {ehHoje ? "Hoje" : diaAtual.longo}, {diaAtual.numero}
                  {aulas.length > 0 && ` · ${aulas.length} ${aulas.length === 1 ? "aula" : "aulas"}`}
                </p>

                {escondidas > 0 && (
                  <button
                    type="button"
                    className="grade__ampliar"
                    aria-label={`Ver o dia inteiro da unidade ${info.nome}`}
                    onClick={() => setAberta(slug)}
                  >
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M12 3h5v5M17 3l-6 6M8 17H3v-5M3 17l6-6" />
                    </svg>
                  </button>
                )}
              </header>

              {/* A key com o dia faz a lista entrar de novo (fade) ao trocar */}
              {visiveis.length > 0 ? (
                <ListaAulas
                  key={dia}
                  aulas={visiveis}
                  ehHoje={ehHoje}
                  agora={agora}
                  proximaId={proximaId}
                />
              ) : (
                <p className="grade__vazio" key={dia}>
                  Sem aulas coletivas neste dia.
                </p>
              )}

              {escondidas > 0 && (
                <button
                  type="button"
                  className="grade__mais"
                  onClick={() => setAberta(slug)}
                >
                  + {escondidas} {escondidas === 1 ? "aula" : "aulas"} neste dia
                </button>
              )}

              {unica ? (
                <Link
                  to={`/agendamento?unidade=${slug}`}
                  className="grade__card-btn grade__card-btn--cheio"
                >
                  Agendar aula experimental
                </Link>
              ) : (
                <Link to={`/unidades/${slug}`} className="grade__card-btn">
                  Ver unidade
                  <span aria-hidden="true" className="grade__card-seta">
                    ›
                  </span>
                </Link>
              )}
            </article>
          );
        })}
      </div>

      {/* Card flutuante com o dia inteiro de uma unidade */}
      <dialog
        ref={dialogRef}
        className="grade__modal"
        aria-labelledby="grade-modal-titulo"
        onClose={() => setAberta(null)}
        onClick={cliqueNoFundo}
      >
        {aberta && (
          <div className="grade__modal-caixa">
            <header className="grade__modal-topo">
              <div>
                <div className="grade__card-marca">{unidades[aberta].marca}</div>
                <h3 className="grade__modal-titulo" id="grade-modal-titulo">
                  {unidades[aberta].nome}
                </h3>
                <p className="grade__card-text">
                  {ehHoje ? "Hoje" : diaAtual.longo}, {diaAtual.numero} ·{" "}
                  {grades[aberta][dia].length} aulas
                </p>
              </div>
              <button
                type="button"
                className="grade__fechar"
                aria-label="Fechar"
                onClick={() => setAberta(null)}
              >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              </button>
            </header>

            <div className="grade__modal-corpo">
              {periodos.map((per, i) => {
                const todas = ordenarPorHora(grades[aberta][dia]);
                const proximaId = ehHoje
                  ? todas.find((a) => a.hora >= agora)?.id
                  : undefined;
                const de = i === 0 ? "00:00" : periodos[i - 1].ate;
                const aulas = todas.filter(
                  (a) => a.hora >= de && a.hora < per.ate,
                );
                if (aulas.length === 0) return null;
                return (
                  <section className="grade__periodo" key={per.nome}>
                    <h4 className="grade__periodo-nome">{per.nome}</h4>
                    <ListaAulas
                      aulas={aulas}
                      ehHoje={ehHoje}
                      agora={agora}
                      proximaId={proximaId}
                      className="grade__aulas grade__aulas--modal"
                    />
                  </section>
                );
              })}
            </div>

            <footer className="grade__modal-rodape">
              <Link to={`/unidades/${aberta}`} className="grade__card-btn">
                Ver unidade
                <span aria-hidden="true" className="grade__card-seta">›</span>
              </Link>
            </footer>
          </div>
        )}
      </dialog>

      <p className="grade__disclaimer">
        A grade pode sofrer alterações. Confirme a aula e a disponibilidade
        diretamente com a unidade.
      </p>
    </section>
  );
}

export default GradeAulas;
