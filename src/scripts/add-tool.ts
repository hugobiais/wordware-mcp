import inquirer from "inquirer";
import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";
import { OPENAI_API_KEY } from "../utils/env.js";

// Add check for OpenAI API key
if (!OPENAI_API_KEY) {
  console.log("❌ OPENAI_API_KEY is not defined.");
  console.log("Please add it to the env.ts file and try again.");
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function generateTool() {
  // First check if deployed
  const { isDeployed } = await inquirer.prompt([
    {
      type: "confirm",
      name: "isDeployed",
      message: "Have you deployed the flow on Wordware?",
    },
  ]);

  if (!isDeployed) {
    console.log(
      "❌ Please deploy your flow on Wordware first, then come back to generate the tool."
    );
    process.exit(0);
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Tool name (must follow format like 'research-founder'):",
      validate: (input) => {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input)) {
          return "Tool name must be in kebab-case format (e.g., research-founder)";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "description",
      message: "Tool description:",
      validate: (input) => input.length > 0,
    },
    {
      type: "input",
      name: "deploymentUrl",
      message: "Deployment URL from Wordware:",
      validate: (input) => {
        const urlPattern =
          /^https:\/\/app\.wordware\.ai\/api\/released-app\/[\w-]+\/run$/;
        if (!urlPattern.test(input)) {
          return "Invalid deployment URL format";
        }
        return true;
      },
    },
    {
      type: "editor",
      name: "schemaJson",
      message: "Complete Body schema from deployment page:",
      validate: (input) => {
        try {
          const parsed = JSON.parse(input);
          if (!parsed.inputs || !parsed.version) {
            return "JSON must contain inputs and version fields";
          }
          return true;
        } catch (e) {
          return "Invalid JSON format";
        }
      },
    },
  ]);

  // Convert kebab-case to camelCase for variable names
  const varName = answers.name.replace(/-([a-z])/g, (g: string) =>
    g[1].toUpperCase()
  );

  // Extract appId from deployment URL
  const appId = answers.deploymentUrl
    .split("/released-app/")[1]
    .split("/run")[0];

  // Parse schema data to get version and inputs
  const schemaData = JSON.parse(answers.schemaJson);
  const version = schemaData.version;
  const zodSchema = await generateZodSchema(
    schemaData.inputs,
    answers.name,
    answers.description
  );

  // Generate the tool file
  const toolTemplate = `import { z } from "zod";
import { makeWordwareRequest } from "../utils/api.js";

export const ${varName}Handler = async (inputs: any) => {
  const ${varName}AppId = "${appId}";
  let currentText = "";

  await makeWordwareRequest(
    ${varName}AppId,
    {
      inputs,
      version: "${version}",
    },
    (content) => {
      const value = content.value;
      if (value.type === "chunk") {
        currentText += value.value || "";
      }
    }
  );

  return {
    content: [
      {
        type: "text" as const,
        text: currentText || "No response generated",
      },
    ],
  };
};

export const ${varName}Schema = ${zodSchema};
`;

  // Read the current index.ts file
  const indexPath = path.join(process.cwd(), "src", "index.ts");
  let indexContent = await fs.readFile(indexPath, "utf-8");

  // Add import statement after the last import
  const importStatement = `import { ${varName}Handler, ${varName}Schema } from "./tools/${varName}.js";\n`;
  const lastImportIndex = indexContent.lastIndexOf("import");
  const lastImportLineEnd = indexContent.indexOf("\n", lastImportIndex) + 1;
  indexContent =
    indexContent.slice(0, lastImportLineEnd) +
    importStatement +
    indexContent.slice(lastImportLineEnd);

  // Add tool registration before the server start
  const toolRegistration = `\nserver.tool("${answers.name}", "${answers.description}", ${varName}Schema, ${varName}Handler);\n`;
  const serverStartIndex = indexContent.indexOf("// Start the server");
  indexContent =
    indexContent.slice(0, serverStartIndex) +
    toolRegistration +
    indexContent.slice(serverStartIndex);

  // Write the files
  const toolsDir = path.join(process.cwd(), "src", "tools");
  await fs.writeFile(path.join(toolsDir, `${varName}.ts`), toolTemplate);
  await fs.writeFile(indexPath, indexContent);

  console.log(`✅ Generated tool ${answers.name}`);
  console.log(`   - Created src/tools/${varName}.ts`);
  console.log("   - Updated src/index.ts");

  // Run build command
  console.log("\nBuilding server...");
  const { exec } = await import("child_process");

  exec("npm run build-server", (error, stdout, stderr) => {
    if (error) {
      console.error("❌ Error building server:", error);
      return;
    }
    console.log("✅ Server built successfully");
    console.log(
      "\n🎉 Your new tool should now be available in Claude! Try it out! (if you don't see it, make sure to close the Desktop app and reopen it)"
    );
  });
}

async function generateZodSchema(
  inputs: Record<string, string>,
  toolName: string,
  toolDescription: string
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a TypeScript expert that generates JSON Zod schemas. Return a JSON object where each key matches the input keys, and values are Zod string schemas with descriptions. Example:
        {
          "fullName": "z.string().describe('Full name of the founder')",
          "company": "z.string().describe('Company name')",
          "url": "z.string().describe('URL of the company')"
        }`,
      },
      {
        role: "user",
        content: `Generate a Zod schema for these inputs: ${JSON.stringify(
          inputs
        )} given the tool name: "${toolName}" and the tool description: "${toolDescription}"`,
      },
    ],
  });

  try {
    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content received from OpenAI");

    const result = JSON.parse(content);

    // Validate the response format
    if (
      typeof result !== "object" ||
      Object.keys(inputs).some((key) => !result[key])
    ) {
      throw new Error("Invalid schema format received from OpenAI");
    }

    return `{\n${Object.entries(result)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join(",\n")}\n}`;
  } catch (error) {
    console.error("Error processing OpenAI response:", error);
    throw new Error("Failed to generate schema");
  }
}

generateTool().catch(console.error);
