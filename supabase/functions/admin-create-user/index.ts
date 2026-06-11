import { createClient } from "npm:@supabase/supabase-js@2";

type UserRole = "staff" | "admin";

interface CreateUserInput {
  firstName: string;
  lastName: string;
  username: string;
  role: UserRole;
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

function sanitizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
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

    const body = (await request.json()) as Partial<CreateUserInput>;
    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const username = sanitizeUsername(body.username ?? "");
    const role: UserRole = body.role === "admin" ? "admin" : "staff";

    if (!firstName || !lastName || !username) {
      return jsonResponse(request, 400, {
        error: "Dati mancanti per la creazione utente",
      });
    }

    if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
      return jsonResponse(request, 400, { error: "Username non valido" });
    }

    const { data: existingUsername, error: existingUsernameError } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingUsernameError) {
      return jsonResponse(request, 500, {
        error: existingUsernameError.message,
      });
    }

    if (existingUsername) {
      return jsonResponse(request, 409, { error: "Username già in uso" });
    }

    const fullName = `${firstName} ${lastName}`.trim();
    const email = `${username}@lafossagames.local`;
    const temporaryPassword = randomPassword();

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          username,
        },
      });

    if (createError || !created.user) {
      return jsonResponse(request, 500, {
        error: createError?.message ?? "Creazione utente fallita",
      });
    }

    const { error: profileUpsertError } = await admin.from("profiles").upsert(
      {
        id: created.user.id,
        email,
        username,
        full_name: fullName,
        role,
        active: true,
      },
      { onConflict: "id" },
    );

    if (profileUpsertError) {
      await admin.auth.admin.deleteUser(created.user.id);
      return jsonResponse(request, 500, { error: profileUpsertError.message });
    }

    return jsonResponse(request, 200, {
      id: created.user.id,
      email,
      username,
      temporaryPassword,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return jsonResponse(request, 500, { error: message });
  }
});
