// Todo el texto visible del Ranking Nacional vive aquí.
// Regla: lenguaje de jugador, frases cortas, sin términos técnicos.

export type FaqItem = { pregunta: string; respuesta: string }
export type EjemploRanking = {
  titulo: string
  explicacion: string
  resultado: string
  real?: boolean
}
export type TarjetaTexto = { titulo: string; texto: string }

export const ETIQUETAS = {
  puntosEnJuego: 'Puntos en juego',
  porSuLugar: 'Por su lugar',
  extra: 'Extra',
  total: 'Total',
  lugar: 'Lugar',
  jugador: 'Jugador',
  eventos: 'Eventos',
  puntos: 'Puntos',
  sinCuenta: 'SIN CUENTA AÚN',
  sinCuentaTooltip:
    'Todavía no tiene cuenta en AirNation. Sus puntos se guardan para cuando la cree.',
  noJugoTodo: 'NO JUGÓ TODO',
  noJugoTodoTooltip: 'No completó todas las partes del evento.',
  resultadosEnVivo: 'RESULTADOS EN VIVO',
  resultadosEnVivoTooltip:
    'Los resultados se registraron en vivo con AirNation durante el evento.',
  eventoFundador: 'EVENTO FUNDADOR',
  tu: 'TÚ',
  verComoSumo: 'Ver cómo sumó',
  datosDelEvento: 'Datos del evento',
  datosDelEventoNota:
    'Los registró el organizador. Son informativos y no cambian los puntos.',
  tablaVacia: 'La tabla se llena con el primer evento de la temporada.',
} as const

export const LUGAR_BANDO: Record<string, string> = {
  ganadora: 'Bando ganador',
  segunda: '2º bando',
  tercera_o_mas: 'Otros bandos',
}

export const STATS_LABELS: Record<string, string> = {
  puntos_amg: 'Puntos AMG',
  tiempo_circuito: 'Tiempo del circuito',
  rondas_ganadas_speedsoft: 'Rondas ganadas en Speedsoft',
  rondas_ganadas_tactical_arena: 'Rondas ganadas en Tactical Arena',
}

export const HERO_RANKING = {
  titulo: 'RANKING NACIONAL',
  subtitulo:
    'Juega, suma puntos y compite por ser el número 1 del airsoft en México.',
  botonTabla: 'VER TABLA',
  botonOrganizador: 'SOY ORGANIZADOR',
}

export const TEXTOS_SOLICITUD = {
  titulo: 'QUE TU EVENTO CUENTE',
  intro:
    'Déjanos tus datos y te contactamos por WhatsApp para sumar tu evento al Ranking Nacional. Es gratis hasta el 28 de febrero de 2027.',
  nombre: 'TU NOMBRE',
  nombrePlaceholder: '¿Cómo te llamas?',
  whatsapp: 'WHATSAPP',
  whatsappPlaceholder: '10 dígitos',
  email: 'CORREO (OPCIONAL)',
  emailPlaceholder: 'tu@correo.com',
  organizacion: 'NOMBRE DE TU EVENTO U ORGANIZACIÓN',
  organizacionPlaceholder: 'Ej. Airsoft Mexican Games',
  tipoEvento: '¿QUÉ TIPO DE EVENTO HACES?',
  tiposEvento: [
    'Dominguera',
    'Torneo',
    'Speedsoft',
    'Milsim o evento grande',
    'Circuito',
    'Otro',
  ],
  ciudad: 'CIUDAD',
  ciudadPlaceholder: '¿Dónde se juega?',
  jugadores: '¿CUÁNTOS JUGADORES ESPERAS?',
  jugadoresOpciones: ['Menos de 15', '15 a 40', '40 a 100', 'Más de 100'],
  fecha: '¿CUÁNDO ES TU PRÓXIMO EVENTO? (OPCIONAL)',
  fechaPlaceholder: 'Ej. noviembre o 15 de diciembre',
  mensaje: '¿ALGO MÁS QUE QUIERAS CONTARNOS? (OPCIONAL)',
  mensajePlaceholder: 'Formato, reglas, dudas…',
  enviar: 'ENVIAR SOLICITUD',
  enviando: 'ENVIANDO…',
  errorCampos: 'Revisa los campos marcados.',
  errorGeneral: 'No se pudo enviar. Intenta de nuevo.',
  exitoTitulo: '¡LISTO!',
  exitoTexto: 'Recibimos tu solicitud. Te escribimos pronto por WhatsApp.',
  cerrar: 'CERRAR',
} as const

