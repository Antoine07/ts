---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js - 17 Express et API RESTful (sans CRUD)"
---

# 17 - Express et API RESTful
## Aller plus vite sur HTTP, sans partir sur un CRUD complet

---

# Objectif du chapitre

- Comprendre ce que simplifie Express
- Mettre en place un router propre
- Définir des routes RESTful lisibles
- Standardiser les réponses JSON et erreurs
- Rester focalisé sur la structure, pas sur un CRUD complet

---

# Pourquoi Express ?

Avec `node:http`, on gère tout à la main :
- parsing URL
- matching des routes
- gestion des erreurs

Express apporte :
- routing clair (`app.get`, `router.get`)
- middlewares réutilisables
- flux requête/réponse plus lisible

---

# Express est-il encore utilisé ?

**Express est encore très utilisé** :
- énorme écosystème
- beaucoup de projets historiques en production
- API simple à prendre en main

Mais sur des projets TypeScript récents, d'autres options sont souvent choisies.

---

# Alternatives pro fréquentes

- **Fastify** : très bon niveau de performance, plugins, schémas JSON
- **NestJS** : architecture très structurée (modules, controllers, DI)
- **Hono** : minimaliste, rapide, DX moderne
- **Koa** : plus bas niveau et composable, souvent plus "clean" qu'Express

---

# Pourquoi certains ne choisissent plus Express en 1er mais Fastify ou NestJS

- typage TypeScript moins "guidé" par défaut que certains frameworks modernes
- peu de structure imposée (risque d'architecture incohérente si l'équipe débute)
- performance brute inférieure à Fastify dans de nombreux cas

Conclusion :
- Express reste valable
- mais Fastify/NestJS sont souvent préférés sur de nouveaux projets

---

# Installation minimale

```bash
npm add express zod
pnpm add -D @types/express
```

---

# Premier serveur Express

```ts
import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("API listening on http://localhost:3001");
});
```

---

# `0.0.0.0` vs nom de service Docker

Dans `app.listen(3001, "0.0.0.0")` :
- `0.0.0.0` = adresse d'ecoute locale du serveur
- cela veut dire "ecouter sur toutes les interfaces du conteneur"

Le nom de service (`postgres`, `app`, ...) sert pour les connexions sortantes :
- ex DB : `host: "postgres"`

Resume :
- **serveur HTTP** -> `0.0.0.0`
- **client DB/HTTP** -> nom du service

---

# Notions clés Express

- `app` : point d'entrée HTTP
- `req` : requête entrante
- `res` : réponse sortante
- `next` : passer au middleware suivant
- `router` : groupe de routes par ressource

---

# Middleware JSON 

```ts
import express from "express";

const app = express();
app.use(express.json());
```

`express.json()` parse automatiquement le body JSON.

---

# Middleware JSON 

```ts
app.use(express.json({ limit: "1mb" }));
```

**limit: "1mb" fixe la taille max du body JSON accepté à 1 Mo.**

---

Ce que fait ce middleware :
- lit le body brut de la requête
- parse le JSON automatiquement
- met le resultat dans `req.body`

Sans `express.json()` :
- `req.body` est `undefined`

Avec `express.json()` :
- `req.body` contient l'objet JS
- JSON invalide => erreur `400 Bad Request`

---

# Middleware = plusieurs couches de logique

Un middleware est une fonction qui :
- lit/modifie `req` et `res`
- peut arreter la requete (reponse immediate)
- ou passer a la couche suivante avec `next()`

Idee cle :
- on decoupe la logique en couches reutilisables

---

# Exemple de pipeline middleware

Pour `GET /demo/access?minAge=18`, on peut faire :
- couche 1 : validation `minAge`
- couche 2 : handler metier simple

Chaque couche a une responsabilite claire.

---

# Exemple concret (plusieurs couches)

```ts
function validateMinAge(req: Request, res: Response, next: NextFunction) {
  const minAge = Number(req.query.minAge ?? "18");
  if (!Number.isInteger(minAge) || minAge <= 0) {
    return res.status(400).json({ ok: false, error: "InvalidMinAge" });
  }
  res.locals.minAge = minAge;
  next();
}

app.get("/demo/access", validateMinAge, (_req, res) => {
  return res.json({ ok: true, minAge: res.locals.minAge });
});
```

---

# Créer un router Movies

```ts
import { Router } from "express";

export const movieRouter = Router();

movieRouter.get("/", (_req, res) => {
  res.json({ ok: true, items: [] });
});
```

---

# Brancher le router dans `server.ts`

```ts
import express from "express";
import { movieRouter } from "./router/movies.router.js";

const app = express();
app.use(express.json());

app.use("/movies", movieRouter);
```

`/movies` devient le préfixe de toutes les routes du router.

---

# Exemple RESTful sans CRUD complet

