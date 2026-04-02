type UserAvatarProps = {
  email: string;
  showEmail?: boolean;
};

function getInitials(email: string) {
  const localPart = email.split("@")[0] || "";
  const parts = localPart
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .split(/[._-]+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  const clean = localPart.replace(/[^a-zA-Z0-9]/g, "");
  return clean.slice(0, 2).toUpperCase() || "U";
}

function truncateEmail(email: string, max = 22) {
  if (email.length <= max) return email;
  return `${email.slice(0, max - 3)}...`;
}

export default function UserAvatar({
  email,
  showEmail = true,
}: UserAvatarProps) {
  const initials = getInitials(email);

  return (
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
        {initials}
      </div>

      {showEmail && (
        <div className="hidden sm:block text-sm font-medium text-slate-700">
          {truncateEmail(email)}
        </div>
      )}
    </div>
  );
}