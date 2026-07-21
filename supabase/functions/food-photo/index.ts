// Edge Function: food-photo
// Analyzes food photos using Groq Llama 4 Scout vision model.
// Accepts base64 encoded images or image URLs.
// Returns structured nutrition data matching the food-search format.

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

function detectMimeType(base64: string): string {
  // Check the base64 header to determine image type
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  if (base64.startsWith("R0lG")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";
  return "image/jpeg"; // default fallback
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json();
    const { image, imageUrl } = body;

    if (!image && !imageUrl) {
      return jsonResponse({ error: "Image data (base64) or imageUrl is required" }, 400);
    }

    // Handle URL-based images (for testing)
    if (imageUrl && typeof imageUrl === "string") {
      const groqBody = {
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a food recognition API. Identify ALL food items visible in the photo. Estimate portion sizes and nutritional content per serving. " +
              "Return valid JSON only, no markdown. ALL numeric fields (calories, protein_g, carbs_g, fat_g) are REQUIRED — if unsure, provide your best estimate rather than 0. " +
              "serving_size is REQUIRED (e.g. '1 cup', '100g', '1 medium'). Never omit fields.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify all food items in this photo. Return as JSON with a \"products\" array. Each product MUST have ALL of: name (string), serving_size (string like '1 cup', '100g', '1 medium'), calories (number), protein_g (number), carbs_g (number), fat_g (number). Do NOT set any field to 0 — estimate if unsure. Up to 5 items.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2048,
      };

      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
          response = await fetch(GROQ_API, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
            },
            body: JSON.stringify(groqBody),
            signal: controller.signal,
          });
          if (response.ok) break;
        } catch {
          // timeout or network error — retry
        } finally {
          clearTimeout(timeout);
        }
        if (attempt < 1) await new Promise((r) => setTimeout(r, 1000));
      }

      if (!response || !response.ok) {
        return jsonResponse({ error: "Food photo analysis temporarily unavailable" }, 502);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return jsonResponse({ error: "Could not analyze the photo" });
      }

      let products;
      try {
        const parsed = JSON.parse(content);
        products = parsed.products ?? [];
      } catch {
        return jsonResponse({ error: "Could not identify food in this photo" });
      }

      console.log("[food-photo] Raw Groq response:", JSON.stringify(products));

      let incomplete = false;
      const result = products.map((p: any, i: number) => {
        if (!p.serving_size || !p.calories || (!p.protein_g && !p.carbs_g && !p.fat_g)) incomplete = true;
        return {
          id: `photo_${i}_${Date.now()}`,
          name: p.name ?? "Unknown food",
          brand: "",
          serving_size: p.serving_size ?? "1 serving",
          nutrition: {
            calories: Math.round(p.calories ?? 0),
            protein: Math.round((p.protein_g ?? 0) * 10) / 10,
            carbs: Math.round((p.carbs_g ?? 0) * 10) / 10,
            fat: Math.round((p.fat_g ?? 0) * 10) / 10,
          },
        };
      });

      return jsonResponse({ products: result, incomplete_fields: incomplete || undefined });
    }

    // Handle base64 images (from camera or photo library)
    if (typeof image !== "string" || image.length === 0) {
      return jsonResponse({ error: "Invalid image data" }, 400);
    }

    if (image.length > 5 * 1024 * 1024) {
      return jsonResponse({ error: "Image too large. Max 5MB." }, 400);
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "AI vision not configured" }, 500);
    }

    const mimeType = detectMimeType(image);
    const groqBody = {
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a food recognition API. Identify ALL food items visible in the photo. Estimate portion sizes and nutritional content per serving. " +
            "Return valid JSON only, no markdown. ALL numeric fields (calories, protein_g, carbs_g, fat_g) are REQUIRED — if unsure, provide your best estimate rather than 0. " +
            "serving_size is REQUIRED (e.g. '1 cup', '100g', '1 medium'). Never omit fields.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify all food items in this photo. Return as JSON with a \"products\" array. Each product MUST have ALL of: name (string), serving_size (string like '1 cup', '100g', '1 medium'), calories (number), protein_g (number), carbs_g (number), fat_g (number). Do NOT set any field to 0 — estimate if unsure. Up to 5 items.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${image}` },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2048,
    };

    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        response = await fetch(GROQ_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(groqBody),
          signal: controller.signal,
        });
        if (response.ok) break;
      } catch {
        // timeout or network error — retry
      } finally {
        clearTimeout(timeout);
      }
      if (attempt < 1) await new Promise((r) => setTimeout(r, 1000));
    }

    if (!response || !response.ok) {
      return jsonResponse({ error: "Food photo analysis temporarily unavailable" }, 502);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: "Could not analyze the photo" });
    }

    let products;
    try {
      const parsed = JSON.parse(content);
      products = parsed.products ?? [];
    } catch {
      return jsonResponse({ error: "Could not identify food in this photo" });
    }

    if (!products || products.length === 0) {
      return jsonResponse({ error: "Could not identify food in this photo" });
    }

    console.log("[food-photo] Raw Groq response:", JSON.stringify(products));

    let incomplete = false;
    const result = products.map((p: any, i: number) => {
      if (!p.serving_size || !p.calories || (!p.protein_g && !p.carbs_g && !p.fat_g)) incomplete = true;
      return {
        id: `photo_${i}_${Date.now()}`,
        name: p.name ?? "Unknown food",
        brand: "",
        serving_size: p.serving_size ?? "1 serving",
        nutrition: {
          calories: Math.round(p.calories ?? 0),
          protein: Math.round((p.protein_g ?? 0) * 10) / 10,
          carbs: Math.round((p.carbs_g ?? 0) * 10) / 10,
          fat: Math.round((p.fat_g ?? 0) * 10) / 10,
        },
      };
    });

    return jsonResponse({ products: result, incomplete_fields: incomplete || undefined });
  } catch (error: any) {
    console.error("Food photo error:", error);
    return jsonResponse({ error: error?.message ?? "Photo analysis failed" }, 500);
  }
});
