import { Suspense } from "react";
import AuthCallbackClient from "./AuthCallbackClient";

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