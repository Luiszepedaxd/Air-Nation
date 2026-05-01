"use client";

import { useState } from "react";
import Link from "next/link";

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
} as const;

const lato = { fontFamily: "'Lato', sans-serif" } as const;

const inputClass =
  "w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]";

export default function EliminarCuentaClient() {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [reason, setReason] = useState("");
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const API_URL = (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://air-nation-production.up.railway.app/api/v1"
  ).replace(/\/$/, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !confirmEmail.trim()) {
      setError("Ingresa tu email y confírmalo.");
      return;
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError("Los emails no coinciden.");
      return;
    }

    if (!confirmCheckbox) {
      setError("Confirma que entiendes que esta acción es permanente.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/account/delete-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          reason: reason.trim() || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[eliminar-cuenta]", err);
      setError(
        "No se pudo enviar la solicitud. Intenta de nuevo o escribe directamente a info@airnation.online"
      );
    } finally {
      setSending(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-white px-6 py-16">
        <div className="w-full max-w-[480px]">
          <Link href="/" className="mb-12 flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                  fill="#fff"
                />
              </svg>
            </span>
            <span
              style={jost}
              className="text-[1.1rem] tracking-[0.18em] text-[#111111]"
            >
              AIR<span className="text-[#CC4B37]">NATION</span>
            </span>
          </Link>

          <p
            className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]"
            style={lato}
          >
            SOLICITUD RECIBIDA
          </p>
          <h1
            style={jost}
            className="mb-6 text-[2rem] leading-[0.95] text-[#111111]"
          >
            ESTAMOS PROCESANDO TU SOLICITUD.
          </h1>
          <p style={lato} className="text-[15px] leading-relaxed text-[#444444]">
            Recibimos tu solicitud para eliminar la cuenta asociada al email{" "}
            <strong>{email}</strong>. Procesaremos la eliminación en un plazo
            máximo de 30 días naturales conforme a la Ley Federal de Protección
            de Datos Personales en Posesión de los Particulares (LFPDPPP) de
            México.
          </p>
          <p
            style={lato}
            className="mt-4 text-[15px] leading-relaxed text-[#444444]"
          >
            Recibirás un email de confirmación cuando tu cuenta y datos hayan
            sido eliminados. Si tienes alguna pregunta, escríbenos a{" "}
            <a
              href="mailto:info@airnation.online"
              className="text-[#CC4B37] underline"
            >
              info@airnation.online
            </a>
            .
          </p>

          <Link
            href="/"
            style={jost}
            className="mt-12 inline-flex items-center justify-center border border-solid border-[#111111] bg-white px-6 py-3 text-[12px] tracking-[0.18em] text-[#111111] transition-colors hover:bg-[#F4F4F4]"
          >
            VOLVER AL INICIO
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-16">
      <div className="w-full max-w-[480px]">
        <Link href="/" className="mb-12 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          <span
            style={jost}
            className="text-[1.1rem] tracking-[0.18em] text-[#111111]"
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </Link>

        <p
          className="mb-3 text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]"
          style={lato}
        >
          ELIMINACIÓN DE CUENTA
        </p>
        <h1
          style={jost}
          className="mb-6 text-[2rem] leading-[0.95] text-[#111111]"
        >
          ELIMINA TU CUENTA Y DATOS DE AIRNATION.
        </h1>

        <div
          className="mb-8 border-l-2 border-[#CC4B37] bg-[#F4F4F4] p-4"
          style={lato}
        >
          <p className="text-[13px] leading-relaxed text-[#111111]">
            <strong>Esta acción es permanente.</strong> Al solicitar la
            eliminación se borrarán los siguientes datos asociados a tu cuenta:
          </p>
          <ul className="mt-3 space-y-1 text-[13px] leading-relaxed text-[#444444]">
            <li>• Perfil de jugador, alias, foto y credencial digital</li>
            <li>• Réplicas registradas en tu Arsenal</li>
            <li>• Publicaciones, comentarios, fotos y videos</li>
            <li>• Mensajes y conversaciones</li>
            <li>• Membresía en equipos y eventos</li>
            <li>• Historial de Marketplace y Store</li>
            <li>• Datos de ubicación y permisos</li>
          </ul>
          <p className="mt-3 text-[13px] leading-relaxed text-[#444444]">
            Algunos datos pueden conservarse por obligación legal (registros
            fiscales, transacciones de Store) por el tiempo que la ley exija.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              style={jost}
              className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
              htmlFor="email"
            >
              EMAIL DE TU CUENTA
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className={inputClass}
              style={{ borderRadius: 2, ...lato }}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label
              style={jost}
              className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
              htmlFor="confirmEmail"
            >
              CONFIRMA TU EMAIL
            </label>
            <input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="tu@email.com"
              className={inputClass}
              style={{ borderRadius: 2, ...lato }}
              required
              autoComplete="off"
            />
          </div>

          <div>
            <label
              style={jost}
              className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
              htmlFor="reason"
            >
              MOTIVO (OPCIONAL)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              rows={4}
              maxLength={500}
              placeholder="¿Por qué quieres eliminar tu cuenta? Tu opinión nos ayuda a mejorar."
              className={`${inputClass} min-h-[100px]`}
              style={{ borderRadius: 2, ...lato, resize: "vertical" }}
            />
            <p
              className="mt-1 text-right text-xs text-[#666666]"
              style={lato}
            >
              {reason.length}/500
            </p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#CC4B37]"
            />
            <span style={lato} className="text-[13px] leading-relaxed text-[#444444]">
              Entiendo que esta acción es permanente y que mis datos serán
              eliminados en un plazo máximo de 30 días. He leído el{" "}
              <Link href="/privacidad" className="text-[#CC4B37] underline">
                Aviso de Privacidad
              </Link>
              .
            </span>
          </label>

          {error ? (
            <p style={lato} className="text-sm text-[#CC4B37]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-[#CC4B37] py-3.5 text-white transition-opacity disabled:opacity-40"
            style={{
              ...jost,
              fontSize: 13,
              letterSpacing: "0.18em",
              borderRadius: 0,
            }}
          >
            {sending ? "ENVIANDO..." : "SOLICITAR ELIMINACIÓN"}
          </button>
        </form>

        <p
          style={lato}
          className="mt-6 text-center text-[12px] text-[#666666]"
        >
          ¿Preguntas? Escríbenos a{" "}
          <a
            href="mailto:info@airnation.online"
            className="text-[#CC4B37] underline"
          >
            info@airnation.online
          </a>
        </p>
      </div>
    </main>
  );
}
