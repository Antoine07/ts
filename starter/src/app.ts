import express, { type NextFunction, type Request, type Response } from "express";

const app = express();

function validateMinAge(
  req: Request<unknown, unknown, unknown, { minAge?: string }>,
  res: Response,
  next: NextFunction
): void {
  const minAge = Number(req.query.minAge ?? "18");
  if (!Number.isInteger(minAge) || minAge <= 0) {
    res.status(400).json({ ok: false, error: "InvalidMinAge" });
    return;
  }
  res.locals.minAge = minAge;
  next();
}

app.get("/demo/access", validateMinAge, (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, minAge: res.locals.minAge });
});

const port = Number(process.env.PORT ?? 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`Express middleware demo on http://localhost:3007`);
  console.log("Try: GET /demo/access?minAge=18");
});
