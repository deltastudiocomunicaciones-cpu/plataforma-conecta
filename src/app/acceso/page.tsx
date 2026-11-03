import { redirect } from "next/navigation";
import { ConectaAccess } from "../../components/ConectaAccess";

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const query = await searchParams;
  const code = typeof query.code === "string" ? query.code : undefined;
  if (code) {
    redirect(`/auth/recovery?code=${encodeURIComponent(code)}`);
  }
  return <ConectaAccess />;
}
