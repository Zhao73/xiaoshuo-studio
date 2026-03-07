import { getDashboardSnapshot } from "@/lib/server/dashboard";

export async function GET() {
  return Response.json(getDashboardSnapshot());
}
