// app/register/page.tsx

export default function RegisterPage() {
  return (
    <main>
      <h1>Create Account</h1>

      <form>
        <input type="email" placeholder="Email" required />
        <br />
        <input type="password" placeholder="Password" required />
        <br />
        <button type="submit">Register</button>
      </form>
    </main>
  );
}
