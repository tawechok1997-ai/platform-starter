export type WorkspaceTabTarget = {
  href?: string;
  value?: string;
};

export function buildWorkspaceTabHref({
  pathname,
  search,
  queryKey,
  target,
}: {
  pathname: string;
  search: string;
  queryKey: string;
  target: WorkspaceTabTarget;
}) {
  if (target.href) return target.href;

  const params = new URLSearchParams(search);
  if (target.value) params.set(queryKey, target.value);
  else params.delete(queryKey);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
