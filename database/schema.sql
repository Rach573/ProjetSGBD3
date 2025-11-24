-- SnowDispatcher Database Schema
-- MariaDB 10.4.32
-- Charset: utf8mb4_general_ci

//SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `snowdispatcher` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `snowdispatcher`;

-- --------------------------------------------------------
-- Structure de la table `departements`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `departements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom_departement` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom_departement` (`nom_departement`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `staff`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `staff` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom_complet` varchar(255) NOT NULL,
  `adresse_mail` varchar(255) NOT NULL,
  `statut_hierarchique` enum('Leader','N+1','Employé Lambda') NOT NULL,
  `departement_id` int(11) DEFAULT NULL,
  `est_marie` tinyint(1) DEFAULT 0,
  `nombre_enfants` int(11) DEFAULT 0,
  `genre` enum('M','F','Autre') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `adresse_mail` (`adresse_mail`),
  KEY `departement_id` (`departement_id`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`departement_id`) REFERENCES `departements` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `users`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','agent') NOT NULL DEFAULT 'agent',
  `staff_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `staff_id` (`staff_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `category`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom_categorie` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nom_categorie` (`nom_categorie`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `privacy`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `privacy` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `niveau_confidentialite` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `niveau_confidentialite` (`niveau_confidentialite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `mail`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `mail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `objet` varchar(255) NOT NULL,
  `contenu` text DEFAULT NULL,
  `date_reception` datetime NOT NULL DEFAULT current_timestamp(),
  `expediteur_staff_id` int(11) DEFAULT NULL,
  `categorie_id` int(11) DEFAULT NULL,
  `privacy_id` int(11) DEFAULT NULL,
  `handler_user_id` int(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expediteur_staff_id` (`expediteur_staff_id`),
  KEY `categorie_id` (`categorie_id`),
  KEY `privacy_id` (`privacy_id`),
  CONSTRAINT `mail_ibfk_1` FOREIGN KEY (`expediteur_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mail_ibfk_2` FOREIGN KEY (`categorie_id`) REFERENCES `category` (`id`) ON DELETE SET NULL,
  CONSTRAINT `mail_ibfk_3` FOREIGN KEY (`privacy_id`) REFERENCES `privacy` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `taches`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `taches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mail_id` int(11) NOT NULL,
  `agent_user_id` int(11) NOT NULL,
  `statut_tache` enum('Nouveau','Assigné','Résolu') NOT NULL DEFAULT 'Nouveau',
  `priorite_calculee` enum('Alerte Rouge','Urgent','Normale') NOT NULL,
  `date_attribution` datetime DEFAULT NULL,
  `commentaire` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mail_id` (`mail_id`),
  KEY `agent_user_id` (`agent_user_id`),
  CONSTRAINT `taches_ibfk_1` FOREIGN KEY (`mail_id`) REFERENCES `mail` (`id`) ON DELETE CASCADE,
  CONSTRAINT `taches_ibfk_2` FOREIGN KEY (`agent_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `stats_gender_mail_count`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `stats_gender_mail_count` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `genre` enum('M','F','Autre') NOT NULL,
  `mail_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `genre` (`genre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `stat_mail_by_gender`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `stat_mail_by_gender` (
  `stat_date` date NOT NULL,
  `gender` enum('F','M','X','U') NOT NULL COMMENT 'U=Unknown/Null',
  `mail_count` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`stat_date`,`gender`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Structure de la table `stat_mail_by_priority`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `stat_mail_by_priority` (
  `stat_date` date NOT NULL,
  `priority_id` int(10) UNSIGNED NOT NULL,
  `mail_count` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`stat_date`,`priority_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT//
