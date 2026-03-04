---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 10 Introduction (Node 24)"
---

# 10 — Node.js (Node 24)
## Introduction et contexte

---

# Pourquoi Node dans ce cours ?

Cas métier : exposer une API (films / séances) et accéder à une base PostgreSQL.

Objectif :
- comprendre l'exécution (runtime) : “le programme tourne”
- séparer exécution et typage : “le type-check protège”

---

# C'est quoi Node.js ?

Node.js est un **runtime JavaScript** :
- exécute du JavaScript **hors navigateur**
- s'appuie sur **V8** (moteur JS)
- fournit des APIs système (fichiers, réseau, processus…)
- gère l'I/O via **libuv** (modèle asynchrone)

Node n'est pas un langage : c'est une plateforme d'exécution.

---

# Un peu d'historique (repères)

- 2009 : Ryan Dahl présente Node.js (I/O non bloquantes + event loop)
- npm devient le standard de distribution de packages
- Node se généralise côté serveur et tooling (scripts, build, CLIs)

Aujourd'hui (Node 24) : environnement moderne (ESM, APIs Web, tooling TS).

---

# Runtime vs TypeScript (rappel clé)

TypeScript :
- vérifie **avant** l'exécution (compile-time)
- disparaît au runtime (les types n'existent pas)

Node :
- exécute du JavaScript
- ne “comprend” pas les types

Conclusion : il faut un workflow (exécution + type-check).

---

# Modèle mental : event loop (très simplifié)

Node exécute JavaScript sur un **thread principal**.

Pour l'I/O (réseau, DB, fichiers) :
- on déclenche une opération asynchrone
- le thread JS n'est pas bloqué
- quand l'I/O termine, Node reprend via callbacks/promesses

Résultat : très bon pour des applications **I/O-bound**.

---

# I/O-bound vs CPU-bound (cas métier)

I/O-bound (souvent Node) :
- API HTTP → attend DB / réseau
- import/export de fichiers

CPU-bound (vigilance) :
- traitement image/vidéo
- calculs lourds (parcours massif, crypto, ML)

Quand c'est CPU-bound : envisager workers, queues, ou service dédié.

---

# Modules : CommonJS vs ESM

CommonJS (historique) :
```js
const fs = require("node:fs");
module.exports = {};
```

ESM (moderne) :
```ts
import { readFile } from "node:fs/promises";
export const x = 1;
```

Dans ce repo : `type: "module"` → ESM (`import/export`).

---

# APIs Node “de base” (à connaître)

- `node:http` : serveur HTTP bas niveau
- `node:fs` / `node:fs/promises` : fichiers
- `node:path` : chemins
- `node:process` : environnement, arguments, exit codes
- `node:crypto` : hash, random, signatures

Idée : comprendre les fondamentaux avant d'ajouter un framework.

---

# Node 24 : ce qui compte ici

- langage moderne (ES modules, top-level `await` selon config)
- APIs Web présentes (ex: `fetch` côté serveur)
- outillage “watch” possible (selon workflow)

Dans le cours : TypeScript passe par le tooling (`tsx`, `tsc`).

---

# Workflow recommandé (double terminal)

Principe :
- Terminal A : exécution (serveur HTTP)
- Terminal B : type-check en continu

Message clé :

> TypeScript ne protège que si le type-check tourne.
