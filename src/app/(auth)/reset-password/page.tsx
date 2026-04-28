import { ResetPasswordClient } from "./ResetPasswordClient";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  return (
    <ResetPasswordClient
      token={searchParams.token ?? ""}
      email={searchParams.email ?? ""}
    />
  );
}
