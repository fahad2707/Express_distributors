import { redirect } from 'next/navigation';

export default function HomePage() {
  // Static storefront lives at /site (see public/site/index.html). Do not use
  // public/landing.html — Next dev incorrectly treats *.html at public root as
  // a path prefix and stat()s e.g. landing.html/admin → ENOTDIR / 500 on /admin.
  redirect('/site');
}
