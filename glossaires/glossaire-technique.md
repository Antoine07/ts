# Glossaire technique (cours TypeScript / Node)

Ce glossaire regroupe les termes les plus fréquents du cours (slides, TPs, énoncés).  
Les définitions sont volontairement orientées “pratique” : à quoi sert le concept et où le placer dans un projet.

---

## TypeScript & typage

**Annotation de type**  
Ajout explicite d'un type à une variable, un paramètre ou un retour. Exemple : `function f(x: number): number { ... }`.

**Analyse statique (static analysis)**  
Analyse du code sans l'exécuter. TypeScript est un analyseur statique : il déduit/valide des types avant le runtime.

**`any`**  
Type qui désactive la sécurité (tout devient possible). À éviter : il masque des erreurs et “propage” l'absence de types.

**`unknown`**  
Type sûr pour “donnée inconnue”. Oblige à vérifier (narrowing) avant d'utiliser la valeur.

**`never`**  
Type d'un cas impossible. Sert notamment à forcer l'exhaustivité dans un `switch` sur une union discriminée.

**`null` / `undefined`**  
Deux valeurs distinctes. En `strictNullChecks`, une variable `string` ne peut pas recevoir `null/undefined` sans union.

**`strict` / `strictNullChecks`**  
Options TypeScript (dans `tsconfig.json`) qui rendent le type-check plus exigeant et plus protecteur.

**Inférence de type (type inference)**  
Capacité de TypeScript à déduire automatiquement un type à partir de la valeur. Recommandé pour le code local “interne”.

**Élargissement (widening)**  
Phénomène où un littéral devient un type plus large, surtout avec `let`. Exemple : `let env = "dev"` → `string`.

**Type littéral (literal type)**  
Type correspondant à une valeur précise. Exemple : `"dev"` (et pas `string`), `42` (et pas `number`).

**`as const`**  
Fige un objet/array en lecture seule et conserve les types littéraux. Très utile pour configs, flags, états.

**Union (`A | B`)**  
Type qui peut prendre plusieurs formes. Exemple : `string | number`. Nécessite du narrowing pour utiliser la valeur.

**Narrowing**  
Réduction d'un type union vers un type plus précis via des checks (`typeof`, `in`, `===`, guards).

**Union discriminée (discriminated union)**  
Union d'objets avec un champ “tag” commun (ex: `type`, `state`) permettant un `switch` lisible et exhaustif.

**Exhaustivité (exhaustive check)**  
Assurance que tous les cas d'une union sont traités. Souvent via `switch` + `assertNever`.

**Type guard**  
Fonction qui vérifie une valeur au runtime et informe TypeScript du type dans la branche “true”.  
Signature typique : `function isX(v: unknown): v is X { ... }`.

**`type` vs `interface`**  
Deux façons de décrire des formes. `type` est très polyvalent (unions, aliases) ; `interface` est souvent utilisé pour des “contrats d'objet”.

**Propriété optionnelle (`?`)**  
Propriété potentiellement absente. Exemple : `{ email?: string }` implique `email` de type `string | undefined`.

**`readonly`**  
Empêche l'affectation (mutation) sur une propriété. Utile pour éviter des modifications involontaires.

**`Record<K, V>`**  
Type dictionnaire : “un objet dont les clés sont `K` et les valeurs `V`”. Exemple : `Record<string, number>`.

**Générique (`<T>`)**  
Paramètre de type utilisé pour préserver une information entre entrée et sortie (ou entre plusieurs paramètres).

**Contrainte de générique (`extends`)**  
Borne un générique. Exemple : `T extends { id: number }` signifie “T doit avoir `id: number`”.

**`keyof`**  
Produit l'union des clés d'un type objet. Exemple : `keyof User` → `"id" | "name" | ...`.

**Accès par clé (`T[K]`)**  
Type de la propriété `K` dans `T`. Base des helpers `get`, `pluck`, `set` en typage sûr.

