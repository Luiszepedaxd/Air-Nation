'use strict'

const { sincronizarIndexNow } = require('../lib/indexnow')

const INTERVALO_MS = 60 * 60 * 1000
const RETRASO_INICIAL_MS = 2 * 60 * 1000

let corriendo = false

async function ejecutarSync() {
  if (corriendo) return
  corriendo = true
  try {
    await sincronizarIndexNow()
  } finally {
    corriendo = false
  }
}

function iniciarJobIndexNow() {
  if (process.env.INDEXNOW_AUTO !== 'true') {
    console.log('[indexnow] Job automático desactivado')
    return
  }

  console.log('[indexnow] Job automático activo (cada 60 min)')

  setTimeout(() => {
    ejecutarSync()
    setInterval(ejecutarSync, INTERVALO_MS)
  }, RETRASO_INICIAL_MS)
}

module.exports = { iniciarJobIndexNow }
