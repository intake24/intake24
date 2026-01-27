import type { IconAliases } from 'vuetify';

import { createVuetify } from 'vuetify';
import * as directives from 'vuetify/directives';
import { aliases, fa } from 'vuetify/iconsets/fa';
import { VDateInput } from 'vuetify/labs/VDateInput';
import { VStepperVertical, VStepperVerticalItem } from 'vuetify/labs/VStepperVertical';

import { colors } from '@intake24/common/theme';

import resources from '../router/resources';

import 'vuetify/styles';

const resourceIcons = resources.reduce<Partial<IconAliases>>((acc, resource) => {
  acc[resource.name] = resource.icon;
  return acc;
}, {});

export default createVuetify({
  components: {
    VDateInput,
    VStepperVertical,
    VStepperVerticalItem,
  },
  directives,
  defaults: {
    VAlert: {
      variant: 'tonal',
    },
    VBtn: {
      variant: 'flat',
    },
    VCardActions: {
      VBtn: {
        variant: 'flat',
      },
    },
    VCombobox: {
      hideDetails: 'auto',
      variant: 'outlined',
    },
    VDataTableServer: {
      VBtn: {
        icon: true,
        variant: 'text',
        size: 'small',
      },
    },
    VFileInput: {
      hideDetails: 'auto',
      variant: 'outlined',
    },
    VListItemAction: {
      VBtn: {
        variant: 'text',
        size: 'small',
      },
    },
    VSelect: {
      hideDetails: 'auto',
      variant: 'outlined',
    },
    VCheckbox: {
      hideDetails: 'auto',
    },
    VCheckboxBtn: {
      hideDetails: 'auto',
    },
    VSwitch: {
      hideDetails: 'auto',
      color: 'primary',
    },
    VTextField: {
      hideDetails: 'auto',
      variant: 'outlined',
    },
    VTextarea: {
      hideDetails: 'auto',
      variant: 'outlined',
    },
    VTimePicker: {
      ampmInTitle: false,
      color: 'primary',
      format: '24hr',
      fullWidth: true,
      title: '',
    },
    VToolbar: {
      class: ['px-2'],
      VBtn: {
        variant: 'flat',
      },
    },
  },
  display: {
    mobileBreakpoint: 'md',
  },
  icons: {
    defaultSet: 'fa',
    aliases: {
      ...aliases,
      add: 'fas fa-plus',
      cancel: 'fas fa-circle-xmark',
      check: 'fas fa-check-circle',
      close: 'fas fa-circle-xmark',
      create: 'fas fa-plus',
      back: 'fas fa-level-up-alt',
      dashboard: 'fas fa-tachometer-alt',
      docs: 'fas fa-circle-info',
      delete: 'fas fa-trash',
      description: 'fas fa-note-sticky',
      desktop: 'fas fa-desktop',
      download: 'fas fa-download',
      edit: 'fas fa-edit',
      handle: 'fas fa-grip-vertical',
      login: 'fas fa-sign-in-alt',
      logout: 'fas fa-sign-out-alt',
      mobile: 'fas fa-mobile-screen',
      options: 'fas fa-ellipsis-vertical',
      read: 'far fa-file',
      redirect: 'fas fa-up-right-from-square',
      search: 'fas fa-magnifying-glass',
      save: 'fas fa-save',
      sync: 'fas fa-sync',
      times: 'fas fa-times-circle',
      upload: 'fas fa-upload',
      user: 'fas fa-user-circle',
      // MFA Provider icons
      duo: 'fas fa-mobile-screen-button',
      fido: 'fas fa-microchip',
      otp: 'fas fa-stopwatch',
      // Resource icons
      ...resourceIcons,
      categories: 'fas fa-list',
      foods: 'fas fa-drumstick-bite',
    },
    sets: {
      fa,
    },
  },
  theme: {
    themes: {
      light: {
        colors,
      },
    },
  },
});
