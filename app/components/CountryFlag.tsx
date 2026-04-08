import { resolveFlagCode } from "@/lib/flags";

type CountryFlagProps = {
  code: string | null | undefined;
  teamName: string | null | undefined;
  alt: string;
  className?: string;
};

const SPECIAL_FLAG_SRC: Record<string, string> = {
  "gb-eng": "/flags/gb-eng.png",
  "gb-sct": "/flags/gb-sct.png",
  "gb-wls": "/flags/gb-wls.png",
  "gb-nir": "/flags/gb-nir.png",
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

  
  const normalized = resolved.trim().toLowerCase();
  const specialSrc = SPECIAL_FLAG_SRC[normalized];
  const src = specialSrc ?? `https://flagcdn.com/w40/${normalized}.png`;

  return (
    <img
      src={src}
      alt={alt}
      className={`h-9 w-9 rounded-full object-cover ring-1 ring-gray-200 ${className}`}
    />

  );
}