import { handleChatRequest, handleHealthRequest } from "../../server.mjs";

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  };
}

export default async function handler(event) {
  const route = event.queryStringParameters?.path || "";
  const normalizedRoute = `/${String(route).replace(/^\/+/, "")}`;

  try {
    if (event.httpMethod === "GET" && normalizedRoute === "/health") {
      return json(200, await handleHealthRequest());
    }

    if (event.httpMethod === "POST" && normalizedRoute === "/chat") {
      const payload = event.body ? JSON.parse(event.body) : {};
      return json(200, await handleChatRequest(payload));
    }

    return {
      statusCode: 405,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
      body: "Method not allowed",
    };
  } catch (error) {
    console.error(error);
    return json(500, {
      error: error instanceof Error ? error.message : "Er ging iets mis op de server.",
    });
  }
}
