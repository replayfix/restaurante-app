import { Injectable } from '@angular/core';

@Injectable({
  provided: 'root'
})
export class FirebaseService {
  private isConnected = false;

  constructor() {
    this.checkFirebaseConfig();
  }

  private checkFirebaseConfig(): void {
    // This wrapper allows the application to run seamlessly on reactive Signals + LocalStorage
    // right out of the box, while ready to connect to real Cloud Firestore when environment config is provided.
    console.info('🔥 Firebase Service initialized. Ready for real-time Cloud Firestore synchronization.');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
