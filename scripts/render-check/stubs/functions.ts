// Stub for `firebase/functions` used only by the render check.
//
// `httpsCallable` is the boundary the student portal uses for everything that
// has to be decided server-side: the notification feed, read state, and the
// academic journey (real CGPA, cohort rank, readiness band). The component,
// its hook and the stage-building logic are the shipped source; only this
// transport is replaced, and it resolves whatever fixture the test installs on
// `globalThis.__RC_CALLABLE_DATA` keyed by function name.
const store = (globalThis as unknown) as {
  __RC_CALLABLE_DATA?: Record<string, unknown>;
  __RC_CALLABLE_CALLS?: string[];
};

export function httpsCallable(_functions: unknown, name: string) {
  return async (_payload?: unknown) => {
    store.__RC_CALLABLE_CALLS = [...(store.__RC_CALLABLE_CALLS ?? []), name];
    const data = store.__RC_CALLABLE_DATA?.[name];
    if (data === undefined) {
      // Mirror the real SDK: an unknown/undeployed function rejects, so the
      // component's error path is what gets exercised rather than a silent
      // undefined render.
      throw Object.assign(new Error(`internal - Function ${name} has no fixture`), {
        code: 'functions/internal',
      });
    }
    return { data };
  };
}

export class HttpsError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export default { httpsCallable, HttpsError };
