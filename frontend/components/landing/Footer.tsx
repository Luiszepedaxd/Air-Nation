export default function Footer() {
  return (
    <footer className="border-t border-air-border px-4 sm:px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-air-green flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="#080C0A"/>
            </svg>
          </span>
          <span className="font-display text-xl tracking-widest text-air-text">
            AIR<span className="text-air-green">NATION</span>
          </span>
        </div>

        {/* Center tagline */}
        <p className="font-body text-air-text-dim text-xs text-center">
          La base del Airsoft en México · <span className="text-air-green">airnation.online</span>
        </p>

        {/* Right */}
        <p className="font-mono text-air-muted text-xs">
          Early Access
        </p>
      </div>
    </footer>
  );
}
