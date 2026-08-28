import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { ensurePrimaryAccount, money } from "../../../../lib/banking";
export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const account = await ensurePrimaryAccount(user.id);
  return NextResponse.json({
    account,
    formattedBalance: money(account.availableBalance, account.currency),
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });
}
