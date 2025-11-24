-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : lun. 24 nov. 2025 à 17:38
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `snowdispatcher`
--

-- --------------------------------------------------------

--
-- Structure de la table `category`
--

CREATE TABLE `category` (
  `id` int(11) NOT NULL,
  `nom_categorie` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `category`
--

INSERT INTO `category` (`id`, `nom_categorie`) VALUES
(3, 'Administratif'),
(1, 'Support'),
(2, 'Technique');

-- --------------------------------------------------------

--
-- Structure de la table `departements`
--

CREATE TABLE `departements` (
  `id` int(11) NOT NULL,
  `nom_departement` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `departements`
--

INSERT INTO `departements` (`id`, `nom_departement`) VALUES
(2, 'Informatique'),
(3, 'Logistique'),
(1, 'Ressources Humaines');

-- --------------------------------------------------------

--
-- Structure de la table `mail`
--

CREATE TABLE `mail` (
  `id` int(11) NOT NULL,
  `objet` varchar(255) NOT NULL,
  `contenu` text DEFAULT NULL,
  `date_reception` datetime NOT NULL DEFAULT current_timestamp(),
  `expediteur_staff_id` int(11) DEFAULT NULL,
  `categorie_id` int(11) DEFAULT NULL,
  `privacy_id` int(11) DEFAULT NULL,
  `handler_user_id` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `mail`
--

INSERT INTO `mail` (`id`, `objet`, `contenu`, `date_reception`, `expediteur_staff_id`, `categorie_id`, `privacy_id`, `handler_user_id`) VALUES
(425, 'Demande de congés', 'Bonjour,\r\nJe souhaite poser 2 jours en décembre.\r\nMerci.', '2025-11-22 20:00:00', 27, 1, 2, 10),
(428, 'Question fiche de paie', 'Pouvez-vous vérifier ma fiche de paie d\'octobre ?', '2025-11-22 23:00:00', 30, NULL, 1, 8),
(429, 'Commande fournitures', 'Nous avons besoin de stylos et cahiers pour l\'équipe.', '2025-11-23 00:00:00', 31, 1, 2, 10),
(431, 'Badge défectueux', 'Mon badge n\'ouvre plus la porte principale.', '2025-11-23 02:00:00', 33, 3, NULL, 8),
(434, 'Proposition amélioration', 'Idée pour optimiser le flux de validation.', '2025-11-23 05:00:00', 36, 2, 3, 10),
(435, 'Ticket Support #123', 'Problème récurrent sur l\'appli de support (voir logs).', '2025-11-23 06:00:00', 37, 3, NULL, 1),
(436, 'Demande d\'attestation', 'J\'ai besoin d\'une attestation de travail pour la banque.', '2025-11-23 07:00:00', 38, NULL, 1, 10),
(437, 'Problème messagerie', 'Des messages restent bloqués en Boîte d\'envoi.', '2025-11-23 08:00:00', 39, 1, 2, 8),
(438, 'Signalement sécurité', 'Comportement suspect sur poste IT-042.', '2025-11-23 09:00:00', 40, 2, 3, 8);

--
-- Déclencheurs `mail`
--
DELIMITER $$
CREATE TRIGGER `mail_before_insert` BEFORE INSERT ON `mail` FOR EACH ROW BEGIN
  -- Normaliser l’email si fourni
  IF NEW.expediteur_staff_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Expéditeur inconnu : staff manquant';
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `privacy`
--

CREATE TABLE `privacy` (
  `id` int(11) NOT NULL,
  `niveau_confidentialite` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `privacy`
--

INSERT INTO `privacy` (`id`, `niveau_confidentialite`) VALUES
(3, 'Confidentiel'),
(2, 'Interne'),
(1, 'Public');

-- --------------------------------------------------------

--
-- Structure de la table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `nom_complet` varchar(255) NOT NULL,
  `adresse_mail` varchar(255) NOT NULL,
  `statut_hierarchique` enum('Leader','N+1','Employé Lambda') NOT NULL,
  `departement_id` int(11) DEFAULT NULL,
  `est_marie` tinyint(1) NOT NULL DEFAULT 0,
  `nombre_enfants` int(11) NOT NULL DEFAULT 0,
  `genre` enum('M','F','Autre') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `staff`
--

INSERT INTO `staff` (`id`, `nom_complet`, `adresse_mail`, `statut_hierarchique`, `departement_id`, `est_marie`, `nombre_enfants`, `genre`) VALUES
(7, 'Dupont Jean (CEO)', 'jean.dupont@entreprise.com', 'Leader', 1, 1, 2, 'M'),
(8, 'Lefevre Marie (Dir.)', 'marie.lefevre@entreprise.com', 'Leader', 1, 0, 0, 'F'),
(9, 'Martinez Carlos (Dir.)', 'carlos.martinez@entreprise.com', 'Leader', 1, 1, 1, 'M'),
(10, 'Nguyen Linh (Dir.)', 'linh.nguyen@entreprise.com', 'Leader', 1, 0, 0, 'F'),
(11, 'Berger Antoine (Dir.)', 'antoine.berger@entreprise.com', 'Leader', 1, 1, 3, 'M'),
(12, 'Dubois Celine', 'celine.dubois@entreprise.com', 'N+1', 1, 1, 1, 'F'),
(13, 'Moreau Thomas', 'thomas.moreau@entreprise.com', 'N+1', 1, 0, 0, 'M'),
(14, 'Petit Sophie', 'sophie.petit@entreprise.com', 'N+1', 1, 1, 2, 'F'),
(15, 'Roux Marc', 'marc.roux@entreprise.com', 'N+1', 1, 0, 0, 'M'),
(16, 'Perez Laura', 'laura.perez@entreprise.com', 'N+1', 1, 1, 0, 'F'),
(17, 'Simon Pierre', 'pierre.simon@entreprise.com', 'Employé Lambda', 1, 0, 0, 'M'),
(18, 'Fournier Emma', 'emma.fournier@entreprise.com', 'Employé Lambda', 1, 1, 1, 'F'),
(19, 'Lamy Lucas', 'lucas.lamy@entreprise.com', 'Employé Lambda', 1, 0, 0, 'M'),
(20, 'Girard Chloe', 'chloe.girard@entreprise.com', 'Employé Lambda', 1, 1, 2, 'F'),
(21, 'Leroy Alex', 'alex.leroy@entreprise.com', 'Employé Lambda', 1, 0, 0, 'M'),
(22, 'Dupuis Manon', 'manon.dupuis@entreprise.com', 'Employé Lambda', 1, 1, 0, 'F'),
(23, 'Faure Julien', 'julien.faure@entreprise.com', 'Employé Lambda', 1, 0, 0, 'M'),
(24, 'Mercier Clara', 'clara.mercier@entreprise.com', 'Employé Lambda', 1, 1, 1, 'F'),
(25, 'Roche Nicolas', 'nicolas.roche@entreprise.com', 'Employé Lambda', 1, 0, 0, 'M'),
(26, 'Garnier Noemie', 'noemie.garnier@entreprise.com', 'Employé Lambda', 1, 0, 0, 'F'),
(27, 'Élodie Bernard', 'elodie.bernard+seed@exemple.com', 'Leader', 1, 1, 2, 'F'),
(28, 'Mathieu Robert', 'mathieu.robert+seed@exemple.com', 'Leader', 2, 0, 0, 'M'),
(29, 'Sofia Mendes', 'sofia.mendes+seed@exemple.com', 'Leader', 3, 1, 1, 'F'),
(30, 'Hugo Lambert', 'hugo.lambert+seed@exemple.com', 'Leader', 2, 0, 0, 'M'),
(31, 'Inès Garcia', 'ines.garcia+seed@exemple.com', 'Leader', 1, 1, 3, 'F'),
(32, 'Paul Nguyen', 'paul.nguyen+seed@exemple.com', 'Employé Lambda', 2, 0, 0, 'M'),
(33, 'Nadia Benali', 'nadia.benali+seed@exemple.com', 'Employé Lambda', 1, 1, 1, 'F'),
(34, 'Luca Romano', 'luca.romano+seed@exemple.com', 'Employé Lambda', 3, 0, 0, 'M'),
(35, 'Aïcha Diallo', 'aicha.diallo+seed@exemple.com', 'Employé Lambda', 1, 0, 0, 'F'),
(36, 'Théo Carpentier', 'theo.carpentier+seed@exemple.com', 'Employé Lambda', 2, 0, 0, 'M'),
(37, 'Camille Moreau', 'camille.moreau+seed@exemple.com', 'Employé Lambda', 3, 0, 0, 'F'),
(38, 'Rayan Haddad', 'rayan.haddad+seed@exemple.com', 'Employé Lambda', 2, 0, 0, 'M'),
(39, 'Julie Petit', 'julie.petit+seed@exemple.com', 'Employé Lambda', 1, 1, 2, 'F'),
(40, 'Noah Lefèvre', 'noah.lefevre+seed@exemple.com', 'Employé Lambda', 3, 0, 0, 'M'),
(41, 'Zoé Marchand', 'zoe.marchand+seed@exemple.com', 'Employé Lambda', 1, 0, 0, 'F'),
(42, 'Lena Hofmann', 'lena.hofmann+seed@exemple.com', 'N+1', 3, 0, 0, 'F'),
(43, 'Victor Rousseau', 'victor.rousseau+seed@exemple.com', 'N+1', 2, 1, 1, 'M'),
(44, 'Clara Fontaine', 'clara.fontaine+seed@exemple.com', 'N+1', 1, 0, 0, 'F'),
(45, 'Yannick Kouam', 'yannick.kouam+seed@exemple.com', 'N+1', 2, 1, 3, 'M'),
(46, 'Beatriz Costa', 'beatriz.costa+seed@exemple.com', 'N+1', 3, 0, 0, 'F');

-- --------------------------------------------------------

--
-- Structure de la table `stats_gender_mail_count`
--

CREATE TABLE `stats_gender_mail_count` (
  `id` int(11) NOT NULL,
  `genre` enum('M','F','Autre') NOT NULL,
  `mail_count` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `stats_gender_mail_count`
--

INSERT INTO `stats_gender_mail_count` (`id`, `genre`, `mail_count`) VALUES
(1, 'M', 2),
(2, 'F', 2),
(3, 'Autre', 0);

-- --------------------------------------------------------

--
-- Structure de la table `stat_mail_by_gender`
--

CREATE TABLE `stat_mail_by_gender` (
  `stat_date` date NOT NULL,
  `gender` enum('F','M','X','U') NOT NULL COMMENT 'U=Unknown/Null',
  `mail_count` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `stat_mail_by_gender`
--

INSERT INTO `stat_mail_by_gender` (`stat_date`, `gender`, `mail_count`) VALUES
('2025-11-11', 'F', 2),
('2025-11-11', 'M', 2),
('2025-11-11', 'U', 0);

-- --------------------------------------------------------

--
-- Structure de la table `stat_mail_by_priority`
--

CREATE TABLE `stat_mail_by_priority` (
  `stat_date` date NOT NULL,
  `priority_id` int(10) UNSIGNED NOT NULL,
  `mail_count` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `stat_mail_by_priority`
--

INSERT INTO `stat_mail_by_priority` (`stat_date`, `priority_id`, `mail_count`) VALUES
('2025-11-11', 1, 1),
('2025-11-11', 2, 1),
('2025-11-11', 3, 2);

-- --------------------------------------------------------

--
-- Structure de la table `taches`
--

CREATE TABLE `taches` (
  `id` int(11) NOT NULL,
  `mail_id` int(11) NOT NULL,
  `agent_user_id` int(11) DEFAULT NULL,
  `statut_tache` enum('Nouveau','Assigné','Résolu') NOT NULL DEFAULT 'Nouveau',
  `priorite_calculee` enum('Alerte Rouge','Urgent','Normale') NOT NULL,
  `date_attribution` datetime DEFAULT NULL,
  `commentaire` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `taches`
--

INSERT INTO `taches` (`id`, `mail_id`, `agent_user_id`, `statut_tache`, `priorite_calculee`, `date_attribution`, `commentaire`) VALUES
(1, 431, 8, 'Assigné', 'Normale', '2025-11-23 17:11:26', NULL),
(4, 429, 10, 'Résolu', 'Alerte Rouge', '2025-11-23 19:24:24', NULL),
(5, 438, 8, 'Assigné', 'Normale', '2025-11-23 19:24:37', NULL),
(6, 436, 10, 'Assigné', 'Normale', '2025-11-23 19:24:41', NULL),
(7, 434, 10, 'Assigné', 'Normale', '2025-11-23 19:24:48', NULL),
(8, 428, 8, 'Assigné', 'Alerte Rouge', '2025-11-23 19:24:58', NULL),
(11, 425, 10, 'Assigné', 'Alerte Rouge', '2025-11-23 19:25:19', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','agent') NOT NULL DEFAULT 'agent',
  `staff_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `staff_id`) VALUES
(1, 'admin', 'bb8844fbb7cbdbb9b9d6ef3c32ee3128:039c57e675f851c62200420efa757f0d2c181308b620c5c4aa8f5a15b7290aa9a5ac283f24fbd56fba0b20cde23619c6bc8cf1a1eb8b68e79d13f08698f9f498', 'admin', NULL),
(8, 'carol', '6ce50b80e6b2b636be2f65e1fbfcc84f:5f826373f7d81c4ca8650be6da68098103b3dd24d15cd5bbee125d56d488447192ee95a37fc7438c48c2ae3d2fe848c8f8358e04572d366f0f7a65359f30479e', 'agent', NULL),
(10, 'bob', '2688411f6de42a8f27453c080f674c4d:6242b835fc9cab11f231fbf300c2ab46b21209317079420bfb6aeda10d53b5cdc2ee62aaa4bd53719e0015561618fa032c595707bb3e74e7dc87f0c5e176c2c4', 'agent', NULL),
(16, 'Illyes', '2051fd01c96279199f2745c2f67177c9:93195e492b97dd31807e20b58498b5d4940f6b4d043c11f3a1372f2a91c11213e77a6b78ea6d7816423db6a7ebdc5d16232774649cbf463de81477e424d44227', 'agent', NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `category_nom_categorie_key` (`nom_categorie`);

--
-- Index pour la table `departements`
--
ALTER TABLE `departements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departements_nom_departement_key` (`nom_departement`);

--
-- Index pour la table `mail`
--
ALTER TABLE `mail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `mail_expediteur_staff_id_fkey` (`expediteur_staff_id`),
  ADD KEY `mail_privacy_id_fkey` (`privacy_id`),
  ADD KEY `mail_categorie_id_idx` (`categorie_id`);

--
-- Index pour la table `privacy`
--
ALTER TABLE `privacy`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `niveau_confidentialite` (`niveau_confidentialite`);

--
-- Index pour la table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `adresse_mail` (`adresse_mail`),
  ADD KEY `staff_departement_id_fkey` (`departement_id`);

--
-- Index pour la table `stats_gender_mail_count`
--
ALTER TABLE `stats_gender_mail_count`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `genre` (`genre`);

--
-- Index pour la table `stat_mail_by_gender`
--
ALTER TABLE `stat_mail_by_gender`
  ADD PRIMARY KEY (`stat_date`,`gender`);

--
-- Index pour la table `stat_mail_by_priority`
--
ALTER TABLE `stat_mail_by_priority`
  ADD PRIMARY KEY (`stat_date`,`priority_id`);

--
-- Index pour la table `taches`
--
ALTER TABLE `taches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `taches_mail_id_fkey` (`mail_id`),
  ADD KEY `taches_agent_user_id_fkey` (`agent_user_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `users_staff_id_key` (`staff_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `category`
--
ALTER TABLE `category`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `departements`
--
ALTER TABLE `departements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `mail`
--
ALTER TABLE `mail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=440;

--
-- AUTO_INCREMENT pour la table `privacy`
--
ALTER TABLE `privacy`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT pour la table `stats_gender_mail_count`
--
ALTER TABLE `stats_gender_mail_count`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `taches`
--
ALTER TABLE `taches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `mail`
--
ALTER TABLE `mail`
  ADD CONSTRAINT `mail_categorie_id_fkey` FOREIGN KEY (`categorie_id`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `mail_expediteur_staff_id_fkey` FOREIGN KEY (`expediteur_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `mail_privacy_id_fkey` FOREIGN KEY (`privacy_id`) REFERENCES `privacy` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_departement_id_fkey` FOREIGN KEY (`departement_id`) REFERENCES `departements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Contraintes pour la table `taches`
--
ALTER TABLE `taches`
  ADD CONSTRAINT `taches_agent_user_id_fkey` FOREIGN KEY (`agent_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `taches_mail_id_fkey` FOREIGN KEY (`mail_id`) REFERENCES `mail` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
