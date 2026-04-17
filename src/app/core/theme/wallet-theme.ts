import { definePreset } from '@primeuix/themes';
import Lara from '@primeuix/themes/lara';

export const WalletTheme = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    },
    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{blue.400}',
      offset: '2px'
    },
    colorScheme: {
      light: {
        primary: {
          color: '{blue.700}',
          inverseColor: '#ffffff',
          hoverColor: '{blue.800}',
          activeColor: '{blue.900}'
        },
        highlight: {
          background: '{blue.50}',
          focusBackground: '{blue.100}',
          color: '{blue.900}',
          focusColor: '{blue.950}'
        },
        formField: {
          hoverBorderColor: '{blue.400}',
          focusBorderColor: '{blue.500}'
        }
      }
    }
  }
});
