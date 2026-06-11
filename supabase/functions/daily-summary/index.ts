import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get yesterday's date in UTC
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    // Query all users who have food log entries for yesterday
    const { data: foodLogs, error: foodError } = await supabase
      .from("food_log")
      .select(
        `
        user_id,
        profiles!inner(email, display_name),
        name,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        meal_type
      `
      )
      .gte("logged_at", `${dateStr}T00:00:00Z`)
      .lte("logged_at", `${dateStr}T23:59:59Z`);

    if (foodError) {
      console.error("Error fetching food logs:", foodError);
      throw foodError;
    }

    // Group by user
    const userSummaries: Record<
      string,
      {
        email: string;
        displayName: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        meals: string[];
      }
    > = {};

    for (const log of foodLogs ?? []) {
      const userId = log.user_id;
      if (!userSummaries[userId]) {
        userSummaries[userId] = {
          email: (log.profiles as any)?.email ?? "",
          displayName: (log.profiles as any)?.display_name ?? "there",
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: [],
        };
      }
      const summary = userSummaries[userId];
      summary.calories += log.calories ?? 0;
      summary.protein += log.protein_g ?? 0;
      summary.carbs += log.carbs_g ?? 0;
      summary.fat += log.fat_g ?? 0;
      summary.meals.push(
        `${log.name} (${log.calories} kcal - ${log.meal_type})`
      );
    }

    // Send emails via Resend API if configured
    if (resendApiKey) {
      for (const [userId, summary] of Object.entries(userSummaries)) {
        if (!summary.email) continue;

        const mealsList = summary.meals
          .map((m) => `<li>${m}</li>`)
          .join("");

        const html = `
          <h2>Daily Nutrition Summary - ${dateStr}</h2>
          <p>Hi ${summary.displayName},</p>
          <p>Here's your nutrition summary for yesterday:</p>
          <ul>
            <li><strong>Calories:</strong> ${Math.round(summary.calories)} kcal</li>
            <li><strong>Protein:</strong> ${Math.round(summary.protein)}g</li>
            <li><strong>Carbs:</strong> ${Math.round(summary.carbs)}g</li>
            <li><strong>Fat:</strong> ${Math.round(summary.fat)}g</li>
          </ul>
          <h3>Meals Logged:</h3>
          <ul>${mealsList || "<li>No meals logged</li>"}</ul>
          <p>Keep up the great work! 💪</p>
          <p>- FastTrack</p>
        `;

        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "FastTrack <noreply@fasttrack.app>",
              to: summary.email,
              subject: `Your Daily Nutrition Report - ${dateStr}`,
              html,
            }),
          });
          console.log(`Email sent to ${summary.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${summary.email}:`, emailError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: Object.keys(userSummaries).length,
        date: dateStr,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
