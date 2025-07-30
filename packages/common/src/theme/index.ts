export const colors = {
  background: '#F5F5F5',
  // Primary equivalent to tailwind's 50 -> 950 scale
  'primary-lighten-5': '#fef5ee',
  'primary-lighten-4': '#fde9d7',
  'primary-lighten-3': '#facfae',
  'primary-lighten-2': '#f6ad7b',
  'primary-lighten-1': '#f18046',
  primary: '#EE672D',
  'primary-darken-1': '#de4618',
  'primary-darken-2': '#b83316',
  'primary-darken-3': '#932b19',
  'primary-darken-4': '#762618',
  'primary-darken-5': '#40100a',
  secondary: '#020202',
  ternary: '#FEE8E1',
  quaternary: '#D34980',
  accent: '#F68623',
  info: '#4456A6',
  'info-2': '#77C044',
  'info-3': '#B968DC',
  'info-4': '#41C3EC',
  'info-5': '#FFDB59',
};

export const variants = ['flat', 'text', 'elevated', 'tonal', 'outlined', 'plain'] as const;
export type Variant = typeof variants[number];
