export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gray-800">404</h1>
      <p className="text-gray-500">The page you&#39;re looking for doesn&#39;t exist.</p>
      <a href="/" className="text-blue-600 underline hover:text-blue-800">
        Go home
      </a>
    </div>
  )
}
