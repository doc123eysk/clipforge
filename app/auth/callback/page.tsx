import { CallbackForm } from "@/components/CallbackForm";

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <p>Нет токена</p>;
  }

  return <CallbackForm token={token} />;
}
