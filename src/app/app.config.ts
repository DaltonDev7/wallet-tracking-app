import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideEnvironmentNgxMask } from 'ngx-mask';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { firebaseConfig } from './db/config.db';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';


const MyPresetDos = definePreset(Aura);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideEnvironmentNgxMask(),


    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPresetDos,
        options: {
          prefix: 'p',
          darkModeSelector: '.app-dark',// 👈 solo cambia a dark si EXISTE esta clase
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng'
          },
        },
      },
      ripple: true,
    }),

    // 🔥 Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};
