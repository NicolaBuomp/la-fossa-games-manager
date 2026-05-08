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
    void this.initialize();
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.sessionState.set(session);
      void this.loadProfile();
    });
  }

  async initialize(): Promise<void> {
    const { data } = await this.supabase.client.auth.getSession();
    this.sessionState.set(data.session);
    await this.loadProfile();
    this.loadingState.set(false);
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.loadProfile();
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.sessionState.set(null);
    this.profileState.set(null);
    await this.router.navigateByUrl('/');
  }

  async loadProfile(): Promise<void> {
    const user = this.sessionState()?.user;
    if (!user) {
      this.profileState.set(null);
      return;
    }

    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      this.profileState.set(null);
      return;
    }

    this.profileState.set(data as Profile | null);
  }
}
