type OverviewCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export default function OverviewCard({ title, value, description }: OverviewCardProps) {
  return (
    <div>
      <p>{title}</p>
      <p>{value}</p>
      {description && <p>{description}</p>}
    </div>
  );
}