export const PASOS_RANKING: TarjetaTexto[] = [
  {
    titulo: 'Juega un evento del ranking',
    texto:
      'Torneos, speedsoft, milsim o domingueras. Si el evento es parte del Ranking Nacional, tus resultados cuentan.',
  },
  {
    titulo: 'Gana puntos',
    texto:
      'Depende de tres cosas: el lugar en el que quedaste, el tipo de evento y cuántos jugadores participaron.',
  },
  {
    titulo: 'Sube en la tabla',
    texto:
      'Se suman tus mejores eventos de la temporada. Cada punto se puede revisar: nada es secreto.',
  },
]

export const TEXTOS_TABLA = {
  titulo: 'LA TABLA',
  nota: (maxResultados: number, maxRecreativos: number) =>
    `Cuentan tus ${maxResultados} mejores eventos de la temporada (máximo ${maxRecreativos} domingueras).`,
}

export const TEXTOS_EVENTOS = {
  titulo: 'EVENTOS QUE CUENTAN',
  jugadores: (n: number) => `${n} jugadores`,
  puntosEnJuego: (n: number) => `${n} puntos en juego`,
}

export const TEXTOS_PUNTOS = {
  titulo: '¿CÓMO SE GANAN LOS PUNTOS?',
  intro: 'Cada evento pone puntos en juego. Tu lugar decide cuántos te llevas.',
  tipoTitulo: 'LO QUE VALE CADA EVENTO',
  tipoNota: 'Puntos para el 1er lugar en un evento de tamaño normal.',
  tamanoTitulo: 'ENTRE MÁS JUGADORES, MÁS PUNTOS',
  tamanoNota:
    'Un evento con pocos jugadores pone menos puntos en juego que uno lleno.',
  ejemploCuenta:
    'Ejemplo: un torneo (100 puntos) con 24 jugadores (evento mediano, 75%) pone 75 puntos en juego.',
  lugarTitulo: 'TU LUGAR',
  lugarNota:
    'El 1er lugar se lleva todos los puntos en juego. Los demás, una parte.',
  lugarBarra: (porcentaje: number) => `${porcentaje}% de los puntos`,
  bandosTitulo: 'SI SE JUEGA POR BANDOS',
  bandosNota:
    'En milsim y domingueras los puntos se reparten entre muchos jugadores, por eso son menos. Lo que te hace destacar son los puntos extra.',
  bandos: [
    { resultado: 'Bando ganador', porcentaje: 30 },
    { resultado: '2º bando', porcentaje: 15 },
    { resultado: 'Otros bandos', porcentaje: 10 },
  ],
  extraTitulo: 'PUNTOS EXTRA',
  extraTexto:
    'MVP, objetivos, rondas ganadas… Cada organizador decide y lo anuncia antes del evento. Nadie puede recibir en extras más del 30% de los puntos en juego.',
}

export const REGLAS_EN_CORTO: TarjetaTexto[] = [
  {
    titulo: 'Tus mejores eventos',
    texto:
      'En la tabla cuentan tus 10 mejores resultados de la temporada, y de esos máximo 4 domingueras. Todos tus eventos quedan en tu historial.',
  },
  {
    titulo: 'Reglas claras desde antes',
    texto:
      'Cada organizador explica cómo decide los lugares antes de que empiece el evento. No se vale cambiar reglas a medio juego.',
  },
  {
    titulo: 'Si hay empate',
    texto:
      'Gana quien tenga más primeros lugares. Si siguen empatados: quien jugó más eventos completos, luego quien quedó mejor en su evento más importante y al final quien jugó más reciente.',
  },
  {
    titulo: '¿Algo está mal?',
    texto:
      'Tienes 3 días desde que se publican los resultados para avisarnos. El organizador revisa y AirNation decide.',
  },
  {
    titulo: 'Nadie compra puntos',
    texto:
      'Pagar no le da más puntos a ningún evento. El tipo de evento lo revisa AirNation con reglas públicas.',
  },
  {
    titulo: 'Tus datos, seguros',
    texto:
      'En el ranking solo se ve tu nombre, tu ciudad y tus resultados. Tus datos de contacto nunca se comparten.',
  },
  {
    titulo: 'Temporadas',
    texto:
      'La tabla empieza de cero cada temporada, pero tu historial se queda para siempre en tu perfil.',
  },
]

