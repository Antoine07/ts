---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 12 Connexion PostgreSQL (pg)"
---

# 12 — Base de données (PostgreSQL)
## Connexion propre avec Node 24 + TypeScript (`pg`)

---

# Objectif du chapitre

- Comprendre la DB comme une **frontière** (I/O, instable, non typée)
- Centraliser la configuration (env) et créer un `Pool`
- Écrire des queries **paramétrées**
- Introduire le pattern repository (HTTP ≠ SQL)

Cas métier : lister des films et leurs séances.

---

# La DB est une frontière

Pourquoi ?
- réseau (latence, timeout)
- service externe (indisponible)
- données dynamiques (SQL → runtime)

Conclusion :
- on isole la DB dans un module dédié
- on mappe ce qui sort de SQL vers des types métier

---

# Configuration : valider les env vars (runtime)

Exemple (avec `zod`) :

```ts
import { z } from "zod";

const EnvSchema = z.object({
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
});

export const env = EnvSchema.parse(process.env);
```

Idée : échouer vite et clairement si la configuration est incomplète.

---

# `parse` vs `safeParse` (gestion d'erreur)

`parse(...)` :
- lève une exception immédiatement
- pratique si on veut stopper le process au démarrage

`safeParse(...)` :
- retourne `{ success: true | false }`
- utile pour formater l'erreur avant de répondre/logguer

---

# Exemple : gérer l'erreur Zod sur `env`

```ts
const parsedEnv = EnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment configuration");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
```

Effet pratique :
- message clair au démarrage
- pas de serveur lancé avec une config cassée

---

# Que fait `flatten().fieldErrors` ?

`parsedEnv.error.flatten().fieldErrors` retourne un objet simple :
- clé = nom du champ invalide
- valeur = liste des messages d'erreur pour ce champ

Exemple :

```ts
{
  DB_PORT: ["Invalid input: expected number, received NaN"],
  DB_NAME: ["Too small: expected string to have >=1 characters"]
}
```

Pratique pour logger et corriger vite la config.

---

# Corriger vite une erreur Zod (env)

Méthode simple :
1. lire le champ en erreur (`DB_PORT`, `DB_NAME`, ...)
2. corriger la source (`docker-compose`, `.env`, CI)
3. relancer l'app

Règle :
> corriger la cause, ne jamais contourner (`as any`, suppression du schéma).

---

# Router : validation simple 

Pour une entrée HTTP invalide :
- `400` si format/paramètre invalide
- `422` si payload JSON valide mais règles métier invalides

Exemple simple (sans Zod) :

```ts
const movieId = Number(segments[1]);
if (!Number.isInteger(movieId) || movieId <= 0) {
  return sendJson(res, 400, { ok: false, error: "Invalid movie id" });
}
```

---

# Place de la validation 

Architecture recommandée :
- `config.ts` : Zod pour valider `process.env`
- `router.ts` : checks explicites (`if`, `Number.isInteger`)
- `Infrastructure/*Repository.ts` : pas de validation, uniquement DB

> Commencer simple : Zod pour `env`, validations claires dans le router.

---

# Dans TP Movie : usage concret

1. `server.ts` démarre
2. `Infrastructure/DB.ts` importe `env` (déjà validé par Zod)
3. `router.ts` valide `movieId` avec un check simple
4. si validation KO -> `400` / `422`
5. si validation OK -> appel repository

Donc :
- Zod au démarrage (config)
- validation manuelle au router (version cours)
- repository sans validation

---

# Peut-on organiser les validations autrement ?

Oui, plusieurs options correctes :
- version simple (ici) : sans dossier `Validation/`
- version avancée : dossier `Validation/` ou validators par feature
- version avancée : helper générique `validate(schema, input)`

Règle stable :
- frontière env -> Zod
- frontière HTTP -> validation explicite (manuelle puis Zod si besoin)
- repository SQL -> sans Zod

---

# Connexion : un `Pool` unique 1/2

```ts
import { Pool } from "pg";
import { env } from "./config";

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});
```

---

# Connexion : un `Pool` unique 2/2


Pourquoi un `Pool` ?
- réutilise les connexions
- gère la concurrence
- évite ouvrir/fermer à chaque requête

---

# SQL paramétré (sécurité)

Ne jamais concaténer une entrée utilisateur dans du SQL.

```ts
// ✅ paramétré
await pool.query("select * from movies where id = $1", [id]);

// ❌ injection possible
await pool.query(`select * from movies where id = ${id}`);
```

---

# Séparer HTTP et SQL : repository

Objectif : éviter un handler HTTP qui fait “tout”.

Donc :
- `router.ts` -> parse + validation des entrées + codes HTTP
- `repository.ts` -> requêtes SQL paramétrées + mapping Domain
- `domain/` -> types métier

```ts
export type Movie = { id: number; title: string };

export class MovieRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Movie[]> {
    const result = await this.pool.query<{ id: number; title: string }>(
      "select id, title from movies order by title asc"
    );
    return result.rows;
  }
}
```

---

# Exemple métier : séances d'un film 1/2

```ts
export type Screening = {
  id: number;
  movieId: number;
  startsAt: string; // simplifié pour débutants
};

export class ScreeningRepository {
  constructor(private readonly pool: Pool) {}

  async listByMovieId(movieId: number): Promise<Screening[]> {
    const result = await this.pool.query<Screening>(
      "select id, movie_id as \"movieId\", starts_at::text as \"startsAt\" from screenings where movie_id = $1 order by starts_at asc",
      [movieId]
    );
    return result.rows;
  }
}
```

---

# Exemple métier : séances d'un film 2/2


Le `::text` permet d'éviter de gérer des conversions de dates au début.

---

# Brancher au serveur HTTP (GET)

```ts
const movieRepo = new MovieRepository(pool);
const screeningRepo = new ScreeningRepository(pool);

if (method === "GET" && path === "/movies") {
  const items = await movieRepo.list();
  return sendJson(res, 200, { items });
}
```

---

# `GET /movies/:id/screenings` (route param)

```ts
const segments = path.split("/").filter(Boolean);

if (method === "GET" && segments[0] === "movies" && segments[2] === "screenings") {
  const movieId = Number(segments[1]);
  if (Number.isNaN(movieId)) return sendJson(res, 400, { error: "Invalid movieId" });

  const items = await screeningRepo.listByMovieId(movieId);
  return sendJson(res, 200, { movieId, items });
}
```

---

# Erreurs : ne pas exposer la DB

Bon réflexe :
- log côté serveur (message + contexte)
- réponse HTTP générique (`500`) sans détails sensibles

À éviter :
- renvoyer la query SQL / stacktrace au client

---

# Healthcheck DB - c'est pratique non ?

Endpoint interne :
- `GET /health/db` fait un `select 1`
- si OK → `200`
- sinon → `503`

Utile pour Docker / supervision / diagnostics.

---

# À retenir

- Env = frontière → validation runtime
- `Pool` unique + SQL paramétré
- Repositories pour séparer HTTP et DB
- Commencer simple : Zod sur `env`, checks manuels dans router

