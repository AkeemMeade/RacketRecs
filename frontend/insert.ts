import { createClient } from "@supabase/supabase-js";
import prompts from "prompts";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---- DEFINE SCHEMA HERE ----
const schema = {
  racket: {
    required: ["racket_id", "name"],
    optional: [
      "manufacturer_id",
      "series",
      "balance",
      "stiffness",
      "price",
      "max_tension",
      "availability"
    ]
  },

  manufacturer: {
    required: ["manufacturer_id", "name"],
    optional: ["country"]
  }

} as const;

// Define TableName type based on schema keys
type TableName = keyof typeof schema;

async function main() {
  console.log("Supabase Insert Tool");
  console.log("------------------------");

  while (true) {
    // Select a table (typed)
    const { table } = await prompts({
      type: "select",
      name: "table",
      message: "Choose a table to insert into:",
      choices: [
        ...Object.keys(schema).map(t => ({ title: t, value: t })),
        { title: "Exit", value: "exit" }
      ]
    });

    if (table === "exit") {
      console.log("Done.");
      process.exit(0);
    }

    // TypeScript-safe lookup
    const tableName = table as TableName;
    const fields = schema[tableName];

    // Fill required fields
    const required = await prompts(
      fields.required.map(name => ({
        type: "text",
        name,
        message: `Enter ${name} (required)`
      }))
    );

    // optional fields
    const { addOptional } = await prompts({
      type: "toggle",
      name: "addOptional",
      message: "Add optional fields?",
      initial: false,
      active: "yes",
      inactive: "no"
    });

    let optional: any = {};

    if (addOptional) {
      optional = await prompts(
        fields.optional.map(name => ({
          type: "text",
          name,
          message: `${name} (optional)`
        }))
      );
    }

    // Merge & clean
    const data = { ...required, ...optional };

    Object.keys(data).forEach(key => {
      if (data[key] === "" || data[key] === null) {
        delete data[key];
      }
    });

    // Convert numeric fields automatically
    for (const key of Object.keys(data)) {
      const num = Number(data[key]);
      if (!isNaN(num) && data[key] !== "") {
        data[key] = num;
      }
    }

    // Insert into Supabase
    const { error } = await supabase.from(tableName).insert([data]);

    if (error) {
      console.error("Insert failed:", error);
    } else {
      console.log(`Inserted into "${tableName}" successfully.`);
    }

    // Continue?
    const { again } = await prompts({
      type: "toggle",
      name: "again",
      message: "Insert into another table?",
      initial: true,
      active: "yes",
      inactive: "no"
    });

    if (!again) break;
  }

  console.log("Done.");
}

main();