export const TEXTOS_ORGANIZADORES = {
  eyebrow: 'PARA ORGANIZADORES',
  titulo: '¿VAS A HACER UN EVENTO? QUE CUENTE PARA EL RANKING.',
  beneficios: [
    'Tus jugadores ganan puntos oficiales y tienen un motivo más para ir.',
    'Página de resultados de tu evento, clara y fácil de compartir.',
    'Árbitros con el celular y resultados en vivo con AirNation.',
    'Tu evento visible para toda la comunidad.',
  ],
  gratis: 'GRATIS HASTA EL 28 DE FEBRERO DE 2027',
  despues: 'Después, pagas por cada jugador que aparezca en el ranking:',
  tarifaAirnationEtiqueta: 'USANDO AIRNATION',
  tarifaAirnationBadge: 'MÁS BARATO',
  tarifaAirnationTexto:
    'Registras tus resultados en AirNation y pagas en los primeros 7 días.',
  tarifaExternaEtiqueta: 'NOS MANDAS TUS RESULTADOS',
  tarifaExternaTexto:
    'Nos envías Excel, fotos o mensajes, o pagas después de 7 días.',
  fundador:
    'Si entras antes de marzo eres organizador fundador y mantienes estos precios todo 2027.',
  cta: 'QUIERO QUE MI EVENTO CUENTE',
}

export const TEXTOS_TRANSPARENCIA: string[] = [
  'Tienes 3 días para avisarnos si algo está mal',
  'Tus datos de contacto nunca se comparten',
  'Las reglas de cada evento se publican antes de jugar',
]

export const EJEMPLOS_RANKING: EjemploRanking[] = [
  {
    real: true,
    titulo: 'AMG Stage 01 CDMX',
    explicacion:
      'Circuito nacional (200 puntos) con 6 jugadores. Es un evento chico, así que queda a la mitad: 100 puntos en juego. AMG daba 5 puntos extra por cada ronda ganada.',
    resultado:
      'Pitbull quedó 1º y ganó 2 rondas: 100 + 10 = 110 puntos.',
  },
  {
    titulo: 'Torneo de 24 jugadores',
    explicacion: 'Torneo (100 puntos), evento mediano (75%): 75 puntos en juego.',
    resultado: 'El 1º gana 75, el 2º 60, el 3º 49, y del 9º al 16º lugar se llevan 23.',
  },
  {
    titulo: 'Torneo de 10 equipos de 5',
    explicacion: '50 jugadores, evento normal: 100 puntos en juego.',
    resultado:
      'Cada integrante del equipo campeón gana 100 puntos. Los del 2º lugar, 80 cada uno.',
  },
  {
    titulo: 'Milsim de 2 días con 160 jugadores',
    explicacion:
      'Milsim (150 puntos), evento grande (125%): 188 puntos en juego. Se juega por bandos.',
    resultado:
      'Bando ganador: 56 cada uno. Bando perdedor: 28. El MVP se lleva 56 extra.',
  },
  {
    titulo: 'Dominguera de 40 jugadores',
    explicacion: 'Dominguera (25 puntos), evento normal: 25 puntos en juego.',
    resultado:
      'Bando ganador: 8 cada uno. Bando perdedor: 4. MVP: 8 extra. Poquito, pero suma.',
  },
  {
    titulo: 'Si vas a 20 domingueras',
    explicacion:
      'En tu tabla solo cuentan 4 domingueras, junto con tus mejores eventos competitivos.',
    resultado:
      'Ir a muchos eventos se premia, pero para llegar arriba hay que competir.',
  },
]

