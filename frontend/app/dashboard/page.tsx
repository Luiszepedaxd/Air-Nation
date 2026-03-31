import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-an-bg text-an-text flex flex-col">
      <header className="border-b border-an-border px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display font-black text-sm tracking-[0.18em] uppercase text-an-text inline-flex items-center gap-2"
        >
          <span className="w-6 h-6 bg-an-accent flex items-center justify-center">
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          AIR<span className="text-an-accent">NATION</span>
        </Link>
        <Link
          href="/login"
          className="font-body text-xs text-an-text-dim hover:text-an-text uppercase tracking-wider"
        >
          Salir (placeholder)
        </Link>
      </header>
      <main className="flex-1 px-5 sm:px-8 py-12 max-w-4xl mx-auto w-full">
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wide mb-3">
          Dashboard
        </h1>
        <p className="font-body text-an-text-dim text-sm leading-relaxed max-w-xl mb-8">
          Área autenticada: perfil, credencial, equipos y réplicas. Conectaremos sesión y datos contra el backend en
          siguientes iteraciones.
        </p>
        <Link
          href="/"
          className="inline-flex font-body font-bold text-xs uppercase tracking-wider text-an-accent hover:underline underline-offset-4"
        >
          ← Volver a la landing
        </Link>
      </main>
    </div>
  );
}
