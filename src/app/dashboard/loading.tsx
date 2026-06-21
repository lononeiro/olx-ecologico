import { PageLoading } from "@/components/ui/PageLoading";

export default function DashboardLoading() {
  return (
    <PageLoading
      title="Carregando dashboard"
      description="Buscando suas solicitações e indicadores."
    />
  );
}
