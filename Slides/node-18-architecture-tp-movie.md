---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js - 18 Architecture du TP Movie"
---

# 18 - Architecture du TP Movie
## Domain, Application, Infrastructure, Router

---

# Objectif du chapitre

- comprendre qui fait quoi dans l'application
- placer les services au bon endroit
- savoir ou mettre les types TypeScript
- garder une architecture simple pour evoluer vers le CRUD

---

# Vue d'ensemble (version pedagogique)

```txt
src/
  Domain/
  Application/
  Infrastructure/
  Controllers/ 
  router.ts
  server.ts
```

---

# Role de chaque couche

- `Domain/` : coeur metier (types metier, regles metier pures)
- `Application/` : orchestration des cas d'usage (services applicatifs)
- `Infrastructure/` : DB, ORM, repositories, acces technique
- `Controllers/` : adaptation HTTP vers Application 
- `router.ts` : declaration des routes et delegation

- Le router mappe GET /movies/:id/screenings vers une fonction, puis il délègue le traitement à la couche suivante.

- simple : router -> Application (use case)
- plus découplé : router -> Controller -> Application (use case)

---

# On peut avoir des services dans `Application`

`Application` est un bon endroit pour :
- `ListMoviesService` (cas d'usage)
- `GetMovieScheduleService` (cas d'usage)

Ces services :
- appellent les repositories
- appliquent les regles de flux
- ne dependent pas directement de HTTP

---

# Domain 

Domain Service :
- regle metier pure, testable sans DB
- exemple : `isEveningScreening(screening)`
  - screening = une séance (horaire d'un film)
  - isEvening = booléen (true/false) selon l'heure

Application Service :
- enchaine plusieurs operations
- exemple : charger les seances puis enrichir la reponse

---

# Exemple de service applicatif 1/2

Use case GetMovieSchedule
"Pour un movieId, récupérer les séances, enrichir chaque séance avec isEvening, puis renvoyer un
résultat prêt pour l'API."

---

# Exemple de service applicatif 2/2

```ts
import type { ScreeningRepository } from "../Infrastructure/ScreeningRepository.js";
import { isEveningScreening } from "../Domain/ScreeningService.js";

export async function getMovieSchedule(
  screenings: ScreeningRepository,
  movieId: number
) {
  const items = await screenings.listByMovieId(movieId);
  return items.map((s) => ({ ...s, isEvening: isEveningScreening(s) }));
}
```

---

# Flux d'une requete 

- `router.ts` parse `movieId` et valide
- appelle `Application/getMovieSchedule`
- le service appelle `Infrastructure/ScreeningRepository`
- le repository lit la DB et mappe vers des types metier
- `router.ts` renvoie la reponse JSON

---

# Ou mettre les types ?

Les types peuvent etre dans plusieurs dossiers.

Regle simple :
- type metier -> `Domain/`
- type de cas d'usage (input/output) -> `Application/`
- type technique (row SQL, config) -> `Infrastructure/`
- type HTTP (params/query/body) -> `Controllers/` ou `router.ts`

---

# Exemples de types par couche

`Domain/Movie.ts`
```ts
export type Movie = { id: number; title: string; durationMinutes: number };
```

`Application/types.ts`
```ts
export type GetMovieScheduleOutput = {
  id: number;
  startTime: string;
  roomName: string;
  isEvening: boolean;
};
```

---

# Types Infrastructure (important)

Quand la DB renvoie un format technique, mappez-le.

```ts
type ScreeningRow = {
  id: number;
  movie_id: number;
  room_name: string;
  start_time: string;
};
```

Puis conversion vers type Domain/Application avant retour.

Un type Infrastructure décrit le format technique brut (DB/ORM), qu'on convertit ensuite en type métier utilisable par l'application.

---

# Exemple concret : mapping Infrastructure -> Domain

```ts
// Domain/Screening.ts
export type Screening = {
  id: number;
  movieId: number;
  startTime: Date;
  price: number;
};

// Infrastructure/ScreeningRow.ts (retour SQL brut)
export type ScreeningRow = {
  id: number;
  movie_id: number;
  start_time: string;
  price: string;
};

// Infrastructure/mappers.ts - votre repository Drizzle par exemple
export function toScreening(row: ScreeningRow): Screening {
  return {
    id: row.id,
    movieId: row.movie_id,
    startTime: new Date(row.start_time),
    price: Number(row.price),
  };
}
```
