import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";

export default function Loading() {
  const t = useTranslations("ranking");

  return (    
    <main className="flex items-center justify-center min-h-[60vh]">
      
      <div className="flex flex-col items-center gap-6">

        {/* Contenedor balón */}
        <div className="relative flex flex-col items-center">

          {/* Balón animado */}
          <div className="animate-[ballBounce_0.8s_ease-in-out_infinite]">
            <Image
              src="/puma-logo-ball.png"
              alt="Ball"
              width={64}
              height={64}
              priority
            />
          </div>

          {/* Shadow dinámico */}
          <div className="mt-2 w-10 h-2 bg-black/40 rounded-full blur-sm animate-[shadowBounce_0.8s_ease-in-out_infinite]" />

        </div>

        {/* Texto */}
        <p className="text-sm text-zinc-400 tracking-wide">
          {t("loading")}
        </p>

      </div>

    </main>
  );
}