import { AuthCard } from "../../components/auth-card";
import { AuthLayout } from "../../components/auth-layout";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const notice =
    (await searchParams).notice === "password-changed"
      ? "Your password has been changed successfully. Sign in with your new password."
      : undefined;
  return (
    <AuthLayout>
      <AuthCard notice={notice} />
    </AuthLayout>
  );
}
