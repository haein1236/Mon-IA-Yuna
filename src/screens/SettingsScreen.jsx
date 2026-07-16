import { useState } from "react";
import { useTheme, THEMES_DISPONIBLES } from "../context/ThemeContext";
import { FONDS_CHAT_DISPONIBLES } from "../services/parametres";
import { fichierVersBase64 } from "../services/images";
import { usePWAInstall } from "../hooks/usePWAInstall";

const IconCloche = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 3a5 5 0 0 0-5 5v3.5c0 1-0.4 2-1.2 2.7L5 15h14l-0.8-0.8A3.8 3.8 0 0 1 17 11.5V8a5 5 0 0 0-5-5z"
      fill="currentColor"
    />
    <path
      d="M9.5 18a2.5 2.5 0 0 0 5 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);
const IconCoche = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline
      points="20 6 9 17 4 12"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconPalette = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 3a9 9 0 1 0 0 18c1.1 0 2-0.9 2-2 0-0.5-0.2-1-0.5-1.4-0.3-0.3-0.5-0.8-0.5-1.3 0-1.1 0.9-2 2-2h2.3A4.2 4.2 0 0 0 21 10.2C21 6.2 16.9 3 12 3z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
    <circle cx="16" cy="10" r="1.2" fill="currentColor" />
  </svg>
);
const IconDownload = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      d="M12 3v12m0 0l-4-4m4 4l4-4"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline
      points="3 6 5 6 21 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M10 11v6M14 11v6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IconInfo = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <line
      x1="12"
      y1="11"
      x2="12"
      y2="16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
  </svg>
);
const IconChevron = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <polyline
      points="6 9 12 15 18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconTelephone = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="7"
      y="2"
      width="10"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <line
      x1="11"
      y1="18"
      x2="13"
      y2="18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
const IconImage = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="8.5" cy="9.5" r="1.8" fill="currentColor" />
    <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

