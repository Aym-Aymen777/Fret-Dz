# Fret-DZ — Plateforme Logistique B2B

> Projet de Fin de Module "Build & Ship" — Architecture Cloud & Vibe Programming
> **Theme 5 : Logistique B2B ("Fret-Dz")**

## Binome

| Nom & Prenom | Role |
|---|---|
| Wail KIHAL | Developpeur Full-Stack |
| *(Binome)* | Developpeur Full-Stack |
| *(Binome)* | Developpeur Full-Stack |
---

## Mapping du Theme

Fret-DZ est un extranet metier connectant des commercants algeriens a des camionneurs certifies pour la gestion de leurs expeditions a travers les 58 wilayas.

| Entite | Table Supabase | Description |
|---|---|---|
| **Table A — Utilisateurs** | `profiles` (via Supabase Auth) | Les **commercants** (clients B2B) qui creent des demandes d'expedition |
| **Table B — Ressources** | `transporters` | Les **camionneurs** certifies avec leur vehicule, wilaya et disponibilite |
| **Table C — Interactions** | `shipments` | Les **expeditions** reliant un commercant a un camionneur, avec statut et dates |
| **Fichier (Storage)** | `shipment-documents` | Le **bon de livraison signe** (PDF/image) uploade lors de la creation d'une expedition |

### Flux utilisateur complet

```
Inscription / Connexion
        |
        v
Consulter les camionneurs disponibles (Table B)
        |
        v
Creer une expedition + upload du bon de livraison (Table C + Storage)
        |
        v
Tableau de bord personnel (suivi des expeditions en temps reel)
```

---

## Stack Technologique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Langage | TypeScript 5 |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS v4 |
| Hebergement / CI/CD | Vercel |

---

## Analyse d'Architecture (Rapport Architecte)

### 1. Pourquoi Vercel + Supabase est financierement plus logique qu'un serveur classique ? (CAPEX vs OPEX)

Monter une infrastructure classique pour ce projet imposerait un **CAPEX** (Capital Expenditure) lourd des le depart : achat de serveurs physiques, switches reseau, onduleurs, licences logicielles, et surtout un espace dans un data center (rack, electricite, climatisation). Ces depenses sont engagees *avant* meme qu'un seul utilisateur utilise l'application, avec un risque financier total en cas d'echec du projet.

Avec **Vercel + Supabase**, on bascule entierement en **OPEX** (Operational Expenditure) : on paie uniquement ce qu'on consomme, mois par mois. Le plan gratuit couvre amplement la phase de lancement (50 000 requetes/mois sur Vercel, 500 MB de base de donnees sur Supabase). Si Fret-DZ monte en charge, on scale le plan sans acheter de nouveau materiel. Ce modele "pay-as-you-grow" reduit le risque financier a zero au demarrage et permet de reaffecter le budget a la valeur produit plutot qu'a l'infrastructure.

### 2. Comment Vercel gere-t-il la scalabilite par rapport a un Data Center physique local ?

Un data center physique local pose un probleme fondamental : la scalabilite est **verticale et lente**. Si Fret-DZ connait un pic de trafic (ex: periode de fetes, forte demande d'expeditions), il faut commander de nouveaux serveurs rack, les installer, les configurer — un processus qui prend des semaines. La climatisation et l'alimentation electrique doivent etre dimensionnees pour le pic maximal prevu, meme si ce pic ne dure que quelques heures par an.

**Vercel** repose sur une architecture **Serverless Edge** : chaque page et chaque API route est une fonction independante, deployee simultanement sur des dizaines de points de presence (PoP) mondiaux. Lorsque le trafic augmente, Vercel instancie automatiquement de nouvelles fonctions en millisecondes — sans intervention humaine, sans surcharge de climatisation, sans rack supplementaire. La scalabilite est **horizontale, automatique et instantanee**. On ne paie que les invocations reelles, et l'infrastructure physique (serveurs, refroidissement, alimentation) reste entierement la responsabilite de Vercel, pas du developpeur.

### 3. Donnees structurees vs donnees non-structurees dans Fret-DZ

**Donnees structurees** — tout ce qui est stocke dans les tables PostgreSQL de Supabase : les profils des commercants (`profiles`), les fiches des camionneurs (`transporters` avec wilaya, type de vehicule, capacite), et les expeditions (`shipments` avec statut, adresses d'origine/destination, dates). Ces donnees ont un schema fixe, des types definis, des cles etrangeres, et peuvent etre interrogees avec du SQL precis. Les regles RLS (Row Level Security) y appliquent l'isolation par utilisateur.

**Donnees non-structurees** — les **bons de livraison signes** (PDF ou images) uploades dans **Supabase Storage** (bucket `shipment-documents`). Ces fichiers n'ont pas de schema interne exploitable directement par une requete SQL : ce sont des blobs binaires. Leur contenu (signature manuscrite, tampon, mentions legales) est lisible par un humain ou un OCR, mais pas par la base relationnelle. Ils sont references dans la table `shipments` via leur URL de storage, creant le pont entre donnee structuree et non-structuree.

---

## Lancer le projet en local

```bash
# Cloner le depot
git clone <url-du-repo>
cd Fret-Dz

# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# Demarrer le serveur de developpement
npm run dev
```

## Deploiement

L'application est deployee automatiquement sur **Vercel** a chaque `git push` sur la branche `main`.

- **URL de production :** *(a completer apres deploiement)*
- **Depot GitHub :** *(lien a ajouter)*

## Identifiants de test

| Champ | Valeur |
|---|---|
| Email | `test@fret-dz.com` |
| Mot de passe | `Test1234!` |

---

*Projet realise dans le cadre du module Architecture Cloud & SI — 2CP 2026*

