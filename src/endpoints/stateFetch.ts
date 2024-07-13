import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Path,
} from "@cloudflare/itty-router-openapi";
import type { Env } from "../types/worker-configuration";

export class StateFetch extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["States"],
    summary: "Fetch the remote state.",
    parameters: {
      projectName: Path(String, {
        description: "Project name",
      }),
    },
    responses: {
      "200": {
        description: "Returns the state data",
        schema: {
          type: "object",
          additionalProperties: true,
        },
      },
      "400": {
        description: "No project name specified",
        schema: {
          type: "string",
        },
      },
    },
  };

  async handle(
    request: Request,
    env: Env,
    context: ExecutionContext,
    data: { params: { projectName: string } },
  ) {
    const { projectName } = data.params;

    if (!projectName) {
      return new Response("No project name specified", { status: 400 });
    }

    // Implement your own object fetch here
    const key: string = `${projectName}.tfstate`;
    const state: R2ObjectBody = await env.TF_STATE_BUCKET.get(key);

    if (state === null) {
      return new Response(null, { status: 204 });
    }

    console.log("Fetched state data for", projectName);

    // Return the state JSON directly
    return new Response(await state.text(), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
