// Layout passthrough — cada página de auth define seu próprio visual
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}