**DTO (Data Transfer Object)**  
Objet “transport” entre couches (API ↔ app ↔ DB). On le sépare souvent du modèle métier (Domain).

**Frontière du système**  
Zone où des données externes entrent : HTTP, DB, fichiers, `process.env`, `JSON.parse`, formulaires.  
À cet endroit, les types ne suffisent pas : validation runtime recommandée.

---

## Tooling & workflow

**`tsc`**  
Compilateur TypeScript. Sert à type-check (`--noEmit`) et/ou compiler TS → JS.

**`tsx`**  
Outil d'exécution de TypeScript en développement (watch, rechargement). Il ne remplace pas un type-check dédié.

**Type-check**  
Vérification TypeScript (compile-time). Ne garantit pas la validité des données externes.

**Runtime**  
Moment où le programme s'exécute réellement. Les types TypeScript n'existent pas au runtime.

**Watch mode**  
Mode où un outil surveille les fichiers et relance (ex: `tsc --watch`, `tsx watch`).

**`tsconfig.json`**  
Fichier de configuration TypeScript : options de compilation, strictness, module system, etc.

---

## Node.js

**Node.js**  
Runtime JavaScript (hors navigateur). Exécute du JS (et, via tooling, du TS en dev).

**V8**  
Moteur JavaScript de Chrome, utilisé par Node.

**I/O (Input/Output)**  
Entrées/sorties : réseau, DB, fichiers. Node est très efficace sur des workloads I/O-bound.

**Event loop**  
Mécanisme qui permet de gérer des opérations I/O sans bloquer le thread JS principal.

**ESM (ECMAScript Modules)**  
Système moderne de modules : `import/export`. Souvent activé via `type: "module"`.

**CommonJS (CJS)**  
Ancien système Node : `require/module.exports`.

**`process.env`**  
Variables d'environnement. À considérer comme une frontière (strings, potentiellement manquantes).

---

## HTTP & API

**HTTP**  
Protocole de communication web. Une requête a une méthode, une URL, des headers, et parfois un body.

**API REST**  
Style d'API basé sur des ressources adressées par URL + conventions HTTP (verbes, status codes, stateless).

**Ressource (REST)**  
Entité métier exposée par l'API (ex: `movies`, `screenings`, `users`).

**Verbes HTTP (méthodes)**  
`GET` (lire), `POST` (créer/déclencher), `PUT` (remplacer), `PATCH` (modifier partiellement), `DELETE` (supprimer).

**Endpoint / route**  
Combinaison (méthode + chemin). Exemple : `GET /movies`.

**Router**  
Composant qui matche (méthode + chemin), valide les entrées, puis délègue au code métier/repository.

**Status code**  
Code réponse : `200` OK, `201` Created, `400` Bad Request, `404` Not Found, `500` Internal Server Error, etc.

**Stateless**  
Principe REST : chaque requête contient le contexte nécessaire. Le serveur ne dépend pas d'un état de session implicite.

**Idempotence**  
Propriété d'une opération qui produit le même effet même répétée plusieurs fois (souvent vrai pour `PUT` et `DELETE`).

**CRUD**  
Create / Read / Update / Delete : opérations de base d'une API sur une ressource.

**Headers**  
Métadonnées HTTP (`Content-Type`, `Authorization`, …).

**Body**  
Contenu envoyé/reçu (souvent JSON). Pour `POST/PUT/PATCH`, il faut parser + valider.

**`node:http`**  
Module standard Node pour créer des serveurs HTTP (bas niveau).

**JSON**  
Format de données texte. `JSON.parse` retourne `unknown` conceptuellement : validation recommandée.

**Validation runtime**  
Validation des entrées au runtime (ex: `zod`). Complémentaire de TypeScript.

**Healthcheck**  
Endpoint simple qui indique si le service est “vivant”. Exemple : `GET /health` et parfois `GET /health/db`.

---

## PostgreSQL & SQL

