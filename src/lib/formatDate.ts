/** Converts "yyyy-mm-dd" → "dd/mm/yyyy" */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
