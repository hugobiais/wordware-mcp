import { z } from "zod";
import { makeWordwareRequest } from "../utils/api.js";
import {
  NOTION_PARENT_PAGE_ID,
  NOTION_SECRET,
  SAVE_TO_NOTION_APP_ID,
} from "../utils/env.js";

export const saveToNotionHandler = async ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => {
  const notion_secret = NOTION_SECRET;
  const notion_parent_page_id = NOTION_PARENT_PAGE_ID;

  const saveToNotionAppId = SAVE_TO_NOTION_APP_ID;
  let currentText = "";

  await makeWordwareRequest(
    saveToNotionAppId,
    {
      inputs: {
        title: title,
        body: body,
        NOTION_SECRET: notion_secret,
        NOTION_PARENT_PAGE_ID: notion_parent_page_id,
      },
      version: "^2.0",
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

export const saveToNotionSchema = {
  title: z.string().describe("Title of the page"),
  body: z.string().describe("Markdown content of the page"),
};
