// Edge Function: food-search
// Proxies OpenFoodFacts API to avoid CORS issues
// Supports both text search and barcode lookup

const OPENFOODFACTS_API = "https://world.openfoodfacts.org/cgi/search.pl";
const OPENFOODFACTS_BARCODE = "https://world.openfoodfacts.org/api/v2/product";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json();
    const { query, barcode } = body;

    // --- Barcode lookup ---
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

    const url = `${OPENFOODFACTS_API}?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=10`;

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        headers: { "User-Agent": "FastTrack/1.0 (contact@fasttrack.app)" },
      });
      if (response.ok) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }

    if (!response || !response.ok) {
      return jsonResponse({ error: "Food database temporarily unavailable. Try again in a moment." });
    }

    const data = await response.json();

    const products = (data.products ?? [])
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

    return jsonResponse({ products });
  } catch (error: any) {
    console.error("Food search error:", error);
    return jsonResponse({ error: error?.message ?? "Search failed" }, 500);
  }
});
