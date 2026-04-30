'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type BillingDetails = {
  name: string
  email: string
  phone: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

type Props = {
  total: number
  billingDetails: BillingDetails
  onSuccess: () => void
  onError: (msg: string) => void
}

export function StripePaymentForm({ total, billingDetails, onSuccess, onError }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      onError('Stripe no está listo. Recarga la página.')
      return
    }

    setSubmitting(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        payment_method_data: {
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone || undefined,
            address: {
              line1: billingDetails.address.line1,
              line2: billingDetails.address.line2 || undefined,
              city: billingDetails.address.city,
              state: billingDetails.address.state,
              postal_code: billingDetails.address.postal_code,
              country: billingDetails.address.country,
            },
          },
        },
      },
      redirect: 'if_required',
    })

    setSubmitting(false)

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        onError(error.message || 'Error con el método de pago.')
      } else {
        onError('Error inesperado al procesar el pago. Intenta de nuevo.')
      }
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="border border-[#EEEEEE] bg-white p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: {
              applePay: 'never',
              googlePay: 'never',
            },
            fields: {
              billingDetails: {
                name: 'never',
                email: 'never',
                phone: 'never',
                address: 'never',
              },
            },
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full bg-[#CC4B37] py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        style={jost}
      >
        {submitting ? 'Procesando pago...' : `Pagar $${total.toLocaleString('es-MX')} →`}
      </button>

      <p className="text-center text-[10px] text-[#999999]" style={lato}>
        Pago seguro con Stripe. Tu información está cifrada.
      </p>
    </form>
  )
}
