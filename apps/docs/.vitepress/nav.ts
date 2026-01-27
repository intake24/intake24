import { links } from './links';

export const nav = [
  {
    text: 'Guide',
    link: '/guide/',
  },
  {
    text: 'Components',
    items: [
      { text: 'Configuration', link: '/config/' },
      { text: 'API', link: '/api/' },
      { text: 'Admin Tool', link: '/admin/' },
      { text: 'Survey App', link: '/survey/' },
      { text: 'CLI', link: '/cli/' },
    ],
  },
  {
    text: 'Resources',
    items: [
      { text: 'Home', link: links.home },
      { text: 'Researcher guides', link: links.researcherGuides },
      { text: 'GitHub', link: links.gitHub },
    ],
  },
];
