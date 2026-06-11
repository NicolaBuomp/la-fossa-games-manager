import { createClient } from "npm:@supabase/supabase-js@2";

interface ResetPasswordInput {
  id: string;
}

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  return {
    ...BASE_CORS_HEADERS,
    "Access-Control-Allow-Origin": origin ?? "*",
    Vary: "Origin",
  };
}

function jsonResponse(
  request: Request,
  status: number,
  payload: unknown,
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(request),
      "Content-Type": "application/json",
    },
  });
}

function randomPassword(length = 14): string {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const chars = crypto.getRandomValues(new Uint32Array(length));
  let output = "";
  for (const code of chars) {
    output += alphabet[code % alphabet.length];
  }
  return output;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders(request),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    const supabaseUrl = Deno.env.get("LFG_SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("LFG_SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(request, 500, {
        error: "Missing server configuration",
      });
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return jsonResponse(request, 401, { error: "Missing access token" });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: callerData, error: callerError } =
      await admin.auth.getUser(token);
    if (callerError || !callerData.user) {
      return jsonResponse(request, 401, { error: "Invalid access token" });
    }

    const { data: callerProfile, error: callerProfileError } = await admin
      .from("profiles")
      .select("role, active")
      .eq("id", callerData.user.id)
      .single();

    if (
      callerProfileError ||
      !callerProfile ||
      !callerProfile.active ||
      callerProfile.role !== "admin"
    ) {
      return jsonResponse(request, 403, {
        error: "Operazione consentita solo agli admin",
      });
    }

    const body = (await request.json()) as Partial<ResetPasswordInput>;
    const userId = body.id?.trim();
    if (!userId) {
      return jsonResponse(request, 400, { error: "ID utente mancante" });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("username, email")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      return jsonResponse(request, 500, { error: profileError.message });
    }

    const temporaryPassword = randomPassword();
    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        password: temporaryPassword,
      },
    );

    if (updateError) {
      return jsonResponse(request, 500, { error: updateError.message });
    }

    return jsonResponse(request, 200, {
      id: userId,
      username: profile?.username ?? profile?.email ?? userId,
      temporaryPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse(request, 500, { error: message });
  }
});
