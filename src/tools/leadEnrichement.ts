import { z } from "zod";
import { makeWordwareRequest } from "../utils/api.js";
import { LEAD_ENRICHMENT_APP_ID } from "../utils/env.js";

export const getLeadEnrichementHandler = async ({
  fullName,
  company,
  companyURL,
}: {
  fullName: string;
  company: string;
  companyURL: string;
}) => {
  const leadEnrichementAppId = LEAD_ENRICHMENT_APP_ID;
  let currentText = "";

  await makeWordwareRequest(
    leadEnrichementAppId,
    {
      inputs: {
        "Full Name": fullName,
        Company: company,
        CompanyURL: companyURL,
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

export const getLeadEnrichementSchema = {
  fullName: z.string().describe("Full name of the founder"),
  company: z.string().describe("Company name"),
  companyURL: z.string().describe("URL of the company"),
};
