// src/app/services/refresh.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RefreshService {
  private refreshSubject = new Subject<void>();

  // Observable to listen for refresh events
  refresh$ = this.refreshSubject.asObservable();

  // Method to trigger a refresh
  triggerRefresh() {
    this.refreshSubject.next();
  }
}
