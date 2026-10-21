/** Centavos → `$1,250 MXN`. El backend nunca manda pesos. */
export function formatCentavos(centavos: number, conMoneda = true): string {
  const n = Number.isFinite(centavos) ? centavos : 0
  const pesos = n / 100
  const texto = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: pesos % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(pesos)
  return conMoneda ? `${texto} MXN` : texto
}

export function MoneyText({
  centavos,
  conMoneda = true,
  className,
}: {
  centavos: number
  conMoneda?: boolean
  className?: string
}) {
  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {formatCentavos(centavos, conMoneda)}
    </span>
  )
}
