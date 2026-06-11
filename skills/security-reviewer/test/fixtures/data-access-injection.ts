export async function unsafePostgrestFilter(request: Request, baseUrl: string) {
  const body = (await request.json()) as { challengeId: string };
  const challengeId = body.challengeId;

  await fetch(`${baseUrl}/rest/v1/otp_challenges?id=eq.${challengeId}&select=*`);
}

export async function safePostgrestFilter(request: Request, baseUrl: string) {
  const body = (await request.json()) as { challengeId: string };
  const challengeId = body.challengeId;
  const params = new URLSearchParams();

  params.append('id', `eq.${challengeId}`);
  params.set('select', 'id');

  await fetch(`${baseUrl}/rest/v1/otp_challenges?${params.toString()}`);
}
