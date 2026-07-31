export function GET() {
  return new Response(null, {
    status: 307,
    headers: {
      Location: '/?download=ios',
      'Cache-Control': 'no-store',
    },
  });
}
