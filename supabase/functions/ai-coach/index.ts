// Edge Function: ai-coach
// AI fasting & fitness coach powered by Groq LLM.
// Provides personalized advice based on the user's current data.

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    const body = await req.json();
    const { question, context, type } = body;

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "AI coach not configured" }, 500);
    }

    if (type === "workout") {
      const workoutPrompt = `You are a personal fitness coach. Based on the user's workout data below, give a brief, encouraging insight (2-3 sentences). Focus on what they've accomplished today, compare to their weekly average if possible, and suggest a small improvement or encouragement. Never claim to be a medical professional.

TODAY'S WORKOUT:
- Exercises: ${context?.workoutExercises ?? "none logged"}
- Total reps today: ${context?.workoutReps ?? 0}
- Total sets today: ${context?.workoutSets ?? 0}
- Total calories burned today: ${context?.workoutCalories ?? 0}
- Weekly total reps: ${context?.weeklyReps ?? 0}
- Weekly total calories: ${context?.weeklyCalories ?? 0}
- Goals met: ${context?.goalsMet ?? "none"}
- Days worked out this week: ${context?.daysWorkedOut ?? 0} out of 7

Keep it concise (2-3 sentences). Be encouraging and specific. Example: "Great push today! You've already hit 85% of your push-up goal, and your weekly reps are 20% above average. Try adding 2 more squats to beat last week's record."`;

      const groqBody = {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: workoutPrompt },
          { role: "user", content: "Give me a workout insight based on my data above." },
        ],
        temperature: 0.7,
        max_tokens: 256,
      };

      let response;
      for (let attempt = 0; attempt < 2; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
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
        if (attempt < 1) await new Promise((r) => setTimeout(r, 500));
      }

      if (!response || !response.ok) {
        return jsonResponse({ reply: "You're doing great — keep up the momentum!" });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "Keep pushing — every rep counts!";
      return jsonResponse({ reply });
    }

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return jsonResponse({ error: "Question is required" }, 400);
    }

    const systemPrompt = `You are a personal fasting and fitness coach. You are helpful, encouraging, and concise. Answer the user's question based on their personal data provided below.

USER DATA:
- Fasting streak: ${context?.streak ?? "unknown"} days
- Total completed fasts: ${context?.completedFasts ?? "unknown"}
- Current fasting phase: ${context?.phase ?? "unknown"}
- Today's macros: ${context?.calories ?? 0} kcal / ${context?.protein ?? 0}g protein / ${context?.carbs ?? 0}g carbs / ${context?.fat ?? 0}g fat
- Daily macro goals: ${context?.calorieGoal ?? 2000} kcal / ${context?.proteinGoal ?? 150}g protein / ${context?.carbsGoal ?? 200}g carbs / ${context?.fatGoal ?? 65}g fat
- Water today: ${context?.waterMl ?? 0}ml (goal: ${context?.waterGoalMl ?? 2500}ml)
- Recent workout reps today: ${context?.workoutReps ?? 0}
- Current weight: ${context?.weight ?? "unknown"} kg
- Weight change: ${context?.weightChange ?? "unknown"} kg

Keep responses short and friendly (2-4 sentences). Focus on actionable advice. Never claim to be a medical professional.`;

    const groqBody = {
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      temperature: 0.7,
      max_tokens: 512,
    };

    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
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
      if (attempt < 1) await new Promise((r) => setTimeout(r, 500));
    }

    if (!response || !response.ok) {
      return jsonResponse({ error: "AI coach temporarily unavailable" }, 502);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "I'm not sure how to answer that. Try asking about your fasting, nutrition, or workouts!";

    return jsonResponse({ reply });
  } catch (error: any) {
    console.error("AI coach error:", error);
    return jsonResponse({ error: error?.message ?? "AI coach failed" }, 500);
  }
});
