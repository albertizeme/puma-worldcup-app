import { resolveFlagCode } from "@/lib/flags";

type CountryFlagProps = {
  code: string | null | undefined;
  teamName: string | null | undefined;
  alt: string;
  className?: string;
};

export default function CountryFlag({
  code,
  teamName,
  alt,
  className = "",
}: CountryFlagProps) {
  const resolved = resolveFlagCode(code, teamName);

  if (!resolved) {
    return (
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-400 ${className}`}
      >
        ?
      </div>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${resolved}.png`}
      alt={alt}
      className={`h-9 w-9 rounded-full object-cover ring-1 ring-gray-200 ${className}`}
    />
  );
}