**PostgreSQL (Postgres)**  
Base de données relationnelle. On y accède via des requêtes SQL.

**SQL**  
Langage de requêtes (select/insert/update/delete). Les résultats ne sont pas typés “nativement” côté TS.

**`pg`**  
Client PostgreSQL pour Node.

**Pool (`pg.Pool`)**  
Gestionnaire de connexions réutilisables. Plus performant et plus propre que d'ouvrir une connexion par requête.

**Query paramétrée**  
Requête avec placeholders (`$1`, `$2`, …) + valeurs séparées. Évite les injections SQL.

**Injection SQL**  
Faille quand on concatène des entrées dans la requête SQL. À éviter via requêtes paramétrées.

**Schéma (`schema.sql`)**  
Définition de tables, colonnes, contraintes, et parfois des données de départ (seed).

**Seed (données d'exemple)**  
Données insérées pour tester/démontrer le fonctionnement.

**Clé primaire (PK)**  
Colonne qui identifie de manière unique une ligne (`id`).

**Clé étrangère (FK)**  
Colonne qui référence la PK d'une autre table (`screenings.movie_id` -> `movies.id`).

**Relation 1-N (one-to-many)**  
Une ligne de la table A peut être liée à plusieurs lignes de la table B (ex: `movies` -> `screenings`).

**Jointure (JOIN)**  
Requête SQL qui combine plusieurs tables liées (ex: `screenings` + `rooms`).

**Migration**  
Versionnement des changements de schéma DB dans le temps (ajout colonne, table, contrainte, etc.).

**ORM (Object-Relational Mapper)**  
Outil qui aide à manipuler une base relationnelle depuis le code applicatif, avec mapping table/objets/types.

**SQL-first**  
Approche où le modèle SQL (tables/contraintes/relations) reste la source de vérité.

**Drizzle ORM**  
ORM TypeScript orienté SQL-first, utilisé dans le cours pour garder un SQL lisible avec typage statique.

---

## Docker

**Docker**  
Outil de conteneurisation : exécuter une app et ses dépendances de façon reproductible.

**Image / conteneur**  
Image = modèle immuable ; conteneur = instance en exécution.

**Docker Compose**  
Fichier `docker-compose.yml` qui décrit plusieurs services (app + DB, ports, volumes, env).

**Volume**  
Stockage persistant (ex: données Postgres) qui survit aux redémarrages de conteneurs.

**`docker compose down -v`**  
Arrête les services et supprime les volumes : utile pour repartir “propre” (attention : perte de données).

---

## Architecture & conception (TPs)

**Domain / Infrastructure / Server (ou Application)**  
Découpage courant :
- Domain : règles métier + modèles
- Infrastructure : DB, fichiers, appels externes
- Server/Application : HTTP, orchestration, wiring

**Repository (pattern)**  
Objet qui encapsule l'accès aux données (SQL/DB) derrière une API TypeScript (`list()`, `findById()`, …).

**Frontière d'entrée**  
Point où des données externes entrent dans l'app (HTTP, env, fichiers). C'est l'endroit où l'on valide au runtime (`zod`).

**Injection de dépendances (DI)**  
Passer les dépendances (ex: repository, storage) en paramètre/constructeur plutôt que les créer “en dur”.

**Séparation des responsabilités**  
Éviter les classes “god object” qui font tout (HTTP + SQL + logique). Chaque partie doit être testable/remplaçable.

**SOLID**  
Ensemble de principes pour un code maintenable :
- SRP : une responsabilité par module/classe
- OCP : ouvert à l'extension, fermé à la modification
- LSP : substituabilité
- ISP : interfaces petites et utiles
- DIP : dépendre d'abstractions, pas de détails

**Refactor**  
Modifier la structure interne du code sans changer le comportement externe (objectif : lisibilité, maintenabilité, sécurité).

**Livrable**  
Ce qui est attendu à la fin d'un TP (fichiers, endpoints, scripts, etc.).
