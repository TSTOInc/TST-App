import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedFrontendRoute = createRouteMatcher([
  '/((?!sign-in|sign-up|api/).*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedFrontendRoute(req)) {
    await auth.protect(); // protect all frontend pages
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
