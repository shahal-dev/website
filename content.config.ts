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
        // Keeps the markdown source alongside the parsed AST so posts can be
        // rendered the same way whether they come from a file or the database,
        // and so admin → Import can copy them into Supabase verbatim.
        rawbody: z.string(),
        minRead: z.number(),
        date: z.date(),
        image: z.string().optional().editor({ input: 'media' }),
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
