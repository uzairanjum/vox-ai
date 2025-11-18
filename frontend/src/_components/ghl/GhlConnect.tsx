// app/account/ghl-connect/page.tsx
"use client";
import { Button } from "@/components/ui/button";
import { startGhlAuth } from "./actions/actions";

export default function GhlConnect({label, ...props}: {label?: string, [key: string]: any}) {
  return (
    <div className="space-y-2 mx-auto">
      <form action={startGhlAuth}>
        <Button {...props} type="submit">{!label ? "Connect LeadConnector" : label}</Button>
      </form>
    </div>
  );
}
