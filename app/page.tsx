import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Welcome to RacketRecs</h1>

      <nav>
        <Link href="/sign-in">Sign In</Link>
        <br />
        <Link href="/sign-up">Create Account</Link>
        <br />
        <Link href="/assessment">Player Assessment</Link>
        <br />
        <Link href="/rackets">Browse Rackets</Link>
        <br />
      </nav>
    </main>
  );
}
