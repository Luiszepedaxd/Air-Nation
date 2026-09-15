export type FaqItem = { pregunta: string; respuesta: string }
export type CasoRanking = { titulo: string; calculo: string; resultado: string; real?: boolean }

export const CASOS_RANKING: CasoRanking[] = [
  { real: true, titulo: 'AMG Stage 01 CDMX · 6 jugadores', calculo: 'Nivel 4 (200 pts) × factor 0.50 = bolsa de 100 pts. Bono declarado: +5% por ronda ganada.', resultado: '1º: 100 + 10 de bono = 110 · 2º: 80 + 10 = 90 · 3º: 65 · 4º: 55 · 5º: 50 + 5 = 55 · 6º: 45 + 5 = 50' },
  { titulo: 'Torneo local individual · 24 jugadores', calculo: 'Nivel 2 (100 pts) × factor 0.75 = bolsa de 75 pts', resultado: '1º gana 75 · 2º gana 60 · 3º gana 49 · del 9º al 16º ganan 23' },
  { titulo: 'Torneo por equipos · 50 jugadores (10 equipos)', calculo: 'Nivel 2 (100 pts) × factor 1.00 = bolsa de 100 pts', resultado: 'Cada integrante del equipo campeón gana 100 · subcampeón 80 · tercer lugar 65' },
  { titulo: 'Milsim de 2 días · 160 jugadores · 2 facciones', calculo: 'Nivel 3 (150 pts) × factor 1.25 = bolsa de 188 pts', resultado: 'Facción ganadora 56 c/u · facción perdedora 28 c/u · bono "Objetivo principal" (+20%) +38 · bono MVP (+30%) +56' },
  { titulo: 'Dominguera · 40 jugadores', calculo: 'Nivel 1 (25 pts) × factor 1.00 = bolsa de 25 pts', resultado: 'Facción ganadora 8 · facción perdedora 4 · MVP +8' },
  { titulo: 'Jugador que va a 20 domingueras en la temporada', calculo: 'Solo cuentan sus mejores 10 resultados, y de esos máximo 4 recreativos', resultado: 'Ir a muchos eventos se premia, pero no reemplaza competir' },
]

export const FAQ_JUGADORES: FaqItem[] = [
  { pregunta: '¿Cómo entro al Ranking Nacional?', respuesta: 'Juega un evento rankeado. El organizador registra los resultados y apareces en la tabla.' },
  { pregunta: '¿Necesito cuenta en AirNation?', respuesta: 'No es obligatorio para sumar puntos, pero sin cuenta apareces como perfil sin reclamar. Con cuenta ves tu desglose, tu historial y tu posición en tu perfil.' },
  { pregunta: '¿Me cuesta algo estar en el ranking?', respuesta: 'No. Para jugadores el ranking es gratis.' },
  { pregunta: '¿Por qué un torneo da más puntos que una dominguera?', respuesta: 'Porque el nivel de exigencia es distinto. Los puntos dependen del nivel del evento y de cuántos jugadores participan. Las tablas están publicadas en esta página.' },
  { pregunta: '¿Cómo sé de dónde salieron mis puntos?', respuesta: 'Cada evento tiene una página pública con nivel, jugadores, bolsa, criterio de posición, bonos y resultados. En tu perfil ves el desglose de cada resultado.' },
  { pregunta: 'Mi resultado está mal. ¿Qué hago?', respuesta: 'Tienes 72 horas desde la publicación para reportarlo. El organizador responde y AirNation resuelve en definitiva.' },
  { pregunta: 'Mi equipo ganó. ¿Todos sumamos?', respuesta: 'Sí. En torneos por equipos, cada integrante que jugó recibe los puntos de la posición de su equipo.' },
  { pregunta: '¿Qué pasa con mis puntos al terminar la temporada?', respuesta: 'La tabla reinicia al empezar la nueva temporada, pero tu historial completo queda guardado para siempre en tu perfil.' },
  { pregunta: '¿Un organizador puede pagar para que su evento dé más puntos?', respuesta: 'No. El nivel del evento lo valida AirNation con criterios públicos y nunca depende de un pago.' },
]

export const FAQ_ORGANIZADORES: FaqItem[] = [
  { pregunta: '¿Qué eventos pueden entrar al ranking?', respuesta: 'Cualquiera: torneos, speedsoft, milsim, domingueras o circuitos, con mínimo 6 jugadores y publicados en AirNation al menos 7 días antes.' },
  { pregunta: '¿Cuánto cuesta?', respuesta: 'Tarifa AirNation: $19 MXN por jugador rankeado si capturas los resultados en AirNation y pagas dentro de los 7 días posteriores al evento. Tarifa estándar: $29 MXN si envías los resultados por otro medio (Excel, fotos, mensajes) o pagas después. Gratis durante toda la Temporada Inaugural, hasta el 28 de febrero de 2027.' },
  { pregunta: '¿Por qué cuesta menos capturar en AirNation?', respuesta: 'Porque los resultados llegan completos y verificables desde el evento, sin que nadie tenga que transcribirlos. Hay menos errores, se publican más rápido y tu evento lleva el distintivo CAPTURA AIRNATION.' },
  { pregunta: '¿Qué es ser organizador fundador?', respuesta: 'Si registras al menos un evento rankeado antes del 28 de febrero de 2027, conservas las tarifas de $19 y $29 durante toda la Temporada 2027, aunque suban para nuevos organizadores.' },
  { pregunta: '¿Quién decide el nivel de mi evento?', respuesta: 'Tú lo propones al registrarlo y AirNation lo valida en un máximo de 48 horas según las tablas públicas.' },
  { pregunta: '¿Puedo usar mi propia dinámica de juego?', respuesta: 'Sí. Tú defines cómo se decide la posición final. Solo debes publicarlo antes del evento y no puede cambiar durante el evento.' },
  { pregunta: '¿Puedo dar puntos extra?', respuesta: 'Sí, con bonos declarados antes del evento (MVP, objetivos, rondas ganadas). Tope de 30% de la bolsa por jugador.' },
  { pregunta: '¿Necesito usar el módulo de torneos de AirNation?', respuesta: 'Para eventos competitivos es lo recomendado: arbitraje desde el celular, resultados en vivo y página pública. También puedes enviar tus resultados.' },
  { pregunta: '¿Mis jugadores necesitan cuenta?', respuesta: 'No es obligatorio, pero con cuenta su historial queda ligado a su perfil y lo pueden ver y compartir.' },
  { pregunta: '¿Comparten los datos de mis jugadores?', respuesta: 'No. En el ranking solo se publica nombre público, ciudad y resultados. Los datos de contacto de tus jugadores nunca se comparten con otros organizadores.' },
  { pregunta: '¿Puedo cobrarle el costo a mis jugadores?', respuesta: 'Sí, puedes incluirlo en la inscripción si así lo decides.' },
]
