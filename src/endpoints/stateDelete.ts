import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Path,
} from "@cloudflare/itty-router-openapi";
import type { Env } from "../types/worker-configuration";

export class StateDelete extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["States"],
    summary: "Delete the remote state.",
    parameters: {
      projectName: Path(String, {
        description: "Project name",
      }),
    },
    responses: {
      "200": {
        description: "State deleted successfully",
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
      "423": {
        description: "State is currently locked",
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
    const key = `${projectName}.tfstate`;
    const id = env.TF_STATE_LOCK.idFromName(key);
    const stub = env.TF_STATE_LOCK.get(id);
    const lockInfo = await stub.getLockInfo();

    if (lockInfo) {
      console.log(`State is currently locked by ${lockInfo.ID}`);
      return new Response(null, { status: 423 });
    }

    await stub.unlock();

    console.log("Unlocked state for", projectName);

    return new Response(null, { status: 200 });
  }
}
