import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { datetimeLocalToIsoCancun, formatoFechaCancun } from './fechas.ts'
import { extraerPrecio, offersDesdeVentanas } from './ofertas.ts'
import { linkOk, httpUrlOk } from './enlaces.ts'

describe('datetimeLocalToIsoCancun', () => {
  it('fija el reloj de Cancún en -05:00', () => {
    assert.equal(datetimeLocalToIsoCancun('2026-11-14T08:00'), '2026-11-14T08:00:00-05:00')
  })

  it('devuelve vacío si no hay fecha', () => {
    assert.equal(datetimeLocalToIsoCancun(''), '')
    assert.equal(datetimeLocalToIsoCancun('08:00'), '')
  })
})

describe('formatoFechaCancun', () => {
  it('no corre el día por la zona horaria del proceso', () => {
    const texto = formatoFechaCancun('2026-11-14')
    assert.match(texto, /14/)
    assert.match(texto, /nov/i)
    assert.match(texto, /2026/)
  })
})

describe('offersDesdeVentanas', () => {
  it('extrae el número, quita comas y marca agotada', () => {
    const offers = offersDesdeVentanas([
      { precio: '$1,650 MXN', estado: 'activa', fecha_fin: '2026-11-01' },
      { precio: 'Agotado $800', estado: 'agotada', fecha_fin: '' },
      { precio: 'Por confirmar', estado: 'proxima' },
    ])
    assert.equal(offers.length, 2)
    assert.equal(offers[0].price, '1650')
    assert.equal(offers[0].priceCurrency, 'MXN')
    assert.equal(offers[0].availability, 'https://schema.org/InStock')
    assert.equal(offers[0].validThrough, '2026-11-01')
    assert.equal(offers[1].price, '800')
    assert.equal(offers[1].availability, 'https://schema.org/SoldOut')
    assert.equal(offers[1].validThrough, undefined)
  })

  it('ignora precios sin dígitos', () => {
    assert.equal(extraerPrecio(''), null)
    assert.equal(extraerPrecio('...,'), null)
    assert.equal(extraerPrecio('$650'), '650')
  })
})

describe('links', () => {
  it('acepta ancla y ruta interna, y rechaza protocolo relativo', () => {
    assert.equal(linkOk('#facciones'), true)
    assert.equal(linkOk('/register'), true)
    assert.equal(linkOk(''), true)
    assert.equal(linkOk('https://wa.me/521'), true)
    assert.equal(linkOk('//evil.test'), false)
    assert.equal(httpUrlOk('#facciones'), false)
    assert.equal(httpUrlOk(''), true)
    assert.equal(httpUrlOk('https://spear.example'), true)
  })
})
