import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

export const dynamic = "force-dynamic";

function AuthCallbackFallback() {
  return <p className="p-6">Validando acceso...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackClient />
    </Suspense>
  );
}