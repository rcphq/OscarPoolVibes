"use client";

import { useState } from "react";
import { DEMO_CATEGORIES } from "@/lib/demo/oscar-data";
import type { DemoCategory } from "@/lib/demo/oscar-data";
import type { Prediction } from "@/lib/demo/scoring";

type PredictionFormProps = {
  onSubmit: (predictions: Prediction[]) => void;
  initialPredictions?: Prediction[];
};

export function PredictionForm({
  onSubmit,
  initialPredictions = [],
}: PredictionFormProps) {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>(
    () => {
      const map: Record<string, Prediction> = {};
      for (const p of initialPredictions) {
        map[p.categoryId] = p;
      }
      return map;
    }
  );

  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    DEMO_CATEGORIES[0]?.id ?? null
  );

  const filledCount = Object.values(predictions).filter(
    (p) => p.firstChoiceId && p.runnerUpId
  ).length;

  const handleSelect = (
    categoryId: string,
    field: "firstChoiceId" | "runnerUpId",
    nomineeId: string
  ) => {
    setPredictions((prev) => {
      const existing = prev[categoryId] ?? {
        categoryId,
        firstChoiceId: "",
        runnerUpId: "",
      };

      // If selecting the same nominee for the other field, swap them
      const otherField =
        field === "firstChoiceId" ? "runnerUpId" : "firstChoiceId";
      const updated = { ...existing, [field]: nomineeId };
      if (updated[otherField] === nomineeId) {
        updated[otherField] = existing[field];
      }

      return { ...prev, [categoryId]: updated };
    });
  };

  const handleSubmit = () => {
    onSubmit(Object.values(predictions));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gold-400">Your Predictions</h2>
          <p className="text-sm text-gray-400">
            Pick a first choice and runner-up for each category
          </p>
        </div>
        <span className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
          {filledCount}/{DEMO_CATEGORIES.length} complete
        </span>
      </div>

      <div className="space-y-2">
        {DEMO_CATEGORIES.map((category) => (
          <CategoryPicker
            key={category.id}
            category={category}
            prediction={predictions[category.id]}
            isExpanded={expandedCategory === category.id}
            onToggle={() =>
              setExpandedCategory(
                expandedCategory === category.id ? null : category.id
              )
            }
            onSelect={(field, nomineeId) =>
              handleSelect(category.id, field, nomineeId)
            }
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={filledCount === 0}
        className="mt-8 w-full rounded-lg bg-gold-500 py-3 text-lg font-semibold text-gray-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {filledCount === DEMO_CATEGORIES.length
          ? "Lock In Predictions"
          : `Lock In Predictions (${filledCount}/${DEMO_CATEGORIES.length})`}
      </button>
    </div>
  );
}

type CategoryPickerProps = {
  category: DemoCategory;
  prediction?: Prediction;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (field: "firstChoiceId" | "runnerUpId", nomineeId: string) => void;
};

function CategoryPicker({
  category,
  prediction,
  isExpanded,
  onToggle,
  onSelect,
}: CategoryPickerProps) {
  const isComplete = prediction?.firstChoiceId && prediction?.runnerUpId;
  const firstPick = category.nominees.find(
    (n) => n.id === prediction?.firstChoiceId
  );
  const runnerUpPick = category.nominees.find(
    (n) => n.id === prediction?.runnerUpId
  );

  return (
    <div
      className={`overflow-hidden rounded-lg border transition-colors ${
        isComplete
          ? "border-gold-500/30 bg-gray-900/80"
          : "border-gray-700 bg-gray-900/50"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gold-500">
            {category.pointValue} pts
          </span>
          <span className="font-medium text-gray-100">{category.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <span className="text-xs text-green-400">
              {firstPick?.name} / {runnerUpPick?.name}
            </span>
          ) : prediction?.firstChoiceId || prediction?.runnerUpId ? (
            <span className="text-xs text-yellow-400">Incomplete</span>
          ) : null}
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-800 px-4 py-3">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gold-400">
              First Choice
            </label>
            <div className="grid gap-1">
              {category.nominees.map((nominee) => (
                <NomineeButton
                  key={nominee.id}
                  name={nominee.name}
                  subtitle={nominee.subtitle}
                  isSelected={prediction?.firstChoiceId === nominee.id}
                  isDisabled={prediction?.runnerUpId === nominee.id}
                  onClick={() => onSelect("firstChoiceId", nominee.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-400">
              Runner-Up
            </label>
            <div className="grid gap-1">
              {category.nominees.map((nominee) => (
                <NomineeButton
                  key={nominee.id}
                  name={nominee.name}
                  subtitle={nominee.subtitle}
                  isSelected={prediction?.runnerUpId === nominee.id}
                  isDisabled={prediction?.firstChoiceId === nominee.id}
                  onClick={() => onSelect("runnerUpId", nominee.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type NomineeButtonProps = {
  name: string;
  subtitle?: string;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
};

function NomineeButton({
  name,
  subtitle,
  isSelected,
  isDisabled,
  onClick,
}: NomineeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`rounded px-3 py-2 text-left text-sm transition ${
        isSelected
          ? "bg-gold-500/20 text-gold-300 ring-1 ring-gold-500/50"
          : isDisabled
            ? "cursor-not-allowed text-gray-600"
            : "text-gray-300 hover:bg-gray-800"
      }`}
    >
      <span>{name}</span>
      {subtitle && (
        <span className="ml-2 text-xs text-gray-500">{subtitle}</span>
      )}
    </button>
  );
}
