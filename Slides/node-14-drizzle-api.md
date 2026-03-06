---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 14 Drizzle ORM (evolution du TP Movie)"
---

# 14 — Drizzle ORM
## Faire evoluer le TP Movie sans casser l'architecture

---

# Objectif du chapitre

- comprendre l'interet de Drizzle dans notre contexte
- garder une approche SQL-first et lisible
- maitriser les relations (`1 -> N`, `N -> 1`) en pratique
- appliquer une demarche propre : DB, migrations, verification

---

# Comparaison rapide : Drizzle vs Doctrine

- **Drizzle (SQL-first)** : requetes explicites, proche SQL, tres lisible cote DB
- **Doctrine (Symfony)** : approche entites/objets, plus d'abstraction

Les deux sont valides :
- Drizzle = controle fin SQL + typage TS
- Doctrine = confort objet + conventions ORM

---

# Doctrine (Symfony) - many-to-many 

```php
#[ORM\Entity]
class Movie {
  #[ORM\ManyToMany(targetEntity: Genre::class, inversedBy: 'movies')]
  private Collection $genres;
}

#[ORM\Entity]
class Genre {
  #[ORM\ManyToMany(targetEntity: Movie::class, mappedBy: 'genres')]
  private Collection $movies;
}
```

Avec Doctrine : on manipule surtout des objets/collections.

---

# Pourquoi Doctrine est interessant

- modele objet naturel pour les equipes Symfony (Entity, Repository)
- relations chargees via ORM, moins de SQL explicite au depart
- gains de vitesse sur du CRUD classique avec conventions stables

Comparaison :
- Doctrine : plus abstrait, plus "objet"
- Drizzle SQL-first : plus explicite, plus proche du SQL

---

# historique - ORM

Repere rapide :
- annees 2000 : forte adoption des ORM (Hibernate, Doctrine, ActiveRecord)
- objectif : eviter le SQL string disperse partout
- principe : mapper tables et relations vers du code

Drizzle aujourd'hui :
- ORM TypeScript moderne
- positionnement **SQL-first** (requetes explicites, peu de magie)

---

# SQL-first : en quelques mots

SQL-first veut dire :
- le modele SQL reste la source de verite
- le code TypeScript s'aligne sur ce modele
- on garde visibles les `join`, `where`, `orderBy`

Donc :
- moins d'erreurs runtime
- sans masquer la logique relationnelle

---


# Impact REST et Drizzle

`GET /movies`
- lit `movies`

`GET /movies/:id/screenings`
- lit `screenings`
- joint `rooms`
- filtre sur `movie_id`

Le design REST suit le modele relationnel.

---

# Installer Drizzle (dans `starter-drizzle/`)

Récupérez le stater sur le dépôt, lancez les conteneurs. Normalement vous avez tout dans les conteneurs donc, vous pouvez faire un `docker compose [name_conteneur] --build -d

Ne mélangez jamais `npm` et `pnpm`, sinon vous allez avoir des conflits.

```bash
pnpm add drizzle-orm
pnpm add -D drizzle-kit  # la cli de Drizzle
```

---

# Structure dans ce starter-drizzle

```txt
src/
  db.ts
  schemas/
    schema.ts
    schema.sql
  server.ts
drizzle.config.ts
drizzle/
```

---

# `src/drizzle/schema.ts`

```ts
import { pgTable, uuid, text, integer, date, timestamp, numeric } from "drizzle-orm/pg-core";

export const movies = pgTable("movies", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  rating: text("rating"),
  releaseDate: date("release_date"),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  capacity: integer("capacity").notNull(),
});

