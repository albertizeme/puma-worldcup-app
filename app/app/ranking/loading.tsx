export default function Loading() {
  return (
    <main className="flex items-center justify-center min-h-[60vh]">
      
      <div className="flex flex-col items-center gap-4">

        {/* Balón animado */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-white flex items-center justify-center text-2xl animate-spin">
            ⚽
          </div>
        </div>

        <p className="text-sm text-zinc-400">
          Cargando ranking...
        </p>

      </div>

    </main>
  );
}