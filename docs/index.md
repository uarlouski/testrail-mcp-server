---
layout: home

hero:
  name: "TestRail MCP Server"
  text: "Model Context Protocol for TestRail"
  tagline: Connect Claude, Cursor, and Windsurf directly to your TestRail instance to manage test cases, runs, and results conversationally.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Configuration
      link: /guide/configuration

features:
  - title: 🔍 Discovery & Navigation
    details: Browse projects, test suites, and sections to automatically map your QA organization.
    link: /reference/discovery
    linkText: View Discovery Tools
  - title: 📋 Case Management
    details: Fetch, create, update, and bulk-edit test cases with comprehensive custom field support.
    link: /reference/cases
    linkText: View Case Tools
  - title: ▶️ Execution & Tracking
    details: Create test runs, update results by test_id or case_id, attach files, and track statuses.
    link: /reference/execution
    linkText: View Execution Tools
  - title: 📎 Attachments & Media
    details: Easily attach screenshots, logs, or entire zip directories to test cases and runs.
    link: /reference/attachments
    linkText: View Attachment Tools
  - title: 🔗 Shared Steps
    details: Create, update, and retrieve shared test steps and their audit history.
    link: /reference/shared-steps
    linkText: View Shared Steps Tools
  - title: 🧠 System Metadata
    details: Dynamically pull statuses, priorities, templates, and configurations for perfect AI generation.
    link: /reference/metadata
    linkText: View Metadata Tools
---

<style>
.custom-section {
  max-width: 1152px;
  margin: 48px auto;
  padding: 0 24px;
}
.custom-section h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--vp-c-divider);
  padding-bottom: 8px;
}
</style>

<div class="custom-section">
  <h2>Why use an MCP Server for TestRail?</h2>
  <p>Managing test cases manually is tedious and error-prone. With the <strong>TestRail MCP Server</strong>, your AI assistant interacts directly with your TestRail instance. Instruct it to find test cases, draft new ones, kick off test runs, and record test results—all through natural conversation.</p>
  <ul>
    <li><strong>No context switching:</strong> Stay in your IDE or chat client.</li>
    <li><strong>No tedious copy-pasting:</strong> Generate comprehensive tests and push them immediately.</li>
    <li><strong>Just ask your AI:</strong> "Create a test run containing cases from section 5" or "Mark test case ID 1042 as passed with the comment 'Tested successfully on staging'."</li>
  </ul>
</div>
