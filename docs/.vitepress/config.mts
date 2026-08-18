import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/testrail-mcp-server/',
  title: "TestRail MCP Server",
  description: "Model Context Protocol (MCP) server for TestRail integration, enabling LLMs to fetch test cases and metadata.",
  themeConfig: {
    outline: 'deep',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' }
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' }
        ]
      },
      {
        text: 'Reference',
        items: [
          {
            text: 'Available Tools',
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/uarlouski/testrail-mcp-server' }
    ]
  }
})
