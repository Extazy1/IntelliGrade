"use client";

import { memo } from "react";

type DiagnosticsAuthState = {
  authenticated: boolean;
  isLoading: boolean;
};

type DiagnosticsServerInfo = {
  timestamp: number;
  isoTimestamp: string;
  randomSeed: number;
};

type DiagnosticsClientInfo = {
  hasWindow: boolean;
  userAgent: string;
  href: string;
  timezone: string;
};

type DiagnosticsHydrationInfo = {
  hydratedAt: number | null;
  readyState: DocumentReadyState | "unknown";
  visibilityState: DocumentVisibilityState | "unknown";
};

type ServerSeedComparison = "unknown" | "identical" | "changed";

export interface DashboardDiagnosticsProps {
  authState: DiagnosticsAuthState;
  serverRenderInfo: DiagnosticsServerInfo;
  clientRuntimeInfo: DiagnosticsClientInfo;
  hydrationSnapshot: DiagnosticsHydrationInfo;
  seedComparison: ServerSeedComparison;
}

const formatTimestamp = (timestamp: number | null | undefined) => {
  if (!timestamp) {
    return "n/a";
  }

  try {
    return new Date(timestamp).toISOString();
  } catch (error) {
    return `${timestamp}`;
  }
};

const formatBoolean = (value: boolean) => (value ? "true" : "false");

const formatComparison = (comparison: ServerSeedComparison) => {
  switch (comparison) {
    case "identical":
      return "identical (static cache suspected)";
    case "changed":
      return "changed (dynamic render detected)";
    default:
      return "unknown";
  }
};

const DashboardDiagnosticsComponent = ({
  authState,
  clientRuntimeInfo,
  hydrationSnapshot,
  serverRenderInfo,
  seedComparison,
}: DashboardDiagnosticsProps) => {
  const infoItems: Array<{ label: string; value: string }> = [
    { label: "Auth authenticated", value: formatBoolean(authState.authenticated) },
    { label: "Auth loading", value: formatBoolean(authState.isLoading) },
    { label: "Server timestamp", value: `${serverRenderInfo.timestamp}` },
    { label: "Server ISO", value: serverRenderInfo.isoTimestamp },
    { label: "Server random seed", value: `${serverRenderInfo.randomSeed}` },
    { label: "Server seed delta", value: formatComparison(seedComparison) },
    { label: "Hydrated at", value: formatTimestamp(hydrationSnapshot.hydratedAt) },
    { label: "Document readyState", value: hydrationSnapshot.readyState },
    { label: "Visibility state", value: hydrationSnapshot.visibilityState },
    { label: "Has window", value: formatBoolean(clientRuntimeInfo.hasWindow) },
    { label: "User agent", value: clientRuntimeInfo.userAgent || "n/a" },
    { label: "Location", value: clientRuntimeInfo.href || "n/a" },
    { label: "Timezone", value: clientRuntimeInfo.timezone || "n/a" },
  ];

  return (
    <aside className="fixed bottom-4 right-4 z-[9999] w-[340px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-background/95 p-4 text-xs shadow-lg">
      <header className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Dashboard Diagnostics</h2>
        <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          Debug
        </span>
      </header>
      <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
        These details help verify whether the dashboard is hydrating correctly and if the
        server render is cached. Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_DASHBOARD_DEBUG=true</code> to
        show this panel in production.
      </p>
      <dl className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: "50vh" }}>
        {infoItems.map((item) => (
          <div key={item.label} className="flex flex-col rounded bg-muted/40 px-2 py-1">
            <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {item.label}
            </dt>
            <dd className="truncate text-[11px] text-foreground" title={item.value}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
};

export const DashboardDiagnostics = memo(DashboardDiagnosticsComponent);

