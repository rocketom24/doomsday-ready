import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { CircularDependencyError } from "./algorithms/rewatch-order";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

// Turns anything thrown inside a route handler into the standard error response.
export function handleError(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.status, error.code, error.message);
  }
  if (error instanceof ZodError) {
    const message = error.issues
      .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
      .join("; ");
    return errorResponse(400, "VALIDATION_ERROR", message);
  }
  if (error instanceof CircularDependencyError) {
    return errorResponse(409, "CIRCULAR_DEPENDENCY", error.message);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = JSON.stringify(error.meta?.target ?? "");
      return target.includes("name")
        ? errorResponse(409, "DUPLICATE_CINEMA", "A cinema with this name already exists.")
        : errorResponse(409, "DUPLICATE_TITLE", "A movie with this title already exists.");
    }
    if (error.code === "P2025") {
      return errorResponse(404, "NOT_FOUND", "Record not found.");
    }
  }
  console.error(error);
  return errorResponse(500, "INTERNAL_SERVER_ERROR", "Something went wrong.");
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "VALIDATION_ERROR", "Request body must be valid JSON.");
  }
}

export function parseId(raw: string, label: string): number {
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id < 1) {
    throw new ApiError(400, "VALIDATION_ERROR", `${label} must be a positive integer.`);
  }
  return id;
}
