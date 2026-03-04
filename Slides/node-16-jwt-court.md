---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 16 JWT (chapitre court API + Drizzle)"
---

# 16 — JWT (court)
## Authentification API stateless avec Drizzle

---

# C'est quoi un JWT ?

JWT = **JSON Web Token** :
- token signé, transporté côté client
- souvent envoyé dans `Authorization: Bearer <token>`
- permet d'identifier l'utilisateur sans session serveur classique

Usage fréquent : API REST stateless.

---

# Structure d'un JWT

Un JWT contient 3 parties :
- `header` (algorithme, type)
- `payload` (claims : `sub`, `role`, `exp`, ...)
- `signature` (preuve d'intégrité)

Format : `xxxxx.yyyyy.zzzzz`

---

# Point de sécurité critique

Le payload est lisible (Base64URL), pas chiffré.

Donc :
- ne jamais mettre de secret dans le payload
- faire expirer les tokens (`exp`)
- signer avec une clé robuste

---

# Flux court recommandé

1. `POST /auth/login` vérifie email/password (DB via Drizzle)
2. serveur émet :
   - access token court (ex: 15 min)
   - refresh token plus long
3. le refresh token est stocké (hashé) en DB
4. `POST /auth/refresh` renouvelle l'access token
5. route protégée valide `Bearer` et continue, sinon `401`

---

# Tables minimales avec Drizzle

```ts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 190 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
```

---

# Login (principe Drizzle)

```ts
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, input.email))
  .limit(1);

if (!user) return sendJson(res, 401, { error: "Invalid credentials" });
// Vérifier le mot de passe hashé puis signer le JWT
```

---

# Middleware de protection (principe)

```ts
const auth = req.headers.authorization;
if (!auth?.startsWith("Bearer ")) return sendJson(res, 401, { error: "Unauthorized" });

const token = auth.slice("Bearer ".length);
const payload = verifyJwt(token); // signature + exp + claims
req.user = { id: payload.sub, role: payload.role };
```

Si la vérification échoue -> `401`.

---

# Bonnes pratiques minimales

- durée courte pour l'access token
- rotation et révocation des refresh tokens
- clé secrète en variable d'environnement
- stocker les refresh tokens hashés en DB
- ne pas accepter l'algorithme `"none"`
- toujours utiliser HTTPS

---

# À retenir

- JWT = identité signée, pas session serveur
- Drizzle sert à persister users et refresh tokens
- simple à intégrer, facile à mal sécuriser

Commencer petit : login + une route protégée + expiration courte.
