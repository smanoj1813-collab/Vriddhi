export interface AssessmentCostTrace {
  operation: string
  path: string
  reads: number
  writes: number
  notes?: string[]
}

export function traceRequested(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && (value as { __costTrace?: unknown }).__costTrace === true)
}

export function maybeTrace<T extends Record<string, unknown>>(
  enabled: boolean,
  result: T,
  trace: AssessmentCostTrace
): T & { costTrace?: AssessmentCostTrace } {
  return enabled ? { ...result, costTrace: trace } : result
}
