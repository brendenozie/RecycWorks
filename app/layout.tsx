import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth-context";
import ClientSessionProvider from "@/components/client-session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "RecycWorks | Circular Economy Infrastructure",
    template: "%s | RecycWorks",
  },
  description:
    "Formalizing Africa's recycling sector through digital intelligence and physical infrastructure. Aligning with Kenya Vision 2030 to turn waste into high-value industrial commodities.",
  keywords: [
    "Recycling Kenya",
    "Circular Economy Africa",
    "Waste Management Software",
    "RecycWorks Dashboard",
    "PET Recycling",
    "HDPE Supply Chain",
    "Sustainable Manufacturing",
    "Kenya Vision 2030 Green Economy",
    "Aggregator Cooperative",
  ],
  authors: [{ name: "RecycWorks Team" }],
  creator: "RecycWorks Africa",
  publisher: "RecycWorks Africa",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://RecycWorks.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://RecycWorks.com",
    title: "RecycWorks | The Brain of the Recycling Value Chain",
    description:
      "Formalizing fragmented waste collection into a transparent, high-yield industrial supply chain.",
    siteName: "RecycWorks",
    images: [
      {
        url: "/RecycWorks_og.png", // Recommended size: 1200x630
        width: 1200,
        height: 630,
        alt: "RecycWorks Digital Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RecycWorks Africa",
    description: "Digital intelligence for the circular economy.",
    images: ["/RecycWorks_og.png"],
    creator: "@RecycWorks",
  },
  icons: {
    icon: "/RecycWorks_ico.png",
    shortcut: "/RecycWorks_ico.png",
    apple: "/RecycWorks_ico.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* External Scripts - Kept only what's necessary for your logistics/data features */}
        <script src="https://code.jquery.com/jquery-3.6.0.min.js" async />
        <script
          src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js"
          async
        />
        
        {/* Extension Conflict Fixes (Your Original Logic) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const disableAutofillOverlays = () => {
                  const overlays = document.querySelectorAll('[data-autofill-overlay]');
                  overlays.forEach(overlay => {
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                  });
                };

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', disableAutofillOverlays);
                } else {
                  disableAutofillOverlays();
                }

                const observer = new MutationObserver(disableAutofillOverlays);
                if (document.body) {
                  observer.observe(document.body, { childList: true, subtree: true });
                }

                const originalInsertBefore = Node.prototype.insertBefore;
                Node.prototype.insertBefore = function(newNode, referenceNode) {
                  try {
                    return originalInsertBefore.call(this, newNode, referenceNode);
                  } catch (error) {
                    if (error.name === 'NotFoundError' && error.message.includes('insertBefore')) {
                      return newNode;
                    }
                    throw error;
                  }
                };
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light" // Fixed to dark for that "stunning" aesthetic
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientSessionProvider>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" theme="dark" />
            </AuthProvider>
          </ClientSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}