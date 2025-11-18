import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/_components/blocks/layouts/ClientLayout";
import { SocketProvider } from "../../context/SocketProvider";
import { ConversationProvider } from "../../context/ConversationProvider";

export const metadata: Metadata = {
  title: "VOX Live Chat Portal",
  description:
    "VOX Live Chat Portal -Manage your chat transcripts -  VOX and Zendesk",
  icons: {
    icon: [
      // { url: '/brand_c2.ico' },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      <ConversationProvider>
        <ClientLayout>{children}</ClientLayout>
      </ConversationProvider>
    </SocketProvider>
  );
}

export const dynamic = "force-dynamic";
