// src/hooks/useAdminSchedule.ts
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchWeeklySchedules,
  createWeeklySchedule,
  updateWeeklySchedule,
  deactivateWeeklySchedule,
  deleteWeeklySchedule,
  bulkCreateWeeklySchedules,
  fetchFacultyList,
  fetchSubjectsFromFaculty,
  fetchBatchesFromStudents,
  fetchBranchesFromStudents,
  fetchDivisionsFromStudents,
} from '../api/scheduleApi'
import type { WeeklyClassSchedule, WeeklyScheduleFormData, DayOfWeek } from '../types/schedule'

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function useAdminSchedule(collegeId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['weeklySchedules', 'admin', collegeId]

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey,
    queryFn: () => fetchWeeklySchedules(collegeId),
    enabled: !!collegeId,
  })

  // Fetch reference data for dropdowns
  const { data: facultyList, isLoading: facultyLoading } = useQuery({
    queryKey: ['facultyList', collegeId],
    queryFn: () => fetchFacultyList(collegeId),
    enabled: !!collegeId,
  })

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['subjects', collegeId],
    queryFn: () => fetchSubjectsFromFaculty(collegeId),
    enabled: !!collegeId,
  })

  const { data: batches, isLoading: batchesLoading } = useQuery({
    queryKey: ['batches', collegeId],
    queryFn: () => fetchBatchesFromStudents(collegeId),
    enabled: !!collegeId,
  })

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches', collegeId],
    queryFn: () => fetchBranchesFromStudents(collegeId),
    enabled: !!collegeId,
  })

  const { data: divisions, isLoading: divisionsLoading } = useQuery({
    queryKey: ['divisions', collegeId],
    queryFn: () => fetchDivisionsFromStudents(collegeId),
    enabled: !!collegeId,
  })

  // Group by day
  const weeklySchedule = (schedules || []).reduce((acc, schedule) => {
    const day = schedule.dayOfWeek
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<DayOfWeek, WeeklyClassSchedule[]>)

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: WeeklyScheduleFormData) => createWeeklySchedule(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WeeklyScheduleFormData> }) =>
      updateWeeklySchedule(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateWeeklySchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWeeklySchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (items: WeeklyScheduleFormData[]) => bulkCreateWeeklySchedules(items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  })

  const isLoading =
    schedulesLoading ||
    facultyLoading ||
    subjectsLoading ||
    batchesLoading ||
    branchesLoading ||
    divisionsLoading

  return {
    schedules: schedules || [],
    weeklySchedule,
    facultyList: facultyList || [],
    subjects: subjects || [],
    batches: batches || [],
    branches: branches || [],
    divisions: divisions || [],
    isLoading,
    createSchedule: createMutation.mutate,
    updateSchedule: updateMutation.mutate,
    deactivateSchedule: deactivateMutation.mutate,
    deleteSchedule: deleteMutation.mutate,
    bulkCreate: bulkCreateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeactivating: deactivateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkCreating: bulkCreateMutation.isPending,
  }
}