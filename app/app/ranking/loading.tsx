export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl p-4">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded bg-zinc-800" />
        <div className="h-24 rounded-2xl bg-zinc-900" />
        <div className="h-24 rounded-2xl bg-zinc-900" />
        <div className="h-24 rounded-2xl bg-zinc-900" />
        <div className="h-24 rounded-2xl bg-zinc-900" />
      </div>
    </main>
  );
}