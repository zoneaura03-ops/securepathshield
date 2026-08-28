import { FeaturePage } from "../../../components/feature-page";
export default async function Page({ params }: { params: Promise<{ feature: string }> }) {
  const { feature } = await params;
  return <FeaturePage feature={feature} />;
}
