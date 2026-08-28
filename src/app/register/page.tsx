import { AuthCard } from "../../components/auth-card";
import { AuthLayout } from "../../components/auth-layout";

export default function Page() {
  return (
    <AuthLayout register>
      <AuthCard register />
    </AuthLayout>
  );
}
