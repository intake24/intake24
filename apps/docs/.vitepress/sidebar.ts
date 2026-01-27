import { links } from './links';

export const sidebar = {
  '/guide/': [
    {
      text: 'Overview',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/guide/',
        },
        {
          text: 'Requirements',
          link: '/guide/requirements',
        },
        {
          text: 'Source code',
          link: '/guide/source-code',
        },
        {
          text: 'Releases',
          link: '/guide/releases',
        },
        {
          text: 'Integrations',
          link: '/guide/integrations',
        },
        {
          text: 'Researcher guides',
          link: links.researcherGuides,
          target: '_blank',
        },
      ],
    },
    {
      text: 'Guide',
      collapsed: false,
      items: [
        {
          text: 'Get started',
          link: '/guide/get-started',
        },
        {
          text: 'Development using Docker',
          link: '/guide/docker',
        },
        {
          text: 'Development using VM',
          link: '/guide/vm',
        },
        {
          text: 'Database',
          link: '/guide/database',
        },
        {
          text: 'Testing',
          link: '/guide/testing',
        },
        {
          text: 'Adding a New Prompt',
          link: '/guide/new-prompts',
        },
        {
          text: 'Version 3 recall model',
          link: '/guide/v3-survey',
        },
        {
          text: 'Portion size methods',
          link: '/guide/portion-size',
        },
      ],
    },
  ],
  '/config/': [
    {
      text: 'Configuration',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/config/',
        },
      ],
    },
    {
      text: 'API server',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/config/api/',
        },
        {
          text: 'Application',
          link: '/config/api/application',
        },
        {
          text: 'ACL',
          link: '/config/api/acl',
        },
        {
          text: 'Cache',
          link: '/config/api/cache',
        },
        {
          text: 'Database',
          link: '/config/api/database',
        },
        {
          text: 'Filesystem',
          link: '/config/api/filesystem',
        },
        {
          text: 'Image processing',
          link: '/config/api/images',
        },
        {
          text: 'Logging',
          link: '/config/api/log',
        },
        {
          text: 'Mail',
          link: '/config/api/mail',
        },
        {
          text: 'PDF generation',
          link: '/config/api/pdf',
        },
        {
          text: 'Pub-sub',
          link: '/config/api/pub-sub',
        },
        {
          text: 'Queue',
          link: '/config/api/queue',
        },
        {
          text: 'Rate limiter',
          link: '/config/api/rate-limiter',
        },
        {
          text: 'Security',
          link: '/config/api/security',
        },
        {
          text: 'Services',
          link: '/config/api/services',
        },
        {
          text: 'Session',
          link: '/config/api/session',
        },
      ],
    },
    {
      text: 'Admin client',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/config/admin/',
        },
      ],
    },
    {
      text: 'Survey client',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/config/survey/',
        },
      ],
    },
  ],
  '/api/': [
    {
      text: 'API',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/api/',
        },
        {
          text: 'OpenAPI Reference',
          link: '/open-api.html',
          target: '_blank',
        },
        {
          text: 'Authentication',
          link: '/api/authentication',
        },
        {
          text: 'Rate and usage limits',
          link: '/api/rate-limits',
        },
      ],
    },
  ],
  '/admin/': [
    {
      text: 'Admin',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/admin/',
        },
        {
          text: 'Profile',
          link: '/admin/user/profile',
        },
        {
          text: 'Personal access tokens',
          link: '/admin/user/personal-access-tokens',
        },
        {
          text: 'Jobs',
          link: '/admin/user/jobs',
        },
      ],
    },
    {
      text: 'Foods',
      items: [
        {
          text: 'Food databases',
          link: '/admin/foods/fdbs',
        },
        {
          text: 'Nutrient tables',
          link: '/admin/foods/nutrient-tables',
        },
        {
          text: 'Nutrient types',
          link: '/admin/foods/nutrient-types',
        },
        {
          text: 'Nutrient units',
          link: '/admin/foods/nutrient-units',
        },
        {
          text: 'Standard units',
          link: '/admin/foods/standard-units',
        },
      ],
    },
    {
      text: 'Localization',
      items: [
        {
          text: 'Languages',
          link: '/admin/localization/languages',
        },
        {
          text: 'Locales',
          link: '/admin/localization/locales',
        },
      ],
    },
    {
      text: 'Images',
      items: [
        {
          text: 'Introduction',
          link: '/admin/images/',
        },
        {
          text: 'As served sets',
          link: '/admin/images/as-served-sets',
        },
        {
          text: 'Image maps',
          link: '/admin/images/image-maps',
        },
        {
          text: 'Guide images',
          link: '/admin/images/guide-images',
        },
        {
          text: 'Drinkware sets',
          link: '/admin/images/drinkware-sets',
        },
        {
          text: 'Media',
          link: '/admin/media',
        },
      ],
    },
    {
      text: 'Feedback',
      items: [
        {
          text: 'Schemes',
          link: '/admin/feedback/schemes',
        },
      ],
    },
    {
      text: 'Surveys MGMT',
      items: [
        {
          text: 'Surveys',
          link: '/admin/surveys/',
        },
        {
          text: 'Schemes',
          link: '/admin/surveys/schemes',
        },
        {
          text: 'Prompt editor',
          link: '/admin/surveys/prompt-editor',
        },
        {
          text: 'Prompt types',
          link: '/admin/surveys/prompt-types',
        },
        {
          text: 'Prompt templates',
          link: '/admin/surveys/prompt-templates',
        },
        {
          text: 'FAQs',
          link: '/admin/surveys/faqs',
        },
      ],
    },
    {
      text: 'Access control list',
      items: [
        {
          text: 'Introduction',
          link: '/admin/acl/',
        },
        {
          text: 'Resources',
          link: '/admin/acl/resources',
        },
        {
          text: 'Securables',
          link: '/admin/acl/securables',
        },
        {
          text: 'Permissions',
          link: '/admin/acl/permissions',
        },
        {
          text: 'Roles',
          link: '/admin/acl/roles',
        },
        {
          text: 'Users',
          link: '/admin/acl/users',
        },
      ],
    },
    {
      text: 'System',
      items: [
        {
          text: 'Job types',
          link: '/admin/system/job-types',
        },
        {
          text: 'Jobs',
          link: '/admin/system/jobs',
        },
        {
          text: 'Sign-in logs',
          link: '/admin/system/sign-in-logs',
        },
        {
          text: 'Tasks',
          link: '/admin/system/tasks',
        },
      ],
    },
  ],
  '/survey/': [
    {
      text: 'Survey',
      items: [
        {
          text: 'Introduction',
          link: '/survey/',
        },
      ],
    },
  ],
  '/cli/': [
    {
      text: 'CLI',
      collapsed: false,
      items: [
        {
          text: 'Introduction',
          link: '/cli/',
        },
        {
          text: 'Initialize .env files',
          link: '/cli/init-env',
        },
        {
          text: 'Initialize system database',
          link: '/cli/init-db-system',
        },
        {
          text: 'Download assets',
          link: '/cli/init-assets',
        },
        {
          text: 'Generate key / secret',
          link: '/cli/generate-key',
        },
        {
          text: 'Generate VAPID keys',
          link: '/cli/generate-vapid-keys',
        },
        {
          text: 'Find portion images',
          link: '/cli/find-portion-images',
        },
      ],
    },
  ],
};