function Interrupteur({ actif, onChange }) {
  return (
    <button
      onClick={() => onChange(!actif)}
      className={`relative rounded-full transition-colors duration-200 flex-shrink-0 ${actif ? "bg-espresso" : "bg-espresso/15"}`}
      style={{ width: "40px", height: "22px" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
        style={{ left: actif ? "20px" : "3px" }}
      />
    </button>
  );
}

function SectionParametre({ titre, description, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-espresso/10 mb-4">
      <h3 className="text-[13px] font-semibold text-espresso mb-0.5">
        {titre}
      </h3>
      {description && (
        <p className="text-[10.5px] text-espresso/45 mb-4">{description}</p>
      )}
      <div className={description ? "" : "mt-3"}>{children}</div>
    </div>
  );
}

const PERSONNALITES = [
  {
    id: "caline",
    emoji: "🤗",
    label: "Câline",
    desc: "Douce, pleine d'affection",
  },
  {
    id: "taquine",
    emoji: "😏",
    label: "Taquine",
    desc: "Espiègle, charrie gentiment",
  },
  {
    id: "motivante",
    emoji: "💪",
    label: "Motivante",
    desc: "Encourageante, pousse à avancer",
  },
  { id: "calme", emoji: "🌊", label: "Calme", desc: "Posée, à l'écoute" },
  {
    id: "encourageante",
    emoji: "🌸",
    label: "Encourageante",
    desc: "Patiente, plein d'emojis",
  },
  {
    id: "mysterieuse",
    emoji: "🌙",
    label: "Mystérieuse",
    desc: "Calme, poétique",
  },
  {
    id: "compagne",
    emoji: "❤️",
    label: "Compagne virtuelle",
    desc: "Chaleureuse, se souvient de toi",
  },
  {
    id: "girlbestie",
    emoji: "💖",
    label: "Girl Bestie",
    desc: "Crushs, sorties, potins",
  },
  {
    id: "fashion",
    emoji: "✨",
    label: "Fashionista",
    desc: "Mode, makeup, skincare",
  },
  {
    id: "romantique",
    emoji: "🌹",
    label: "Romantique",
    desc: "Amour, rendez-vous, douceur",
  },
  {
    id: "psy",
    emoji: "🧠",
    label: "Psychologue",
    desc: "Comprendre émotions et relations",
  },
  {
    id: "anime",
    emoji: "🌸",
    label: "Otaku",
    desc: "Animés, mangas, webtoons",
  },
  {
    id: "dev",
    emoji: "💻",
    label: "Développeuse",
    desc: "Code et informatique",
  },
  {
    id: "humoriste",
    emoji: "😂",
    label: "Humoriste",
    desc: "Toujours une blague prête",
  },
];

const VERSION_APP = "1.0.0";

function SettingsScreen({ onChangerEcran }) {
  const {
    parametres,
    choisirTheme,
    appliquerCouleursPersonnalisees,
    mettreAJourParametres,
  } = useTheme();
  const { installable, install, dejaInstalle, estIOS } = usePWAInstall();

  const [modePerso, setModePerso] = useState(
    !!parametres.couleursPersonnalisees,
  );
  const [themeOuvert, setThemeOuvert] = useState(false);

  const [couleursEnEdition, setCouleursEnEdition] = useState(() => {
    const base =
      parametres.couleursPersonnalisees ||
      THEMES_DISPONIBLES.find((t) => t.id === parametres.themeId).couleurs;
    return { ...base };
  });

  const [messageConfirmation, setMessageConfirmation] = useState(false);
  const afficherConfirmation = () => {
    setMessageConfirmation(true);
    setTimeout(() => setMessageConfirmation(false), 2000);
  };

  const validerCouleursPersonnalisees = () => {
    appliquerCouleursPersonnalisees(couleursEnEdition);
    afficherConfirmation();
  };

  // ============================================================
  // UPLOAD D'UN FOND D'ÉCRAN PERSONNALISÉ POUR LE CHAT
  // ============================================================
  const gererUploadFondEcran = async (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;
    const base64 = await fichierVersBase64(fichier);
    mettreAJourParametres({
      fondEcranChat: "personnalise",
      fondEcranChatPerso: base64,
    });
    afficherConfirmation();
  };

  const exporterMesDonnees = () => {
    const donnees = {};
    Object.keys(localStorage)
      .filter((cle) => cle.startsWith("yuna-"))
      .forEach((cle) => {
        try {
          donnees[cle] = JSON.parse(localStorage.getItem(cle));
        } catch {
          donnees[cle] = localStorage.getItem(cle);
        }
      });
    const blob = new Blob([JSON.stringify(donnees, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `yuna-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    lien.click();
    URL.revokeObjectURL(url);
  };

  const reinitialiserToutesLesDonnees = () => {
    const confirme = window.confirm(
      "Ceci supprimera définitivement tes conversations, ta galerie, ton profil et tes paramètres. Cette action est irréversible. Continuer ?",
    );
    if (!confirme) return;
    Object.keys(localStorage)
      .filter((cle) => cle.startsWith("yuna-"))
      .forEach((cle) => localStorage.removeItem(cle));
    window.location.reload();
  };

  return (
    <div className="h-full min-h-0 w-full flex flex-col overflow-hidden bg-[#F0EEEB]">
      <div className="flex items-center gap-3 px-4 md:px-7 py-4 md:py-6 flex-shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-espresso/8 flex-shrink-0">
          <IconCloche
            style={{ width: "15px", height: "15px" }}
            className="text-espresso"
          />
        </div>
        <div className="min-w-0">
          <h1
            className="text-espresso font-semibold truncate"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "19px",
            }}
          >
            Paramètres
          </h1>
          <p className="text-[10px] md:text-[10.5px] text-espresso/45">
            Personnalise Yuna à ton image
          </p>
        </div>

        {messageConfirmation && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-full flex-shrink-0">
            <IconCoche style={{ width: "11px", height: "11px" }} />
            <span className="hidden sm:inline">Enregistré</span>
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_300px] overflow-y-auto scroll-suave md:overflow-hidden">
        <div className="px-4 md:px-7 pb-7 md:overflow-y-auto md:scroll-suave md:min-h-0">
          <SectionParametre
            titre="Yuna & moi"
            description="Comment Yuna doit s'adresser à toi"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">
                  Comment Yuna doit t'appeler
                </label>
                <input
                  type="text"
                  value={parametres.surnom}
                  onChange={(e) =>
                    mettreAJourParametres({ surnom: e.target.value })
                  }
                  className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors duration-200"
                />
              </div>
              <div>
                <label className="text-[9px] text-espresso/40 uppercase tracking-wide">
                  Date d'anniversaire
                </label>
                <input
                  type="date"
                  value={parametres.dateAnniversaire}
                  onChange={(e) =>
                    mettreAJourParametres({ dateAnniversaire: e.target.value })
                  }
                  className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso transition-colors duration-200"
                />
              </div>
            </div>
          </SectionParametre>

          <SectionParametre titre="Messages spontanés">
            <div className="flex items-center justify-between mb-4">
              <div className="pr-3">
                <p className="text-[11.5px] text-espresso font-medium">
                  Autoriser Yuna à t'écrire seule
                </p>
                <p className="text-[10px] text-espresso/45">
                  Elle pourra t'envoyer des messages sans que tu lui parles
                  d'abord
                </p>
              </div>
              <Interrupteur
                actif={parametres.messagesActifs}
                onChange={(val) =>
                  mettreAJourParametres({ messagesActifs: val })
                }
              />
            </div>
            <div
              className={
                parametres.messagesActifs
                  ? ""
                  : "opacity-40 pointer-events-none"
              }
            >
              <label className="text-[9px] text-espresso/40 uppercase tracking-wide">
                Fréquence
              </label>
              <select
                value={parametres.frequence}
                onChange={(e) =>
                  mettreAJourParametres({ frequence: e.target.value })
                }
                className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 mb-3 outline-none border border-espresso/15 focus:border-espresso"
              >
                <option value="quotidien">Une fois par jour</option>
                <option value="deuxFoisParJour">Deux fois par jour</option>
                <option value="hebdomadaire">Une fois par semaine</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">
                    Pas avant
                  </label>
                  <input
                    type="time"
                    value={parametres.heureDebut}
                    onChange={(e) =>
                      mettreAJourParametres({ heureDebut: e.target.value })
                    }
                    className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-espresso/40 uppercase tracking-wide">
                    Pas après
                  </label>
                  <input
                    type="time"
                    value={parametres.heureFin}
                    onChange={(e) =>
                      mettreAJourParametres({ heureFin: e.target.value })
                    }
                    className="w-full bg-[#F0EEEB] rounded-xl px-3 py-2 text-[12px] text-espresso mt-1 outline-none border border-espresso/15 focus:border-espresso"
                  />
                </div>
              </div>
            </div>
          </SectionParametre>
<SectionParametre titre="Personnalité de Yuna" description="Choisis un ou plusieurs traits, Yuna les combine">
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
    {PERSONNALITES.map((p) => {
      const estChoisie = (parametres.personnalites || []).includes(p.id)
      return (
        <button
          key={p.id}
          onClick={() => {
            const actuelles = parametres.personnalites || []
            const nouvelles = estChoisie
              ? actuelles.filter((id) => id !== p.id)
              : [...actuelles, p.id]
            // Empêche de tout décocher — au moins une personnalité active
            if (nouvelles.length === 0) return
            mettreAJourParametres({ personnalites: nouvelles })
          }}
          className={`text-left rounded-xl p-2.5 border transition-all duration-200 flex items-start gap-2 ${
            estChoisie ? 'bg-espresso border-espresso' : 'bg-[#F0EEEB] border-espresso/12 hover:border-espresso/30'
          }`}
        >
          <span className="text-[18px] leading-none flex-shrink-0 mt-0.5">{p.emoji}</span>
          <div className="min-w-0">
            <p className={`text-[11.5px] font-semibold truncate ${estChoisie ? 'text-peony' : 'text-espresso'}`}>{p.label}</p>
            <p className={`text-[9px] mt-0.5 leading-snug ${estChoisie ? 'text-peony/70' : 'text-espresso/45'}`}>{p.desc}</p>
          </div>
        </button>
      )
    })}
  </div>
</SectionParametre>

          <SectionParametre titre="Notifications & accessibilité">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11.5px] text-espresso font-medium">
                Notifications activées
              </p>
              <Interrupteur
                actif={parametres.notificationsActives}
                onChange={(val) =>
                  mettreAJourParametres({ notificationsActives: val })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="pr-3">
                <p className="text-[11.5px] text-espresso font-medium">
                  Réduire les animations
                </p>
                <p className="text-[10px] text-espresso/45">
                  Coupe les transitions et effets de mouvement
                </p>
              </div>
              <Interrupteur
                actif={parametres.reduireAnimations}
                onChange={(val) =>
                  mettreAJourParametres({ reduireAnimations: val })
                }
              />
            </div>
          </SectionParametre>

          {/* ===== NOUVELLE SECTION : INSTALLATION SUR L'APPAREIL ===== */}
          <SectionParametre
            titre="Installer l'application"
            description="Ajoute Yuna directement sur ton écran d'accueil"
          >
            {dejaInstalle ? (
              <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-200">
                <IconCoche
                  style={{ width: "16px", height: "16px" }}
                  className="text-emerald-600"
                />
                <span className="text-[11.5px] text-emerald-700 font-medium">
                  Déjà installée sur cet appareil !
                </span>
              </div>
            ) : estIOS ? (
              // iOS ne propose aucune installation automatique — instructions manuelles
              <div className="rounded-xl px-4 py-3 bg-[#F0EEEB] border border-espresso/12">
                <p className="text-[11px] text-espresso/70 leading-relaxed">
                  Sur iPhone/iPad, l'installation se fait manuellement :
                </p>
                <ol className="text-[10.5px] text-espresso/60 mt-1.5 pl-4 list-decimal space-y-0.5">
                  <li>
                    Appuie sur le bouton Partager{" "}
                    <span className="font-mono">⬆️</span> en bas de Safari
                  </li>
                  <li>Fais défiler et choisis "Sur l'écran d'accueil"</li>
                  <li>Confirme — l'icône Yuna apparaîtra chez toi</li>
                </ol>
              </div>
            ) : installable ? (
              <button
                onClick={install}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 bg-espresso text-peony font-semibold text-[11.5px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <IconTelephone style={{ width: "15px", height: "15px" }} />
                Installer Yuna sur cet appareil
              </button>
            ) : (
              <p className="text-[10.5px] text-espresso/45 italic">
                L'option d'installation apparaîtra ici une fois les conditions
                du navigateur remplies (peut demander un rechargement de la
                page).
              </p>
            )}
          </SectionParametre>

          <SectionParametre
            titre="Données & confidentialité"
            description="Tes données restent dans ce navigateur, jamais envoyées ailleurs"
          >
            <div className="flex flex-col gap-2.5">
              <button
                onClick={exporterMesDonnees}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-[#F0EEEB] border border-espresso/12 hover:border-espresso/30 transition-colors duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <IconDownload
                    style={{ width: "15px", height: "15px" }}
                    className="text-espresso/60"
                  />
                  <span className="text-[11.5px] text-espresso font-medium">
                    Exporter mes données
                  </span>
                </div>
                <span className="text-[9px] text-espresso/40">.json</span>
              </button>
              <button
                onClick={reinitialiserToutesLesDonnees}
                className="flex items-center gap-2.5 rounded-xl px-4 py-3 bg-red-50 border border-red-200 hover:border-red-400 transition-colors duration-200"
              >
                <IconTrash
                  style={{ width: "15px", height: "15px" }}
                  className="text-red-500"
                />
                <span className="text-[11.5px] text-red-600 font-medium">
                  Tout réinitialiser
                </span>
              </button>
            </div>
          </SectionParametre>

          <div className="md:hidden bg-white rounded-2xl p-4 border border-espresso/10">
            <div className="flex items-center gap-2 mb-3">
              <IconInfo
                style={{ width: "15px", height: "15px" }}
                className="text-espresso/50"
              />
              <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium">
                À propos
              </h2>
            </div>
            <p className="text-[11px] text-espresso font-semibold mb-0.5">
              Yuna
            </p>
            <p className="text-[10px] text-espresso/45 mb-3">
              Version {VERSION_APP}
            </p>
            <p className="text-[10px] text-espresso/50 leading-relaxed">
              Une IA compagnon créée avec React, Tailwind CSS et l'API Gemini —
              projet personnel développé en L2.
            </p>
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 md:py-7 bg-white md:border-l border-espresso/10 md:overflow-y-auto md:scroll-suave md:min-h-0">
          <button
            onClick={() => setThemeOuvert(!themeOuvert)}
            className="md:hidden w-full flex items-center justify-between gap-2 mb-2 py-1"
          >
            <div className="flex items-center gap-2">
              <IconPalette
                style={{ width: "15px", height: "15px" }}
                className="text-espresso/50"
              />
              <span className="text-espresso/70 text-[12px] uppercase tracking-[0.08em] font-semibold">
                Thème visuel
              </span>
            </div>
            <IconChevron
              style={{
                width: "16px",
                height: "16px",
                transform: themeOuvert ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
              className="text-espresso/50"
            />
          </button>

          <div className="hidden md:flex items-center gap-2 mb-4">
            <IconPalette
              style={{ width: "15px", height: "15px" }}
              className="text-espresso/50"
            />
            <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium">
              Thème visuel
            </h2>
          </div>

          <div className={themeOuvert ? "block" : "hidden md:block"}>
            <div className="flex flex-col gap-2 mb-4">
              {THEMES_DISPONIBLES.map((theme) => {
                const estActif =
                  parametres.themeId === theme.id &&
                  !parametres.couleursPersonnalisees;
                return (
                  <button
                    key={theme.id}
                    onClick={() => {
                      choisirTheme(theme.id);
                      setModePerso(false);
                      afficherConfirmation();
                    }}
                    className={`flex items-center gap-2.5 rounded-xl p-3 border transition-all duration-200 ${estActif ? "border-espresso bg-[#F0EEEB]" : "border-espresso/12 hover:border-espresso/30"}`}
                  >
                    <div className="flex -space-x-1.5 flex-shrink-0">
                      {["espresso", "peony", "accent"].map((cle) => (
                        <span
                          key={cle}
                          className="w-5 h-5 rounded-full border-2 border-white"
                          style={{ backgroundColor: theme.couleurs[cle] }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-espresso font-medium">
                      {theme.nom}
                    </span>
                    {estActif && (
                      <IconCoche
                        style={{ width: "12px", height: "12px" }}
                        className="text-espresso ml-auto"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setModePerso(!modePerso)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-espresso/60 hover:text-espresso transition-colors duration-200 mb-3"
            >
              <IconPalette style={{ width: "13px", height: "13px" }} />
              {modePerso
                ? "Masquer la personnalisation"
                : "Créer mes propres couleurs"}
            </button>

            {modePerso && (
              <div className="pt-3 border-t border-espresso/10 mb-2">
                <div className="flex flex-col gap-3 mb-3">
                  {[
                    { cle: "espresso", label: "Couleur principale" },
                    { cle: "peony", label: "Couleur secondaire" },
                    { cle: "accent", label: "Couleur d'accent" },
                    { cle: "cream", label: "Arrière-plan" },
                  ].map((champ) => (
                    <div
                      key={champ.cle}
                      className="flex items-center justify-between gap-2"
                    >
                      <label className="text-[10px] text-espresso/50">
                        {champ.label}
                      </label>
                      <input
                        type="color"
                        value={couleursEnEdition[champ.cle]}
                        onChange={(e) =>
                          setCouleursEnEdition((a) => ({
                            ...a,
                            [champ.cle]: e.target.value,
                          }))
                        }
                        className="w-14 h-8 rounded-lg cursor-pointer border border-espresso/15"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={validerCouleursPersonnalisees}
                  className="w-full rounded-xl py-2.5 text-[11px] font-semibold text-peony bg-espresso transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Appliquer mes couleurs
                </button>
              </div>
            )}
          </div>

          <div className="hidden md:block pt-4 border-t border-espresso/10">
            <div className="flex items-center gap-2 mb-3">
              <IconInfo
                style={{ width: "15px", height: "15px" }}
                className="text-espresso/50"
              />
              <h2 className="text-espresso/45 text-[10.5px] uppercase tracking-[0.08em] font-medium">
                À propos
              </h2>
            </div>
            <p className="text-[11px] text-espresso font-semibold mb-0.5">
              Yuna
            </p>
            <p className="text-[10px] text-espresso/45 mb-3">
              Version {VERSION_APP}
            </p>
            <p className="text-[10px] text-espresso/50 leading-relaxed">
              Une IA compagnon créée avec React, Tailwind CSS et l'API Gemini —
              projet personnel développé en L2.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsScreen;
