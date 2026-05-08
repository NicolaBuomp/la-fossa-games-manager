import { Injectable } from '@angular/core';
import { CrudService } from './crud.service';
import { SupabaseService } from './supabase.service';
import { InsertRegistration, Registration } from '../types/models';

@Injectable({ providedIn: 'root' })
export class RegistrationsService extends CrudService<Registration, InsertRegistration> {
  constructor(supabase: SupabaseService) {
    super(supabase, 'registrations', 'registration_date');
  }
}
