const WORDWARE_API_KEY =
  "ww-Df9Nl5BUttHFs2Bwv1vFAgz1FTBtr3jEoJxwg2CmW491iNq88lLLmk";

export type StreamCallback = (content: any) => void;

// Helper function for making Wordware API requests
export async function makeWordwareRequest<T>(
  appId: string,
  body: any,
  onStream?: StreamCallback
): Promise<T | null> {
  try {
    const url = `https://app.wordware.ai/api/released-app/${appId}/run`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WORDWARE_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (onStream) {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer: string[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (let i = 0; i < chunk.length; i++) {
            if (chunk[i] === "\n") {
              const line = buffer.join("").trim();
              if (line) {
                const content = JSON.parse(line);
                onStream(content);
              }
              buffer = [];
            } else {
              buffer.push(chunk[i]);
            }
          }
        }
        return null;
      } finally {
        reader.releaseLock();
      }
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Error making Wordware request:", error);
    return null;
  }
}
