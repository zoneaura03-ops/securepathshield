import { redirect } from "next/navigation";
import { WalletDepositForm } from "../../../components/wallet-deposit-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawProvider = Array.isArray(params.provider)
    ? params.provider[0]
    : params.provider;
  const provider = String(rawProvider || "").toLowerCase();
  if (!["paypal", "cashapp", "skrill"].includes(provider)) redirect("/dashboard");
  return <WalletDepositForm provider={provider as "paypal" | "cashapp" | "skrill"} />;
}