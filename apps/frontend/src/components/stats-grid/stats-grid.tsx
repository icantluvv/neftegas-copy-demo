export type StatTileTone = "neutral" | "warning" | "success" | "danger";

export interface StatTileData {
  label: string;
  value: number;
  tone?: StatTileTone;
}

const TONE_CLASS_NAMES: Record<StatTileTone, string> = {
  neutral: "",
  warning: "text-amber-600 dark:text-amber-500",
  success: "text-emerald-600 dark:text-emerald-500",
  danger: "text-destructive",
};

export function StatsGrid({ tiles }: { tiles: StatTileData[] }) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg border border-border p-4">
          <dt className="text-sm text-muted-foreground">{tile.label}</dt>
          <dd className={`text-2xl font-semibold ${TONE_CLASS_NAMES[tile.tone ?? "neutral"]}`}>{tile.value}</dd>
        </div>
      ))}
    </dl>
  );
}
