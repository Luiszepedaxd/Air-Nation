import type { Metadata } from 'next'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

export const metadata: Metadata = {
  title: 'Aviso de Privacidad | AirNation',
  description:
    'Conoce cómo AirNation protege y trata tus datos personales conforme a la LFPDPPP.',
  alternates: {
    canonical: 'https://www.airnation.online/privacidad',
  },
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <article className="mx-auto max-w-3xl px-4 py-10 md:py-12">
        <h1
          style={jost}
          className="text-[28px] font-extrabold uppercase leading-tight text-[#111111] md:text-[36px]"
        >
          Aviso de Privacidad
        </h1>
        <p className="mt-3 font-body text-sm text-[#666666]">
          <strong>Última actualización:</strong> 16 de abril de 2026
        </p>

        <div className="prose-airnation mt-8">
          <p>
            En cumplimiento con la{' '}
            <strong>
              Ley Federal de Protección de Datos Personales en Posesión de los
              Particulares (LFPDPPP)
            </strong>{' '}
            y su Reglamento, AirNation (en adelante, &quot;el Responsable&quot;)
            pone a tu disposición el presente Aviso de Privacidad.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>1. Responsable del Tratamiento</h2>
          <p>
            <strong>AirNation</strong>
            <br />
            Sitio web:{' '}
            <a href="https://www.airnation.online">www.airnation.online</a>
            <br />
            Correo de contacto: <strong>info@airnation.online</strong>
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>2. Datos Personales que Recopilamos</h2>
          <p>Al registrarte y usar AirNation, podemos recopilar los siguientes datos:</p>
          <p>
            <strong>Datos de identificación:</strong>
          </p>
          <ul>
            <li>Nombre o nombre de usuario</li>
            <li>Correo electrónico</li>
            <li>Fotografía de perfil (opcional)</li>
            <li>Ciudad y estado de residencia</li>
          </ul>
          <p>
            <strong>Datos de uso de la plataforma:</strong>
          </p>
          <ul>
            <li>Réplicas registradas en el Arsenal</li>
            <li>Publicaciones, comentarios y actividad social</li>
            <li>Listings del Marketplace</li>
            <li>Historial de transferencias de réplicas</li>
          </ul>
          <p>
            <strong>Datos técnicos:</strong>
          </p>
          <ul>
            <li>Dirección IP</li>
            <li>Tipo de dispositivo y navegador</li>
            <li>
              Datos de geolocalización (solo con tu autorización explícita)
            </li>
            <li>Cookies de sesión</li>
          </ul>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>3. Finalidades del Tratamiento</h2>
          <p>Usamos tus datos para:</p>
          <p>
            <strong>Finalidades primarias (necesarias para el servicio):</strong>
          </p>
          <ul>
            <li>Crear y gestionar tu cuenta de usuario</li>
            <li>Generar tu credencial digital y perfil público</li>
            <li>
              Habilitar el funcionamiento del Arsenal, Marketplace y funciones
              sociales
            </li>
            <li>
              Enviarte notificaciones relacionadas con tu actividad (mensajes,
              solicitudes, eventos)
            </li>
          </ul>
          <p>
            <strong>Finalidades secundarias (puedes oponerte):</strong>
          </p>
          <ul>
            <li>
              Enviarte comunicaciones sobre novedades y nuevas funciones de
              AirNation
            </li>
            <li>
              Análisis estadísticos agregados para mejorar la Plataforma
            </li>
          </ul>
          <p>
            Si deseas que tus datos no sean usados para finalidades secundarias,
            escríbenos a info@airnation.online.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>4. Transferencia de Datos</h2>
          <p>
            AirNation no vende ni renta tus datos personales a terceros. Podemos
            compartirlos únicamente con:
          </p>
          <ul>
            <li>
              <strong>Proveedores tecnológicos</strong> necesarios para operar
              la Plataforma (Supabase para base de datos, Resend para correos,
              Vercel para hosting), quienes están obligados a mantener la
              confidencialidad de los datos
            </li>
            <li>
              <strong>Autoridades competentes</strong>, cuando sea requerido
              por ley
            </li>
          </ul>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>5. Geolocalización</h2>
          <p>
            La Plataforma puede solicitar acceso a tu ubicación para mostrarte
            campos, eventos y listings cercanos. Esta función es{' '}
            <strong>completamente opcional</strong> y puedes activarla o
            desactivarla en cualquier momento desde tu Configuración. No
            compartimos tu ubicación exacta con otros usuarios.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>6. Cookies</h2>
          <p>
            AirNation utiliza cookies para mantener tu sesión activa y mejorar tu
            experiencia. Puedes desactivarlas desde la configuración de tu
            navegador, aunque esto puede afectar algunas funciones de la
            Plataforma.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>7. Derechos ARCO</h2>
          <p>
            Tienes derecho a <strong>Acceder, Rectificar, Cancelar u Oponerte</strong>{' '}
            al tratamiento de tus datos personales (Derechos ARCO). Para
            ejercerlos:
          </p>
          <ol>
            <li>
              Envía un correo a <strong>info@airnation.online</strong> con el
              asunto &quot;Derechos ARCO&quot;
            </li>
            <li>
              Incluye tu nombre, correo registrado y la solicitud específica
            </li>
            <li>Responderemos en un plazo máximo de <strong>20 días hábiles</strong></li>
          </ol>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>8. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger tus
            datos contra acceso no autorizado, pérdida o divulgación indebida.
            Sin embargo, ningún sistema es completamente infalible, por lo que te
            recomendamos usar una contraseña segura y no compartirla.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>9. Cambios al Aviso de Privacidad</h2>
          <p>
            AirNation puede modificar este Aviso en cualquier momento.
            Publicaremos la versión actualizada en esta misma página con la nueva
            fecha de actualización. El uso continuo de la Plataforma implica la
            aceptación de los cambios.
          </p>

          <hr className="my-8 border-0 border-t border-[#EEEEEE]" />

          <h2>10. Contacto</h2>
          <p>Para cualquier duda o solicitud relacionada con tu privacidad:</p>
          <p>
            <strong>Correo:</strong> info@airnation.online
            <br />
            <strong>Sitio:</strong>{' '}
            <a href="https://www.airnation.online/privacidad">
              www.airnation.online/privacidad
            </a>
          </p>
        </div>
      </article>
    </div>
  )
}
