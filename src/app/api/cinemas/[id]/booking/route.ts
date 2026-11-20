import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handleError, parseId } from "@/lib/api";
import { parseBundleSizes } from "@/lib/cinemas";
import { minBundles } from "@/lib/algorithms/booking";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = parseId((await params).id, "Cinema id");

    const rawGroupSize = new URL(request.url).searchParams.get("groupSize");
    const groupSize = Number(rawGroupSize);
    if (!rawGroupSize || !/^\d+$/.test(rawGroupSize) || groupSize < 1 || groupSize > 10000) {
      throw new ApiError(400, "VALIDATION_ERROR", "groupSize must be an integer between 1 and 10000.");
    }

    const row = await prisma.cinema.findUnique({ where: { id } });
    if (!row) throw new ApiError(404, "NOT_FOUND", "Cinema not found.");

    const bundleSizes = parseBundleSizes(row.bundleSizes);
    if (!bundleSizes) {
      console.error(`Cinema ${row.id} has malformed bundleSizes`);
      throw new ApiError(500, "INTERNAL_SERVER_ERROR", "This cinema has invalid bundle data.");
    }

    const cinema = { id: row.id, name: row.name, bundleSizes };
    const bundles = minBundles(bundleSizes, groupSize);

    if (!bundles) {
      return NextResponse.json({
        cinema,
        groupSize,
        possible: false,
        totalBundles: null,
        totalSeats: null,
        bundles: [],
        message: "No exact combination of this cinema's bundles adds up to the group size.",
      });
    }

    return NextResponse.json({
      cinema,
      groupSize,
      possible: true,
      totalBundles: bundles.reduce((sum, b) => sum + b.count, 0),
      totalSeats: bundles.reduce((sum, b) => sum + b.size * b.count, 0),
      bundles,
    });
  } catch (error) {
    return handleError(error);
  }
}
