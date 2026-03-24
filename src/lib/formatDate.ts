/** Converts "yyyy-mm-dd" → "dd/mm" */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}
