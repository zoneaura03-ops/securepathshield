export type Transaction = {
  id: string;
  name: string;
  kind: string;
  amount: number;
  currency: string;
  date: string;
  status: "Processed" | "Pending";
};
export const transactions: Transaction[] = [
  {
    id: "LMC7RUN6PYFEDK5",
    name: "Wire Transfer",
    kind: "Debit",
    amount: -500,
    currency: "GBP",
    date: "May 23, 2026",
    status: "Pending",
  },
  {
    id: "LMC0A91TQK8M",
    name: "Transfer",
    kind: "Debit",
    amount: -100,
    currency: "GBP",
    date: "May 10, 2026",
    status: "Processed",
  },
  {
    id: "LMC6F42X2QPC",
    name: "Deposit",
    kind: "Credit",
    amount: 300,
    currency: "GBP",
    date: "Jun 08, 2026",
    status: "Pending",
  },
  {
    id: "LMC92JPQ10AV",
    name: "Card Top-up",
    kind: "Credit",
    amount: 2000,
    currency: "GBP",
    date: "Jun 25, 2026",
    status: "Processed",
  },
];
export const menu = [
  ["Dashboard", "/dashboard"],
  ["Deposits", "/dashboard/deposit"],
  ["Local Transfer", "/dashboard/transfer"],
  ["International Transfer", "/dashboard/international"],
  ["Internal Transfer", "/dashboard/internal"],
  ["Transactions", "/dashboard/activity"],
  ["Account Statement", "/dashboard/statement"],
  ["Virtual Cards", "/dashboard/cards"],
  ["Investments", "/dashboard/investments"],
  ["Grant Applications", "/dashboard/grants"],
  ["Crypto Swap", "/dashboard/crypto"],
  ["Customer Support", "/dashboard/support"],
  ["Profile Settings", "/dashboard/profile"],
] as const;
