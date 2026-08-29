import { currentUser } from "../../../lib/auth";
import { ensurePrimaryAccount } from "../../../lib/banking";
import { AccountDetailsClient } from "./account-details-client";

export default async function Page() {
  const user = await currentUser();
  if (!user) return null;
  const account = await ensurePrimaryAccount(user.id);
  return (
    <AccountDetailsClient
      preview={{
        accountHolder: `${user.firstName} ${user.lastName}`,
        accountNumber: `******${account.accountNumber.slice(6)}`,
        accountName: account.name,
        accountType: account.type,
        currency: account.currency,
        status: account.status,
        bankName: process.env.BANK_LEGAL_NAME || "SecurePath Bank",
      }}
    />
  );
}
