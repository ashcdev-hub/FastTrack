// Edge Function: food-search
// Proxies OpenFoodFacts API with Groq LLM fallback for food nutrition lookups

const OPENFOODFACTS_API = "https://world.openfoodfacts.org/cgi/search.pl";
const OPENFOODFACTS_BARCODE = "https://world.openfoodfacts.org/api/v2/product";
const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

async function searchOpenFoodFacts(query: string): Promise<any[]> {
  const url = `${OPENFOODFACTS_API}?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=10`;

  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      response = await fetch(url, {
        headers: { "User-Agent": "FastTrack/1.0 (contact@fasttrack.app)" },
        signal: controller.signal,
      });
      if (response.ok) break;
    } catch {
      // timeout or network error — retry
    } finally {
      clearTimeout(timeout);
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }

  if (!response || !response.ok) return [];

  const data = await response.json();
  return (data.products ?? [])
    .filter((p: any) => p.product_name)
    .map((p: any) => ({
      id: p.code,
      name: p.product_name,
      brand: p.brands ?? "",
      serving_size: p.serving_size ?? null,
      nutrition: {
        calories: Math.round(p.nutriments?.["energy-kcal_serving"] ?? 0),
        protein: Math.round((p.nutriments?.proteins_serving ?? 0) * 10) / 10,
        carbs: Math.round((p.nutriments?.carbohydrates_serving ?? 0) * 10) / 10,
        fat: Math.round((p.nutriments?.fat_serving ?? 0) * 10) / 10,
      },
    }));
}

async function searchGroq(query: string): Promise<any[]> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) return [];

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a food nutrition database. Return accurate nutrition data per standard serving (e.g. 100g, 1 cup, 1 medium). " +
          "Respond with valid JSON only, no markdown. If the query is ambiguous, return the most common result.",
      },
      {
        role: "user",
        content:
          `Search for food: "${query}". Return up to 5 results as a JSON object with a "products" array. ` +
          `Each product has: name (string), brand (string), serving_size (string), calories (number), protein_g (number), carbs_g (number), fat_g (number).`,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1024,
  };

  let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        response = await fetch(GROQ_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (response.ok) break;
      } catch {
        // timeout or network error — retry
      } finally {
        clearTimeout(timeout);
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }

  if (!response || !response.ok) return [];

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    const products = parsed.products ?? [];
    return products.map((p: any, i: number) => ({
      id: `groq_${i}_${Date.now()}`,
      name: p.name ?? "Unknown",
      brand: p.brand ?? "",
      serving_size: p.serving_size ?? null,
      nutrition: {
        calories: Math.round(p.calories ?? 0),
        protein_g: Math.round((p.protein_g ?? 0) * 10) / 10,
        carbs_g: Math.round((p.carbs_g ?? 0) * 10) / 10,
        fat_g: Math.round((p.fat_g ?? 0) * 10) / 10,
      },
    }));
  } catch {
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json();
    const { query, barcode } = body;

    // --- Barcode lookup (no LLM fallback — barcodes need real product DB) ---
    if (barcode && typeof barcode === "string" && barcode.trim().length > 0) {
      const url = `${OPENFOODFACTS_BARCODE}/${barcode.trim()}.json`;

      let response;
      for (let attempt = 0; attempt < 3; attempt++) {
        response = await fetch(url, {
          headers: { "User-Agent": "FastTrack/1.0 (contact@fasttrack.app)" },
        });
        if (response.ok) break;
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }

      if (!response || !response.ok) {
        return jsonResponse({ error: "Product not found for this barcode." });
      }

      const data = await response.json();

      if (!data.product) {
        return jsonResponse({ error: "Product not found for this barcode." });
      }

      const p = data.product;
      if (!p.product_name) {
        return jsonResponse({ error: "Product found but no nutrition data available." });
      }

      const product = {
        id: p.code,
        name: p.product_name,
        brand: p.brands ?? "",
        serving_size: p.serving_size ?? null,
        nutrition: {
          calories: Math.round(p.nutriments?.["energy-kcal_serving"] ?? 0),
          protein: Math.round((p.nutriments?.proteins_serving ?? 0) * 10) / 10,
          carbs: Math.round((p.nutriments?.carbohydrates_serving ?? 0) * 10) / 10,
          fat: Math.round((p.nutriments?.fat_serving ?? 0) * 10) / 10,
        },
      };

      return jsonResponse({ products: [product] });
    }

    // --- Text search ---
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return jsonResponse({ error: "Query or barcode is required" }, 400);
    }

    const trimmed = query.trim();

    // Try OpenFoodFacts first
    const ofProducts = await searchOpenFoodFacts(trimmed);
    if (ofProducts.length > 0) {
      return jsonResponse({ products: ofProducts });
    }

    // Fallback to Groq LLM
    const groqProducts = await searchGroq(trimmed);
    if (groqProducts.length > 0) {
      return jsonResponse({ products: groqProducts });
    }

    // Both failed
    return jsonResponse({ error: "Food database temporarily unavailable. Try again in a moment." });
  } catch (error: any) {
    console.error("Food search error:", error);
    return jsonResponse({ error: error?.message ?? "Search failed" }, 500);
  }
});
