# 📄 README — SnowDispatcher

Application Electron + Vue (Vite) pour le dispatch des mails et la gestion des tâches.

## ⚙️ Prérequis

* **Node.js 20+**
* **npm 10+**
* **MySQL** accessible via l’URL définie dans `DATABASE_URL`
  👉 Pour le développement local, **XAMPP** est recommandé

Si vous utilisez **XAMPP**, MySQL tourne par défaut sur :

```
Host : localhost
Port : 3306
Utilisateur : root
Mot de passe : (vide)
```

phpMyAdmin est accessible via :
[http://localhost/phpmyadmin](http://localhost/phpmyadmin)

---

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer votre fichier d’environnement

```bash
cp .env.example .env
```

Puis éditer `.env` et remplir :

* `DATABASE_URL`
* les clés API Gmail (Client ID / Secret / Refresh Token / Redirect URI)

---

## 🗄️ Base de données (via XAMPP)

### 🅰️ Option A — Vous avez `schema.sql`

Le fichier `schema.sql` fournit la structure complète de la base.
Pour l’importer :

1. Lancez MySQL dans XAMPP
2. Accédez à : [http://localhost/phpmyadmin](http://localhost/phpmyadmin)
3. Créez une base nommée, par exemple :

```
snowdispatcher
```

4. Cliquez sur la base → onglet **Importer**
5. Sélectionnez :
   `database/schema.sql`
6. Lancer l’import

➡️ Toutes les tables nécessaires sont créées.

---

### 🅱️ Option B — Vous partez d’une base vide

Créez simplement une base vide dans phpMyAdmin :

```
snowdispatcher
```

Puis adaptez votre `DATABASE_URL`.

---

## 🔧 Prisma

Le fichier Prisma se trouve dans :

```
src/main/prisma/schema.prisma
```

### Générer le client Prisma

```bash
npx prisma generate --schema=src/main/prisma/schema.prisma
```

### Synchroniser Prisma avec la base existante

```bash
npx prisma db pull --schema=src/main/prisma/schema.prisma
```

⚠️ Assurez-vous que MySQL est lancé dans XAMPP.

---

## 🔑 Variables d’environnement importantes

### Base de données

Format attendu :

```
DATABASE_URL="mysql://UTILISATEUR:MOTDEPASSE@HOTE:PORT/NOM_BASE"
```

Exemple XAMPP (mot de passe vide) :

```
DATABASE_URL="mysql://root:@localhost:3306/snowdispatcher"
```

### Gmail API (obligatoire pour la récupération des mails)

* `GMAIL_CLIENT_ID`
* `GMAIL_CLIENT_SECRET`
* `GMAIL_REFRESH_TOKEN`
* `GMAIL_REDIRECT_URI`

### Options supplémentaires

* `GMAIL_USER_EMAIL`
* `GMAIL_LABEL_ID`
* `GMAIL_QUERY`
* `GMAIL_MAX_RESULTS`

---

## ▶️ Lancer l'application

### Mode développement (Vite + Electron)

```bash
npm run dev
```

### Mode "production local" (build + Electron Forge)

```bash
npm run start:prod
```

> Si nécessaire, build le renderer avant :
>
> ```bash
> npm run build:renderer
> ```

---

## 🧰 Scripts utiles

```bash
npm run prisma:generate   # régénère le client Prisma
npm run prisma:push       # pousse le schéma (à utiliser prudemment)
npm run seed:mail         # charge des données de test (si le script existe)
npm run lint              # lint du code
```

---

## 📝 Notes

* **Ne jamais committer `.env`** (déjà dans `.gitignore`)
* En mode packagé/production, le renderer charge `dist/index.html`
* Pour reconstruire l’UI :

  ```bash
  npm run build:renderer
  ```

---

## Comptes utilisateurs (par défaut)

L’application contient 4 comptes utilisateurs standards et 1 compte administrateur préconfigurés.

Rôle : Admin | Identifiant : admin | Mot de passe : admin
Rôle : User  | Identifiant : bob   | Mot de passe : bob123
Rôle : User  | Identifiant : carol | Mot de passe : carol123
Rôle : User  | Identifiant : Illyes | Mot de passe : Illyes123456
