import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pb, currentUser } from "../helpers/pocketbase";
import { addDays, dayKey, startOfDay } from "../helpers/dates";
import type {
  AnalyzeResult,
  FoodDraft,
  FoodEntry,
  FoodReference,
  LabelResult,
  ReferenceDraft,
  WeightLog,
} from "../types";

// PocketBase auto-cancels duplicate in-flight requests; TanStack Query already
// dedupes, so turn that off for every call made from here.
const noAutoCancel = { requestKey: null };

function requireUserId(): string {
  const user = currentUser();
  if (!user) throw new Error("Not signed in.");
  return user.id;
}

// ---------- food entries ----------

export function useEntriesForDay(date: Date) {
  const from = startOfDay(date);
  const to = addDays(from, 1);
  return useQuery({
    queryKey: ["entries", dayKey(from)],
    queryFn: () =>
      pb.collection("food_entries").getFullList<FoodEntry>({
        filter: pb.filter("eaten_at >= {:from} && eaten_at < {:to}", { from, to }),
        sort: "-eaten_at",
        ...noAutoCancel,
      }),
  });
}

/** Entries over a period, without photos — used for the progress charts. */
export function useEntriesRange(days: number) {
  const to = addDays(startOfDay(new Date()), 1);
  const from = addDays(to, -days);
  return useQuery({
    queryKey: ["entries-range", days, dayKey(from)],
    queryFn: () =>
      pb.collection("food_entries").getFullList<FoodEntry>({
        filter: pb.filter("eaten_at >= {:from} && eaten_at < {:to}", { from, to }),
        fields: "id,calories,carbs,fat,protein,eaten_at",
        sort: "eaten_at",
        ...noAutoCancel,
      }),
  });
}

export function useAddEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ drafts, eatenAt, photo }: { drafts: FoodDraft[]; eatenAt: Date; photo?: Blob }) => {
      const user = requireUserId();
      // Sequential on purpose: keeps request count gentle on a small server.
      const created: FoodEntry[] = [];
      for (const draft of drafts) {
        created.push(
          await pb.collection("food_entries").create<FoodEntry>(
            {
              user,
              name: draft.name,
              portion: draft.portion,
              grams: draft.grams,
              calories: draft.calories,
              carbs: draft.carbs,
              fat: draft.fat,
              protein: draft.protein,
              micros: draft.micros,
              eaten_at: eatenAt.toISOString(),
              ...(photo ? { photo: new File([photo], "meal.jpg", { type: photo.type }) } : {}),
            },
            noAutoCancel,
          ),
        );
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["entries-range"] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.collection("food_entries").delete(id, noAutoCancel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["entries-range"] });
    },
  });
}

// ---------- food recognition ----------

export function useAnalyzeFood() {
  return useMutation({
    mutationFn: ({
      base64,
      mediaType,
      hint,
      references,
    }: {
      base64: string;
      mediaType: string;
      hint?: string;
      /** food_references ids the meal contains */
      references?: string[];
    }) =>
      pb.send<AnalyzeResult>("/api/saludablex/analyze", {
        method: "POST",
        body: { image: base64, mediaType, hint, references },
        ...noAutoCancel,
      }),
  });
}

// ---------- food references (package labels) ----------

/** All of the user's references; small enough to search client-side. */
export function useReferences() {
  return useQuery({
    queryKey: ["references"],
    queryFn: () =>
      pb.collection("food_references").getFullList<FoodReference>({
        sort: "name",
        ...noAutoCancel,
      }),
  });
}

export function useReadLabel() {
  return useMutation({
    mutationFn: ({ base64, mediaType }: { base64: string; mediaType: string }) =>
      pb.send<LabelResult>("/api/saludablex/read-label", {
        method: "POST",
        body: { image: base64, mediaType },
        ...noAutoCancel,
      }),
  });
}

export function useAddReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ draft, photo }: { draft: ReferenceDraft; photo?: Blob }) =>
      pb.collection("food_references").create<FoodReference>(
        {
          user: requireUserId(),
          ...draft,
          ...(photo ? { photo: new File([photo], "label.jpg", { type: photo.type }) } : {}),
        },
        noAutoCancel,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });
}

export function useDeleteReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.collection("food_references").delete(id, noAutoCancel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["references"] }),
  });
}

// ---------- weight ----------

export function useWeightLogs() {
  return useQuery({
    queryKey: ["weight"],
    queryFn: () =>
      pb.collection("weight_logs").getFullList<WeightLog>({
        sort: "logged_at",
        ...noAutoCancel,
      }),
  });
}

export function useAddWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weightKg, loggedAt }: { weightKg: number; loggedAt: Date }) =>
      pb.collection("weight_logs").create<WeightLog>(
        { user: requireUserId(), weight_kg: weightKg, logged_at: loggedAt.toISOString() },
        noAutoCancel,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weight"] }),
  });
}

export function useUpdateWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, weightKg, loggedAt }: { id: string; weightKg: number; loggedAt: Date }) =>
      pb
        .collection("weight_logs")
        .update<WeightLog>(id, { weight_kg: weightKg, logged_at: loggedAt.toISOString() }, noAutoCancel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weight"] }),
  });
}

export function useDeleteWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pb.collection("weight_logs").delete(id, noAutoCancel),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["weight"] }),
  });
}
