import z from "zod";

const schema = z.object({
  DATABASE_URL: z.url().startsWith("postgresql://"),
});

export const env = schema.parse(process.env);
