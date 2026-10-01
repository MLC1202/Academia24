// Painel "Detalhes" de uma aula no editor da grade: duracao, professor,
// estudio e categoria. Todos opcionais; aparecem no site numa linha pequena
// embaixo do nome da aula.
//
// Decidido com o Matheus em 01/10/2026: um botao "Detalhes" por aula abre
// este painel; texto livre com sugestoes do que ja existe na unidade.
//
// As regras ficam em lib/detalhes-aula.ts (iguais as do servidor).

import type { Aula } from '../../data/grade';
import {
  DURACAO_MAX,
  DURACAO_MIN,
  camposTexto,
  problemaCampo,
  type CampoDetalhe,
  type CampoTexto,
} from '../../lib/detalhes-aula';

type Props = {
  aula: Aula;
  idPainel: string;
  aoMudar: (campo: CampoDetalhe, valor: string) => void;
};

function DetalhesAula({ aula, idPainel, aoMudar }: Props) {
  const erroDuracao = problemaCampo('duracao', aula);
  return (
    <div className="detalhes" id={idPainel}>
      <label className="detalhes__campo">
        <span>Duração (min)</span>
        <input
          type="number"
          inputMode="numeric"
          min={DURACAO_MIN}
          max={DURACAO_MAX}
          step={5}
          placeholder="ex.: 60"
          value={aula.duracao ?? ''}
          aria-invalid={!!erroDuracao}
          onChange={(e) => aoMudar('duracao', e.target.value)}
        />
        {erroDuracao && <small className="detalhes__erro">{erroDuracao}</small>}
      </label>

      {(Object.keys(camposTexto) as CampoTexto[]).map((campo) => {
        const erro = problemaCampo(campo, aula);
        return (
          <label className="detalhes__campo" key={campo}>
            <span>{camposTexto[campo].rotulo}</span>
            <input
              type="text"
              maxLength={camposTexto[campo].max}
              placeholder={camposTexto[campo].exemplo}
              list={`sugestoes-${campo}`}
              autoComplete="off"
              value={aula[campo] ?? ''}
              aria-invalid={!!erro}
              onChange={(e) => aoMudar(campo, e.target.value)}
            />
            {erro && <small className="detalhes__erro">{erro}</small>}
          </label>
        );
      })}
    </div>
  );
}

export default DetalhesAula;