export const FAQ_JUGADORES: FaqItem[] = [
  {
    pregunta: '¿Cómo entro al ranking?',
    respuesta:
      'Juega un evento que sea parte del Ranking Nacional. El organizador sube los resultados y apareces en la tabla.',
  },
  {
    pregunta: '¿Necesito cuenta en AirNation?',
    respuesta:
      'No para sumar puntos. Pero con cuenta puedes ver tu historial y tu posición en tu perfil, y compartirlo.',
  },
  { pregunta: '¿Me cuesta algo?', respuesta: 'No. Para jugadores es gratis.' },
  {
    pregunta: '¿Por qué un torneo da más puntos que una dominguera?',
    respuesta:
      'Porque no es lo mismo competir por un lugar que jugar una partida casual. Por eso cada tipo de evento vale distinto.',
  },
  {
    pregunta: '¿Cómo sé de dónde salieron mis puntos?',
    respuesta:
      'Cada evento tiene su página con los resultados y cómo sumó cada jugador. También lo ves en tu perfil.',
  },
  {
    pregunta: 'Mi resultado está mal, ¿qué hago?',
    respuesta:
      'Avísanos en los primeros 3 días después de que se publiquen los resultados. Lo revisamos con el organizador.',
  },
  {
    pregunta: 'Mi equipo ganó, ¿todos sumamos?',
    respuesta:
      'Sí. Cada integrante que jugó se lleva los puntos del lugar de su equipo.',
  },
  {
    pregunta: '¿Qué pasa cuando termina la temporada?',
    respuesta:
      'La tabla empieza de cero, pero tu historial se queda para siempre en tu perfil.',
  },
  {
    pregunta: '¿Un organizador puede pagar para dar más puntos?',
    respuesta: 'No. Pagar nunca cambia cuántos puntos da un evento.',
  },
]

export const FAQ_ORGANIZADORES: FaqItem[] = [
  {
    pregunta: '¿Qué eventos pueden entrar?',
    respuesta:
      'Cualquiera: torneos, speedsoft, milsim o domingueras. Solo necesitas mínimo 6 jugadores y publicar tu evento en AirNation con una semana de anticipación.',
  },
  {
    pregunta: '¿Cuánto cuesta?',
    respuesta:
      'Gratis hasta el 28 de febrero de 2027. Después: $19 por jugador si registras tus resultados en AirNation, o $29 si nos los mandas por otro medio.',
  },
  {
    pregunta: '¿Por qué es más barato usando AirNation?',
    respuesta:
      'Porque los resultados llegan completos desde el evento y nadie tiene que pasarlos a mano. Hay menos errores, se publican más rápido y tu evento lleva el distintivo RESULTADOS EN VIVO.',
  },
  {
    pregunta: '¿Qué es ser organizador fundador?',
    respuesta:
      'Si haces al menos un evento del ranking antes de marzo de 2027, mantienes los precios de $19 y $29 durante todo 2027, aunque suban para los demás.',
  },
  {
    pregunta: '¿Quién decide cuánto vale mi evento?',
    respuesta:
      'Tú nos dices qué tipo de evento es y AirNation lo confirma en máximo 2 días, con las mismas reglas para todos.',
  },
  {
    pregunta: '¿Puedo usar mi propia forma de jugar?',
    respuesta:
      'Sí. Tú decides cómo se definen los lugares. Solo explícalo antes del evento.',
  },
  {
    pregunta: '¿Puedo dar puntos extra?',
    respuesta:
      'Sí: MVP, objetivos, rondas ganadas… Anúncialos antes del evento. Máximo 30% de los puntos en juego por jugador.',
  },
  {
    pregunta: '¿Mis jugadores necesitan cuenta?',
    respuesta:
      'No es obligatorio, pero con cuenta su historial queda en su perfil y lo pueden presumir.',
  },
  {
    pregunta: '¿Comparten los datos de mis jugadores?',
    respuesta:
      'No. En el ranking solo se ve nombre, ciudad y resultados. Los contactos de tus jugadores nunca se comparten con otros organizadores.',
  },
  {
    pregunta: '¿Puedo cobrarle el costo a mis jugadores?',
    respuesta: 'Sí, puedes incluirlo en la inscripción si quieres.',
  },
]

