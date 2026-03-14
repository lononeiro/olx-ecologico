export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl">♻️</span>
          <h1 className="text-2xl font-bold text-green-800 mt-2">ReciclaFácil</h1>
        </div>
        <div className="card">{children}</div>
      </div>
    </div>
  );
}
