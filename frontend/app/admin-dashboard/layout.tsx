export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <title>Дашборд администратора - Felix</title>
        <meta name="description" content="Дашборд администратора системы Felix" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
