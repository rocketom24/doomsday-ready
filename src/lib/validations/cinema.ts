import { z } from "zod";

export const createCinemaSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  bundleSizes: z
    .array(z.number().int().min(1).max(500))
    .min(1, "At least one bundle size is required")
    .max(10, "At most 10 bundle sizes are allowed")
    .refine((sizes) => new Set(sizes).size === sizes.length, {
      message: "Bundle sizes must be unique",
    }),
});

export type CreateCinemaInput = z.infer<typeof createCinemaSchema>;
