import { setAuthToken } from "../actions/auth";

export default async function AuthCallback({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <p>Нет токена</p>;
  }

  await setAuthToken(token);
}
