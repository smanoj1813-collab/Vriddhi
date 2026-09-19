// Minimal stand-in: the components only need Link + useNavigate to render.
// `useSearchParams` / `useParams` are stateful so a test can drive them:
//   globalThis.__RC_SEARCH = '?program=bba'   → the URL the component reads
//   globalThis.__RC_PARAMS = { subjectId: … } → the route params
// and clicking something that calls setSearchParams re-renders with the new
// query string, exactly like the real router.
import React from 'react';
// forwardRef, like the real router's Link: MUI passes a ref through
// `component={Link}` (ButtonBase), and a plain function component warns.
export const Link = React.forwardRef(function Link({ to, children, ...rest }: any, ref: any) {
  return React.createElement('a', { ref, href: typeof to === 'string' ? to : to?.pathname ?? '#', ...rest }, children);
});
export function NavLink(p: any) { return React.createElement(Link, p); }
export function useNavigate() { return (to: any) => { (globalThis as any).__navigated = to; }; }
export function MemoryRouter({ children }: any) { return children; }
export function useLocation() { return { pathname: '/admin/dashboard', search: (globalThis as any).__RC_SEARCH ?? '' }; }
export function useParams() { return (globalThis as any).__RC_PARAMS ?? {}; }

export function useSearchParams() {
  const [search, setSearch] = React.useState<string>(() => String((globalThis as any).__RC_SEARCH ?? ''));
  const params = React.useMemo(() => new URLSearchParams(search.replace(/^\?/, '')), [search]);
  const setParams = React.useCallback((next: any, _options?: any) => {
    const value = typeof next === 'string' ? next : String(next);
    const normalised = value.startsWith('?') ? value : `?${value}`;
    (globalThis as any).__RC_SEARCH = normalised;
    (globalThis as any).__RC_SEARCH_SETS = [...((globalThis as any).__RC_SEARCH_SETS ?? []), normalised];
    setSearch(normalised);
  }, []);
  return [params, setParams];
}

export default { Link, NavLink, useNavigate, MemoryRouter, useLocation, useParams, useSearchParams };
