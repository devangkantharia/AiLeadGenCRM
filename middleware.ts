// Location: /middleware.ts (in the root of your project)
// This file controls authentication for the entire app.

import { authMiddleware } from "@clerk/nextjs/server";

export default authMiddleware({
    // These are routes that can be accessed WITHOUT being logged in.
    publicRoutes: [
        "/", // The landing page
        "/sign-in(.*)", // The sign-in page
        "/sign-up(.*)", // The sign-up page
        "/api/clerk/webhook", // The webhook for syncing users
    ],

    // These routes will be ignored by Clerk (e.g., for static assets)
    // We don't have any for now, but it's good to know.
    // ignoredRoutes: ["/no-auth-in-this-route"],
});

export const config = {
    // This matcher ensures that the middleware runs on all routes
    // *except* for static files and internal Next.js routes.
    matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
