import { z } from "zod";

const movieFields = {
  title: z.string().trim().min(1, "Title is required"),
  releaseYear: z
    .number()
    .int()
    .min(1888, "Release year is too early")
    .max(2100, "Release year is too far in the future"),
  runtime: z.number().int().min(1).max(300),
  prerequisites: z
    .array(z.number().int().positive())
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Prerequisite ids must be unique",
    })
    .optional(),
  watched: z.boolean().optional(),
};

export const createMovieSchema = z.object(movieFields);

export const updateMovieSchema = z
  .object(movieFields)
  .partial()
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided",
  });

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
