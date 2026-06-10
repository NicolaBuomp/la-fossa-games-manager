import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { LoadingService } from "./loading.service";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  readonly client: SupabaseClient;

  /**
   * Client verso il database del nuovo gestionale
   * (la-fossa-events-management): usato solo dal form pubblico della landing
   * per inoltrare le richieste di partecipazione/sponsor.
   */
  readonly managementClient: SupabaseClient;

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

    this.managementClient = createClient(
      environment.managementSupabaseUrl,
      environment.managementSupabaseAnonKey,
      {
        auth: {
          // Accesso solo anonimo: nessuna sessione da persistere e niente
          // conflitti di storage con il client principale.
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: trackedFetch,
        },
      },
    );
  }
}
