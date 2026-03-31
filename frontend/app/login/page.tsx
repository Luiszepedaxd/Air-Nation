import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-an-bg text-an-text flex flex-col">
      <header className="border-b border-an-border px-5 sm:px-8 py-4">
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
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-16">
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wide text-center mb-3">
          Iniciar sesión
        </h1>
        <p className="font-body text-an-text-dim text-center text-sm max-w-md mb-8">
          Aquí irá el formulario de acceso. Misma app: landing en <span className="text-an-text">/</span>, panel en{" "}
          <span className="text-an-text">/dashboard</span>.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/signup"
            className="font-body font-bold text-xs uppercase tracking-wider text-an-accent hover:underline underline-offset-4"
          >
            Crear cuenta
          </Link>
          <span className="text-an-muted">·</span>
          <Link
            href="/"
            className="font-body font-bold text-xs uppercase tracking-wider text-an-text-dim hover:text-an-text transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
