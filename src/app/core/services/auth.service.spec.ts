import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { SupabaseService } from "./supabase.service";
import { Profile } from "../types/models";

class ProfileQuery {
  constructor(private readonly profile: Profile | null) {}

  select(): ProfileQuery {
    return this;
  }

  eq(): ProfileQuery {
    return this;
  }

  maybeSingle(): Promise<{ data: Profile | null; error: null }> {
    return Promise.resolve({ data: this.profile, error: null });
  }
}

describe("AuthService", () => {
  const profile = (overrides: Partial<Profile> = {}): Profile => ({
    id: "user-1",
    email: "user@example.com",
    username: "mario",
    full_name: "Mario Rossi",
    roles: ["staff"],
    active: true,
    created_at: "2026-05-01T10:00:00Z",
    ...overrides,
  });

  function setup(currentProfile: Profile | null = profile()) {
    const auth = {
      getSession: jasmine
        .createSpy("getSession")
        .and.resolveTo({ data: { session: null }, error: null }),
      onAuthStateChange: jasmine
        .createSpy("onAuthStateChange")
        .and.returnValue({ data: { subscription: { unsubscribe: () => undefined } } }),
      signInWithPassword: jasmine.createSpy("signInWithPassword").and.resolveTo({
        data: {
          session: {
            user: { id: "user-1", email: "user@example.com" },
          },
        },
        error: null,
      }),
      signOut: jasmine.createSpy("signOut").and.resolveTo({ error: null }),
      updateUser: jasmine.createSpy("updateUser").and.resolveTo({ error: null }),
    };
    const client = {
      auth,
      rpc: jasmine
        .createSpy("rpc")
        .and.resolveTo({ data: "user@example.com", error: null }),
      from: jasmine
        .createSpy("from")
        .and.callFake(() => new ProfileQuery(currentProfile)),
    };
    const router = {
      navigateByUrl: jasmine.createSpy("navigateByUrl").and.resolveTo(true),
    };
    const service = new AuthService(
      { client } as unknown as SupabaseService,
      router as unknown as Router,
    );
    return { service, client, auth, router };
  }

  it("signs in with usernames by resolving the email first", async () => {
    const { service, client, auth } = setup();

    const result = await service.signIn(" mario ", "secret");

    expect(client.rpc).toHaveBeenCalledOnceWith("username_login_email", {
      login_username: "mario",
    });
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.username).toBe("mario");
    expect(service.isAuthenticated()).toBeTrue();
  });

  it("signs inactive profiles out and rejects login", async () => {
    const { service, auth } = setup(profile({ active: false }));

    await expectAsync(service.signIn("user@example.com", "secret")).toBeRejectedWithError(
      "Profilo non attivo o non configurato.",
    );

    expect(auth.signOut).toHaveBeenCalled();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.profile()).toBeNull();
  });

  it("clears local state on sign out and returns to the landing page", async () => {
    const { service, router } = setup();
    await service.signIn("user@example.com", "secret");

    await service.signOut();

    expect(service.session()).toBeNull();
    expect(service.profile()).toBeNull();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith("/");
  });
});
