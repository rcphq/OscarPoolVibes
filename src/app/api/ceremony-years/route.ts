import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET() {
  const years = await prisma.ceremonyYear.findMany({
    where: { isActive: true },
    select: {
      id: true,
      year: true,
      name: true,
    },
    orderBy: { year: "desc" },
  });

  return NextResponse.json(years);
}
