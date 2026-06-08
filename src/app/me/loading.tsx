import { PageLoading } from "@/components/ui/PageLoading";

export default function ProfileLoading() {
  return (
    <PageLoading
      variant="content"
      title="Carregando perfil"
      description="Buscando suas informacoes de conta."
    />
  );
}
