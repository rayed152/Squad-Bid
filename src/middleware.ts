import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/sign-in",
  },
});

export const config = {
  matcher: ["/menu/:path*", "/room/:path*", "/match/:path*", "/profile/:path*", "/leaderboard/:path*"],
};
