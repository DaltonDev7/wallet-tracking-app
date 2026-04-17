import { ApplicationConfig } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { initializeFirebaseApp } from './app/db/config.db';

const testProviders: NonNullable<ApplicationConfig['providers']> = [
  provideNoopAnimations(),
  provideRouter([]),
  provideEnvironmentNgxMask(),
  provideFirebaseApp(() => initializeFirebaseApp()),
  provideAuth(() => getAuth(initializeFirebaseApp())),
  provideFirestore(() => getFirestore(initializeFirebaseApp()))
];

export default testProviders;
