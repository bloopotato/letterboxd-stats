type OverviewCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export default function OverviewCard({ title, value, description }: OverviewCardProps) {
  return (
    <div className="group relative flex min-h-36 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:border-accent/60">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-accent opacity-60 transition-opacity group-hover:opacity-100" />

      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{title}</p>

      <div>
        <p className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{value}</p>

        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </div>
  );
}
