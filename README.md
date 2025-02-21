# Wordware MCP Server

A Model Context Protocol (MCP) server implementation that enables integration of your Wordware deployed flows as tools that can be used directly within Claude conversations.

## Features

- Integration with Claude via MCP
- Support for basic Wordware tools including:
  - Research Founder: Comprehensive founder analysis and meeting prep
  - Lead Enrichment: Sales prospect research and intelligence
  - Save to Notion: Direct page saving to Notion
  - React Agent: Task solving with Google search and API capabilities

## Setup

### 1. Modify the `env.example.ts` file in the root directory to set it to `env.ts` and set the variables inside:

Using a regular `.env` file seemed to complicated considering you would also need to make those variables accessible from the server's environment (inside the Claude Desktop config). Come back to this if you find a better solution.

- `OPENAI_API_KEY`: Your OpenAI API key (used in `add-tool.ts` to generate a zod schema from the given information about the Wordware flow)
- `NOTION_SECRET`: Your Notion secret
- `NOTION_PARENT_PAGE_ID`: The ID of the Notion page to save to
- `SAVE_TO_NOTION_APP_ID`: The ID of your deployed Save to Notion app
- `RESEARCH_FOUNDER_APP_ID`: The ID of your deployed Research Founder app
- `LEAD_ENRICHMENT_APP_ID`: The ID of your deployed Lead Enrichment app
- `REACT_AGENT_APP_ID`: The ID of your deployed React Agent app

To setup Notion for the `saveToNotion` tool, follow the instructions [here](https://wordware.notion.site/How-to-save-to-your-own-Notion-page-419ed6ddad64412ca58b2e5bfb0a8d4a)

If you don't want to use one of the 4 tools, you can just leave its corresponding env variable empty and the tool will not be registered.

### 2. Install dependencies and build the server:

```bash
npm install
npm run build-server
```

### 3. Testing the server with Claude for Desktop

You need to have Claude for Desktop installed to test the server. If you do, you need to modify the config file to use the MCP server. Run the following command to open the config file (if you use VSCode):

```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Then, add the following to the file (make sure to replace `/ABSOLUTE/PATH/TO/PARENT/FOLDER/wordware/build/index.js` with the absolute path to the `index.js` file in the `build` folder of this repository):

```json
{
  "mcpServers": {
    "wordware": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/PARENT/FOLDER/wordware/build/index.js"]
    }
  }
}
```

### 4. Using the `add-tool` command (optional but recommended)

Note: The `add-tool` command has only been tested on a few simple Wordware flows. Since it relies on OpenAI to generate the schema, please make sure to verify the output of the tool before using it.

To run the tool:

```bash
npm run add-tool
```

## Future Improvements

### Dynamic Tool Configuration

Currently, the tools are hardcoded in the server implementation. Future improvements should focus on:

- Implement authentication with Wordware API
- Add capability to fetch user's deployments automatically
- Figure out which deployments can be added as MCP tools automatically
- Better support for complex blocks (e.g. "ask a Human" blocks)
