import { z } from "zod";
import { makeWordwareRequest } from "../utils/api.js";
import { RESEARCH_FOUNDER_APP_ID } from "../utils/env.js";

// // Format alert data
// function formatAlert(feature: AlertFeature): string {
//   const props = feature.properties;
//   return [
//     `Event: ${props.event || "Unknown"}`,
//     `Area: ${props.areaDesc || "Unknown"}`,
//     `Severity: ${props.severity || "Unknown"}`,
//     `Status: ${props.status || "Unknown"}`,
//     `Headline: ${props.headline || "No headline"}`,
//     "---",
//   ].join("\n");
// }

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

  // ADD ERROR HANDLING LATER !

  // if (!researchFoundersData) {
  //   return {
  //     content: [
  //       {
  //         type: "text" as const,
  //         text: "Failed to retrieve alerts data",
  //       },
  //     ],
  //   };
  // }

  // const features = alertsData.features || [];
  // if (features.length === 0) {
  //   return {
  //     content: [
  //       {
  //         type: "text" as const,
  //         text: `No active alerts for ${stateCode}`,
  //       },
  //     ],
  //   };
  // }

  // const formattedAlerts = features.map(formatAlert);
  // const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join(
  //   "\n"
  // )}`;

  // return {
  //   content: [
  //     {
  //       type: "text" as const,
  //       text: alertsText,
  //     },
  //   ],
  // };
};

export const getResearchFoundersSchema = {
  fullName: z.string().describe("Full name of the founder"),
  company: z.string().describe("Company name"),
  url: z.string().describe("URL of the company"),
};
