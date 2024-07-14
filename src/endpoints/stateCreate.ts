import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Path,
  Query,
} from "@cloudflare/itty-router-openapi";
import type { Env } from "../types/worker-configuration";

export class StateCreate extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["States"],
    summary: "Create or update the remote state.",
    parameters: {
      projectName: Path(String, {
        description: "Project name",
      }),
      ID: Query(String, {
        description: "The state lock identifier",
        required: false,
      }),
    },
    responses: {
      "200": {
        description: "State created or updated successfully",
        schema: {
          type: "string",
        },
      },
      "400": {
        description: "No project name specified",
        schema: {
          type: "string",
        },
      },
      "401": {
        description: "Invalid authentication credentials",
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
    data: { params: { projectName: string; ID?: string } },
  ) {
    const { projectName } = data.params;

    if (!projectName) {
      return new Response(null, { status: 400 });
    }

    const requestBody = await request.clone().text();

    if (!isValidJSON(requestBody)) {
      return new Response(null, { status: 415 });
    }

    const arrayBuffer = await request.arrayBuffer();

    const key = `${projectName}.tfstate`;
    await env.TF_STATE_BUCKET.put(key, arrayBuffer);

    console.log("Created or updated state data for", projectName);

    return new Response(null, { status: 200 });
  }
}

function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}
