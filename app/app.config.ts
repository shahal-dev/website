export default defineAppConfig({
  global: {
    picture: {
      dark: '/avatar.jpg',
      light: '/avatar.jpg',
      alt: 'MD Shahadat Hossain Shahal'
    },
    meetingLink: 'mailto:shahadatw6@gmail.com',
    email: 'shahadatw6@gmail.com',
    available: true,
    availableLabel: 'Open to research collaborations'
  },
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'neutral'
    },
    pageHero: {
      slots: {
        container: 'py-18 sm:py-24 lg:py-32',
        title: 'mx-auto max-w-xl text-pretty text-3xl sm:text-4xl lg:text-5xl',
        description: 'mt-2 text-md mx-auto max-w-2xl text-pretty sm:text-md text-muted'
      }
    }
  },
  footer: {
    credits: `© ${new Date().getFullYear()} MD Shahadat Hossain Shahal`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/shahal-dev',
      'target': '_blank',
      'aria-label': 'Shahal on GitHub'
    }, {
      'icon': 'i-simple-icons-linkedin',
      'to': 'https://www.linkedin.com/in/shahadatw6/',
      'target': '_blank',
      'aria-label': 'Shahal on LinkedIn'
    }, {
      'icon': 'i-simple-icons-googlescholar',
      'to': 'https://scholar.google.com/citations?hl=en&user=NewZCTsAAAAJ&view_op=list_works',
      'target': '_blank',
      'aria-label': 'Shahal on Google Scholar'
    }, {
      'icon': 'i-simple-icons-orcid',
      'to': 'https://orcid.org/0009-0001-5495-2619',
      'target': '_blank',
      'aria-label': 'Shahal on ORCID'
    }]
  }
})
