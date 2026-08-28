import { randomBytes } from "node:crypto";
export function reference(prefix = "LMC") {
  return `${prefix}${randomBytes(7).toString("hex").toUpperCase()}`;
}