export const screenings = pgTable("screenings", {
  id: uuid("id").primaryKey(),
  movieId: uuid("movie_id").notNull(),
  roomId: uuid("room_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  price: numeric("price", { precision: 6, scale: 2 }).notNull(),
});
```

---

# `src/db.ts` + client Drizzle

```ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const pool = new Pool({
  host: "postgres",
  port: 5432,
  user: "postgres",
  password: "postgres",
  database: "db_sandbox",
});

export const db = drizzle(pool);
```

---

# Creer la base sandbox


```bash
docker exec -it db-postgres-movie-starter psql -U postgres -d db -c "SELECT datname FROM pg_database WHERE datname IN ('db', 'db_sandbox');"
```

---

# Configurer `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

 export default defineConfig({
    dialect: "postgresql", // SGBD cible : PostgreSQL
    schema: "./src/drizzle/schema.ts", // Fichier TS qui décrit les tables
    out: "./drizzle", // Dossier de sortie des migrations SQL générées
    dbCredentials: {
      host: "postgres", // Hôte DB (nom du service Docker Compose)
      port: 5432, // Port PostgreSQL côté conteneur
      user: "postgres", // Utilisateur PostgreSQL
      password: "postgres", // Mot de passe PostgreSQL
      database: "db_sandbox", // Base de données ciblée
      ssl: false, // SSL désactivé (en local Docker)
    },
  });
```

---

# Generer puis appliquer la migration

```bash
pnpm exec drizzle-kit generate --config drizzle.config.ts
pnpm exec drizzle-kit migrate --config drizzle.config.ts
```

---

# Inserer des donnees de test 

Depuis votre machine hôte insérer les données.

```bash
docker exec -i db-postgres-movie psql -U postgres -d db < src/schema.sql
```

---

# Exemple - lister les films

```ts
import { asc } from "drizzle-orm";
import { db } from "../db";
import { movies } from "./schema";

export async function listMovies() {
  return db
    .select()
    .from(movies)
    .orderBy(asc(movies.id));
}

listMovies().then(console.log)
```

---

# Exemple - relation `movie -> screenings -> room`

```ts
import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { movies, screenings, rooms } from "./schema";

export async function getMovieSchedule(movieId: string) {
  return db
    .select({
      movieId: movies.id,
      movieTitle: movies.title,
      screeningId: screenings.id,
      startTime: screenings.startTime,
      roomName: rooms.name,
    })
    .from(movies)
    .innerJoin(screenings, eq(screenings.movieId, movies.id))
    .innerJoin(rooms, eq(rooms.id, screenings.roomId))
    .where(eq(movies.id, movieId))
    .orderBy(asc(screenings.startTime));
}
```

---

# Exemple  - compter les seances par film

```ts
import { eq, count } from "drizzle-orm";
import { db } from "../db";
import { movies, screenings } from "./schema";

export async function listMoviesWithCount() {
  return db
    .select({
      id: movies.id,
      title: movies.title,
      screeningsCount: count(screenings.id),
    })
    .from(movies)
    .leftJoin(screenings, eq(screenings.movieId, movies.id))
    .groupBy(movies.id, movies.title);
}
```

---

# Exemple  - creation relationnelle controlee

```ts
import { eq } from "drizzle-orm";
import { db } from "../db";
import { movies, rooms, screenings } from "./schema";

export async function createScreening(input: {
  movieId: string;
  roomId: string;
  startTime: Date;
  price: string;
}) {
  const [movie] = await db.select({ id: movies.id }).from(movies).where(eq(movies.id, input.movieId));
  const [room] = await db.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, input.roomId));
  if (!movie || !room) return null;

  const [created] = await db.insert(screenings).values(input).returning();
  return created;
}
```

---

# Exemple  - filtre temporel sur une relation

```ts
import { eq, gte, and, asc } from "drizzle-orm";
import { db } from "../db";
import { screenings } from "./schema";

export async function listUpcomingScreenings(movieId: string, from: Date) {
  return db
    .select()
    .from(screenings)
    .where(and(eq(screenings.movieId, movieId), gte(screenings.startTime, from)))
    .orderBy(asc(screenings.startTime));
}
```

---

## Commandes de survi

```bash
docker exec -it db-postgres-movie-starter psql -U postgres -d db -c "DROP DATABASE IF EXISTS db_sandbox WITH (FORCE);"

docker exec -it db-postgres-movie-starter psql -U postgres -d db -c "CREATE DATABASE db_sandbox;"

pnpm exec drizzle-kit generate --config drizzle.config.ts
pnpm exec drizzle-kit migrate --config drizzle.config.ts

docker exec -it db-postgres-movie-starter psql -U postgres -d db_sandbox -c "SELECT id, title FROM movies;"

docker exec -i db-postgres-movie-starter psql -U postgres -d db_sandbox < schema.sql

```
