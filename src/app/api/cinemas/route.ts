import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, readJson } from "@/lib/api";
import { parseBundleSizes } from "@/lib/cinemas";
import { createCinemaSchema } from "@/lib/validations/cinema";

export async function GET() {
  try {
    const rows = await prisma.cinema.findMany({ orderBy: { name: "asc" } });

    const cinemas = [];
    for (const row of rows) {
      const bundleSizes = parseBundleSizes(row.bundleSizes);
      if (!bundleSizes) {
        console.error(`Cinema ${row.id} has malformed bundleSizes, skipping`);
        continue;
      }
      cinemas.push({ id: row.id, name: row.name, bundleSizes });
    }
    return NextResponse.json(cinemas);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { name, bundleSizes } = createCinemaSchema.parse(await readJson(request));
    const sorted = [...bundleSizes].sort((a, b) => a - b);

    const cinema = await prisma.cinema.create({
      data: { name, bundleSizes: JSON.stringify(sorted) },
    });
    return NextResponse.json({ id: cinema.id, name: cinema.name, bundleSizes: sorted }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
