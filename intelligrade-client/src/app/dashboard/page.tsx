// src/app/dashboard/page.tsx
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const createServerRenderInfo = () => ({
  timestamp: Date.now(),
  isoTimestamp: new Date().toISOString(),
  randomSeed: Math.random(),
});

export default function Page() {
  return <DashboardClient serverRenderInfo={createServerRenderInfo()} />;
}