Dans Movie, on peut démarrer avec lecture seulement :
- `GET /movies`
- `GET /movies/:id`
- `GET /movies/:id/screenings`

Objectif :
- modéliser les ressources
- stabiliser le contrat d'API

---

# Paramètres de route (`req.params`)

```ts
movieRouter.get("/:id", (req, res) => {
  const movieId = Number(req.params.id);
  if (Number.isNaN(movieId)) {
    return res.status(400).json({ ok: false, error: "InvalidMovieId" });
  }

  return res.json({ ok: true, item: { id: movieId, title: "Heat" } });
});
```

---

# Query string (`req.query`)

Exemples d'URL :
- `GET /movies?limit=5`
- `GET /movies?limit=20`

Dans Express :
- `req.query.limit` vaut `"5"` ou `"20"` (string)
- on convertit ensuite en `number`

```ts
movieRouter.get("/", (req, res) => {
  const limit = Number(req.query.limit ?? "10");
  if (Number.isNaN(limit) || limit <= 0) {
    return res.status(400).json({ ok: false, error: "InvalidLimit" });
  }

  return res.json({ ok: true, limit, items: [] });
});
```

---

## Rappels

 - params = dans le chemin
    Ex: /movies/42
    Ici 42 est req.params.id
  - query string = après ?
    Ex: /movies?limit=10
    Ici limit est req.query.limit

  En pratique :

  - params identifient une ressource
  - query modifie la lecture (filtre, tri, pagination)

---

# Validation des entrees avec Zod

Pourquoi dans Express :
- valider a la frontiere HTTP (`params`, `query`, `body`)
- eviter les conversions manuelles repetitives
- renvoyer des erreurs `400` coherentes

---

# Zod sur `params` + `query`

```ts
import { z } from "zod";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(10),
});

movieRouter.get("/:id", (req, res) => {
  const parsedParams = paramsSchema.safeParse(req.params);
  const parsedQuery = querySchema.safeParse(req.query);
  if (!parsedParams.success || !parsedQuery.success) {
    return res.status(400).json({ ok: false, error: "ValidationError" });
  }

  const movieId = parsedParams.data.id;
  const limit = parsedQuery.data.limit;
  return res.json({ ok: true, movieId, limit });
});
```

---

# Zod sur un body JSON

```ts
const filterBodySchema = z.object({
  movieId: z.number().int().positive(),
  from: z.string().datetime().optional(),
});

movieRouter.post("/screenings/filter", (req, res) => {
  const parsedBody = filterBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    return res.status(400).json({
      ok: false,
      error: "ValidationError",
      details: parsedBody.error.flatten().fieldErrors,
    });
  }

  return res.json({ ok: true, filter: parsedBody.data });
});
```

---

# Ce que fait `flatten().fieldErrors`

- transforme les erreurs Zod en objet simple par champ
- format facile a exploiter cote front

Exemple :

```json
{
  "movieId": ["Number must be greater than 0"],
  "from": ["Invalid datetime"]
}
```

---

# RESTful: ce que cela veut dire ici

- URL orientée ressource (`/movies`, pas `/getMovies`)
- verbe HTTP cohérent avec l'intention (`GET` pour lire)
- réponses auto-descriptives (status + JSON clair)
- API stateless (chaque requête porte son contexte)

---

# API stateless (rappel pratique)

Stateless signifie :
- le serveur ne dépend pas d'un "état de requête précédente"
- chaque requête est autonome

Exemple :
- `GET /movies/1/screenings?from=2026-03-05`
- l'URL contient déjà le contexte de lecture

---

# Contrat JSON cohérent

Succès :

```json
{ "ok": true, "items": [] }
```

Erreur :

```json
{ "ok": false, "error": "InvalidMovieId" }
```

Le front peut traiter les réponses sans heuristique.

---

# Middleware 404

```ts
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: "NotFound" });
});
```

Toutes les routes inconnues ont un format de réponse stable.

---

# Middleware d'erreur global

```ts
import type { NextFunction, Request, Response } from "express";

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ ok: false, error: "InternalServerError" });
});
```

---

# Typage et validation (progression)

Simple et lisible :
- parser `req.params.id` en `number`
- vérifier `Number.isNaN(...)`
- renvoyer une erreur `400` claire

Progression recommandée :
- d'abord validation manuelle
- puis Zod quand l'app grossit

---

# Structure simple recommandée

- `server.ts` : création app Express + middlewares globaux
- `router/movies.router.ts` : routes HTTP
- `Infrastructure/*Repository.ts` : accès DB
- `Domain/*` : types et logique métier

Même séparation que le TP Movie.

---

# Ce que vous devez retenir

- Express accélère le routing et la lisibilité
- RESTful commence par une bonne modélisation des routes
- Pas besoin d'un CRUD complet pour faire une API propre
- Contrat JSON + statuts HTTP = intégration front plus simple
