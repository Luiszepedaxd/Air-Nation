// Todo el texto visible del Ranking Nacional vive aquí.
// Regla: lenguaje de jugador, frases cortas, sin términos técnicos.

export type FaqItem = { pregunta: string; respuesta: string }
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
  botonTabla: 'VER CLASIFICACIÓN',
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
  organizacionPlaceholder: '',
  tipoEvento: '¿QUÉ TIPO DE EVENTO HACES?',
  tiposEvento: [
    'Dominguera',
    'Milsim / Opsim',
    'Torneo',
    'Final nacional',
    'Speedsoft',
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
      'Domingueras, milsim/opsim o torneos. La final nacional es el tope de los torneos. Si el evento es parte del Ranking Nacional, tus resultados cuentan.',
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
  eyebrow: 'CLASIFICACIÓN',
  titulo: 'ASÍ VA LA TEMPORADA',
  subtitulo: 'Los mejores jugadores del Ranking Nacional hasta hoy.',
  nota: (maxResultados: number, maxRecreativos: number) =>
    `Cuentan tus ${maxResultados} mejores eventos de la temporada (máximo ${maxRecreativos} domingueras).`,
}

export const TEXTOS_EVENTOS = {
  eyebrow: 'EVENTOS',
  titulo: 'EVENTOS QUE YA SUMARON',
  subtitulo:
    'Estos eventos ya repartieron puntos para el Ranking Nacional. ¿El tuyo es el siguiente?',
  linkOrganizar: 'Haz que tu evento sume →',
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
    'Ejemplo: un torneo (120 puntos) con 24 jugadores (evento mediano, 75%) pone 90 puntos en juego.',
  lugarTitulo: 'TU LUGAR',
  lugarNota:
    'El 1er lugar se lleva todos los puntos en juego. Los demás, una parte.',
  lugarBarra: (porcentaje: number) => `${porcentaje}% de los puntos`,
  bandosTitulo: 'SI SE JUEGA POR BANDOS',
  bandosNota:
    'En milsim/opsim y domingueras los puntos se reparten entre muchos jugadores, por eso son menos. Lo que te hace destacar son los puntos extra.',
  bandos: [
    { resultado: 'Bando ganador', porcentaje: 30 },
    { resultado: '2º bando', porcentaje: 15 },
    { resultado: 'Otros bandos', porcentaje: 10 },
  ],
  extraTitulo: 'PUNTOS EXTRA',
  extraTexto:
    'MVP, objetivos, rondas ganadas… Cada organizador decide y lo anuncia antes del evento. Nadie puede recibir en extras más del 30% de los puntos en juego.',
  ordenMenosAMas: 'De menos a más puntos',
  ordenMasAMenos: 'Del 1er lugar al último',
}

export const TEXTOS_REGLAS = {
  eyebrow: 'REGLAS',
  titulo: 'REGLAS CLARAS',
  subtitulo: 'Lo básico para competir parejo.',
}

export const REGLAS_EN_CORTO: TarjetaTexto[] = [
  {
    titulo: 'Cuentan tus mejores eventos',
    texto:
      'En cada temporada suman tus 10 mejores resultados (máximo 4 domingueras). La tabla empieza de cero cada temporada y tu historial se queda en tu perfil.',
  },
  {
    titulo: 'Todo se avisa antes de jugar',
    texto:
      'Cada organizador publica cómo decide los lugares y qué puntos extra da antes de que empiece el evento. No se cambian reglas a medio juego.',
  },
  {
    titulo: '¿Empate? Así se decide',
    texto:
      'Gana quien tenga más primeros lugares. Si siguen igual: quien jugó más eventos completos, luego quien quedó mejor en su evento más importante y al final quien jugó más reciente.',
  },
  {
    titulo: '¿Ves un error? Avísanos',
    texto:
      'Tienes 3 días desde que se publican los resultados. El organizador lo revisa y AirNation decide.',
  },
  {
    titulo: 'Los puntos no se compran',
    texto:
      'Pagar nunca le da más puntos a un evento. Cuánto vale cada evento se decide con reglas públicas, iguales para todos.',
  },
  {
    titulo: 'Tus datos están protegidos',
    texto:
      'En el ranking solo se ve tu nombre, tu ciudad y tus resultados. Tus datos de contacto nunca se comparten.',
  },
]

export const TEXTOS_ORGANIZADORES = {
  eyebrow: 'PARA ORGANIZADORES',
  titulo: '¿ORGANIZAS EVENTOS?',
  subtitulo: 'Haz que tus resultados sumen al Ranking Nacional.',
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

export const TEXTOS_FAQ = {
  eyebrow: 'FAQ',
  titulo: 'PREGUNTAS FRECUENTES',
  tabJugadores: 'SI JUEGAS',
  tabOrganizadores: 'SI ORGANIZAS',
  verTodas: (n: number) => `VER TODAS (${n})`,
  verMenos: 'VER MENOS',
}

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
    pregunta: '¿Por qué un torneo da más puntos que una milsim o una dominguera?',
    respuesta:
      'Porque no es lo mismo competir por un lugar que jugar por bandos o una partida casual. La milsim/opsim y la dominguera reparten puntos entre muchos; el torneo define lugares. La final nacional es el tope de los torneos, no un tipo de evento aparte.',
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
      'Domingueras, milsim/opsim o torneos (la final nacional es el tope del circuito de torneos). Solo necesitas mínimo 6 jugadores y publicar tu evento en AirNation con una semana de anticipación.',
  },
  {
    pregunta: '¿Cuánto cuesta?',
    respuesta:
      'Gratis hasta el 28 de febrero de 2027. Después: $9 por jugador si registras tus resultados en AirNation, o $29 si nos los mandas por otro medio.',
  },
  {
    pregunta: '¿Por qué es más barato usando AirNation?',
    respuesta:
      'Porque los resultados llegan completos desde el evento y nadie tiene que pasarlos a mano. Hay menos errores, se publican más rápido y tu evento lleva el distintivo RESULTADOS EN VIVO.',
  },
  {
    pregunta: '¿Qué es ser organizador fundador?',
    respuesta:
      'Si haces al menos un evento del ranking antes de marzo de 2027, mantienes los precios de $9 y $29 durante todo 2027, aunque suban para los demás.',
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
    'Haz que tus resultados cuenten para el Ranking Nacional. Torneos, milsim/opsim o domingueras.',
  orgBullets: [
    'Puntos oficiales para tus jugadores',
    'Resultados claros y fáciles de compartir',
    'Árbitros y resultados en vivo con AirNation',
  ],
  orgPrecio: 'Gratis hasta el 28 de febrero',
  orgPrecioDespues: 'después, desde $9 por jugador',
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
