import { PageLoading } from "@/components/ui/PageLoading";

export default function ProfileLoading() {
  return (
    <PageLoading
      variant="full"
      title="Carregando perfil"
      description="Buscando suas informacoes de conta."
    />
  );
}
