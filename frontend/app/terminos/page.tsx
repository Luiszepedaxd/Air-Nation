import type { Metadata } from 'next'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export const metadata: Metadata = {
  title: 'Términos y Condiciones | AirNation',
  description:
    'Lee los términos y condiciones de uso de AirNation, la plataforma de airsoft, gotcha y paintball en México.',
  alternates: {
    canonical: 'https://www.airnation.online/terminos',
  },
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <article className="mx-auto max-w-3xl px-4 py-10 md:py-12">
        <h1
          style={jost}
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
        >
          Términos y Condiciones de Uso
        </h1>
        <p className="mt-3 font-body text-sm text-[#666666]">
          <strong>Última actualización:</strong> 16 de abril de 2026
        </p>

        <div className="prose-airnation mt-8">
          <p>
            Bienvenido a <strong>AirNation</strong> (en adelante, &quot;la
            Plataforma&quot;), operada por AirNation con domicilio digital en{' '}
            <a href="https://www.airnation.online">airnation.online</a>. Al
            registrarte y usar la Plataforma, aceptas los presentes Términos y
            Condiciones en su totalidad.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>1. Descripción del Servicio</h2>
          <p>
            AirNation es una plataforma digital dirigida a la comunidad de
            airsoft, gotcha y paintball en México. Ofrece los siguientes
            servicios:
          </p>
          <ul>
            <li>Registro y gestión de perfil de jugador con credencial digital</li>
            <li>Directorio de campos de juego y equipos</li>
            <li>Registro y transferencia de réplicas (Arsenal)</li>
            <li>
              Marketplace P2P para compra y venta de réplicas entre usuarios
            </li>
            <li>Feed social con publicaciones, eventos y comunidad</li>
            <li>Chat entre usuarios</li>
          </ul>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>2. Elegibilidad</h2>
          <p>Para usar AirNation debes:</p>
          <ul>
            <li>
              Ser mayor de 18 años, o contar con autorización de tu tutor legal
              si eres menor de edad
            </li>
            <li>Proporcionar información veraz durante el registro</li>
            <li>
              Cumplir con la legislación mexicana aplicable al uso de réplicas de
              airsoft, gotcha y paintball
            </li>
          </ul>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>3. Cuentas de Usuario</h2>
          <p>
            Eres responsable de mantener la confidencialidad de tu contraseña y
            de todas las actividades que ocurran bajo tu cuenta. AirNation no se
            hace responsable por pérdidas derivadas del acceso no autorizado a tu
            cuenta si no nos notificaste de manera oportuna.
          </p>
          <p>
            Nos reservamos el derecho de suspender o eliminar cuentas que violen
            estos Términos.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>4. Marketplace y Transacciones P2P</h2>
          <p>
            El Marketplace de AirNation es un espacio para que usuarios vendan y
            compren réplicas entre sí. AirNation actúa únicamente como
            intermediario tecnológico y <strong>no es parte de ninguna transacción</strong>.
            Por lo tanto:
          </p>
          <ul>
            <li>
              AirNation no garantiza la calidad, legalidad ni entrega de los
              productos listados
            </li>
            <li>
              El comprador y el vendedor son responsables de acordar y cumplir
              los términos de cada transacción
            </li>
            <li>
              El usuario vendedor declara que las réplicas listadas son de su
              propiedad y que su venta cumple con la legislación vigente en México
            </li>
            <li>
              AirNation puede remover listings que violen estas políticas sin
              previo aviso
            </li>
          </ul>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>5. Registro de Réplicas (Arsenal)</h2>
          <p>
            El sistema de registro de réplicas es una herramienta de
            organización personal. AirNation no valida oficialmente la propiedad
            legal de ninguna réplica ante autoridades. El usuario es responsable
            de la veracidad de la información ingresada.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>6. Conducta del Usuario</h2>
          <p>Al usar AirNation te comprometes a no:</p>
          <ul>
            <li>
              Publicar contenido falso, ofensivo, discriminatorio o que incite a
              la violencia
            </li>
            <li>Suplantar la identidad de otras personas</li>
            <li>Usar la Plataforma para actividades ilegales</li>
            <li>Intentar vulnerar la seguridad o integridad del sistema</li>
          </ul>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>7. Propiedad Intelectual</h2>
          <p>
            El nombre AirNation, su logotipo, diseño y contenido editorial son
            propiedad de AirNation. El contenido generado por los usuarios
            (fotos, publicaciones, descripciones) es responsabilidad de quien lo
            publica. Al subirlo, otorgas a AirNation una licencia no exclusiva
            para mostrarlo dentro de la Plataforma.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>8. Limitación de Responsabilidad</h2>
          <p>
            AirNation no será responsable por daños directos, indirectos o
            consecuentes derivados del uso de la Plataforma, incluyendo pérdidas
            en transacciones del Marketplace, interrupciones del servicio o
            errores en la información de terceros.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>9. Modificaciones</h2>
          <p>
            AirNation puede actualizar estos Términos en cualquier momento. Los
            cambios serán notificados en la Plataforma. El uso continuo después
            de la notificación implica aceptación de los nuevos términos.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>10. Legislación Aplicable</h2>
          <p>
            Estos Términos se rigen por las leyes de los Estados Unidos
            Mexicanos. Cualquier controversia se someterá a los tribunales
            competentes de Guadalajara, Jalisco.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>11. Contacto</h2>
          <p>
            Para dudas sobre estos Términos escríbenos a:{' '}
            <strong>info@airnation.online</strong>
          </p>
        </div>
      </article>
    </div>
  )
}
