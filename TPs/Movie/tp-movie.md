# TP Movie — API Films & Seances (Node 24 + TypeScript + PostgreSQL)

Ce TP consiste a construire une mini API HTTP qui expose :
- la liste des films
- les seances d'un film

Objectif : travailler une architecture simple, lisible, et proche d'une vraie application, avec separation **Domain / Infrastructure / Router**.

```txt
# Structure cible (version simple, 2e annee)
TPs/Movie/
  Domain/
    Movie.ts
    Screening.ts
    ScreeningService.ts
  Infrastructure/
    DB.ts
    MovieRepository.ts
    ScreeningRepository.ts
  router.ts
  server.ts
  schema.sql
```

## Prerequis

- Node.js 24
- Docker + Docker Compose
- VS Code (recommande)

## Un schéma mental avec Drizzle vu en deuxième partie

![Abstraction ORM](./images/orm-abstraction-flow.png)

## Contexte technique

Ce TP se base sur :
- `node:http` (serveur HTTP natif)
- `pg` (PostgreSQL)
- TypeScript strict

Les donnees proviennent d'une base PostgreSQL initialisee par `TPs/Movie/schema.sql`.

## Regle importante (a respecter)

**Partie 1 : sans Drizzle.**

Durant cette premiere partie, vous utilisez uniquement :
- `pg.Pool`
- des repositories SQL parametrises
- un `router.ts` simple
- `zod` pour valider les frontieres runtime

Rappel utile :
- Frontieres runtime = endroits ou des donnees externes entrent dans l'application et ou TypeScript ne peut pas garantir la validite.
- Exemples : `process.env`, params/query/body HTTP, JSON fichier, reponse API externe, resultat DB.

## Structure proposee

Vous travaillez dans le dossier `starter/src` avec :

- `Domain/`
  - `Movie.ts`
  - `Screening.ts`
  - `ScreeningService.ts` (petit service de domaine)
- `Infrastructure/`
  - `DB.ts`
  - `MovieRepository.ts`
  - `ScreeningRepository.ts`
- `router.ts`
- `server.ts`
- `schema.sql`

Regle : **pas de SQL dans `router.ts` ni dans `server.ts`**. Le SQL reste dans `Infrastructure/*Repository.ts`.

## Schema UML

![Schema UML tables Movie](./images/movie-schema.png)

## Mise en route

1. Lancer les conteneurs :

```bash
cd starter
docker compose up --build -d
```

La base est creee automatiquement au demarrage du service Postgres via :
- `starter/docker-compose.yml`
- variable `POSTGRES_DB: db`

2. Inserer schema + donnees (commande unique) :

```bash
docker exec -i db-postgres-movie psql -U postgres -d db < TPs/Movie/schema.sql
```

3. Verifier rapidement en SQL :

```bash
docker exec -it db-postgres-movie psql -U postgres -d db -c "\\dt"
docker exec -it db-postgres-movie psql -U postgres -d db -c "select count(*) as movies_count from movies;"
docker exec -it db-postgres-movie psql -U postgres -d db -c "select id, title from movies order by id asc;"
docker exec -it db-postgres-movie psql -U postgres -d db -c "select s.id, s.movie_id, r.name as room_name, s.start_time, s.price from screenings s join rooms r on r.id = s.room_id order by s.id asc;"
```

4. Lancer l'API (depuis `starter/`) :

```bash
npm run dev
```

L'API est exposee sur `http://localhost:3001`.

## Plan de realisation conseille

1. Completer les types Domain : `Movie` et `Screening`.
2. Completer `Infrastructure/DB.ts` (connexion `Pool`).
3. Completer `MovieRepository.list()`.
4. Completer `ScreeningRepository.listByMovieId(movieId)`.
5. Ajouter la feature guidee `isEvening` (service de domaine + reponse API enrichie).
6. Completer `router.ts` avec `sendJson`, `sendError`, validations et routes.
7. Brancher le router dans `server.ts`.
8. Tester au fur et a mesure avec `curl` ou Insomnia.

## Domain : types a definir

### `Domain/Movie.ts`

Type attendu :
- `id: number`
- `title: string`
- `description: string | null`
- `durationMinutes: number`
- `rating: string | null`
- `releaseDate: string | null`

### `Domain/Screening.ts`

Type attendu :
- `id: number`
- `movieId: number`
- `startTime: string`
- `price: number`
- `room: { id: number; name: string; capacity: number }`

Definition courte : `Screening` = une seance de projection d'un film.

### `Domain/ScreeningService.ts` (exemple court)

Un service de domaine contient une logique metier pure :
- pas de SQL
- pas de HTTP
- pas de `process.env`

Exemple :

```ts
import type { Screening } from "./Screening.js";

export function isEveningScreening(screening: Screening): boolean {
  const hour = new Date(screening.startTime).getHours();
  return hour >= 18;
}
```

Usage possible :
- enrichir une reponse (`isEvening: true/false`)
- appliquer une regle metier dans la couche Application

## Feature guidee : marquer les seances du soir

Objectif : enrichir la reponse de `GET /movies/:id/screenings` avec un booleen `isEvening`.

1. Implementer `isEveningScreening(screening)` dans `Domain/ScreeningService.ts`.
2. Dans `router.ts`, apres `listByMovieId(movieId)`, transformer la reponse :

```ts
const items = await screenings.listByMovieId(movieId);
const enrichedItems = items.map((item) => ({
  ...item,
  isEvening: isEveningScreening(item),
}));

return sendJson(res, 200, { ok: true, items: enrichedItems });
```

