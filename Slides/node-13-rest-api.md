---
marp: true
theme: default
paginate: true
class: lead
header: "[index](https://antoine07.github.io/ts)"
title: "Node.js — 13 Théorie API REST"
---

# 13 — Théorie API REST
## Ressources, verbes HTTP, statuts

---

# Objectif du chapitre

- Comprendre ce qu'est une API REST
- Savoir modéliser des ressources
- Maîtriser les verbes HTTP d'une API
- Choisir les bons status codes

---

# API REST : idée centrale

Une API REST expose des **ressources** via HTTP.

Exemples de ressources :
- `movies`
- `screenings`
- `users`

>Chaque ressource a une URL stable et des représentations JSON.

---

# Contraintes REST 

- **Client/Serveur** : responsabilités séparées
- **Stateless** : chaque requête porte son contexte
- **Cacheable** : certaines réponses peuvent être cachées
- **Uniform Interface** : conventions HTTP cohérentes

>En pratique : API prévisible pour front, mobile, partenaires.

---

# Contraintes REST  1/2

- **Client/Serveur**  
  Le front affiche et appelle l'API.  
  L'API contient la logique métier et l'accès DB.

- **Stateless**  
  Chaque requête est autonome.  
  Ex: `GET /movies/1/screenings` 

- Le serveur n'a pas besoin de “se souvenir” d'une requête précédente pour traiter la
suivante.
- Chaque requête apporte ce qu'il faut (URL, params, body, headers/token).

# Contraintes REST 2/2

- **Cacheable**  
  Certaines réponses peuvent être réutilisées un moment.  
  Ex: `GET /movies` peut être mis en cache.

- **Uniform Interface**  
  Même conventions partout : ressources, verbes, status codes.  
  Ex: `GET /movies`, `POST /movies`, `DELETE /movies/:id`.

---

# Modéliser les URLs 

Bon style :
- `/movies`
- `/movies/:id`
- `/movies/:id/screenings`

À éviter :
- `/getMovies`
- `/createMovie`

>L'action vient du verbe HTTP, pas du chemin.

---

# Pourquoi c'est important pour la documentation

Une URL bien modélisée :
- rend l'API plus lisible
- simplifie la documentation
- rend les tests plus simples à écrire
- accélère l'intégration front/mobile

Règle simple :
- URL = ressource
- verbe HTTP = intention

---

# Les verbes HTTP 

- `GET` : lire
- `POST` : créer
- `PUT` : remplacer entièrement
- `PATCH` : modifier partiellement
- `DELETE` : supprimer

>Une API REST sérieuse utilise ces verbes correctement.

---

# API REST full vs "RESTful" 1/2

Dans la pratique, on entend souvent REST full.

Le terme correct est **RESTful** :
- API qui suit les principes REST
- ressources bien modélisées
- verbes HTTP cohérents
- statuts HTTP cohérents
- API stateless (pas d'état de session conservée entre deux états, la requête contient l'informatio)

---

# API REST full vs "RESTful" 2/2

Donc :
- REST full = expression courante
- **RESTful** = terme précis

>Vous pouvez utiliser les deux.

---

# `GET` et `POST`

`GET /movies`
- liste de ressources
- doit être sans effet de bord

`POST /movies`
- crée une nouvelle ressource
- retourne souvent `201 Created`

---

# `PUT` vs `PATCH`

`PUT /movies/:id`
- remplace toute la ressource
- client envoie l'état complet attendu

`PATCH /movies/:id`
- modifie seulement certains champs
- utile pour mises à jour partielles

---

# `DELETE` et idempotence

`DELETE /movies/:id`
- supprime la ressource
- réponse fréquente : `204 No Content`

Idempotence :
- `PUT` et `DELETE` sont idempotents
- `POST` ne l'est généralement pas

---

# Status codes à maîtriser / utiliser 

- `200 OK` : succès standard
- `201 Created` : création
- `204 No Content` : succès sans body
- `400 Bad Request` : format invalide
- `404 Not Found` : ressource absente
- `409 Conflict` : conflit métier/unicité
- `422 Unprocessable Entity` : validation métier
- `500 Internal Server Error` : erreur serveur

---

# Contrat de réponse cohérent

Exemple :

```json
{
  "ok": false,
  "error": "ValidationError",
  "message": "title is required"
}
```

>Le front doit traiter les erreurs via status codes + codes d'erreur documentés.

---

# Filtrage, tri, pagination

Sur `GET /movies` :
- filtre : `?title=alien`
- tri : `?sort=title&order=asc`
- pagination : `?page=2&limit=20`

>Toujours documenter les paramètres.

---

# Cas d'usage (notre infra Movie)

Cette architecture API sert par exemple :
- site web cinema : catalogue + horaires
- borne en salle : recherche rapide des seances
- back-office : gestion films, salles, tarifs
- partenaire externe : synchronisation des programmes

>Même API, clients differents, contrat HTTP unique.

---

# Flux pratique d'une requete

Exemple `GET /movies/1/screenings` :
1. `router.ts` matche la route et valide `movieId`
2. `ScreeningRepository` execute SQL parametre (`$1`)
3. Postgres retourne les lignes
4. repository mappe vers le type Domain `Screening`
5. router renvoie `{ ok: true, items }`

>Ce flux est simple, testable et maintenable.

---

# Cas pratique 1 : page \"Catalogue\"

Besoin front :
- afficher 20 films tries par titre
- filtrer par note age (`PG-13`, `R`, ...)

API :
- `GET /movies?limit=20&sort=title&order=asc&rating=PG-13`

Infrastructure :
- router parse query
- repository construit une query SQL parametree
- reponse JSON stable pour le front

---

# Cas pratique 2 : fiche film + seances

Besoin front :
- details film
- seances du jour par salle

API :
- `GET /movies/:id`
- `GET /movies/:id/screenings`

Infrastructure :
- deux endpoints specialises
- deux repositories clairs
- erreurs previsibles (`400`, `404`, `500`)

---

# À retenir

- REST = ressources + conventions HTTP stables
- les verbes donnent l'intention métier
- les status codes donnent le contrat de succès/erreur
- la valeur pratique vient du duo `router + repositories`

Prochaine étape : implémenter ça avec Drizzle ORM.


---

# TP 

`TPs/Movie/tp-movie.md`
