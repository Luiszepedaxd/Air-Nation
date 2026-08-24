import Script from 'next/script'

/**
 * TruConversion — heatmaps y analytics de comportamiento.
 * ID de cuenta: 63765/9229f (airnation.online)
 */
export function TruConversion() {
  return (
    <Script
      id="ti-js"
      src="https://app.truconversion.com/ti-js/63765/9229f.js"
      strategy="afterInteractive"
    />
  )
}
