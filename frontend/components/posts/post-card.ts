/**
 * Misma card que el feed de inicio.
 * El contenedor inmediato es `postCardColumn` (`px-4 md:px-6`, tope 680).
 * Si ese contenedor está dentro de otro `px-4 md:px-6` (perfil, equipo, campo),
 * envuélvelo con `postCardBreakout` para no sumar márgenes.
 */
export const postCardShell =
  'min-w-0 -mx-4 w-[calc(100%+2rem)] border-b border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6 md:w-[calc(100%+3rem)]'

export const postCardShellHi =
  'min-w-0 -mx-4 w-[calc(100%+2rem)] border-b border-[#CC4B37] bg-[#FFF8F7] md:-mx-6 md:w-[calc(100%+3rem)]'

export const postCardColumn = 'mx-auto w-full max-w-[680px] px-4 md:px-6'

export const postCardBreakout = '-mx-4 md:-mx-6'
