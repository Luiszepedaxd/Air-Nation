'use client'

import { Autocomplete, useLoadScript } from '@react-google-maps/api'
import { useRef } from 'react'

const GOOGLE_LIBRARIES: ['places'] = ['places']

export type DireccionCompleta = {
  calle: string
  numero: string
  colonia: string
  ciudad: string
  estado: string
  cp: string
}

type Props = {
  onSelect: (dir: DireccionCompleta) => void
  placeholder?: string
  className?: string
}

function getComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  form: 'long_name' | 'short_name' = 'long_name'
): string {
  return components.find((c) => c.types.includes(type))?.[form] ?? ''
}

export function AddressAutocomplete({
  onSelect,
  placeholder = 'Busca tu dirección...',
  className,
}: Props) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? '',
    libraries: GOOGLE_LIBRARIES,
  })

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  function handlePlaceChanged() {
    const place = autocompleteRef.current?.getPlace()
    if (!place?.address_components) return

    const comps = place.address_components

    const streetNumber = getComponent(comps, 'street_number')
    const route = getComponent(comps, 'route')
    const colonia =
      getComponent(comps, 'sublocality_level_1') ||
      getComponent(comps, 'neighborhood') ||
      getComponent(comps, 'sublocality')
    const ciudad =
      getComponent(comps, 'locality') ||
      getComponent(comps, 'administrative_area_level_2')
    const estado = getComponent(comps, 'administrative_area_level_1')
    const cp = getComponent(comps, 'postal_code')

    onSelect({
      calle: route,
      numero: streetNumber,
      colonia,
      ciudad,
      estado,
      cp,
    })
  }

  if (!isLoaded) {
    return (
      <input
        type="text"
        disabled
        placeholder="Cargando..."
        className={className}
      />
    )
  }

  return (
    <Autocomplete
      onLoad={(ac) => {
        autocompleteRef.current = ac
      }}
      onPlaceChanged={handlePlaceChanged}
      options={{
        types: ['address'],
        componentRestrictions: { country: 'mx' },
      }}
    >
      <input
        type="text"
        placeholder={placeholder}
        className={className}
      />
    </Autocomplete>
  )
}
