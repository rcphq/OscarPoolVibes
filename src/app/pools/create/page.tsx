"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPoolAction, type CreatePoolFormState } from "./actions";

type CeremonyYear = {
  id: string;
  year: number;
  name: string;
};

export default function CreatePoolPage() {
  const [state, formAction, isPending] = useActionState<
    CreatePoolFormState,
    FormData
  >(createPoolAction, {});

  const [ceremonyYears, setCeremonyYears] = useState<CeremonyYear[]>([]);
  const [ceremonyYearId, setCeremonyYearId] = useState("");
  const [accessType, setAccessType] = useState("INVITE_ONLY");

  useEffect(() => {
    async function fetchCeremonyYears() {
      try {
        const res = await fetch("/api/ceremony-years");
        if (res.ok) {
          const data = await res.json();
          setCeremonyYears(data);
          // Auto-select if there's only one active year
          if (data.length === 1) {
            setCeremonyYearId(data[0].id);
          }
        }
      } catch {
        // Ceremony years will be empty — form validation will catch it
      }
    }

    fetchCeremonyYears();
  }, []);

  return (
    <main className="min-h-screen">
      {/* Header Section */}
      <section className="bg-navy px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/pools"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-100/70 hover:text-gold-100"
          >
            <ArrowLeft className="size-4" />
            Back to Pools
          </Link>
          <h1 className="font-heading text-3xl font-bold text-gold-300 sm:text-4xl">
            Create a Pool
          </h1>
          <p className="mt-2 text-gold-100/70">
            Set up a new Oscar prediction pool and invite your friends
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                Pool Details
              </CardTitle>
              <CardDescription>
                Fill in the details below to create your prediction pool.
              </CardDescription>
            </CardHeader>
            <form action={formAction}>
              <CardContent className="space-y-6">
                {/* Form-level errors */}
                {state.errors?._form && (
                  <div
                    role="alert"
                    className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {state.errors._form.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                )}

                {/* Pool Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Pool Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Film Buffs 2026"
                    required
                    maxLength={100}
                    aria-describedby={
                      state.errors?.name ? "name-error" : undefined
                    }
                    aria-invalid={!!state.errors?.name}
                  />
                  {state.errors?.name && (
                    <p id="name-error" className="text-sm text-destructive">
                      {state.errors.name[0]}
                    </p>
                  )}
                </div>

                {/* Ceremony Year */}
                <div className="space-y-2">
                  <Label htmlFor="ceremonyYearId">Ceremony Year</Label>
                  <input
                    type="hidden"
                    name="ceremonyYearId"
                    value={ceremonyYearId}
                  />
                  <Select
                    value={ceremonyYearId}
                    onValueChange={setCeremonyYearId}
                  >
                    <SelectTrigger
                      id="ceremonyYearId"
                      className="w-full"
                      aria-describedby={
                        state.errors?.ceremonyYearId
                          ? "ceremonyYear-error"
                          : undefined
                      }
                      aria-invalid={!!state.errors?.ceremonyYearId}
                    >
                      <SelectValue placeholder="Select a ceremony year" />
                    </SelectTrigger>
                    <SelectContent>
                      {ceremonyYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name} ({year.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.errors?.ceremonyYearId && (
                    <p
                      id="ceremonyYear-error"
                      className="text-sm text-destructive"
                    >
                      {state.errors.ceremonyYearId[0]}
                    </p>
                  )}
                </div>

                {/* Access Type */}
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium">Access Type</legend>
                  <input
                    type="hidden"
                    name="accessType"
                    value={accessType}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAccessType("INVITE_ONLY")}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
                        accessType === "INVITE_ONLY"
                          ? "border-gold-500 bg-gold-500/10"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                      aria-pressed={accessType === "INVITE_ONLY"}
                    >
                      <span className="text-sm font-medium">Invite Only</span>
                      <span className="text-xs text-muted-foreground">
                        Members need an invite link
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccessType("OPEN")}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-colors ${
                        accessType === "OPEN"
                          ? "border-gold-500 bg-gold-500/10"
                          : "border-border hover:border-muted-foreground/50"
                      }`}
                      aria-pressed={accessType === "OPEN"}
                    >
                      <span className="text-sm font-medium">Open</span>
                      <span className="text-xs text-muted-foreground">
                        Anyone can join
                      </span>
                    </button>
                  </div>
                  {state.errors?.accessType && (
                    <p className="text-sm text-destructive">
                      {state.errors.accessType[0]}
                    </p>
                  )}
                </fieldset>

                {/* Max Members */}
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">
                    Max Members{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="maxMembers"
                    name="maxMembers"
                    type="number"
                    min={2}
                    placeholder="No limit"
                    aria-describedby={
                      state.errors?.maxMembers
                        ? "maxMembers-error"
                        : "maxMembers-hint"
                    }
                    aria-invalid={!!state.errors?.maxMembers}
                  />
                  <p
                    id="maxMembers-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Leave empty for unlimited members.
                  </p>
                  {state.errors?.maxMembers && (
                    <p
                      id="maxMembers-error"
                      className="text-sm text-destructive"
                    >
                      {state.errors.maxMembers[0]}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" asChild>
                  <Link href="/pools">Cancel</Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Pool"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </section>
    </main>
  );
}
