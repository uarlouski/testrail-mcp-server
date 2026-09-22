import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, type HeadConfig } from 'vitepress'

const HOSTNAME = 'https://uarlouski.github.io'
const BASE = '/testrail-mcp-server/'
const SITE_URL = `${HOSTNAME}${BASE}`
const REPO_URL = 'https://github.com/uarlouski/testrail-mcp-server'
const NPM_URL = 'https://www.npmjs.com/package/@uarlouski/testrail-mcp-server'
const SITE_NAME = 'TestRail MCP Server'
const SITE_DESCRIPTION =
  'TestRail MCP Server is an open-source Model Context Protocol server that connects Claude, Cursor, Windsurf, and VS Code to the TestRail API v2, so AI assistants can read, create, and update test cases, runs, and results.'
// GitHub renders a 1200x630 PNG social card for the repository, keeping the
// preview image in sync with the repo name, description, and star count.
const OG_IMAGE = 'https://opengraph.githubassets.com/testrail-mcp-server-docs/uarlouski/testrail-mcp-server'

/** Absolute, canonical URL for a source file such as `guide/cli.md`. */
function pageUrl(relativePath: string): string {
  const path = relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
  return `${SITE_URL}${path}`
}

/** Documentation pages in reading order, used to build `llms-full.txt`. */
const LLMS_FULL_PAGES = [
  'index.md',
  'guide/getting-started.md',
  'guide/configuration.md',
  'guide/cli.md',
  'guide/faq.md',
  'reference/index.md',
  'reference/discovery.md',
  'reference/cases.md',
  'reference/execution.md',
  'reference/attachments.md',
  'reference/shared-steps.md',
  'reference/deletion.md',
  'reference/metadata.md'
]

/**
 * Concatenates every documentation page into a single plain-text file at
 * `/llms-full.txt`, the convention AI answer engines follow to ingest a whole
 * site in one request. Generated at build time so it cannot drift from source.
 */
function writeLlmsFullTxt(srcDir: string, outDir: string): void {
  const sections = LLMS_FULL_PAGES.map((page) => {
    const raw = readFileSync(join(srcDir, page), 'utf-8')
    const body = raw
      .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '') // frontmatter
      .replace(/<style>[\s\S]*?<\/style>/g, '') // VitePress-only styling
      .replace(/^<\/?div[^>]*>\s*$/gm, '') // layout wrappers
      .replace(/^> \[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*$/gm, '> ')
      .trim()
    return `${body}\n\nSource: ${pageUrl(page)}`
  })

  const header = [
    `# ${SITE_NAME} — Complete Documentation`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `Canonical site: ${SITE_URL}`,
    `Source repository: ${REPO_URL}`,
    `npm package: ${NPM_URL}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    ''
  ].join('\n')

  writeFileSync(join(outDir, 'llms-full.txt'), `${header}\n${sections.join('\n\n---\n\n')}\n`, 'utf-8')
}

/**
 * Builds `FAQPage` structured data from a page's own Markdown, so the schema
 * can never disagree with the visible answers. Picks up every `###` heading
 * that ends in a question mark and uses the prose that follows it as the
 * answer. Opt in per page with `faq: true` in the frontmatter.
 */
function faqPageLd(markdown: string): object | null {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  const entries: { question: string; answer: string }[] = []
  const pattern = /^###\s+(.+\?)\s*$/gm

  let match: RegExpExecArray | null
  while ((match = pattern.exec(body)) !== null) {
    const nextHeading = body.slice(match.index + match[0].length).search(/^#{1,3}\s/m)
    const section = body.slice(
      match.index + match[0].length,
      nextHeading === -1 ? undefined : match.index + match[0].length + nextHeading
    )

    const answer = section
      .replace(/```[\s\S]*?```/g, '') // fenced code blocks
      .replace(/^\s*>\s?\[![A-Z]+\]\s*$/gm, '')
      .replace(/^\s*[>|]\s?/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link text only
      .replace(/[*`]/g, '') // emphasis and code spans, but never `_`: it appears in tool and variable names
      .split(/\n\s*\n/)
      .map((p) => p.trim().replace(/\s+/g, ' '))
      .filter(Boolean)
      .join(' ')
      .trim()

    if (answer) {
      entries.push({ question: match[1].replace(/[*`]/g, '').trim(), answer })
    }
  }

  if (entries.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  }
}

/**
 * Structured data describing the package itself. Answer engines and rich
 * results use this to attribute capabilities, licence, and pricing.
 */
const softwareApplicationLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  alternateName: ['@uarlouski/testrail-mcp-server', 'TestRail Model Context Protocol Server'],
  description: SITE_DESCRIPTION,
  applicationCategory: 'DeveloperApplication',
  applicationSubCategory: 'Test Management Integration',
  operatingSystem: 'Linux, macOS, Windows',
  url: SITE_URL,
  downloadUrl: NPM_URL,
  codeRepository: REPO_URL,
  installUrl: NPM_URL,
  license: 'https://www.apache.org/licenses/LICENSE-2.0',
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'Node.js 18+',
  softwareRequirements: 'Node.js 18 or newer, a TestRail instance, and a TestRail API key',
  isAccessibleForFree: true,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  author: {
    '@type': 'Person',
    name: 'Uladzislau Arlouski',
    url: 'https://github.com/uarlouski'
  },
  featureList: [
    'Query TestRail projects, suites, and sections from an AI assistant',
    'Create, update, and bulk-edit test cases with custom field validation',
    'Create test runs and submit results by test_id or case_id',
    'Upload attachments and auto-zip directories',
    'Manage shared steps and test case revision history',
    'Export test cases as Markdown for RAG and knowledge base ingestion',
    'Run every tool from CI/CD with the testrail-cli command line interface'
  ],
  keywords:
    'TestRail MCP server, Model Context Protocol, TestRail API, AI test management, Claude TestRail integration, Cursor TestRail integration, QA automation'
}

