import type { ReactNode } from "react";
import { SiteAccountProvider } from "@/components/site/layout/site-account";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteAccountProvider>{children}</SiteAccountProvider>;
}
