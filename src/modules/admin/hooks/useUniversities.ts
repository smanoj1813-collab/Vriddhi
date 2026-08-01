// src/hooks/useUniversities.ts
// React Query hooks for university data

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  University,
  CreateUniversityInput,
  UpdateUniversityInput,
  ListUniversitiesOptions,
  UpdateCollegeClassificationInput,
  UniversityStats,
  UniversityRolloutProgress,
} from "../types/university";
import {
  listUniversities,
  getUniversityById,
  getUniversityByCodeFromDb,
  createUniversity,
  updateUniversity,
  deleteUniversity,
  seedUniversities,
  getUniversityStats,
  getRolloutProgress,
  updateCollegeClassification,
  getCollegesByUniversity,
} from "../api/universityApi";

// ═══════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════

const universityKeys = {
  all: ["universities"] as const,
  lists: () => [...universityKeys.all, "list"] as const,
  list: (filters: ListUniversitiesOptions) => [...universityKeys.lists(), filters] as const,
  details: () => [...universityKeys.all, "detail"] as const,
  detail: (id: string) => [...universityKeys.details(), id] as const,
  byCode: (code: string) => [...universityKeys.all, "byCode", code] as const,
  stats: () => [...universityKeys.all, "stats"] as const,
  rollout: () => [...universityKeys.all, "rollout"] as const,
  colleges: (universityId: string) => [...universityKeys.all, "colleges", universityId] as const,
};

// ═══════════════════════════════════════════════════════════════════════
// LIST HOOK
// ═══════════════════════════════════════════════════════════════════════

export function useUniversities(options: ListUniversitiesOptions = {}, enabled = true) {
  return useQuery({
    queryKey: universityKeys.list(options),
    queryFn: () => listUniversities(options),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ═══════════════════════════════════════════════════════════════════════
// DETAIL HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useUniversity(universityId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: universityKeys.detail(universityId || ""),
    queryFn: () => getUniversityById(universityId!),
    enabled: enabled && !!universityId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUniversityByCode(code: string | undefined, enabled = true) {
  return useQuery({
    queryKey: universityKeys.byCode(code || ""),
    queryFn: () => getUniversityByCodeFromDb(code!),
    enabled: enabled && !!code,
    staleTime: 10 * 60 * 1000, // 10 minutes — codes don't change
  });
}

// ═══════════════════════════════════════════════════════════════════════
// STATS & ANALYTICS HOOKS
// ═══════════════════════════════════════════════════════════════════════

export function useUniversityStats(enabled = true) {
  return useQuery({
    queryKey: universityKeys.stats(),
    queryFn: getUniversityStats,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useRolloutProgress(enabled = true) {
  return useQuery({
    queryKey: universityKeys.rollout(),
    queryFn: getRolloutProgress,
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// COLLEGE AFFILIATION HOOK
// ═══════════════════════════════════════════════════════════════════════

export function useUniversityColleges(universityId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: universityKeys.colleges(universityId || ""),
    queryFn: () => getCollegesByUniversity(universityId!),
    enabled: enabled && !!universityId,
    staleTime: 3 * 60 * 1000,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// MUTATIONS
// ═══════════════════════════════════════════════════════════════════════

export function useCreateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUniversity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: universityKeys.stats() });
    },
  });
}

export function useUpdateUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateUniversityInput }) =>
      updateUniversity(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: universityKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: universityKeys.stats() });
      queryClient.invalidateQueries({ queryKey: universityKeys.rollout() });
    },
  });
}

export function useDeleteUniversity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUniversity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: universityKeys.stats() });
      queryClient.invalidateQueries({ queryKey: universityKeys.rollout() });
    },
  });
}

export function useSeedUniversities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seedUniversities,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: universityKeys.lists() });
      queryClient.invalidateQueries({ queryKey: universityKeys.stats() });
      queryClient.invalidateQueries({ queryKey: universityKeys.rollout() });
    },
  });
}

export function useUpdateCollegeClassification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ collegeId, input }: { collegeId: string; input: UpdateCollegeClassificationInput }) =>
      updateCollegeClassification(collegeId, input),
    onSuccess: (_, variables) => {
      // Invalidate college detail and university colleges list
      queryClient.invalidateQueries({ queryKey: ["college", variables.collegeId] });
      if (variables.input.universityId) {
        queryClient.invalidateQueries({
          queryKey: universityKeys.colleges(variables.input.universityId),
        });
      }
      queryClient.invalidateQueries({ queryKey: universityKeys.stats() });
      queryClient.invalidateQueries({ queryKey: universityKeys.rollout() });
    },
  });
}
