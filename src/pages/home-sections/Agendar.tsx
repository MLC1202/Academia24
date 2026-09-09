import "./Agendar.css";

function Agendar() {
  return (
    <section className="agendar snap-section" id="agendar">
      <div className="agendar__intro">
        <div className="agendar__eyebrow">CONHEÇA ANTES DE DECIDIR</div>
        <h2 className="agendar__title">
          Agende uma
          <br />
          aula
          <br />
          experimental.
        </h2>
        <p className="agendar__subtitle">
          Escolha a unidade, conte o que você busca e nossa equipe entra em
          contato para combinar o melhor dia e horário.
        </p>

        <ul className="agendar__checklist">
          <li>Sem compromisso</li>
          <li>Atendimento da unidade escolhida</li>
          <li>Visita guiada pela estrutura</li>
        </ul>
      </div>

      <form className="agendar__form" onSubmit={(e) => e.preventDefault()}>
        <div className="agendar__field">
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" type="text" placeholder="Como podemos chamar você?" />
        </div>

        <div className="agendar__field">
          <label htmlFor="whatsapp">WhatsApp</label>
          <input id="whatsapp" type="tel" placeholder="(DDD) 00000-0000" />
        </div>

        <div className="agendar__field">
          <label htmlFor="email">
            E-mail <span className="agendar__optional">(opcional)</span>
          </label>
          <input id="email" type="email" placeholder="voce@email.com" />
        </div>

        <div className="agendar__field">
          <label htmlFor="unidade">Unidade de interesse</label>
          <select id="unidade" defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="alphaville">24 Wellness — Alphaville</option>
            <option value="norte">24 Health Club — Norte</option>
            <option value="cambui">24 Health Club — Cambuí</option>
            <option value="lagoa">24 Health Club — Lagoa</option>
          </select>
        </div>

        <div className="agendar__field">
          <label htmlFor="objetivo">Principal objetivo</label>
          <select id="objetivo" defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="saude">Saúde e qualidade de vida</option>
            <option value="emagrecimento">Emagrecimento</option>
            <option value="massamuscular">Ganho de massa muscular</option>
            <option value="condicionamento">Condicionamento físico</option>
            <option value="retomar">Retomar a rotina de treinos</option>

          </select>
        </div>

        <div className="agendar__field">
          <label htmlFor="periodo">Melhor período</label>
          <select id="periodo" defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </select>
        </div>

        <label className="agendar__consent">
          <input type="checkbox" />
          <span>
            Autorizo o contato da equipe da Rede 24 sobre minha aula
            experimental e condições de matrícula.
          </span>
        </label>

        <button type="submit" className="agendar__submit">
          <span className="agendar__submit-eyebrow">QUERO AGENDAR</span>
          <span className="agendar__submit-title">MINHA AULA</span>
          <span className="agendar__submit-note">SEM COMPROMISSO →</span>
        </button>

        <p className="agendar__disclaimer">
          Seus dados serão utilizados somente para atendimento da sua
          solicitação.
        </p>
      </form>
    </section>
  );
}

export default Agendar;