import { z } from "zod";
import { makeWordwareRequest } from "../utils/api.js";
import { REACT_AGENT_APP_ID } from "../utils/env.js";
export const reactAgentHandler = async ({ question }: { question: string }) => {
  const reactAgentAppId = REACT_AGENT_APP_ID;
  let currentText = "";

  await makeWordwareRequest(
    reactAgentAppId,
    {
      inputs: {
        question: question,
      },
      version: "^1.0",
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

export const reactAgentSchema = {
  question: z.string().describe("Question to answer"),
};
