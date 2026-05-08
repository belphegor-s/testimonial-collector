import { auth } from '@/auth';
import LandingPageContent from './LandingPageContent';

export default async function Home() {
  const session = await auth();
  return <LandingPageContent loggedIn={!!session?.user} />;
}
