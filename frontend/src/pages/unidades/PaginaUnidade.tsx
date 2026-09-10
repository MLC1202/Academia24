import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Car,
  Check,
  Clock,
  HandHeart,
  MapPin,
  Plus,
  ShoppingBag,
  Star,
} from './icons';
import type { UnidadeData } from './tipos';
import ContatoUnidade from '../../components/ContatoUnidade';
import type { Interesse } from '../../lib/lead';
import type { UnidadeSlug } from '../../unidades';
import './PaginaUnidade.css';

/* ---------- primitivos ---------- */

function Kicker({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={light ? 'un-kicker un-kicker--light' : 'un-kicker'}>
      <span className="un-kicker__dot" />
      <span>{children}</span>
    </div>
  );
}

function Cta({
  href,
  onClick,
  children,
  variant = 'solid',
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: 'solid' | 'outline' | 'light' | 'paper';
}) {
  const classe = `un-cta un-cta--${variant}`;

  // sem href, o CTA abre o modal de contato
  if (onClick) {
    return (
      <button type="button" className={classe} onClick={onClick}>
        <span>{children}</span>
        <ArrowRight className="un-cta__arrow" />
      </button>
    );
  }

  const external = href?.startsWith('http');
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={classe}
    >
      <span>{children}</span>
      <ArrowRight className="un-cta__arrow" />
    </a>
  );
}

/* ---------- seções ---------- */

type AbrirContato = (interesse: Interesse | null) => void;