3. Verifier avec `curl` que `isEvening` apparait bien dans la reponse JSON.

## Infrastructure : connexion PostgreSQL

Dans `Infrastructure/DB.ts`, creer un `Pool` avec les variables :
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

Exemple :

```ts
import { Pool } from "pg";

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

Exemple de requete `pg` pour demarrer vite :

```ts
const result = await pool.query<{ now: string }>("select now() as now");
console.log(result.rows[0]?.now);
```

## Validation (zod)

Ne pas utiliser Zod dans les repositories SQL.

Exemple simple dans `config.ts` :

```ts
import { z } from "zod";

export const EnvSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
});
```

Exemple court dans `router.ts` (optionnel au debut) :

```ts
import { z } from "zod";

const MovieIdSchema = z.coerce.number().int().positive();
const parsed = MovieIdSchema.safeParse(segments[1]);
if (!parsed.success) return sendError(res, 400, "Invalid movie id");
```

## Infrastructure : repositories

### `MovieRepository.list()`

But : retourner tous les films tries par `id`.

Exemple SQL (idee) :

```sql
select
  id,
  title,
  description,
  duration_minutes as "durationMinutes",
  rating,
  release_date::text as "releaseDate" -- syntaxe Postgres
from movies
order by id asc;
```

### `ScreeningRepository.listByMovieId(movieId)`

But : retourner les seances d'un film + infos de salle (`rooms`).

Exemple SQL (idee) :

```sql
select
  s.id,
  s.movie_id as "movieId",
  s.start_time::text as "startTime",
  s.price::float8 as "price",
  r.id as "roomId",
  r.name as "roomName",
  r.capacity as "roomCapacity"
from screenings s
join rooms r on r.id = s.room_id
where s.movie_id = $1
order by s.start_time asc;
```

> Important : parametrez toujours les entrees utilisateur (`$1`, `$2`, ...) pour vous premunir des injections SQL.

## Router : routes HTTP

Routes minimales a implementer :
- `GET /health` -> `{ ok: true }`
- `GET /movies` -> `{ ok: true, items: Movie[] }`
- `GET /movies/:id/screenings` -> `{ ok: true, items: Screening[] }`
- alias optionnel : `GET /movies/:id/seances`

### Typage attendu pour le router

Objectif : **zero `any`** et signatures explicites.

```ts
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Pool } from "pg";
import type { MovieRepository } from "./Infrastructure/MovieRepository.js";
import type { ScreeningRepository } from "./Infrastructure/ScreeningRepository.js";

type RouterDeps = {
  pool: Pool;
  movies: MovieRepository;
  screenings: ScreeningRepository;
};

export async function router(
  req: IncomingMessage,
  res: ServerResponse,
  deps: RouterDeps
): Promise<void> {
  // ...
}
```

### Helpers JSON (dans `router.ts`)

```ts
function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { ok: false, error: message });
}
```

### Parsing de route avec Zod (exemple)

```ts
const parsedMovieId = MovieIdSchema.safeParse(segments[1]);
if (!parsedMovieId.success) {
  return sendError(res, 400, "Invalid movie id");
}
const movieId = parsedMovieId.data;
```

### Gestion de branche de route (exemple)

```ts
if (method === "GET" && path === "/movies") {
  const items = await movies.list();
  return sendJson(res, 200, { ok: true, items });
}
```

Erreurs a gerer :
- `400` : id invalide
- `404` : route inconnue
- `500` : erreur serveur (message generique)

Conseil typing : faire retourner `Promise<void>` au router et `void` aux helpers `sendJson/sendError`.

## `server.ts` : brancher le router

Role de `server.ts` : instancier les repositories et brancher le router.

Si vous voulez aller plus loin :
- le router peut deleguer a des controllers
- les controllers deleguent ensuite a la couche Application

Dans ce cas, ajoutez un dossier `Application/` et un dossier `Controllers/`.

Separation propre : `Router -> Controllers -> Application -> Infrastructure`.

- `Application` = logique metier (use cases), sans dependance HTTP.
- `Controllers` = couche transport HTTP (status code, req/res).

Exemple court :

```ts
const movies = new MovieRepository(pool);
const screenings = new ScreeningRepository(pool);

const server = createServer(async (req, res) => {
  await router(req, res, { pool, movies, screenings });
});
```

## Tests manuels (`curl` ou Insomnia)

```bash
curl -s http://localhost:3001/health
curl -s http://localhost:3001/movies
curl -s http://localhost:3001/movies/1/screenings
```

Tests d'erreur utiles :

```bash
curl -s http://localhost:3001/movies/abc/screenings
curl -s http://localhost:3001/unknown
```

## Criteres de validation

- structure des fichiers respectee
- SQL uniquement dans les repositories
- Zod utilise pour `env` + entrees `router`
- endpoints GET fonctionnels
- retours JSON coherents
- aucun `any`

---

## Partie 2 : evolution vers Drizzle (apres le cours Drizzle)

Quand la Partie 1 est stable, vous pouvez evoluer sans casser l'architecture (sur une nouvelle branche).

1. Installer Drizzle :

```bash
npm i drizzle-orm
npm i -D drizzle-kit
```

2. Ajouter :
- `Infrastructure/schema.ts`
- `Infrastructure/drizzle.ts`

3. Migrer les repositories vers Drizzle.

4. Etendre l'API REST :
- `GET /movies/:id`
- `POST /movies`
- `PUT /movies/:id`
- `PATCH /movies/:id`
- `DELETE /movies/:id`
