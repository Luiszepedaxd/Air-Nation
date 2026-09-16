'use strict'

const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const {
  verificarLlave,
  enviarUrls,
  sincronizarIndexNow,
} = require('../src/lib/indexnow')

async function main() {
  const args = process.argv.slice(2)
  const todo = args.includes('--todo')
  const ranking = args.includes('--ranking')
  const urlArgs = args.filter(
    (a) =>
      a !== '--todo' &&
      a !== '--ranking' &&
      (a.startsWith('http://') || a.startsWith('https://'))
  )

  if (urlArgs.length > 0) {
    const ok = await verificarLlave()
    if (!ok) {
      console.error(
        '[indexnow] El archivo de la llave no está publicado en producción'
      )
      process.exit(1)
    }
    const resultados = await enviarUrls(urlArgs)
    let total = 0
    for (const r of resultados) {
      console.log(r.mensaje)
      total += r.enviadas
    }
    const ultimo = resultados[resultados.length - 1]
    console.log(
      `Total de URLs enviadas: ${total}. Código de respuesta: ${ultimo?.status ?? 0}`
    )
    process.exit(0)
  }

  let resultado
  if (todo) {
    resultado = await sincronizarIndexNow({ forzar: true })
  } else if (ranking) {
    resultado = await sincronizarIndexNow({ forzar: true, filtro: '/ranking' })
  } else {
    resultado = await sincronizarIndexNow()
  }

  console.log(JSON.stringify(resultado, null, 2))
  process.exit(0)
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