function Hero({
  unidade,
  abrir,
}: {
  unidade: UnidadeData;
  abrir: AbrirContato;
}) {
  return (
    <section className="un-hero" id="topo">
      <img
        className="un-hero__bg"
        src={unidade.images.hero}
        alt={`Interior da academia ${unidade.brand} ${unidade.unitName}`}
      />
      <div className="un-hero__scrim" />

      <div className="un-hero__inner">
        <Kicker>{unidade.hero.eyebrow}</Kicker>
        <h1 className="un-hero__title un-display">
          {unidade.hero.titleLead}{' '}
          <span className="un-hero__title-accent">{unidade.hero.titleAccent}</span>
        </h1>
        <p className="un-hero__subtitle">{unidade.hero.subtitle}</p>

        <div className="un-hero__actions">
          <Cta onClick={() => abrir('planos')}>Quero conhecer os planos</Cta>
          <Cta href="#experiencia" variant="light">
            Conhecer a unidade
          </Cta>
        </div>

        <p className="un-hero__note">
          Atendimento rápido pelo WhatsApp · Sem compromisso
        </p>
      </div>

      <div className="un-hero__stats">
        {unidade.quickStats.map((stat) => (
          <div key={stat} className="un-hero__stat">
            <p>{stat}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Experience({ unidade }: { unidade: UnidadeData }) {
  const { experience } = unidade;
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows]);

  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    const step = first ? first.offsetWidth + 16 : el.clientWidth;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  return (
    <section className="un-section un-section--cream" id="experiencia">
      <div className="un-wrap">
        <div className="un-head">
          <div className="un-head__main">
            <Kicker>{experience.kicker}</Kicker>
            <h2 className="un-h2 un-display">{experience.title}</h2>
          </div>
          <p className="un-head__aside">{experience.description}</p>
        </div>

        <div className="un-carousel__bar">
          <span className="un-carousel__hint">
            Arraste ou navegue para ver mais
          </span>
          <div className="un-carousel__nav">
            <button
              type="button"
              onClick={() => scrollByPage(-1)}
              disabled={!canPrev}
              aria-label="Anterior"
              className="un-carousel__btn"
            >
              <ArrowLeft className="un-icon" />
            </button>
            <button
              type="button"
              onClick={() => scrollByPage(1)}
              disabled={!canNext}
              aria-label="Próximo"
              className="un-carousel__btn"
            >
              <ArrowRight className="un-icon" />
            </button>
          </div>
        </div>

        <div className="un-carousel__track" ref={trackRef}>
          {experience.features.map((f) => (
            <article key={f.title} className="un-feature">
              <span className="un-tag">{f.tag}</span>
              <h3 className="un-feature__title">{f.title}</h3>
              <p className="un-feature__text">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Structure({
  unidade,
  abrir,
}: {
  unidade: UnidadeData;
  abrir: AbrirContato;
}) {
  const { structure } = unidade;
  return (
    <section className="un-section un-section--ink" id="estrutura">
      <div className="un-wrap un-structure">
        <div className="un-structure__media">
          <div className="un-structure__frame">
            <img
              src={unidade.images.structure}
              alt={`Área de musculação da unidade ${unidade.unitName}`}
            />
          </div>
          <div className="un-structure__badge">
            <p className="un-display un-structure__badge-value">
              {unidade.structureBadge.value}
            </p>
            <p className="un-structure__badge-label">
              {unidade.structureBadge.label}
            </p>
          </div>
        </div>

        <div className="un-structure__body">
          <Kicker light>{structure.kicker}</Kicker>
          <h2 className="un-h2 un-display">{structure.title}</h2>
          <p className="un-lead un-lead--light">{structure.description}</p>

          <ul className="un-bullets">
            {structure.bullets.map((b) => (
              <li key={b}>
                <span className="un-bullets__mark">
                  <Check className="un-icon un-icon--sm" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="un-actions">
            <Cta onClick={() => abrir('aula')} variant="light">
              Quero conhecer a estrutura
            </Cta>
          </div>
        </div>
      </div>
    </section>
  );
}

const convenienceIcons = [ShoppingBag, HandHeart, Car];

function Convenience({ unidade }: { unidade: UnidadeData }) {
  const { convenience } = unidade;
  return (
    <section className="un-section un-section--offwhite">
      <div className="un-wrap un-split">
        <div className="un-split__left">
          <Kicker>{convenience.kicker}</Kicker>
          <h2 className="un-h2 un-display">{convenience.title}</h2>
          <p className="un-lead">{convenience.description}</p>
        </div>

        <div className="un-split__right un-conv">
          {convenience.items.map((item, i) => {
            const Icon = convenienceIcons[i % convenienceIcons.length];
            return (
              <article key={item.title} className="un-conv__card">
                <span className="un-conv__icon">
                  <Icon className="un-icon" />
                </span>
                <div>
                  <span className="un-tag">{item.tag}</span>
                  <h3 className="un-conv__title">{item.title}</h3>
                  <p className="un-conv__text">{item.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Trial({
  unidade,
  abrir,
}: {
  unidade: UnidadeData;
  abrir: AbrirContato;
}) {
  const { trial } = unidade;
  return (
    <section className="un-section un-section--cream un-section--tight">
      <div className="un-wrap">
        <div className="un-trial">
          <div className="un-trial__body">
            <Kicker light>{trial.kicker}</Kicker>
            <h2 className="un-h2 un-display">{trial.title}</h2>
            <p className="un-trial__text">{trial.description}</p>
            <div className="un-actions">
              <Cta onClick={() => abrir('aula')} variant="paper">
                Agendar aula experimental
              </Cta>
            </div>
          </div>

          <div className="un-trial__aside">
            <span className="un-trial__label">Aula</span>
            <span className="un-trial__number un-display">01</span>
            <span className="un-trial__caption">Experimental gratuita</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ unidade }: { unidade: UnidadeData }) {
  const { testimonials } = unidade;
  return (
    <section className="un-section un-section--offwhite">
      <div className="un-wrap">
        <div className="un-intro">
          <Kicker>{testimonials.kicker}</Kicker>
          <h2 className="un-h2 un-display">{testimonials.title}</h2>
          <p className="un-lead">{testimonials.intro}</p>
        </div>

        <div className="un-quotes">
          {testimonials.items.map((t, i) => (
            <figure key={i} className="un-quote">
              <div className="un-quote__stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="un-icon un-icon--sm" />
                ))}
              </div>
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>
                {t.name} · {t.source}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Campaign({
  unidade,
  abrir,
}: {
  unidade: UnidadeData;
  abrir: AbrirContato;
}) {
  const { campaign } = unidade;
  return (
    <section className="un-section un-section--ink">
      <div className="un-wrap un-campaign">
        <div>
          <Kicker light>{campaign.kicker}</Kicker>
          <h2 className="un-h2 un-display">{campaign.title}</h2>
          <p className="un-lead un-lead--light">{campaign.description}</p>
        </div>

        <div className="un-offer">
          <span className="un-offer__tag">{campaign.offerTag}</span>
          <h3 className="un-offer__title un-display">{campaign.offerTitle}</h3>
          <p className="un-offer__text">{campaign.offerDescription}</p>
          <div className="un-actions">
            <Cta onClick={() => abrir('planos')}>Quero receber os valores</Cta>
          </div>
          <p className="un-offer__note">Resposta rápida pelo WhatsApp</p>
        </div>
      </div>
    </section>
  );
}

function Location({ unidade }: { unidade: UnidadeData }) {
  const { location } = unidade;
  return (
    <section className="un-section un-section--cream" id="localizacao">
      <div className="un-wrap un-local">
        <div>
          <Kicker>{location.kicker}</Kicker>
          <h2 className="un-h2 un-display">{location.title}</h2>

          <div className="un-local__address">
            <MapPin className="un-icon un-icon--red" />
            <div>
              {location.address.map((line, i) => (
                <p
                  key={i}
                  className={i === 0 ? 'un-local__street' : 'un-local__city'}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="un-actions">
            <Cta href={unidade.mapsUrl} variant="outline">
              Abrir no Google Maps
            </Cta>
          </div>
        </div>

        <div className="un-hours">
          <div className="un-hours__head">
            <Clock className="un-icon un-icon--red" />
            <span>Horários</span>
          </div>
          <dl className="un-hours__list">
            {location.schedule.map((s) => (
              <div key={s.label} className="un-hours__row">
                <dt>{s.label}</dt>
                <dd>{s.hours}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function Faq({ unidade }: { unidade: UnidadeData }) {
  const { faq } = unidade;
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="un-section un-section--offwhite" id="duvidas">
      <div className="un-wrap un-faq">
        <div className="un-faq__head">
          <Kicker>Dúvidas frequentes</Kicker>
          <h2 className="un-h2 un-display">{faq.title}</h2>
        </div>

        <ul className="un-faq__list">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={i} className="un-faq__item">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="un-faq__trigger"
                >
                  <span className="un-faq__question">{item.question}</span>
                  <Plus
                    className={
                      isOpen
                        ? 'un-icon un-icon--red un-faq__plus un-faq__plus--open'
                        : 'un-icon un-icon--red un-faq__plus'
                    }
                  />
                </button>
                <div
                  className={
                    isOpen ? 'un-faq__panel un-faq__panel--open' : 'un-faq__panel'
                  }
                >
                  <p>{item.answer}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FinalCta({
  unidade,
  abrir,
}: {
  unidade: UnidadeData;
  abrir: AbrirContato;
}) {
  return (
    <section className="un-final">
      <img className="un-final__bg" src={unidade.images.ambiance} alt="" aria-hidden />
      <div className="un-final__scrim" />
      <div className="un-wrap un-final__inner">
        <Kicker light>Seu próximo passo</Kicker>
        <h2 className="un-final__title un-display">
          Fale com a Unidade {unidade.unitName}.
        </h2>
        <p className="un-final__text">{unidade.whatsappMessage}</p>
        <div className="un-actions">
          <Cta onClick={() => abrir(null)}>Chamar no WhatsApp</Cta>
        </div>
      </div>
    </section>
  );
}

function UnitFooter({ unidade }: { unidade: UnidadeData }) {
  return (
    <footer className="un-footer">
      <div className="un-wrap un-footer__inner">
        <div className="un-footer__brand">
          <span className="un-display un-footer__number">24</span>
          <span className="un-footer__name">
            {unidade.brand}
            <span className="un-footer__unit"> · {unidade.unitName}</span>
          </span>
        </div>
        <p className="un-footer__disclaimer">{unidade.disclaimer}</p>
      </div>
    </footer>
  );
}

/* ---------- página completa da unidade ---------- */

function PaginaUnidade({ unidade }: { unidade: UnidadeData }) {
  // null = modal fechado. O interesse vem do botao que abriu.
  const [contato, setContato] = useState<{ interesse: Interesse | null } | null>(
    null,
  );

  const abrir: AbrirContato = (interesse) => setContato({ interesse });

  return (
    <>
      <div className="snap-container un-page">
        <Hero unidade={unidade} abrir={abrir} />
        <Experience unidade={unidade} />
        <Structure unidade={unidade} abrir={abrir} />
        <Convenience unidade={unidade} />
        <Trial unidade={unidade} abrir={abrir} />
        <Testimonials unidade={unidade} />
        <Campaign unidade={unidade} abrir={abrir} />
        <Location unidade={unidade} />
        <Faq unidade={unidade} />
        <FinalCta unidade={unidade} abrir={abrir} />
        <UnitFooter unidade={unidade} />
      </div>

      {contato && (
        <ContatoUnidade
          unidade={unidade.slug as UnidadeSlug}
          interesseInicial={contato.interesse}
          onFechar={() => setContato(null)}
        />
      )}
    </>
  );
}

export default PaginaUnidade;
