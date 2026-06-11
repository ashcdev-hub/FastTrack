// Edge Function: food-search
// Proxies OpenFoodFacts API to avoid CORS issues
// Uses Deno.serve() built-in API - no external imports

const OPENFOODFACTS_API = "https://world.openfoodfacts.org/cgi/search.pl";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const query = body?.query;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const url = `${OPENFOODFACTS_API}?search_terms=${encodeURIComponent(query.trim())}&search_simple=1&action=process&json=1&page_size=10`;

    // Retry logic for transient 503 errors
    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch(url, {
        headers: {
          "User-Agent": "FastTrack/1.0 (contact@fasttrack.app)",
        },
      });
      if (response.ok) break;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!response || !response.ok) {
      return new Response(
        JSON.stringify({ error: "Food database temporarily unavailable. Try again in a moment." }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
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

    return new Response(
      JSON.stringify({ products }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error: any) {
    console.error("Food search error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? "Search failed" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
