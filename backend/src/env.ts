import z from "zod";

const schema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
  FRONTEND_URL: z.url(),
  POLAR_ACCESS_TOKEN: z.string().startsWith("polar_oat_"),
  environment: z.enum(["development", "production"]).default("development"),
});

export const env = schema.parse(process.env);
