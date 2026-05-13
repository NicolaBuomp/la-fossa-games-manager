import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { LoadingService } from "./loading.service";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor(private readonly loading: LoadingService) {
    const trackedFetch: typeof fetch = async (input, init) => {
      this.loading.start();
      try {
        return await fetch(input, init);
      } finally {
        this.loading.stop();
      }
    };

    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        global: {
          fetch: trackedFetch,
        },
      },
    );
  }
}
