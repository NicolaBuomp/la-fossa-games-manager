import { Injectable } from "@angular/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { LoadingService } from "./loading.service";

@Injectable({ providedIn: "root" })
export class SupabaseService {
  readonly client: SupabaseClient;

  private _managementClient: SupabaseClient | null = null;
  private readonly trackedFetch: typeof fetch;

  constructor(private readonly loading: LoadingService) {
    this.trackedFetch = async (input, init) => {
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
          fetch: this.trackedFetch,
        },
      },
    );
  }

  /**
   * Client verso il database del nuovo gestionale
   * (la-fossa-events-management): usato solo dal form pubblico della landing
   * per inoltrare le richieste di partecipazione/sponsor.
   *
   * Creato pigramente: se la configurazione manca l'app si avvia comunque e
   * l'errore emerge solo al primo utilizzo, dove viene gestito dal form.
   */
  get managementClient(): SupabaseClient {
    if (!this._managementClient) {
      if (
        !environment.managementSupabaseUrl ||
        !environment.managementSupabaseAnonKey
      ) {
        throw new Error(
          "Configurazione del nuovo gestionale mancante: il form non puo' inviare richieste. " +
            "Aggiungere LFEM_SUPABASE_URL e LFEM_SUPABASE_ANON_KEY al .env e rifare il build.",
        );
      }

      this._managementClient = createClient(
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
            fetch: this.trackedFetch,
          },
        },
      );
    }

    return this._managementClient;
  }
}
