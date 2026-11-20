import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleError, parseId, readJson } from "@/lib/api";
import { assertValidPrerequisites, movieInclude } from "@/lib/movies";
import { updateMovieSchema } from "@/lib/validations/movie";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id, "Movie id");
    const { prerequisites, ...fields } = updateMovieSchema.parse(await readJson(request));

    // Check and write in one transaction so a rejected update changes nothing.
    const movie = await prisma.$transaction(async (tx) => {
      const existing = await tx.movie.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new ApiError(404, "NOT_FOUND", "Movie not found.");

      if (prerequisites) await assertValidPrerequisites(tx, id, prerequisites);

      return tx.movie.update({
        where: { id },
        data: {
          ...fields,
          // Only touch the relation when prerequisites was sent.
          ...(prerequisites && { prerequisites: { set: prerequisites.map((p) => ({ id: p })) } }),
        },
        include: movieInclude,
      });
    });
    return NextResponse.json(movie);
  } catch (error) {
    return handleError(error);
  }
}
