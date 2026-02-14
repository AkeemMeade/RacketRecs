import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface RacketData {
  name: string;
  url?: string;  image_url?: string;  specifications?: {
    Color?: string;
    Balance?: string;
    "Shaft Flexibility"?: string;
    Weight?: string;
    Price?: string | number;
    "Maximum Racket Tension"?: string;
    [key: string]: string | number | undefined;
  };
  description?: string;
  price?: number;
}

interface ImportedRacket {
  name: string;
  color: string | null;
  balance: string | null;
  stiffness: string | null;
  price: number | null;
  max_tension: string | null;
  description: string | null;
  weight: string | null;
  img_url: string | null;
}

export async function POST(request: Request) {
  try {
    const rackets: RacketData[] = await request.json();

    if (!Array.isArray(rackets)) {
      return NextResponse.json(
        { error: "Expected an array of rackets" },
        { status: 400 },
      );
    }

    // Map scraped data to racket table schema
    const importedRackets: ImportedRacket[] = rackets.map((racket) => {
      const specs = racket.specifications || {};

      // Parse price - handle both string and number formats
      let parsedPrice: number | null = null;
      if (racket.price) {
        parsedPrice =
          typeof racket.price === "string"
            ? parseFloat((racket.price as string).replace(/[^\d.]/g, ""))
            : racket.price;
      } else if (specs.Price) {
        const priceStr = String(specs.Price).replace(/[^\d.]/g, "");
        parsedPrice = parseFloat(priceStr) || null;
      }

      return {
        name: racket.name || "Unknown",
        color: specs.Color ? String(specs.Color) : null,
        balance: specs.Balance ? String(specs.Balance) : null,
        stiffness: specs["Shaft Flexibility"]
          ? String(specs["Shaft Flexibility"])
          : null,
        price: isNaN(parsedPrice!) ? null : parsedPrice,
        max_tension: specs["Maximum Racket Tension"]
          ? String(specs["Maximum Racket Tension"])
          : null,
        description: racket.description ? String(racket.description) : null,
        weight: specs.Weight ? String(specs.Weight) : null,
        img_url: racket.image_url ? String(racket.image_url) : null,
      };
    });

    console.log(`Processing ${importedRackets.length} rackets for insert`);
    console.log("Sample first racket:", JSON.stringify(importedRackets[0], null, 2));

    // Insert into Supabase
    const { data, error } = await supabase
      .from("racket")
      .insert(importedRackets)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: `Database error: ${error.message}`,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully imported ${data?.length || 0} rackets`,
        imported: data?.length || 0,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: `Failed to import rackets: ${String(error)}` },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: "Racket import endpoint",
      usage: "POST JSON array of racket objects to import",
    },
    { status: 200 },
  );
}
