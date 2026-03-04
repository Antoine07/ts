// Router HTTP (à implémenter)
//
// Objectif :
// - gérer les routes :
//   - GET /health
//   - GET /movies
//   - GET /movies/:id/screenings
// - envoyer les réponses JSON directement ici (sendJson / sendError)
//
// Conseil :
// - créer deux helpers locaux :
//   - sendJson(res, status, data)
//   - sendError(res, status, message)
// - parser `path` + `segments` avec :
//   - const [path] = (req.url ?? "/").split("?", 2)
//   - const segments = (path ?? "/").split("/").filter(Boolean)

export {};
