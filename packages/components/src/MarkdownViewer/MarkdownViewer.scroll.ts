export function getMarkdownAnchorTarget(
  content: HTMLElement | null,
  fragment: string,
): HTMLElement | null {
  if (!content || !fragment) return content;
  let id = fragment;
  try {
    id = decodeURIComponent(fragment);
  } catch {
    // Malformed percent escapes can still be literal custom IDs.
  }
  return content.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
}

/** Bound readers scroll locally; auto-height documents retain page navigation. */
export function scrollToMarkdownHeading(
  container: HTMLElement | null,
  target: HTMLElement,
  toStart = false,
): void {
  if (!container) return;
  const view = container.ownerDocument.defaultView;
  const behavior = view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
  if (container.scrollHeight <= container.clientHeight) {
    target.scrollIntoView({ behavior, block: 'start' });
    return;
  }
  const margin = parseFloat(view?.getComputedStyle(target).scrollMarginTop ?? '0') || 0;
  const top =
    container.scrollTop +
    target.getBoundingClientRect().top -
    container.getBoundingClientRect().top -
    container.clientTop -
    margin;
  container.scrollTo({ top: toStart ? 0 : Math.max(0, top), behavior });
}
