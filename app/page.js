"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const ateliers = [
  {
    title: "Arts plastiques & DIY",
    text: "Peinture, collage, exploration des matières et petites créations à assembler.",
    icon: "palette",
    color: "red",
  },
  {
    title: "Potager",
    text: "Semis, récolte et découverte du cycle des plantes dans le jardin de Bab Rayan.",
    icon: "leaf",
    color: "green",
  },
  {
    title: "Poterie",
    text: "Modelage à la main et initiation au tournage sous la supervision de nos artisans.",
    icon: "pot",
    color: "cream",
  },
  {
    title: "Pâtisserie",
    text: "Recette simple préparée et dégustée sur place, encadrée par le CFI.",
    icon: "cake",
    color: "gold",
    tag: "12 enfants maximum",
  },
];

const formulas = [
  {
    age: "4 - 8 ans",
    name: "Parcours Découverte",
    subtitle: "2 ateliers au choix parmi 4, 1h chacun",
    price: "120",
    accent: "dark",
    points: [
      "L'école choisit 2 ateliers parmi les 4 univers",
      "Format court, adapté au rythme des plus jeunes",
      "Encadrement dédié et transitions incluses",
    ],
  },
  {
    age: "8 - 10 ans",
    name: "Parcours Immersion",
    subtitle: "1 atelier approfondi au choix, 1h30",
    price: "140",
    accent: "red",
    points: [
      "Un atelier plus élaboré, techniques approfondies",
      "Format long pour aller au bout d'une réalisation",
      "Groupes encadrés par nos artisans confirmés",
    ],
  },
];

const galleryImages = [
  {
    src: "/images/kids-workshop-1.png",
    alt: "Enfants de l'École Palmier pendant un atelier peinture",
  },
  {
    src: "/images/kids-workshop-2.png",
    alt: "Enfant accompagné par une encadrante pendant un atelier créatif",
  },
  {
    src: "/images/kids-workshop-3.png",
    alt: "Enfant souriant pendant une activité peinture",
  },
];

function maxAteliersFor(formule) {
  if (formule.includes("Immersion")) return 1;
  if (formule.includes("Découverte")) return 2;
  return 4;
}

function getTodayDateValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function AtelierIcon({ type }) {
  if (type === "leaf") {
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <path d="M40 12v28" />
        <path d="M22 50c10-25 31-25 36 0" />
        <path d="M40 41c-12-12-24-8-28 5 13 4 24 0 28-5Z" />
        <circle cx="40" cy="15" r="6" />
      </svg>
    );
  }

  if (type === "pot") {
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <path d="M23 30h34l-5 32H28L23 30Z" />
        <path d="M26 30c2-9 8-14 14-14s12 5 14 14" />
        <path d="M28 48h24" />
      </svg>
    );
  }

  if (type === "cake") {
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <path d="M20 47c7-18 33-18 40 0v15H20V47Z" />
        <path d="M25 47c4 5 9 5 13 0 4 5 9 5 13 0 3 4 6 5 9 3" />
        <circle cx="31" cy="30" r="4" />
        <circle cx="49" cy="30" r="4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true">
      <rect x="17" y="20" width="20" height="17" rx="3" />
      <rect x="42" y="28" width="20" height="17" rx="3" transform="rotate(-8 52 36)" />
      <circle cx="28" cy="57" r="8" />
      <path d="m49 49 8 13H41l8-13Z" />
    </svg>
  );
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formule, setFormule] = useState("Parcours Découverte (4-8 ans)");
  const [selectedAteliers, setSelectedAteliers] = useState([]);

  const maxAteliers = useMemo(() => maxAteliersFor(formule), [formule]);
  const todayDate = useMemo(() => getTodayDateValue(), []);

  function toggleAtelier(value) {
    setSelectedAteliers((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      if (current.length >= maxAteliers) {
        return current;
      }

      return [...current, value];
    });
  }

  function handleFormulaChange(event) {
    const nextFormula = event.target.value;
    const nextMax = maxAteliersFor(nextFormula);
    setFormule(nextFormula);
    setSelectedAteliers((current) => current.slice(0, nextMax));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    const formData = new FormData(form);
    const payload = {
      school: formData.get("school"),
      contactName: formData.get("contactName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      formule,
      childrenCount: formData.get("childrenCount"),
      requestedDate: formData.get("requestedDate"),
      pauseGourmande: formData.get("pauseGourmande"),
      ateliers: selectedAteliers,
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Impossible d'envoyer la demande.");
      }

      form.reset();
      setFormule("Parcours Découverte (4-8 ans)");
      setSelectedAteliers([]);
      setModalOpen(false);
      setStatus({
        type: "success",
        message: "Merci, votre demande a bien été envoyée. Nous vous répondrons rapidement.",
      });
      setNotification({
        type: "success",
        message: "Votre demande a bien été envoyée. L'équipe Bab Rayan vous répondra rapidement.",
      });
      window.setTimeout(() => {
        setNotification({ type: "", message: "" });
      }, 6000);
    } catch (error) {
      const message =
        error.message ||
        "La demande n'a pas pu être envoyée. Vérifiez la configuration email puis réessayez.";

      setStatus({
        type: "error",
        message,
      });
      setNotification({
        type: "error",
        message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Bab Rayan accueil">
          <Image src="/images/bab-rayan-logo.png" alt="Logo Bab Rayan" width={72} height={72} priority />
          <span>
            <strong>Bab Rayan</strong>
            <small>Sorties pédagogiques solidaires</small>
          </span>
        </a>

        <nav aria-label="Navigation principale">
          <a href="#ateliers">Ateliers</a>
          <a href="#formules">Formules</a>
          <a href="#impact">Impact</a>
          <a href="#contact">Contact</a>
        </nav>

        <button className="header-cta" type="button" onClick={() => setModalOpen(true)}>
          Réserver
        </button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">Écoles internationales · Casablanca</span>
            <h1>
              Une sortie créative qui finance le foyer et <span>l'École Palmier.</span>
            </h1>
            <p>
              Vos élèves vivent une matinée d'ateliers à Bab Rayan pendant que leur venue contribue
              directement à l'autofinancement de l'association, du foyer et de l'École Palmier.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>
                Demander une réservation
              </button>
              <a className="btn btn-secondary" href="#impact">
                Découvrir l'impact
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Photos des ateliers Bab Rayan">
            <div className="photo-card photo-main">
              <Image src="/images/kids-workshop-1.png" alt={galleryImages[0].alt} fill sizes="(max-width: 900px) 92vw, 45vw" priority />
            </div>
            <div className="floating-card logo-card">
              <Image src="/images/bab-rayan-logo.png" alt="Logo Bab Rayan" width={88} height={88} />
              <span>Reconnue d'Utilité Publique</span>
            </div>
            <div className="floating-card palmier-card">
              <Image src="/images/ecole-palmier-logo-clean.png" alt="Logo École Palmier" width={82} height={82} />
              <span>École Palmier</span>
            </div>
          </div>
        </section>

        <section className="intro-section">
          <div className="section-heading">
            <span className="eyebrow">Le concept</span>
            <h2>Bab Rayan, une association en trois volets.</h2>
          </div>
          <p>
          Bab Rayan est une association qui réunit un foyer d'enfants, l'École Palmier qui les scolarise — et qui accueille aussi des enfants de mères célibataires en situation de précarité — ainsi que le CFI, son centre de formation et d'insertion.
          
          Pour financer cet ensemble, Bab Rayan ouvre ses ateliers aux classes des écoles internationales le temps d'une sortie encadrée. Chaque réservation contribue directement à l'autofinancement de l'association.
          </p>
        </section>

        <section className="gallery-section" aria-label="Galerie des enfants en atelier">
          {galleryImages.map((image, index) => (
            <div className={`gallery-item gallery-${index + 1}`} key={image.src}>
              <Image src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 92vw, 31vw" />
            </div>
          ))}
        </section>

        <section className="section" id="ateliers">
          <div className="section-heading">
            <span className="eyebrow">Les ateliers</span>
            <h2>Quatre univers pour apprendre avec les mains.</h2>
            <p>Chaque atelier est encadré par un artisan, une formatrice ou un membre de l'association.</p>
          </div>

          <div className="atelier-grid">
            {ateliers.map((atelier) => (
              <article className={`atelier-card ${atelier.color}`} key={atelier.title}>
                <div className="atelier-icon">
                  <AtelierIcon type={atelier.icon} />
                </div>
                <h3>{atelier.title}</h3>
                <p>{atelier.text}</p>
                {atelier.tag ? <span>{atelier.tag}</span> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="section formulas-section" id="formules">
          <div className="section-heading">
            <span className="eyebrow">Formules & tarifs</span>
            <h2>Deux parcours selon l'âge du groupe.</h2>
            <p>Tarif par enfant, groupe scolaire. Les créneaux peuvent être adaptés sur demande.</p>
          </div>

          <div className="formula-grid">
            {formulas.map((item) => (
              <article className={`formula-card ${item.accent}`} key={item.name}>
                <span className="formula-age">{item.age}</span>
                <h3>{item.name}</h3>
                <p>{item.subtitle}</p>
                <div className="price">
                  <strong>{item.price}</strong>
                  <span>MAD / enfant</span>
                </div>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="snack-card">
            <div>
              <span>Option</span>
              <h3>Pause Gourmande</h3>
              <p>
                Eau, jus et préparations maison réalisées par les stagiaires du CFI de Bab Rayan.
              </p>
            </div>
            <strong>+ 30 MAD</strong>
          </div>
        </section>

        <section className="impact-section" id="impact">
          <div className="section-heading light">
            <span className="eyebrow">Impact & RSE</span>
            <h2>Votre sortie finance une mission sociale durable.</h2>
            <p>
              Chaque réservation aide l'association à financer le foyer et l'École Palmier, qui
              scolarise les enfants du foyer ainsi que des enfants de mères célibataires en situation
              de précarité.
            </p>
          </div>

          <div className="impact-grid">
            <article>
              <span>Le foyer</span>
              <h3>Un lieu de vie pour les enfants accueillis par Bab Rayan.</h3>
              <p>Les revenus des ateliers participent au fonctionnement quotidien du foyer.</p>
            </article>
            <article className="palmier-impact">
              <div style={{ display: 'flex', justifyContent: 'center'}}>
                <Image
                  src="/images/ecole-palmier-logo-clean.png"
                  className=""
                  alt="Logo École Palmier"
                  width={94}
                  height={94}
                />
              </div>
              <center><span>L'École Palmier</span></center>
              <h3>Une scolarité pour les enfants accompagnés par l'association.</h3>
              <p>Le logo vert signale les contenus liés à l'École Palmier et à son action éducative.</p>
        
            </article>
            <article>
              <span>Le CFI</span>
              <h3>Formation, insertion et savoir-faire transmis aux élèves.</h3>
              <p>Les ateliers mettent en valeur les compétences des artisans et stagiaires du CFI.</p>
            </article>
          </div>
        </section>

        <section className="section practical-section" id="contact">
          <div className="section-heading">
            <span className="eyebrow">Infos pratiques</span>
            <h2>Organiser la sortie de votre classe.</h2>
          </div>

          <div className="practical-grid">
            <div>
              <span>Découverte</span>
              <strong>1h, 2 ateliers</strong>
            </div>
            <div>
              <span>Immersion</span>
              <strong>1h30, 1 atelier</strong>
            </div>
            <div>
              <span>Pâtisserie</span>
              <strong>12 enfants / session</strong>
            </div>
            <div>
              <span>Créneaux</span>
              <strong>Sur demande</strong>
            </div>
          </div>

          <div className="final-cta">
            <h2>Parlons effectif, dates et ateliers.</h2>
            <p>Remplissez le formulaire, l'équipe Bab Rayan vous recontacte pour confirmer le programme.</p>
            <button className="btn btn-primary" type="button" onClick={() => setModalOpen(true)}>
              Ouvrir le formulaire
            </button>
          </div>
        </section>
      </main>

      <footer>
        <span>Bab Rayan - Association & école</span>
        <span>Un modèle autofinancé au service du foyer et de l'École Palmier</span>
      </footer>

      {notification.message ? (
        <div className={`toast ${notification.type}`} role="status" aria-live="polite">
          <strong>{notification.type === "success" ? "Demande envoyée" : "Envoi impossible"}</strong>
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification({ type: "", message: "" })} aria-label="Fermer la notification">
            ×
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setModalOpen(false)} aria-label="Fermer le formulaire">
              ×
            </button>
            <div className="form-heading">
              <span className="eyebrow">Réservation</span>
              <h2 id="booking-title">Réserver une sortie pour votre classe</h2>
              <p>Aucun paiement n'est demandé à ce stade. Nous confirmons la date et le programme par email.</p>
            </div>

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  École / établissement
                  <input name="school" type="text" required />
                </label>
                <label>
                  Nom du contact
                  <input name="contactName" type="text" required />
                </label>
                <label>
                  Email
                  <input name="email" type="email" required />
                </label>
                <label>
                  Téléphone
                  <input name="phone" type="tel" />
                </label>
                <label>
                  Formule souhaitée
                  <select name="formule" value={formule} onChange={handleFormulaChange}>
                    <option value="Parcours Découverte (4-8 ans)">Parcours Découverte - 4 à 8 ans</option>
                    <option value="Parcours Immersion (8-10 ans)">Parcours Immersion - 8 à 10 ans</option>
                    <option value="Prestation sur mesure">Prestation sur mesure</option>
                  </select>
                </label>
                <label>
                  Nombre d'enfants
                  <input name="childrenCount" type="number" min="1" />
                </label>
                <label>
                  Date souhaitée
                  <input name="requestedDate" type="date" min={todayDate} />
                </label>
                <label>
                  Pause Gourmande
                  <select name="pauseGourmande" defaultValue="Non">
                    <option value="Non">Non</option>
                    <option value="Oui">Oui, ajouter la Pause Gourmande</option>
                  </select>
                </label>
              </div>

              <fieldset>
                <legend>
                  Ateliers souhaités <small>({maxAteliers} maximum pour cette formule)</small>
                </legend>
                <div className="checkbox-grid">
                  {ateliers.map((atelier) => {
                    const checked = selectedAteliers.includes(atelier.title);
                    const disabled = !checked && selectedAteliers.length >= maxAteliers;

                    return (
                      <label className={disabled ? "disabled" : ""} key={atelier.title}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleAtelier(atelier.title)}
                        />
                        {atelier.title}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <label className="full-field">
                Message (optionnel)
                <textarea
                  name="message"
                  rows="4"
                  placeholder="Précisions sur votre groupe, contraintes horaires, accessibilité..."
                />
              </label>

              <button className="btn btn-primary submit-btn" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Envoi en cours..." : "Envoyer la demande"}
              </button>

              {status.message ? <p className={`form-status ${status.type}`}>{status.message}</p> : null}
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
