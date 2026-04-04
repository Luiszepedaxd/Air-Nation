'use client'

import { useRef } from 'react'
import { CredentialCard, type CredentialUserData } from './CredentialCard'
import { CredentialActions } from './CredentialActions'

export function CredencialClient({ data }: { data: CredentialUserData }) {
  const cardRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <div className="mx-auto w-full max-w-[360px]">
        <CredentialCard ref={cardRef} data={data} />
      </div>
      <CredentialActions cardRef={cardRef} data={data} />
    </>
  )
}
