export function GET(request: Request) {
  const destination = new URL('/', request.url);
  destination.searchParams.set('download', 'ios');
  return Response.redirect(destination, 307);
}
