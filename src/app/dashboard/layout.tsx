import { DashboardShell } from "../../components/dashboard-shell";
import { requireUser } from "../../lib/auth";
import { ensurePrimaryAccount, notificationData } from "../../lib/banking";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("user");
  const [account, notificationState] = await Promise.all([
    ensurePrimaryAccount(user.id),
    notificationData(user.id),
  ]);
  return (
    <DashboardShell
      user={user}
      account={account}
      notificationState={notificationState}
    >
      {children}
    </DashboardShell>
  );
}
