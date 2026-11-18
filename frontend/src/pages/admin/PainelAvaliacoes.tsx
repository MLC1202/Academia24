// Aba "Avaliações do Google" do dashboard: a equipe digita a nota atual de
// cada unidade (a do Google Maps) e ela aparece na LP daquela unidade.
// O site nao consulta o Google sozinho, entao a nota so muda quando alguem
// salva aqui.

import { useEffect, useState } from "react";
import { ErroApi, SEM_API } from "../../lib/api";
import { slugsUnidades, unidades, type UnidadeSlug } from "../../data/unidades";
import { buscarNotas, formatarNota, salvarNota } from "../../lib/avaliacoes-store";

type Props = { aoExpirar: () => void };
type Aviso = { tipo: "ok" | "erro"; texto: string };

function PainelAvaliacoes({ aoExpirar }: Props) {
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [carregando, setCarregando] = useState(!SEM_API);
  const [ocupada, setOcupada] = useState<UnidadeSlug | null>(null);
  const [aviso, setAviso] = useState<Record<string, Aviso>>({});

  useEffect(() => {
    if (SEM_API) return;
    let ativo = true;
    buscarNotas()
      .then((notas) => {
        if (!ativo) return;
        setCampos(Object.fromEntries(Object.entries(notas).map(([slug, n]) => [slug, formatarNota(n)])));
        setCarregando(false);
      })
      .catch((erro) => {
        console.error("[avaliacoes] não foi possível carregar", erro);
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function salvar(slug: UnidadeSlug) {
    setOcupada(slug);
    setAviso((a) => ({ ...a, [slug]: { tipo: "ok", texto: "" } }));
    try {
      const nota = await salvarNota(slug, campos[slug] ?? "");
      setCampos((c) => ({ ...c, [slug]: formatarNota(nota) }));
      setAviso((a) => ({ ...a, [slug]: { tipo: "ok", texto: "Salvo. Já está no site." } }));
    } catch (erro) {
      if (erro instanceof ErroApi && erro.codigo === "nao_autenticado") return aoExpirar();
      const texto = erro instanceof ErroApi && erro.detalhe ? erro.detalhe : "Não consegui salvar. Tente de novo.";
      setAviso((a) => ({ ...a, [slug]: { tipo: "erro", texto } }));
    } finally {
      setOcupada(null);
    }
  }

  if (SEM_API) {
    return <p className="admin__vazio">Prévia: as notas só funcionam com o servidor.</p>;
  }

  return (
    <section className="admin__bloco">
      <h2 className="admin__bloco-titulo">Nota do Google por unidade</h2>
      <p className="cancel__nota">
        Digite a nota que aparece no Google Maps (de 1,0 a 5,0). O site não consulta o Google sozinho: ao
        mudar lá, atualize aqui.
      </p>
      {carregando && <p className="admin__vazio">Carregando…</p>}
      <ul className="aval__lista">
        {slugsUnidades.map((slug) => (
          <li key={slug} className="aval__linha">
            <label htmlFor={`nota-${slug}`} className="aval__nome">
              {unidades[slug].nome}
            </label>
            <input
              id={`nota-${slug}`}
              className="aval__campo"
              inputMode="decimal"
              maxLength={3}
              value={campos[slug] ?? ""}
              onChange={(e) => setCampos((c) => ({ ...c, [slug]: e.target.value }))}
              disabled={carregando || ocupada !== null}
            />
            <button
              type="button"
              className="admin__aba"
              onClick={() => salvar(slug)}
              disabled={carregando || ocupada !== null}
            >
              {ocupada === slug ? "Salvando…" : "Salvar"}
            </button>
            {aviso[slug]?.texto && (
              <span
                className={aviso[slug].tipo === "ok" ? "cancel__msg" : "cancel__msg cancel__msg--erro"}
                role={aviso[slug].tipo === "ok" ? "status" : "alert"}
              >
                {aviso[slug].texto}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default PainelAvaliacoes;
