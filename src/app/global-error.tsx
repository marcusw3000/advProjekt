"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-lg font-semibold">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            Nossa equipe foi notificada. Tente novamente em instantes.
          </p>
        </div>
      </body>
    </html>
  );
}
