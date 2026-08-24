export default function TorneosPublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style>{`
        .torneos-public-wrapper {
          background-color: #FFFFFF !important;
          color: #111111 !important;
          color-scheme: light !important;
        }
        .torneos-public-wrapper * {
          color-scheme: light;
        }
      `}</style>
      <div
        className="torneos-public-wrapper"
        style={{
          minHeight: '100dvh',
          backgroundColor: '#FFFFFF',
          color: '#111111',
        }}
      >
        {children}
      </div>
    </>
  )
}
