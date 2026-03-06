CREATE TABLE "movies" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"rating" text,
	"release_date" date
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"capacity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "screenings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"movie_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"price" numeric(6, 2) NOT NULL
);
