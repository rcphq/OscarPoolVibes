import { z } from "zod";

export const predictionInputSchema = z
  .object({
    categoryId: z.string().cuid(),
    firstChoiceId: z.string().cuid(),
    runnerUpId: z.string().cuid(),
  })
  .refine((data) => data.firstChoiceId !== data.runnerUpId, {
    message: "First choice and runner-up must be different",
    path: ["runnerUpId"],
  });

export const savePredictionsSchema = z.object({
  poolId: z.string().cuid(),
  predictions: z.array(predictionInputSchema),
});

export type PredictionInput = z.infer<typeof predictionInputSchema>;
export type SavePredictionsInput = z.infer<typeof savePredictionsSchema>;
