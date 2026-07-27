import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const createBaseSchema = () => z.object({
  title: z.string(),
  description: z.string()
})

const createButtonSchema = () => z.object({
  label: z.string(),
  icon: z.string().optional(),
  to: z.string().optional(),
  color: z.enum(['primary', 'neutral', 'success', 'warning', 'error', 'info']).optional(),
  size: z.enum(['xs', 'sm', 'md', 'lg', 'xl']).optional(),
  variant: z.enum(['solid', 'outline', 'subtle', 'soft', 'ghost', 'link']).optional(),
  target: z.enum(['_blank', '_self']).optional()
})

const createImageSchema = () => z.object({
  src: z.string().editor({ input: 'media' }),
  alt: z.string()
})

const createAuthorSchema = () => z.object({
  name: z.string(),
  description: z.string().optional(),
  username: z.string().optional(),
  twitter: z.string().optional(),
  to: z.string().optional(),
  avatar: createImageSchema().optional()
})

export default defineContentConfig({
  collections: {
    index: defineCollection({
      type: 'page',
      source: 'index.yml',
      schema: z.object({
        tagline: z.string().optional(),
        hero: z.object({
          links: z.array(createButtonSchema())
        }),
        about: createBaseSchema(),
        experience: createBaseSchema().extend({
          items: z.array(z.object({
            date: z.date(),
            position: z.string(),
            company: z.object({
              name: z.string(),
              url: z.string(),
              logo: z.string().editor({ input: 'icon' }),
              color: z.string()
            })
          }))
        }),
        blog: createBaseSchema(),
        faq: createBaseSchema().extend({
          categories: z.array(
            z.object({
              title: z.string().nonempty(),
              questions: z.array(
                z.object({
                  label: z.string().nonempty(),
                  content: z.string().nonempty()
                })
              )
            }))
        })
      })
    }),
    projects: defineCollection({
      type: 'data',
      source: 'projects/*.yml',
      schema: z.object({
        title: z.string().nonempty(),
        description: z.string().nonempty(),
        image: z.string().optional().editor({ input: 'media' }),
        url: z.string().nonempty(),
        tags: z.array(z.string()),
        date: z.date()
      })
    }),
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        minRead: z.number(),
        date: z.date(),
        image: z.string().nonempty().editor({ input: 'media' }),
        author: createAuthorSchema()
      })
    }),
    pages: defineCollection({
      type: 'page',
      source: [
        { include: 'projects.yml' },
        { include: 'blog.yml' }
      ],
      schema: z.object({
        links: z.array(createButtonSchema())
      })
    }),
    publications: defineCollection({
      type: 'page',
      source: 'publications.yml',
      schema: z.object({
        links: z.array(createButtonSchema()),
        events: z.array(z.object({
          category: z.enum(['Paper', 'Preprint', 'Thesis', 'Award']),
          title: z.string(),
          date: z.date(),
          location: z.string(),
          url: z.string().optional()
        }))
      })
    }),
    cv: defineCollection({
      type: 'data',
      source: 'cv.yml',
      schema: z.object({
        name: z.string(),
        role: z.string(),
        summary: z.string(),
        location: z.string(),
        phone: z.string().optional(),
        email: z.string(),
        links: z.array(z.object({ label: z.string(), url: z.string() })),
        education: z.array(z.object({
          institution: z.string(),
          degree: z.string(),
          date: z.string(),
          compact: z.boolean(),
          details: z.array(z.string())
        })),
        experience: z.array(z.object({
          organisation: z.string(),
          role: z.string(),
          date: z.string(),
          compact: z.boolean(),
          details: z.array(z.string())
        })),
        publications: z.array(z.object({
          title: z.string(),
          authors: z.string(),
          venue: z.string(),
          date: z.string(),
          url: z.string().optional(),
          compact: z.boolean()
        })),
        awards: z.array(z.object({
          title: z.string(),
          detail: z.string(),
          date: z.string(),
          compact: z.boolean()
        })),
        skills: z.array(z.object({
          group: z.string(),
          compact: z.boolean(),
          items: z.array(z.string())
        })),
        projects: z.array(z.object({
          title: z.string(),
          detail: z.string(),
          url: z.string().optional(),
          compact: z.boolean()
        })),
        teaching: z.array(z.object({
          title: z.string(),
          detail: z.string(),
          date: z.string(),
          compact: z.boolean()
        })),
        outreach: z.array(z.object({
          title: z.string(),
          detail: z.string(),
          compact: z.boolean()
        })),
        languages: z.array(z.string())
      })
    }),
    galleryIndex: defineCollection({
      type: 'page',
      source: 'gallery.yml',
      schema: z.object({})
    }),
    gallery: defineCollection({
      type: 'page',
      source: 'gallery/*.md',
      schema: z.object({
        object: z.string().nonempty(),
        tag: z.string().optional(),
        // Folder produced by `pnpm photo` — holds thumb.webp / medium.webp / full.jpg.
        folder: z.string().nonempty(),
        alt: z.string().nonempty(),
        featured: z.boolean().default(false),
        date: z.string().optional(),
        location: z.string().optional(),
        // Extra frames of the same object, shown in the carousel.
        frames: z.array(z.object({
          folder: z.string().optional(),
          src: z.string().optional(),
          caption: z.string().optional()
        })).optional(),
        // Professional reference (Hubble, JWST, a survey) for the comparison slider.
        reference: z.object({
          src: z.string().nonempty(),
          label: z.string().optional(),
          credit: z.string().nonempty(),
          url: z.string().optional()
        }).optional(),
        gear: z.object({
          telescope: z.string().optional(),
          camera: z.string().optional(),
          mount: z.string().optional(),
          filters: z.string().optional()
        }).optional(),
        acquisition: z.object({
          exposures: z.string().optional(),
          integration: z.string().optional(),
          sky: z.string().optional()
        }).optional()
      })
    }),
    about: defineCollection({
      type: 'page',
      source: 'about.yml',
      schema: z.object({
        content: z.object({}),
        images: z.array(createImageSchema())
      })
    })
  }
})
