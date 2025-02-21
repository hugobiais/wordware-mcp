import { z } from "zod";
import { makeWordwareRequest } from "../utils/api.js";
import { RESEARCH_FOUNDER_APP_ID } from "../utils/env.js";

export const getResearchFoundersHandler = async ({
  fullName,
  company,
  url,
}: {
  fullName: string;
  company: string;
  url: string;
}) => {
  const researchFoundersAppId = RESEARCH_FOUNDER_APP_ID;
  let currentText = "";

  await makeWordwareRequest(
    researchFoundersAppId,
    {
      inputs: {
        "Full Name": fullName,
        Company: company,
        URL: url,
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

export const getResearchFoundersSchema = {
  fullName: z.string().describe("Full name of the founder"),
  company: z.string().describe("Company name"),
  url: z.string().describe("URL of the company"),
};
