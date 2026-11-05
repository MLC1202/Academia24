// Aba "Grade de aulas" do dashboard (/admin/dashboard?aba=grade).
// As aulas vem do Pacto (o site as busca sozinho a cada 10 min). Aqui a dona
// forca a atualizacao na hora e cancela aulas por data.
//
// O topo (e-mail, sair) fica no DashboardPage.

import { useState } from "react";
import { ErroApi, SEM_API } from "../../lib/api";
import { slugsUnidades, unidades, type UnidadeSlug } from "../../data/unidades";
import { atualizarGradeDoPacto } from "../../lib/grade-store";
import CancelarAulas from "./CancelarAulas";
import "./DashboardPage.css";

type Props = {
  aoExpirar: () => void;
};

function mensagemDeErro(err: unknown): string {
  if (err instanceof ErroApi) {
    if (err.detalhe) return err.detalhe;
    if (err.codigo === "muitas_tentativas") return "Muitas atualizações seguidas. Espere alguns minutos.";
    if (err.codigo === "sem_conexao") return "Sem conexão com o servidor. Tente de novo.";
  }
  return "Não foi possível atualizar. O site continua com a grade anterior.";
}

function PainelGrade({ aoExpirar }: Props) {
  const [unidade, setUnidade] = useState<UnidadeSlug>("alphaville");
  const [atualizando, setAtualizando] = useState(false);
  const [resultado, setResultado] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  // Muda a cada atualizacao: o CancelarAulas recarrega a lista de aulas.
  const [versao, setVersao] = useState(0);

  async function atualizar() {
    setAtualizando(true);
    setResultado(null);
    try {
      await atualizarGradeDoPacto();
      setVersao((n) => n + 1);
      setResultado({ tipo: "ok", texto: "Grade atualizada. O site já mostra as aulas do Pacto." });
    } catch (err) {
      if (err instanceof ErroApi && err.codigo === "nao_autenticado") return aoExpirar();
      setResultado({ tipo: "erro", texto: mensagemDeErro(err) });
    } finally {
      setAtualizando(false);
    }
  }

  // Fragmento: os blocos ficam direto dentro do .admin do DashboardPage
  // (o CSS centraliza os filhos diretos).
  return (
    <>
      <p className="admin__aviso">
        As aulas vêm do <strong>Pacto</strong>. Depois de mudar lá, o site atualiza sozinho em até
        10 minutos. Se não quiser esperar, clique em <strong>Atualizar agora</strong>.
      </p>

      <section className="admin__bloco">
        <h2 className="admin__bloco-titulo">Atualizar a grade</h2>
        <button
          type="button"
          className="admin__salvar"
          disabled={atualizando || SEM_API}
          onClick={atualizar}
        >
          {atualizando ? "Atualizando…" : "Atualizar agora"}
        </button>
        {SEM_API && <p className="admin__estado">Prévia: sem servidor, não é possível atualizar.</p>}
        {resultado && (
          <p
            className={resultado.tipo === "ok" ? "admin__estado admin__estado-salvo" : "admin__estado admin__estado-erro"}
            role={resultado.tipo === "erro" ? "alert" : "status"}
          >
            {resultado.texto}
          </p>
        )}
      </section>

      <section className="admin__bloco">
        <h2 className="admin__bloco-titulo">Unidade</h2>
        <div className="admin__abas">
          {slugsUnidades.map((slug) => (
            <button
              key={slug}
              type="button"
              className={slug === unidade ? "admin__aba admin__aba--ativa" : "admin__aba"}
              onClick={() => setUnidade(slug)}
            >
              {unidades[slug].nome}
            </button>
          ))}
        </div>
      </section>

      <CancelarAulas
        key={unidade}
        unidade={unidade}
        chave={versao}
        desativado={SEM_API}
        aoExpirar={aoExpirar}
      />
    </>
  );
}

export default PainelGrade;
