import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { SDKDocsLayout } from "@/components/docs/sdk-docs-layout";

export default async function DocsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return <SDKDocsLayout isLoggedIn={Boolean(session?.user)} />;
}