export default defineConfig({
  base: BASE,
  lang: 'en-US',
  title: SITE_NAME,
  titleTemplate: ':title | TestRail MCP Server',
  description: SITE_DESCRIPTION,
  lastUpdated: true,
  sitemap: {
    hostname: SITE_URL
  },
  head: [
    ['meta', { name: 'author', content: 'Uladzislau Arlouski' }],
    [
      'meta',
      {
        name: 'keywords',
        content:
          'TestRail MCP server, TestRail Model Context Protocol, TestRail AI integration, TestRail API v2, MCP server for test management, Claude TestRail, Cursor TestRail, Windsurf TestRail, AI test case generation, QA automation, testrail-cli'
      }
    ],
    ['meta', { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' }],
    ['meta', { name: 'theme-color', content: '#3c8772' }],
    ['link', { rel: 'icon', href: `${BASE}favicon.svg`, type: 'image/svg+xml' }],

    // Open Graph
    ['meta', { property: 'og:site_name', content: SITE_NAME }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:locale', content: 'en_US' }],
    ['meta', { property: 'og:image', content: OG_IMAGE }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: `${SITE_NAME} — Model Context Protocol server for TestRail` }],

    // Twitter / X
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: OG_IMAGE }],
    ['meta', { name: 'twitter:image:alt', content: `${SITE_NAME} — Model Context Protocol server for TestRail` }],

    ['script', { type: 'application/ld+json' }, JSON.stringify(softwareApplicationLd)]
  ],

  transformPageData(pageData, { siteConfig }) {
    const title: string = pageData.frontmatter.title ?? pageData.title ?? SITE_NAME
    const description: string = pageData.frontmatter.description ?? pageData.description ?? SITE_DESCRIPTION
    const url = pageUrl(pageData.relativePath)
    const isHome = pageData.relativePath === 'index.md'
    const fullTitle = isHome ? `${SITE_NAME} — Model Context Protocol Server for TestRail` : `${title} | ${SITE_NAME}`

    const head: HeadConfig[] = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:title', content: fullTitle }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { name: 'twitter:title', content: fullTitle }],
      ['meta', { name: 'twitter:description', content: description }]
    ]

    // Breadcrumbs help search engines render the docs hierarchy and help answer
    // engines understand where a page sits in the information architecture.
    if (!isHome) {
      const [sectionSlug] = pageData.relativePath.split('/')
      const sectionName = sectionSlug === 'guide' ? 'Guide' : 'Tool Reference'
      head.push([
        'script',
        { type: 'application/ld+json' },
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: SITE_NAME, item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: sectionName, item: `${SITE_URL}${sectionSlug}/` },
            { '@type': 'ListItem', position: 3, name: title, item: url }
          ]
        })
      ])
    }

    if (pageData.frontmatter.faq) {
      const ld = faqPageLd(readFileSync(join(siteConfig.srcDir, pageData.relativePath), 'utf-8'))
      if (ld) head.push(['script', { type: 'application/ld+json' }, JSON.stringify(ld)])
    }

    pageData.frontmatter.head = [...head, ...(pageData.frontmatter.head ?? [])]
  },

  buildEnd(siteConfig) {
    writeLlmsFullTxt(siteConfig.srcDir, siteConfig.outDir)
  },

  themeConfig: {
    outline: 'deep',
    logo: '/favicon.svg',

    search: {
      provider: 'local'
    },

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Tools', link: '/reference/' },
      { text: 'CLI', link: '/guide/cli' },
      { text: 'FAQ', link: '/guide/faq' },
      {
        text: 'Links',
        items: [
          { text: 'npm package', link: NPM_URL },
          { text: 'GitHub repository', link: REPO_URL },
          { text: 'Changelog', link: `${REPO_URL}/blob/main/CHANGELOG.md` },
          { text: 'Report an issue', link: `${REPO_URL}/issues` }
        ]
      }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'CLI & CI/CD Automation', link: '/guide/cli' },
          { text: 'FAQ', link: '/guide/faq' }
        ]
      },
      {
        text: 'Reference',
        items: [
          {
            text: 'All Tools',
            link: '/reference/',
            collapsed: false,
            items: [
              { text: 'Discovery & Navigation', link: '/reference/discovery' },
              { text: 'Test Case Management', link: '/reference/cases' },
              { text: 'Test Execution & Tracking', link: '/reference/execution' },
              { text: 'Attachments & Media', link: '/reference/attachments' },
              { text: 'Shared Steps', link: '/reference/shared-steps' },
              { text: 'Deletion', link: '/reference/deletion' },
              { text: 'System Metadata', link: '/reference/metadata' }
            ]
          }
        ]
      }
    ],

    editLink: {
      pattern: `${REPO_URL}/edit/main/docs/:path`,
      text: 'Edit this page on GitHub'
    },

    socialLinks: [{ icon: 'github', link: REPO_URL }],

    footer: {
      message: `Released under the <a href="${REPO_URL}/blob/main/LICENSE">Apache 2.0 License</a>. Built with the <a href="https://modelcontextprotocol.io">Model Context Protocol</a>.`,
      copyright: `Copyright © 2025-present <a href="https://github.com/uarlouski">Uladzislau Arlouski</a>`
    }
  }
})
