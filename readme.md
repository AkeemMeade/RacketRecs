# RacketRecs — Local Development Setup

Follow these steps to set up your local environment and connect the app to Supabase.

---

## 1. Create Environment File

In the root of your **frontend** directory (same level as `package.json`), create a file named `.env.local`.

Paste the following inside:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vwxuphwwdjllxzlhwveq.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eHVwaHd3ZGpsbHh6bGh3dmVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTk3MzMsImV4cCI6MjA3OTMzNTczM30._2oFLvQjgNYjAk6XO9ybzJ_S3H90CQYUgcs75ef-C3M
```

---

## 2. Install Dependencies

In your terminal, navigate to the `frontend` folder:

```
cd frontend
```

Then install the dependencies:

```
npm install
npm install @supabase/supabase-js
```

---

## 3. Run the Development Server

Start the local dev server:

```
npm run dev
```

Once it starts, open your browser and visit:

[http://localhost:3000](http://localhost:3000)

---

# Supabase Insert Tool

Interactive CLI tool to insert data into Supabase tables.

---

## Setup

1. Ensure `package.json` has `"type": "module"`:

```json
{
  "type": "module"
}
```

2. add to `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=(get the secret key from api keys in supabase)
```

---

## Running

Run the script with:

```bash
node --loader ts-node/esm insert.ts
```

Or via npm script:

```json
"scripts": {
  "insert": "node --loader ts-node/esm insert.ts"
}
```

```bash
npm run insert
```

---