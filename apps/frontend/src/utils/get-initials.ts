export function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}
