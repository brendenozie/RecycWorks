import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getDatabase } from "./mongodb";
import { generateToken } from "./auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error", // Pointing to a custom error page for role issues
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        const db = await getDatabase();

        let existingUser = await db.collection("users").findOne({
          email: user.email,
        });

        if (!existingUser) {
          const googleProfile = profile as any;

          // Default user object for RecycWorks
          const newUser = {
            email: user.email!,
            name: user.name || googleProfile?.name,
            firstName:
              googleProfile?.given_name || user.name?.split(" ")[0] || "User",
            lastName:
              googleProfile?.family_name ||
              user.name?.split(" ").slice(1).join(" ") ||
              "",
            image: user.image,
            role: "supplier", // Default role; Admins/Ops changed manually in DB or via Admin panel
            hubId: null, // Associated Hub for Ops/Suppliers
            status: "active",
            emailVerified: true,
            provider: "google",
            googleId: account?.providerAccountId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.collection("users").insertOne(newUser);
        } else {
          // Sync Google profile image if it changed
          await db.collection("users").updateOne(
            { email: user.email },
            {
              $set: {
                updatedAt: new Date(),
                image: user.image,
                googleId: account?.providerAccountId,
              },
            },
          );
        }
        return true;
      } catch (error) {
        console.error("[Auth Error]:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        const db = await getDatabase();
        const dbUser = await db
          .collection("users")
          .findOne({ email: user.email });

        if (dbUser) {
          // Essential RecycWorks claims
          token.userId = dbUser._id.toString();
          token.role = dbUser.role; // admin | operations | supplier | driver
          token.hubId = dbUser.hubId;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;

          // Generate our internal app token for API authorization
          token.appToken = generateToken(
            dbUser._id.toString(),
            dbUser.email,
            dbUser.role,
            dbUser.role === "admin",
          );
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.role = token.role as
          | "supplier"
          | "admin"
          | "operations"
          | "driver";
        session.user.hubId = token.hubId as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.appToken = token.appToken as string;
      }
      return session;
    },
  },
  // Security best practices for PWA/Mobile usage
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
};
