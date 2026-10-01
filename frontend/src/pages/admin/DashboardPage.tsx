// Dashboard (/admin/dashboard). So abre logado (o App envolve esta pagina
// no RotaAdmin).
//
// Ao abrir mostra dois botoes grandes: "Grade de aulas" e "Leads". Cada um
// abre o seu painel:
//   /admin/dashboard            -> inicio (os dois botoes)
//   /admin/dashboard?aba=grade  -> PainelGrade (editor da grade, como antes)
//   /admin/dashboard?aba=leads  -> PainelLeads (pedidos de aula experimental)
// A aba fica no endereco, entao o "voltar" do navegador funciona.
//
// O topo (e-mail, ver o site, sair) e o mesmo pros dois paineis.

import { useCallback, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { sair, SEM_API } from "../../lib/api";
import PainelGrade from "./PainelGrade";
import PainelLeads from "./PainelLeads";
import "./DashboardPage.css";
import { SEO } from "../../data/seo";
import { useSeo } from "../../lib/useSeo";

type Aba = "grade" | "leads";

const titulos: Record<Aba, string> = {
  grade: "Grade de aulas",
  leads: "Leads",
};

function DashboardPage({ email }: { email: string | null }) {
  useSeo(SEO.admin);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const valor = params.get("aba");
  const aba: Aba | null = valor === "grade" || valor === "leads" ? valor : null;

  // O PainelGrade avisa quando tem alteracao nao salva.
  const [gradeAlterada, setGradeAlterada] = useState(false);
  const [saindo, setSaindo] = useState(false);

  // Sessao venceu (30 min parado / 8 h): volta pro login.
  const sessaoExpirou = useCallback(() => {
    navigate("/admin/login", { replace: true, state: { expirou: true } });
  }, [navigate]);

  function podeSairDaGrade() {
    return (
      aba !== "grade" ||
      !gradeAlterada ||
      confirm("Você tem alterações não salvas na grade. Sair descarta essas alterações. Continuar?")
    );
  }

  function ir(destino: Aba | null) {
    if (destino === aba || !podeSairDaGrade()) return;
    setParams(destino ? { aba: destino } : {});
  }

  async function encerrar() {
    if (!podeSairDaGrade()) return;
    setSaindo(true);
    try {
      await sair();
    } catch {
      // Mesmo se a API falhar, a sessao expira sozinha em 30 min.
    }
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin">
      <header className="admin__topo">
        <div>
          <p className="admin__eyebrow">Área interna</p>
          <h1 className="admin__titulo">{aba ? titulos[aba] : "Painel"}</h1>
        </div>
        <div className="admin__conta">
          {email && <span className="admin__email">{email}</span>}
          <Link to="/" className="admin__voltar">
            ← Ver o site
          </Link>
          {!SEM_API && (
            <button type="button" className="admin__sair" onClick={encerrar} disabled={saindo}>
              {saindo ? "Saindo…" : "Sair"}
            </button>
          )}
        </div>
      </header>

      {aba === null ? (
        <nav className="painel__inicio" aria-label="O que você quer fazer?">
          <button type="button" className="painel__cartao" onClick={() => ir("grade")}>
            <span className="painel__cartao-titulo">Grade de aulas</span>
            <span className="painel__cartao-texto">
              Editar as aulas de cada unidade, importar a planilha e voltar para a versão
              anterior.
            </span>
            <span className="painel__cartao-ir">Abrir grade →</span>
          </button>
          <button type="button" className="painel__cartao" onClick={() => ir("leads")}>
            <span className="painel__cartao-titulo">Leads</span>
            <span className="painel__cartao-texto">
              Quem pediu aula experimental pelo site: contato, status e exclusão.
            </span>
            <span className="painel__cartao-ir">Abrir leads →</span>
          </button>
        </nav>
      ) : (
        <nav className="painel__troca" aria-label="Seções do painel">
          <button type="button" className="admin__aba" onClick={() => ir(null)}>
            ← Início
          </button>
          {(Object.keys(titulos) as Aba[]).map((a) => (
            <button
              key={a}
              type="button"
              className={a === aba ? "admin__aba admin__aba--ativa" : "admin__aba"}
              aria-current={a === aba ? "page" : undefined}
              onClick={() => ir(a)}
            >
              {titulos[a]}
            </button>
          ))}
        </nav>
      )}

      {aba === "grade" && <PainelGrade aoAlterar={setGradeAlterada} aoExpirar={sessaoExpirou} />}
      {aba === "leads" && <PainelLeads aoExpirar={sessaoExpirou} />}
    </div>
  );
}

export default DashboardPage;
