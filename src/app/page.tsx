import { redirect } from "next/navigation";
import { ConectaLanding } from "../components/ConectaLanding";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const query = await searchParams;
  const code = typeof query.code === "string" ? query.code : undefined;
  if (code) {
    redirect(`/auth/recovery?code=${encodeURIComponent(code)}`);
  }
  return <ConectaLanding />;
}
