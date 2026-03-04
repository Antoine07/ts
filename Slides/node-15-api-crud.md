---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 15 Faire évoluer le TP Movie en API REST complète"
---

# 15 — CRUD API avec Drizzle
## De `GET` uniquement vers `GET/POST/PUT/PATCH/DELETE`

---

# Objectif du chapitre

- Ajouter les verbes REST au TP Movie
- Garder la structure `router + repositories`
- Utiliser Drizzle dans les écritures DB
- Stabiliser les contrats JSON

---

# Phase 0 (état actuel du TP)

Routes déjà en place :
- `GET /movies`
- `GET /movies/:id/screenings`

Objectif : enrichir progressivement sans casser l'existant.

---

# Phase 1 : ajouter `GET /movies/:id`

```ts
const [movie] = await db
  .select()
  .from(movies)
  .where(eq(movies.id, id))
  .limit(1);

if (!movie) return sendError(res, 404, "Movie not found");
return sendJson(res, 200, { ok: true, item: movie });
```

On commence par un endpoint lecture simple.

---

# Phase 2 : ajouter `POST /movies`

```ts
const input = CreateMovieSchema.parse(payload);

const [created] = await db
  .insert(movies)
  .values(input)
  .returning();

return sendJson(res, 201, { ok: true, item: created });
```

---

# Schéma de validation (`zod`)

```ts
const CreateMovieSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  durationMinutes: z.number().int().positive(),
  rating: z.string().nullable().optional(),
  releaseDate: z.string().nullable().optional(),
});
```

Validation runtime obligatoire sur `POST/PUT/PATCH`.

---

# Phase 3 : `PUT /movies/:id` (remplacement complet)

`PUT` = état complet de la ressource.

```ts
const input = ReplaceMovieSchema.parse(payload);

const [updated] = await db
  .update(movies)
  .set(input)
  .where(eq(movies.id, id))
  .returning();

if (!updated) return sendError(res, 404, "Movie not found");
return sendJson(res, 200, { ok: true, item: updated });
```

---

# Phase 4 : `PATCH /movies/:id` (partiel)

```ts
const patch = PatchMovieSchema.parse(payload);

const [updated] = await db
  .update(movies)
  .set(patch)
  .where(eq(movies.id, id))
  .returning();

if (!updated) return sendError(res, 404, "Movie not found");
return sendJson(res, 200, { ok: true, item: updated });
```

`PatchMovieSchema = ReplaceMovieSchema.partial()`

---

# Phase 5 : `DELETE /movies/:id`

```ts
const deleted = await db
  .delete(movies)
  .where(eq(movies.id, id))
  .returning({ id: movies.id });

if (deleted.length === 0) return sendError(res, 404, "Movie not found");
res.writeHead(204).end();
```

---

# Status codes à stabiliser dans le TP

- `200` : lecture / update
- `201` : création
- `204` : suppression sans body
- `400` : id ou body invalide
- `404` : ressource introuvable
- `500` : erreur non prévue

Même contrat JSON sur tous les endpoints.

---

# Bonus Movie : `POST /movies/:id/screenings`

Cas multi-table, utile pour introduire les transactions :

```ts
await db.transaction(async (tx) => {
  // 1) vérifier que le movie existe
  // 2) insérer une séance
  // 3) rollback auto si erreur
});
```

---

# À retenir

- On fait évoluer le TP Movie par étapes
- Drizzle facilite le CRUD sans casser l'architecture
- REST = verbes justes + status codes justes + validation runtime
