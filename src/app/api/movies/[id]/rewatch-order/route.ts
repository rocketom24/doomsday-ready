import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleError, parseId } from "@/lib/api";
import { buildRewatchPlan } from "@/lib/algorithms/rewatch-order";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id, "Movie id");

    const rows = await prisma.movie.findMany({
      select: {
        id: true,
        title: true,
        releaseYear: true,
        runtime: true,
        watched: true,
        prerequisites: { select: { id: true } },
      },
    });
    const movies = rows.map(({ prerequisites, ...m }) => ({
      ...m,
      prerequisiteIds: prerequisites.map((p) => p.id),
    }));

    const target = movies.find((m) => m.id === id);
    if (!target) throw new ApiError(404, "NOT_FOUND", "Movie not found.");

    return NextResponse.json({
      target: { id: target.id, title: target.title },
      ...buildRewatchPlan(movies, id),
    });
  } catch (error) {
    return handleError(error);
  }
}
