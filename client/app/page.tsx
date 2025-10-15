import { redirect } from 'next/navigation';

export default function HomePage() {
  // This component's only job is to redirect to our main authentication page.
  redirect('/authenticate');

  // We return null because the redirect happens on the server before the page can render.
  return null;
}
