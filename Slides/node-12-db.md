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

# Place exacte de `zod` dans l'app

Architecture recommandée :
- `Validation/env.schema.ts` : valide `process.env`
- `Validation/router.schema.ts` : valide `params/query/body`
- `Infrastructure/*Repository.ts` : **pas de zod**, uniquement accès DB

Message clé :
> Zod valide les frontières d'entrée, pas la logique SQL.

---

# Connexion : un `Pool` unique

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
- `router.ts` -> parse + validation runtime (`zod`) + codes HTTP
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

# Exemple métier : séances d’un film

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

Le `::text` permet d’éviter de gérer des conversions de dates au début.

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

# Healthcheck DB (très utile)

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
- Commencer simple (GET) puis étendre avec validation runtime

---

