"use client";
import { useState } from "react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async () => {
    if (!email || !teamName) return;
    setStatus("loading");
    try {
      // TODO: conectar al backend POST /api/v1/teams o waitlist
      await new Promise((r) => setTimeout(r, 1000)); // simular request
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="unete" className="py-20 sm:py-28 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div
          className="relative rounded-2xl border border-air-green/20 p-8 sm:p-12 overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(46,204,113,0.08) 0%, rgba(15,22,18,0.9) 60%)",
          }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-air-green/40 rounded-tl-2xl" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-air-green/40 rounded-br-2xl" />

          <div className="relative text-center mb-8">
            <span className="inline-block mb-3 px-3 py-1 bg-air-green/10 border border-air-green/20 rounded-full text-air-green text-xs font-mono tracking-widest uppercase">
              Early Access
            </span>
            <h2 className="font-display text-[clamp(2rem,6vw,4rem)] text-air-text tracking-wider leading-none mb-4">
              REGISTRA TU<br />
              <span className="text-gradient-green">EQUIPO AHORA</span>
            </h2>
            <p className="font-body text-air-text-dim text-sm leading-relaxed">
              Sé de los primeros equipos en AirNation. Acceso anticipado, sin costo.
            </p>
          </div>

          {status === "success" ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-air-green/10 border border-air-green/30 flex items-center justify-center mx-auto mb-4">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10l4 4 8-8" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-display text-2xl text-air-green tracking-wider">CONFIRMADO</p>
              <p className="font-body text-air-text-dim text-sm mt-2">
                Te avisamos cuando AirNation esté listo. <span className="text-air-text">Nos vemos en el campo.</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nombre del equipo"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-3 bg-air-bg border border-air-border rounded-lg text-air-text placeholder-air-muted text-sm font-body focus:outline-none focus:border-air-green/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-3 bg-air-bg border border-air-border rounded-lg text-air-text placeholder-air-muted text-sm font-body focus:outline-none focus:border-air-green/50 transition-colors"
              />
              <input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-air-bg border border-air-border rounded-lg text-air-text placeholder-air-muted text-sm font-body focus:outline-none focus:border-air-green/50 transition-colors"
              />
              <button
                onClick={handleSubmit}
                disabled={status === "loading" || !email || !teamName}
                className="w-full py-3.5 bg-air-green text-air-bg font-body font-semibold rounded-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {status === "loading" ? "Enviando..." : "Quiero acceso anticipado →"}
              </button>
              {status === "error" && (
                <p className="text-red-400 text-xs text-center font-body">
                  Algo salió mal. Intenta de nuevo.
                </p>
              )}
              <p className="text-air-text-dim text-xs text-center font-body">
                Sin spam. Sin costo. Solo airsoft.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
