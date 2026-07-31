export function isMemberNavigationActive(
  pathname: string,
  currentSearch: URLSearchParams | ReadonlyURLSearchParamsLike,
  href: string,
  id?: string,
) {
  try {
    const target = new URL(href, 'https://member.local');
    if (target.pathname === '/') {
      const targetCategory = target.searchParams.get('category') ?? '';
      const currentCategory = currentSearch.get('category') ?? '';
      return pathname === '/' && targetCategory === currentCategory;
    }
    if (pathname !== target.pathname && !pathname.startsWith(`${target.pathname}/`)) return false;

    for (const [key, value] of target.searchParams.entries()) {
      if ((currentSearch.get(key) ?? '') !== value) return false;
    }
    return true;
  } catch {
    return id === 'home' ? pathname === '/' : false;
  }
}

type ReadonlyURLSearchParamsLike = {
  get(name: string): string | null;
};
