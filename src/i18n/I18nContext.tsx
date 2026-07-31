import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type InterfaceLanguage = 'en' | 'fr';

const LANGUAGE_STORAGE_KEY = 'radreppilot-interface-language';

const frenchText: Record<string, string> = {
  Home: 'Accueil',
  Workspace: 'Espace de travail',
  About: 'À propos',
  Disclaimer: 'Avis de non-responsabilité',
  Feedback: 'Commentaires',
  Dashboard: 'Tableau de bord',
  Reports: 'Rapports',
  'New Report': 'Nouveau rapport',
  Preferences: 'Préférences',
  Login: 'Connexion',
  Signup: 'Créer un compte',
  Logout: 'Déconnexion',
  'Radiology reporting education platform': "Plateforme éducative de rédaction en radiologie",
  'Public navigation': 'Navigation publique',
  'App navigation': "Navigation de l'application",
  'RadRepPilot home': 'Accueil RadRepPilot',
  'Choose interface language': "Choisir la langue de l'interface",
  English: 'English',
  French: 'Français',
  'Privacy reminder:': 'Rappel de confidentialité :',
  'Please do not enter patient-identifying information. RadRepPilot is an educational reporting-support tool and does not interpret images, provide diagnoses, or replace radiologist review.':
    "N'inscrivez aucun renseignement permettant d'identifier un patient. RadRepPilot est un outil éducatif d'aide à la rédaction; il n'interprète pas les images, ne pose pas de diagnostic et ne remplace pas la révision par un radiologiste.",
  'Free educational platform for radiology reporting practice. User-entered content only.':
    "Plateforme éducative gratuite pour s'exercer à la rédaction en radiologie. Contenu saisi par l'utilisateur seulement.",
  'Footer navigation': 'Navigation du pied de page',
  'Radiology reporting practice, organized.': 'La rédaction en radiologie, mieux structurée.',
  'RadRepPilot is a free educational platform that helps learners practise structured radiology reporting, save draft reports, and customize reporting preferences.':
    "RadRepPilot est une plateforme éducative gratuite qui aide les apprenants à pratiquer la rédaction structurée en radiologie, à enregistrer des brouillons et à personnaliser leurs préférences.",
  'Educational use only. Do not enter patient-identifying information. RadRepPilot does not interpret images or provide diagnoses.':
    "Usage éducatif seulement. N'inscrivez aucun renseignement permettant d'identifier un patient. RadRepPilot n'interprète pas les images et ne pose pas de diagnostic.",
  'Start using RadRepPilot': 'Commencer à utiliser RadRepPilot',
  'Create free account': 'Créer un compte gratuit',
  'Learn more': 'En savoir plus',
  'Structured reporting practice': 'Pratique de la rédaction structurée',
  'Draft findings and impressions in a focused educational workspace.':
    'Rédigez les constatations et la conclusion dans un espace éducatif ciblé.',
  'Saved reports': 'Rapports enregistrés',
  'Create an account to keep a personal library of anonymized practice drafts.':
    "Créez un compte pour conserver une bibliothèque personnelle de brouillons d'exercice anonymisés.",
  'Customize language, reporting style, and default structure when signed in.':
    'Personnalisez la langue, le style de rédaction et la structure par défaut après la connexion.',
  'RadRepPilot features': 'Fonctionnalités de RadRepPilot',
  Account: 'Compte',
  'Sign in to the RadRepPilot workspace. Do not enter patient-identifying information.':
    "Connectez-vous à l'espace RadRepPilot. N'inscrivez aucun renseignement permettant d'identifier un patient.",
  Email: 'Courriel',
  Password: 'Mot de passe',
  'Signing in...': 'Connexion en cours…',
  'Sign in': 'Se connecter',
  'Need an account?': "Besoin d'un compte?",
  'Create one': 'Créer un compte',
  'Create a RadRepPilot workspace account. This remains prototype-only and must not store PHI.':
    "Créez un compte RadRepPilot. Cette version demeure un prototype et ne doit contenir aucun renseignement de santé identifiable.",
  'Creating account...': 'Création du compte…',
  'Create account': 'Créer le compte',
  'Already have an account?': 'Vous avez déjà un compte?',
  'Workspace Overview': "Vue d'ensemble de l'espace de travail",
  'Imaging Requisition Workspace': "Demandes d'imagerie",
  'Imaging Guide': "Guide d'imagerie",
  'Reporting Workflows': 'Parcours de rédaction',
  Calculators: 'Calculateurs',
  'Report Builder': 'Générateur de rapport',
  'Example Outputs': 'Exemples de résultats',
  'Local Drafts': 'Brouillons locaux',
  'Safety and Scope': 'Sécurité et portée',
  'RadRepPilot Workspace': 'Espace de travail RadRepPilot',
  Overview: "Vue d'ensemble",
  'Reporting workflows': 'Parcours de rédaction',
  'Imaging requisitions': "Demandes d'imagerie",
  'Report builder': 'Générateur de rapport',
  Examples: 'Exemples',
  'Local drafts': 'Brouillons locaux',
  Safety: 'Sécurité',
  Menu: 'Menu',
  Close: 'Fermer',
  Modules: 'Modules',
  'Workspace tools': "Outils de l'espace de travail",
  'Start a focused task': 'Commencer une tâche ciblée',
  'From clinical question to clear draft.': "De la question clinique à un brouillon clair.",
  'Choose the workspace that matches what you need to prepare.': "Choisissez l'espace adapté à ce que vous devez préparer.",
  'Workspace actions': "Actions de l'espace de travail",
  'Structured findings and editable reports': 'Constatations structurées et rapports modifiables',
  'Focused measurements and classifications': 'Mesures et classifications ciblées',
  'Compare appropriate imaging options': "Comparer les options d'imagerie appropriées",
  'Build concise, question-led requests': 'Créer des demandes concises axées sur la question clinique',
  'Choose study': "Choisir l'examen",
  'Structure findings': 'Structurer les constatations',
  'Generate report': 'Générer le rapport',
  'Educational use only. Do not enter patient-identifying information.':
    "Usage éducatif seulement. N'inscrivez aucun renseignement permettant d'identifier un patient.",
  'Report draft': 'Brouillon du rapport',
  'Save local draft': 'Enregistrer localement',
  Expand: 'Développer',
  Collapse: 'Réduire',
  Preview: 'Aperçu',
  Edit: 'Modifier',
  Indication: 'Indication',
  Technique: 'Technique',
  Findings: 'Constatations',
  Impression: 'Conclusion',
  'Incidental findings / follow-up': 'Constatations fortuites / suivi',
  Recommendations: 'Recommandations',
  'Internal notes': 'Notes internes',
  'Regenerate from structured fields': 'Régénérer à partir des champs structurés',
  'Copy full report': 'Copier le rapport complet',
  'Copy impression': 'Copier la conclusion',
  'Save draft': 'Enregistrer le brouillon',
  Reset: 'Réinitialiser',
  'Advanced insert options': "Options d'insertion avancées",
  'Start entering structured findings to generate a draft.':
    'Commencez à saisir les constatations structurées pour générer un brouillon.',
  'Report draft panel collapsed. Expand to preview, edit, copy, or save the draft.':
    'Le panneau du brouillon est réduit. Développez-le pour afficher, modifier, copier ou enregistrer le rapport.',
  'Clinical context': 'Contexte clinique',
  'Optional context fields': 'Champs contextuels facultatifs',
  'This workflow has no dedicated clinical context fields.': 'Ce parcours ne comporte aucun champ contextuel particulier.',
  'Calculators / classification systems': 'Calculateurs / systèmes de classification',
  'Linked helpers': 'Outils associés',
  'Free text': 'Texte libre',
  'Additional findings / radiologist comment': 'Constatations supplémentaires / commentaire du radiologiste',
  Limitations: 'Limites',
  'Limitations / uncertainty': 'Limites / incertitude',
  'Teaching note': "Note d'enseignement",
  'Educational scope': 'Portée éducative',
  'RadRepPilot organizes user-entered findings into draft language. Verify source images, measurements, and final wording before use.':
    "RadRepPilot organise les constatations saisies par l'utilisateur sous forme de brouillon. Vérifiez les images sources, les mesures et le libellé final avant utilisation.",
  'Core findings': 'Constatations principales',
  'Structured imaging findings': "Constatations d'imagerie structurées",
  'Common negatives': 'Éléments négatifs courants',
  'Auto-derived from selected states': 'Dérivés automatiquement des états sélectionnés',
  'Absent/normal selections are included in the draft when appropriate. Positive findings suppress contradictory negatives.':
    'Les sélections absentes ou normales sont incluses dans le brouillon lorsque cela est approprié. Les constatations positives éliminent les éléments négatifs contradictoires.',
  'Quick start': 'Démarrage rapide',
  'Start from a common scenario': "Commencer à partir d'un scénario courant",
  'Start with normal template': 'Commencer avec le modèle normal',
  'Start with positive template': 'Commencer avec le modèle positif',
  'Workflow tools': 'Outils du parcours',
  Tools: 'Outils',
  'Optional support': 'Soutien facultatif',
  'Key negatives': 'Éléments négatifs clés',
  'Common negatives to include': 'Éléments négatifs courants à inclure',
  'Select only items verified by the user/radiologist.': "Sélectionnez uniquement les éléments vérifiés par l'utilisateur ou le radiologiste.",
  'Clinical indication': 'Indication clinique',
  'Relevant clinical context': 'Contexte clinique pertinent',
  'Relevant clinical history': 'Antécédents cliniques pertinents',
  Comparison: 'Comparaison',
  'Comparison study': 'Examen comparatif',
  'Comparison date': 'Date de comparaison',
  'Technical quality': 'Qualité technique',
  'Exam quality': "Qualité de l'examen",
  'Technique / protocol': 'Technique / protocole',
  'Additional findings': 'Constatations supplémentaires',
  'Incidental findings': 'Constatations fortuites',
  'Findings override': 'Remplacement des constatations',
  'Impression override': 'Remplacement de la conclusion',
  'Diagnostic confidence': 'Degré de confiance diagnostique',
  Laterality: 'Latéralité',
  Location: 'Emplacement',
  Measurements: 'Mesures',
  Present: 'Présent',
  Absent: 'Absent',
  Indeterminate: 'Indéterminé',
  'Not assessed': 'Non évalué',
  'Not adequately assessed': 'Évaluation insuffisante',
  Diagnostic: 'Diagnostique',
  Limited: 'Limité',
  Nondiagnostic: 'Non diagnostique',
  Yes: 'Oui',
  No: 'Non',
  yes: 'oui',
  no: 'non',
  present: 'présent',
  absent: 'absent',
  indeterminate: 'indéterminé',
  'not assessed': 'non évalué',
  diagnostic: 'diagnostique',
  limited: 'limité',
  nondiagnostic: 'non diagnostique',
  'About RadRepPilot': 'À propos de RadRepPilot',
  'RadRepPilot is a free educational platform designed to help medical learners, residents, and clinicians practise structured radiology reporting.':
    'RadRepPilot est une plateforme éducative gratuite conçue pour aider les étudiants en médecine, les résidents et les cliniciens à pratiquer la rédaction structurée en radiologie.',
  'The platform provides a focused workspace for organizing findings, drafting impressions, refining requisition language, and developing consistent reporting habits.':
    "La plateforme offre un espace ciblé pour organiser les constatations, rédiger les conclusions, améliorer les demandes d'imagerie et développer des habitudes de rédaction cohérentes.",
  'The goal is to support clear, concise, and clinically useful communication between imaging providers and referring clinicians. RadRepPilot is intended for learning, workflow practice, and report-writing support. It is not a diagnostic tool and does not replace image interpretation by a qualified radiologist.':
    "L'objectif est de favoriser une communication claire, concise et cliniquement utile entre les professionnels de l'imagerie et les cliniciens demandeurs. RadRepPilot est destiné à l'apprentissage, à la pratique des parcours de travail et au soutien à la rédaction. Ce n'est pas un outil diagnostique et il ne remplace pas l'interprétation des images par un radiologiste qualifié.",
  'Future versions will include user accounts, saved reports, customizable reporting preferences, and a feedback pathway for users to suggest improvements.':
    "Les versions futures comprendront des comptes utilisateurs, des rapports enregistrés, des préférences personnalisables et un moyen de proposer des améliorations.",
  'Educational and Safety Disclaimer': 'Avis éducatif et de sécurité',
  'RadRepPilot is provided for educational and report-writing practice only.':
    "RadRepPilot est fourni uniquement à des fins éducatives et d'exercice de rédaction.",
  'It does not interpret medical images, establish diagnoses, recommend management, or replace clinical judgment, local protocols, or radiologist review.':
    "Il n'interprète pas les images médicales, n'établit pas de diagnostic, ne recommande pas de prise en charge et ne remplace ni le jugement clinique, ni les protocoles locaux, ni la révision par un radiologiste.",
  'Users must not enter patient-identifying information, including names, dates of birth, medical record numbers, health insurance numbers, addresses, or any other information that could identify a patient.':
    "Les utilisateurs ne doivent saisir aucun renseignement permettant d'identifier un patient, notamment le nom, la date de naissance, le numéro de dossier médical, le numéro d'assurance maladie, l'adresse ou tout autre renseignement identifiable.",
  'Any generated or drafted wording should be reviewed and adapted by an appropriate clinician before use. RadRepPilot is intended to support learning and communication, not to provide clinical decision-making or patient-specific medical advice.':
    "Tout libellé généré ou rédigé doit être révisé et adapté par un clinicien qualifié avant utilisation. RadRepPilot soutient l'apprentissage et la communication; il ne fournit pas de décision clinique ni de conseil médical propre à un patient.",
  'Help Improve RadRepPilot': 'Aidez-nous à améliorer RadRepPilot',
  'Feedback from learners, residents, radiologists, referring clinicians, and educators helps improve the platform.':
    'Les commentaires des étudiants, résidents, radiologistes, cliniciens demandeurs et enseignants contribuent à améliorer la plateforme.',
  'RadRepPilot is being developed as a public-good educational project. Feedback from learners, residents, radiologists, referring clinicians, and educators is essential to improving the platform.':
    "RadRepPilot est développé comme un projet éducatif d'intérêt public. Les commentaires des étudiants, résidents, radiologistes, cliniciens demandeurs et enseignants sont essentiels à son amélioration.",
  'Use this page to report bugs, suggest features, comment on usability, or share ideas for future reporting templates and educational tools.':
    "Utilisez cette page pour signaler un problème, proposer une fonctionnalité, commenter la convivialité ou partager des idées de futurs modèles et outils éducatifs.",
  'Feedback can also be sent directly to': 'Les commentaires peuvent également être envoyés directement à',
  'Please do not include patient-identifying information in feedback messages.':
    "N'incluez aucun renseignement permettant d'identifier un patient dans vos messages.",
  'Radiology Reporting': 'Rédaction en radiologie',
  'Radiology Reporting Modules': 'Modules de rédaction en radiologie',
  'Structured Reporting Modules': 'Modules de rédaction structurée',
  'Select a modality to begin.': 'Sélectionnez une modalité pour commencer.',
  'Select a body system': 'Sélectionnez une région anatomique',
  'Select a workflow': 'Sélectionnez un parcours',
  'Back one step': 'Étape précédente',
  'Back to imaging modalities': "Retour aux modalités d'imagerie",
  'Change workflow': 'Changer de parcours',
  'Reset selection': 'Réinitialiser la sélection',
  Modality: 'Modalité',
  workflows: 'parcours',
  'Open workflow': 'Ouvrir le parcours',
  'X-ray': 'Radiographie',
  Ultrasound: 'Échographie',
  MRI: 'IRM',
  'Nuclear Medicine': 'Médecine nucléaire',
  Chest: 'Thorax',
  Abdomen: 'Abdomen',
  Spine: 'Rachis',
  'Lines/Tubes': 'Cathéters / tubes',
  'Abdomen/RUQ': 'Abdomen / quadrant supérieur droit',
  'Renal/Bladder': 'Reins / vessie',
  'Pelvic/Gynecology': 'Pelvis / gynécologie',
  Thyroid: 'Thyroïde',
  Scrotal: 'Scrotum',
  'Vascular/DVT': 'Vasculaire / TVP',
  'Soft Tissue': 'Tissus mous',
  'Neuro/Head': 'Neuro / tête',
  'Abdomen/Pelvis': 'Abdomen / pelvis',
  Vascular: 'Vasculaire',
  Oncology: 'Oncologie',
  Pelvis: 'Pelvis',
  Cardiac: 'Cardiaque',
  'Insert into Report Builder': 'Insérer dans le générateur de rapport',
  Insert: 'Insérer',
  'Save Draft': 'Enregistrer le brouillon',
  'Generated text': 'Texte généré',
  'Generated requisition': "Demande d'imagerie générée",
  'Editable requisition': "Demande d'imagerie modifiable",
  'Copy requisition': 'Copier la demande',
  'Generated requisition will appear here.': "La demande d'imagerie générée apparaîtra ici.",
  'Output style': 'Style de sortie',
  Tone: 'Ton',
  Minimal: 'Minimal',
  Standard: 'Standard',
  Detailed: 'Détaillé',
  'Polite requisition': 'Demande courtoise',
  'Direct clinical': 'Clinique direct',
  'Clear/reset': 'Effacer / réinitialiser',
  Complaint: 'Motif',
  'Clinical questions': 'Questions cliniques',
  'Recommended imaging': 'Imagerie recommandée',
  Form: 'Formulaire',
  Split: 'Partagé',
  'Core requisition fields': 'Champs essentiels de la demande',
  'More patient details': 'Plus de renseignements sur le patient',
  'Radiology question / request': 'Question / demande en radiologie',
  'Key clinical question': 'Question clinique principale',
  Exam: 'Examen',
  'PMHx documented?': 'Antécédents documentés?',
  'Not specified': 'Non précisé',
  'No relevant PMHx': 'Aucun antécédent pertinent',
  'Relevant PMHx present': 'Antécédents pertinents présents',
  'Relevant PMHx': 'Antécédents pertinents',
  'Pregnancy status': 'Statut de grossesse',
  'Renal function / contrast issue': 'Fonction rénale / enjeu lié au contraste',
  Anticoagulation: 'Anticoagulation',
  'Prior imaging': 'Imagerie antérieure',
  'Relevant surgery': 'Chirurgie pertinente',
  'Cancer history': 'Antécédents de cancer',
  Immunosuppression: 'Immunosuppression',
  'Show missing details': 'Afficher les renseignements manquants',
  'Show readiness details': "Afficher l'état de préparation",
  'Verify the generated wording before using it clinically.': 'Vérifiez le libellé généré avant toute utilisation clinique.',
  'Optional quick fills': 'Remplissages rapides facultatifs',
  'Additional request details': 'Renseignements supplémentaires sur la demande',
  'Less common details': 'Renseignements moins courants',
  'Why this matters to radiology': 'Pourquoi cela importe en radiologie',
  'Use natural wording: characterize, compare, evaluate, assess stability, assess for complication, or rule out when appropriate.':
    'Utilisez un libellé naturel : caractériser, comparer, évaluer, vérifier la stabilité, rechercher une complication ou exclure lorsque cela est approprié.',
  Optional: 'Facultatif',
  'Optional comparison': 'Comparaison facultative',
  'If relevant': 'Si pertinent',
};

export function translateInterfaceText(english: string, language: InterfaceLanguage): string {
  return language === 'fr' ? frenchText[english] ?? english : english;
}

interface I18nContextValue {
  language: InterfaceLanguage;
  setLanguage: (language: InterfaceLanguage) => void;
  text: (english: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLanguage(): InterfaceLanguage {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'fr' ? 'fr' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<InterfaceLanguage>(initialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === 'fr' ? 'fr-CA' : 'en-CA';
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      text: (english) => translateInterfaceText(english, language),
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within I18nProvider');
  return context;
}

export const i18nStorageKey = LANGUAGE_STORAGE_KEY;
