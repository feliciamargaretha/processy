export const metadata = {
  title: 'Processy — Figma design timeline',
  description: 'Turn your Figma file into a design process timeline for your case study',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
