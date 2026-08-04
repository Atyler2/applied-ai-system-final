export async function GET() {
  return new Response(JSON.stringify({ message: "Chat API is available." }), {
    headers: { "Content-Type": "application/json" },
  })
}
