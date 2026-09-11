// Minimal stand-in: the components only need Link + useNavigate to render.
import React from 'react';
export function Link({ to, children, ...rest }: any) {
  return React.createElement('a', { href: typeof to === 'string' ? to : to?.pathname ?? '#', ...rest }, children);
}
export function NavLink(p: any) { return Link(p); }
export function useNavigate() { return (to: any) => { (globalThis as any).__navigated = to; }; }
export function MemoryRouter({ children }: any) { return children; }
export function useLocation() { return { pathname: '/admin/dashboard', search: '' }; }
export function useParams() { return {}; }
export function useSearchParams() { return [new URLSearchParams(), () => {}]; }
export default { Link, NavLink, useNavigate, MemoryRouter, useLocation, useParams, useSearchParams };
