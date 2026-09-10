// Primeira dobra da home: video de fundo, titulo, os dois botoes e os numeros.
//
// O VIDEO DE FUNDO:
// arquivo fixo em frontend/public/hero.mp4 (+ hero-poster.jpg, o primeiro
// quadro, que aparece enquanto o video carrega). Pra trocar eu apago os dois
// e ponho os novos COM O MESMO NOME — aqui no codigo nao mexo em nada.
//
// Especificacao do arquivo:
//   - MP4 (H.264) horizontal, 16:9, 1920x1080 ou 1600x900
//   - 8 a 15 segundos, cortado pra emendar bem no loop
//   - SEM audio (o autoplay so funciona no mudo)
//   - ate uns 5 MB, senao a home demora pra abrir no celular
//   - imagem sem texto no meio, que o titulo fica por cima
// O que esta la agora e provisorio, feito a partir da foto da unidade.

import "./Hero.css";

function Hero() {
  return (
    <section className="hero snap-section" id="hero">
      {/* Mudo e com playsInline, senao o iPhone abre em tela cheia sozinho.
          Se o mp4 faltar, sobra o poster e depois a foto de fundo do CSS. */}
      <video
        className="hero__video"
        src="/hero.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      />

      {/* Escurece o video pro texto branco continuar legivel. */}
      <div className="hero__veu" aria-hidden="true" />

      <div className="hero__content">
        <div className="hero__location">SÃO PAULO · ALPHAVILLE · CAMPINAS</div>
        <h1 className="hero__title">
          Seu bem-estar.
          <br />
          <span className="hero__title-accent">Seu ritmo. Sua 24.</span>
        </h1>
        <p className="hero__subtitle">
          Quatro unidades completas, cada uma com personalidade própria e o
          mesmo compromisso: oferecer estrutura, acolhimento e condições reais
          para você evoluir.
        </p>
        <div className="hero__actions">
          <a href="#agendar" className="hero__btn-primary">
            Agendar aula experimental
          </a>
          <a href="#unidades" className="hero__btn-secondary">
            Escolher minha unidade
          </a>
        </div>
      </div>

      <div className="hero__stats">
        <div className="hero__stat">
          <span className="hero__stat-number">04</span>
          <span className="hero__stat-label">Unidades</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-number">02</span>
          <span className="hero__stat-label">Cidades</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-number">01</span>
          <span className="hero__stat-label">Comunidade</span>
        </div>
      </div>
    </section>
  );
}

export default Hero;