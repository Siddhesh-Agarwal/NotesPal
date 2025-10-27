import { ClerkProvider } from "@clerk/tanstack-react-start";
import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

const metadata = {
  title: "NotesPal",
  description: "A cutesy no-nonsense note-taking app",
  keywords: ["notes", "note-taking", "app", "notespal"],
  author: "Siddhesh Agarwal",
  site: import.meta.env.DEV
    ? "http://localhost:5173"
    : "https://notespal.siddhesh-agarwal.workers.dev",
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: metadata.title,
      },
      {
        name: "description",
        content: metadata.description,
      },
      {
        name: "keywords",
        content: metadata.keywords.join(", "),
      },
      {
        name: "author",
        content: metadata.author,
      },
      {
        property: "og:title",
        content: metadata.title,
      },
      {
        property: "og:description",
        content: metadata.description,
      },
      {
        property: "og:url",
        content: metadata.site,
      },
      {
        property: "og:image",
        content: `${metadata.site}/og.png`,
      },
      {
        name: "twitter:title",
        content: metadata.title,
      },
      {
        name: "twitter:description",
        content: metadata.description,
      },
      {
        name: "twitter:image",
        content: `${metadata.site}/og.png`,
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:url",
        content: metadata.site,
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider
          publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        >
          {children}
          {import.meta.env.DEV && (
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
                {
                  name: "Tanstack Query",
                  render: <ReactQueryDevtoolsPanel />,
                },
              ]}
            />
          )}
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}
