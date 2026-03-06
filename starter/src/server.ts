import { drizzle } from "drizzle-orm/node-postgres";
import { asc, eq, relations } from "drizzle-orm";
import { movies, screenings, rooms } from "./drizzle/schema";
import { pool } from "./db"


export const db = drizzle(pool);

export async function listMovies() {
  const items = await db
    .select()
    .from(movies)
    .orderBy(asc(movies.id));

  return items;
}

listMovies().then(console.log)


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

getMovieSchedule("8c2d4f91-1a6b-4c3e-8f57-9d2a6b4e1c22").then(console.log)
