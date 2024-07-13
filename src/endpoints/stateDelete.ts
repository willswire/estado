import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Path,
} from "@cloudflare/itty-router-openapi";

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
    env: any,
    context: any,
    data: Record<string, any>,
  ) {
    const { projectName } = data.params;

    if (!projectName) {
      return new Response("No project name specified", { status: 400 });
    }

    const key = `${projectName}.tfstate`;
    const id = env.TF_STATE_LOCK.idFromName(key);
    const stub = env.TF_STATE_LOCK.get(id);
    const lockInfo = await stub.getLockInfo();

    if (lockInfo) {
      console.log(`State is currently locked by ${lockInfo.ID}`);
      return new Response("State is currently locked", { status: 423 });
    }

    await stub.unlock();

    console.log("Unlocked state for", projectName);

    return new Response("State unlocked successfully");
  }
}
