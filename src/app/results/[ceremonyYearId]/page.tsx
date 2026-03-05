import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { checkResultsPermission } from "@/lib/results/permissions";
import { ResultsEntryForm } from "@/components/results/ResultsEntryForm";
import { Trophy, ShieldAlert } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

type CategoryWithNominees = {
  id: string;
  name: string;
  displayOrder: number;
  pointValue: number;
  winnerId: string | null;
  nominees: { id: string; name: string; subtitle: string | null }[];
};

type ExistingResult = {
  categoryId: string;
  winnerId: string;
  version: number;
  setBy: { name: string | null };
  updatedAt: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ceremonyYearId: string }>;
}): Promise<Metadata> {
  await params;
  return {
    title: "Enter Results | OscarPoolVibes",
    description: "Enter official Oscar ceremony results.",
  };
}

export default async function ResultsEntryPage({
  params,
}: {
  params: Promise<{ ceremonyYearId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { ceremonyYearId } = await params;

  // Check permission
  const permission = await checkResultsPermission(session.user.id, ceremonyYearId);

  if (!permission.canSetResults) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-6 text-destructive" />
              <CardTitle className="font-heading text-lg">
                Permission Denied
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">
              You don&apos;t have permission to manage results for this ceremony.
            </p>
            <p className="text-sm text-muted-foreground">
              Only pool creators (admins) and designated results managers can
              enter Oscar winners. If you believe you should have access, ask
              your pool admin to grant you the Results Manager role.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch ceremony year with categories and nominees
  const ceremonyYear = await prisma.ceremonyYear.findUnique({
    where: { id: ceremonyYearId },
    select: {
      id: true,
      year: true,
      name: true,
      categories: {
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          displayOrder: true,
          pointValue: true,
          winnerId: true,
          nominees: {
            select: {
              id: true,
              name: true,
              subtitle: true,
            },
          },
        },
      },
    },
  });

  if (!ceremonyYear) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Ceremony Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The ceremony year you&apos;re looking for doesn&apos;t exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch existing results with setBy info
  const categoryResults = await prisma.categoryResult.findMany({
    where: {
      category: { ceremonyYearId },
    },
    select: {
      categoryId: true,
      winnerId: true,
      version: true,
      updatedAt: true,
      setBy: {
        select: { name: true },
      },
    },
  });

  const categories: CategoryWithNominees[] = ceremonyYear.categories;

  const existingResults: ExistingResult[] = categoryResults.map((r) => ({
    categoryId: r.categoryId,
    winnerId: r.winnerId,
    version: r.version,
    setBy: { name: r.setBy.name },
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <Trophy className="size-7 text-gold-400" />
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Enter Results
          </h1>
        </div>
        <p className="text-muted-foreground">
          {ceremonyYear.name} &mdash; Set the official winners for each category.
        </p>
      </div>

      <ResultsEntryForm
        categories={categories}
        existingResults={existingResults}
      />
    </div>
  );
}
