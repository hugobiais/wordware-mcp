import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  getLeadEnrichementHandler,
  getLeadEnrichementSchema,
} from "./tools/leadEnrichement.js";
import {
  getResearchFoundersHandler,
  getResearchFoundersSchema,
} from "./tools/researchFounders.js";
import {
  saveToNotionSchema,
  saveToNotionHandler,
} from "./tools/saveToNotion.js";
import { reactAgentHandler, reactAgentSchema } from "./tools/reactAgent.js";
import {
  NOTION_SECRET,
  NOTION_PARENT_PAGE_ID,
  RESEARCH_FOUNDER_APP_ID,
  LEAD_ENRICHMENT_APP_ID,
  SAVE_TO_NOTION_APP_ID,
  REACT_AGENT_APP_ID,
} from "./utils/env.js";

// Create server instance
const server = new McpServer({
  name: "wordware",
  version: "1.0.0",
});

// Register tools

if (RESEARCH_FOUNDER_APP_ID) {
  server.tool(
    "research-founder",
    "Comprehensive founder research tool - analyzes person, company, competition and generates personalized questions using AI to prepare for meetings",
    getResearchFoundersSchema,
    getResearchFoundersHandler
  );
}

if (LEAD_ENRICHMENT_APP_ID) {
  server.tool(
    "lead-enrichment",
    "Sales prospect research tool that gathers key information about individuals and their companies using search to provide actionable sales intelligence",
    getLeadEnrichementSchema,
    getLeadEnrichementHandler
  );
}

if (SAVE_TO_NOTION_APP_ID && NOTION_PARENT_PAGE_ID && NOTION_SECRET) {
  server.tool(
    "save-to-notion",
    "Save a page to Notion",
    saveToNotionSchema,
    saveToNotionHandler
  );
}

if (REACT_AGENT_APP_ID) {
  server.tool(
    "react-agent",
    "Agent that will work out how to solve the given task by searching Google, writing code and calling out to APIs",
    reactAgentSchema,
    reactAgentHandler
  );
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wordware MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
