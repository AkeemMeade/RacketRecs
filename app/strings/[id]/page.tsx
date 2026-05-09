import StringDetails from "@/components/StringDetails";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <StringDetails params={params} />;
}