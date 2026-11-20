import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, readJson } from "@/lib/api";
import { assertValidPrerequisites, movieInclude } from "@/lib/movies";
import { createMovieSchema } from "@/lib/validations/movie";

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      include: movieInclude,
      orderBy: [{ releaseYear: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(movies);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { prerequisites = [], ...data } = createMovieSchema.parse(await readJson(request));

    const movie = await prisma.$transaction(async (tx) => {
      await assertValidPrerequisites(tx, undefined, prerequisites);
      return tx.movie.create({
        data: { ...data, prerequisites: { connect: prerequisites.map((id) => ({ id })) } },
        include: movieInclude,
      });
    });
    return NextResponse.json(movie, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
