import type { Screening } from "./Screening.js";

// Petit exemple de service de domaine : logique metier pure, sans HTTP/DB.
export function isEveningScreening(screening: Screening): boolean {
  const hour = new Date(screening.startTime).getHours();
  return hour >= 18;
}
