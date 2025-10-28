import { Polar } from "@polar-sh/sdk";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN;
if (!POLAR_ACCESS_TOKEN) {
  throw new Error("Missing Polar access token");
}

export const polar = new Polar({ accessToken: POLAR_ACCESS_TOKEN });
