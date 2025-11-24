// Types centralisés décrivant la structure des tables et enums de la base Prisma

// Enums utilisés dans plusieurs tables
export type StaffHierarchie = 'Leader' | 'N+1' | 'N' | 'Employe Lambda' | 'Employe_Lambda';
export type MailPriorite = 'Alerte Rouge' | 'Urgent' | 'Normale';
export type MailStatut = 'Nouveau' | 'Assigne' | 'Resolu';
export type UserRole = 'admin' | 'agent';
export type Genre = 'M' | 'F' | 'Autre';
export type GenderStat = 'F' | 'M' | 'X' | 'U'; // U = Inconnu

/**
 * Table `departements` : différents services de l'entreprise
 */
export interface Departement {
  id: number;
  nom_departement: string;
}

/**
 * Table `staff` : employés qui envoient les mails
 */
export interface Staff {
  id: number;
  nom_complet: string;
  adresse_mail: string;
  statut_hierarchique: StaffHierarchie;
  departement_id: number | null;
  est_marie: boolean;
  nombre_enfants: number;
  genre: Genre;
}

/**
 * Table `users` : utilisateurs IT qui utilisent l'application
 */
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: UserRole;
}

/**
 * Table `category` : catégories de mail
 */
export interface Category {
  id: number;
  nom_categorie: string;
}

/**
 * Table `privacy` : niveaux de confidentialité des mails
 */
export interface Privacy {
  id: number;
  niveau_confidentialite: string;
}

/**
 * Table `mail` : messages entrants non assignés
 */
export interface Mail {
  id: number;
  objet: string;
  contenu: string | null;
  date_reception: string;
  expediteur_staff_id: number | null;
  categorie_id: number | null;
  privacy_id: number | null;
  handler_user_id: number | null;
  handler_username?: string | null;
  expediteur?: Staff | null;
  taches?: Array<{
    id: number;
    agent_user_id: number;
    statut_tache: MailStatut;
    priorite_calculee?: MailPriorite;
  }>;
}

/**
 * Table `taches` : tickets de suivi liés à un mail et un agent
 */
export interface Tache {
  id: number;
  mail_id: number;
  agent_user_id: number;
  statut_tache: MailStatut;
  priorite_calculee: MailPriorite;
  date_attribution: string | null;
  commentaire: string | null;
  // Optional computed field populated by the service when joining the agent user
  agent_username?: string | null;
  mail?: Mail | null;
}

/**
 * Table `stats_gender_mail_count` : nombre de mails reçus par genre
 */
export interface StatsGenderMailCount {
  id: number;
  genre: Genre;
  mail_count: number;
}

/**
 * Table `stat_mail_by_gender` : statistique quotidienne par genre
 */
export interface StatMailByGender {
  stat_date: string;
  gender: GenderStat;
  mail_count: number;
}

/**
 * Table `stat_mail_by_priority` : statistique quotidienne par priorité
 */
export interface StatMailByPriority {
  stat_date: string;
  priority_id: number;
  mail_count: number;
}


