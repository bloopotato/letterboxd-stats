type OverviewCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export default function OverviewCard({ title, value, description }: OverviewCardProps) {
  return (
    <div className="flex flex-col rounded-3xl border-2 border-primary bg-card p-4 shadow-sm items-center justify-center">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </div>
  );
}
