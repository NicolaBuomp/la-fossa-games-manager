import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { Profile } from '../types/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionState = signal<Session | null>(null);
  private readonly profileState = signal<Profile | null>(null);
  private readonly loadingState = signal(true);
  private initializePromise: Promise<void> | null = null;
  private profileLoadToken = 0;

  readonly session = this.sessionState.asReadonly();
  readonly profile = this.profileState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly user = computed<User | null>(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionState());
  readonly isAdmin = computed(() => this.profileState()?.role === 'admin');
  readonly isActive = computed(() => this.profileState()?.active === true);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly router: Router
  ) {
    void this.ensureReady();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.sessionState.set(session);
      void this.loadProfileForCurrentSession();
    });
  }

  ensureReady(): Promise<void> {
    if (!this.initializePromise) {
      this.initializePromise = this.initialize();
    }

    return this.initializePromise;
  }

  async signIn(identifier: string, password: string): Promise<Profile> {
    await this.ensureReady();
    const normalizedIdentifier = identifier.trim();
    const email = normalizedIdentifier.includes('@')
      ? normalizedIdentifier
      : await this.emailForUsername(normalizedIdentifier);

    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    this.sessionState.set(data.session);
    const profile = await this.loadProfileForCurrentSession();
    if (!profile?.active) {
      await this.supabase.client.auth.signOut();
      this.sessionState.set(null);
      this.profileState.set(null);
      throw new Error('Profilo non attivo o non configurato.');
    }

    return profile;
  }

  private async emailForUsername(username: string): Promise<string> {
    const { data, error } = await this.supabase.client.rpc('username_login_email', {
      login_username: username
    });
    if (error) throw error;
    if (!data) throw new Error('Username o password non validi.');
    return data as string;
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.sessionState.set(null);
    this.profileState.set(null);
    await this.router.navigateByUrl('/');
  }

  async updatePassword(password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.updateUser({ password });
    if (error) throw error;
  }

  async refreshProfile(): Promise<Profile | null> {
    await this.ensureReady();
    return this.loadProfileForCurrentSession();
  }

  private async initialize(): Promise<void> {
    this.loadingState.set(true);
    try {
      const { data } = await this.supabase.client.auth.getSession();
      this.sessionState.set(data.session);
      await this.loadProfileForCurrentSession();
    } finally {
      this.loadingState.set(false);
    }
  }

  private async loadProfileForCurrentSession(): Promise<Profile | null> {
    const token = ++this.profileLoadToken;
    const user = this.sessionState()?.user;
    if (!user) {
      this.profileState.set(null);
      return null;
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      if (token === this.profileLoadToken) {
        this.profileState.set(null);
      }
      return null;
    }

    const profile = data as Profile | null;
    if (token === this.profileLoadToken) {
      this.profileState.set(profile);
    }

    return profile;
  }
}
