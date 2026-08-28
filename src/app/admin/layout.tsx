import { AdminShell } from "../../components/admin-shell";
import { requireUser } from "../../lib/auth";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("admin");
  return <AdminShell user={user}>{children}</AdminShell>;
}