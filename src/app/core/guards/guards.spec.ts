import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { adminGuard } from "./admin.guard";
import { appHomeGuard } from "./app-home.guard";
import { authGuard } from "./auth.guard";
import { AuthService } from "../services/auth.service";

describe("route guards", () => {
  let auth: {
    ensureReady: jasmine.Spy<() => Promise<void>>;
    isAuthenticated: jasmine.Spy<() => boolean>;
    isActive: jasmine.Spy<() => boolean>;
    isAdmin: jasmine.Spy<() => boolean>;
  };
  let router: { createUrlTree: jasmine.Spy };

  beforeEach(() => {
    auth = {
      ensureReady: jasmine.createSpy("ensureReady").and.resolveTo(),
      isAuthenticated: jasmine.createSpy("isAuthenticated").and.returnValue(true),
      isActive: jasmine.createSpy("isActive").and.returnValue(true),
      isAdmin: jasmine.createSpy("isAdmin").and.returnValue(false),
    };
    router = {
      createUrlTree: jasmine
        .createSpy("createUrlTree")
        .and.callFake((commands: unknown[], extras?: unknown) => ({
          commands,
          extras,
        })),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it("allows active authenticated users through authGuard", async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: "/app/registrations" } as never),
    );

    expect(result).toBeTrue();
  });

  it("redirects inactive users to login with returnUrl", async () => {
    auth.isActive.and.returnValue(false);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: "/app/registrations" } as never),
    );

    expect(result as unknown).toEqual({
      commands: ["/login"],
      extras: { queryParams: { returnUrl: "/app/registrations" } },
    });
  });

  it("redirects non-admin users away from admin routes", async () => {
    const result = await TestBed.runInInjectionContext(() =>
      adminGuard({} as never, {} as never),
    );

    expect(result as unknown).toEqual({ commands: ["/app"], extras: undefined });
  });

  it("sends staff and admins to the right app home", async () => {
    let result = await TestBed.runInInjectionContext(() =>
      appHomeGuard({} as never, {} as never),
    );
    expect(result as unknown).toEqual({
      commands: ["/app/registrations"],
      extras: undefined,
    });

    auth.isAdmin.and.returnValue(true);
    result = await TestBed.runInInjectionContext(() =>
      appHomeGuard({} as never, {} as never),
    );
    expect(result as unknown).toEqual({
      commands: ["/app/dashboard"],
      extras: undefined,
    });
  });
});
