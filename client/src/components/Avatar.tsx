import { initials } from "../lib/format";

const COLORS = [
  "bg-brand-100 text-brand-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

export default function Avatar({
  first,
  last,
  size = "md",
}: {
  first?: string | null;
  last?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const seed = `${first ?? ""}${last ?? ""}`;
  const colorIdx = seed.length ? seed.charCodeAt(0) % COLORS.length : 0;
  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-xl",
  }[size];

  return (
    <div
      className={`flex items-center justify-center rounded-full font-semibold shrink-0 ${COLORS[colorIdx]} ${sizeClasses}`}
    >
      {initials(first, last)}
    </div>
  );
}
