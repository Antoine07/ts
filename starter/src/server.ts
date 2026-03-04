import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { pool } from "./Infrastructure/DB.js";
import { MovieRepository } from "./Infrastructure/MovieRepository.js";
import { ScreeningRepository } from "./Infrastructure/ScreeningRepository.js";
import { router } from "./router.js";

const PORT = Number(process.env.PORT ?? 3000);

const movies = new MovieRepository(pool);
const screenings = new ScreeningRepository(pool);
const deps = { pool, movies, screenings };

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  await router(req, res, deps);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`http://localhost:${PORT}`);
});
