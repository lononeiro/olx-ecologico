import { ResetPasswordClient } from "./ResetPasswordClient";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const sp = await searchParams;
  return (
    <ResetPasswordClient
      token={sp.token ?? ""}
      email={sp.email ?? ""}
    />
  );
}