export const TEXTOS_EVENTO = {
  breadcrumb: 'RANKING NACIONAL / EVENTOS',
  organiza: 'Organiza',
  puntosTitulo: '¿CUÁNTOS PUNTOS HABÍA EN JUEGO?',
  cajaTipo: 'TIPO DE EVENTO',
  cajaTamano: 'TAMAÑO',
  cajaPuntos: 'PUNTOS EN JUEGO',
  cuenta: (
    tipo: string,
    puntosTipo: number,
    etiquetaTamano: string,
    porcentaje: number,
    bolsa: number
  ) =>
    `${tipo} (${puntosTipo}) × ${etiquetaTamano.toLowerCase()} (${porcentaje}%) = ${bolsa} puntos en juego.`,
  comoSeJugo: 'CÓMO SE JUGÓ',
  ordenTitulo: '¿CÓMO SE DECIDIÓ EL ORDEN?',
  ordenNota: 'Lo definió el organizador y lo anunció antes del evento.',
  extraTitulo: 'PUNTOS EXTRA DE ESTE EVENTO',
  extraCadaUno: (puntos: number) => `+${puntos} puntos cada una`,
  extraNota:
    'Nadie puede recibir en extras más del 30% de los puntos en juego.',
  extraVacio: 'Este evento no dio puntos extra.',
  resultadosTitulo: 'RESULTADOS',
  sumaLugar: (lugar: string, puntos: number) =>
    `Quedó en ${lugar}: ${puntos} puntos.`,
  sumaExtra: (nombre: string, veces: number, puntos: number) =>
    `${nombre} × ${veces}: +${puntos} puntos extra.`,
  sumaTotal: (total: number) => `Total: ${total} puntos.`,
  avisoError:
    '¿Ves algo mal? Tienes 3 días desde que se publicaron los resultados para avisarnos en',
}

export const TEXTOS_HOME = {
  eyebrow: 'RANKING NACIONAL',
  verCompleto: 'VER RANKING COMPLETO →',
  orgEyebrow: 'PARA ORGANIZADORES',
  orgTitulo: '¿VAS A HACER UN EVENTO?',
  orgTexto:
    'Haz que tus resultados cuenten para el Ranking Nacional. Torneos, speedsoft, milsim o domingueras.',
  orgBullets: [
    'Puntos oficiales para tus jugadores',
    'Resultados claros y fáciles de compartir',
    'Árbitros y resultados en vivo con AirNation',
  ],
  orgPrecio: 'Gratis hasta el 28 de febrero',
  orgPrecioDespues: 'después, desde $19 por jugador',
  orgCta: 'QUIERO QUE MI EVENTO CUENTE',
  orgLink: '¿Cómo se ganan los puntos? →',
}

export const TEXTOS_FEED = {
  bannerTitulo: '¿VAS A HACER UN EVENTO?',
  bannerTexto:
    'Haz que cuente para el Ranking Nacional. Gratis hasta el 28 de febrero.',
  jugadores: (n: number) => `${n} jugadores en la tabla`,
  verCompleto: 'VER RANKING COMPLETO →',
  comoSeGanan: '¿CÓMO SE GANAN PUNTOS? →',
  vacio: 'El Ranking Nacional arranca pronto.',
}

export const TEXTOS_PERFIL = {
  titulo: 'RANKING NACIONAL',
  verTabla: 'VER TABLA →',
  deMexico: 'en México',
  puntos: (n: number) => `${n} puntos`,
  susEventos: 'SUS EVENTOS',
  pie: 'Cada punto se puede revisar.',
  pieLink: '¿Cómo se ganan? →',
}

// Compatibilidad con imports existentes
export const CASOS_RANKING = EJEMPLOS_RANKING
