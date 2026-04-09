export default function MobileMenuButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 rounded-lg border"
    >
      ☰
    </button>
  );
}