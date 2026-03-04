---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 11 HTTP (node:http)"
---

# 11 — Node.js
## Le module `node:http` (serveur HTTP)

---

# Objectif du chapitre

- Comprendre requête / réponse HTTP
- Créer un serveur `node:http` en TypeScript
- Router "à la main" (méthode + chemin)
- Parser simplement `path` et `query`

Cas métier : mini API "films / séances".

---

# Rappels HTTP (essentiel)

Une requête HTTP = :
- méthode : `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, …
- URL : `/health`, `/movies?limit=10`
- headers : `Content-Type`, `Authorization`, …
- body (optionnel) : surtout pour `POST/PUT/PATCH`

Une réponse HTTP = :
- status code : `200`, `201`, `400`, `404`, `500`, …
- headers
- body

---

# Les verbes HTTP (intention)

- `GET` : lire une ressource
- `POST` : créer / déclencher une action
- `PUT` : remplacer (souvent une ressource entière)
- `PATCH` : modifier partiellement
- `DELETE` : supprimer

Dans ce chapitre, focus sur `GET` (fondamentaux).

---

# Serveur HTTP minimal (TypeScript)

```ts
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  const method = req.method ?? "GET";
  const rawUrl = req.url ?? "/";
  const path = rawUrl.split("?", 2)[0] ?? "/";

  if (method === "GET" && path === "/health") {
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { ok: false, error: "Not Found" });
});

server.listen(3001, "0.0.0.0");
```

---

# Parser une query simplement

Objectif : supporter `GET /movies?limit=2`

```ts
const rawUrl = req.url ?? "/";
const [path, queryString = ""] = rawUrl.split("?", 2);
const params = new URLSearchParams(queryString);

const limit = Number(params.get("limit") ?? "10");
```

Note : `URLSearchParams` parse une query string, sans construire une URL complète.

---

# Exemple métier : `GET /movies`

```ts
const movies = ["Heat", "Alien", "Arrival"];

if (method === "GET" && path === "/movies") {
  const [_, queryString = ""] = rawUrl.split("?", 2);
  const params = new URLSearchParams(queryString);
  const limit = Number(params.get("limit") ?? String(movies.length));

  return sendJson(res, 200, { items: movies.slice(0, limit) });
}
```

---

# Paramètres de route (sans framework)

Objectif : `GET /movies/42/screenings`

```ts
const segments = path.split("/").filter(Boolean);
// "/movies/42/screenings" -> ["movies", "42", "screenings"]

if (method === "GET" && segments[0] === "movies" && segments[2] === "screenings") {
  const movieId = Number(segments[1]);
  if (Number.isNaN(movieId)) return sendJson(res, 400, { error: "Invalid movieId" });

  return sendJson(res, 200, { movieId, items: [] });
}
```

---

# Pourquoi `POST` demande plus de travail ?

Pour `POST/PUT/PATCH`, il faut gérer :
- lecture du body (stream)
- `Content-Type` + parsing JSON
- limites (taille max)
- validation runtime (TypeScript ne suffit pas)

On reviendra sur la validation quand on parlera du "monde réel" et de la DB.
