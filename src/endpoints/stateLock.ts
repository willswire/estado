import {
  OpenAPIRoute,
  OpenAPIRouteSchema,
  Path,
} from "@cloudflare/itty-router-openapi";
import type { LockInfo } from "../types/terraform";
import type { Env } from "../types/worker-configuration";
import { DurableState } from "../durableState";

export class StateLock extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["States"],
    summary: "Lock or Unlock the remote state for edits.",
    parameters: {
      projectName: Path(String, {
        description: "Project name",
      }),
    },
    responses: {
      "200": {
        description: "Returns if the state was locked successfully",
        schema: { type: "string" },
      },
      "400": {
        description: "No project name specified",
        schema: { type: "string" },
      },
      "405": {
        description: "Method not allowed",
        schema: { type: "string" },
      },
      "423": {
        description: "State is currently locked",
        schema: { type: "string" },
      },
      "500": {
        description: "Unable to determine username",
        schema: { type: "string" },
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

    if (request.method === "GET") {
      const response = await stub.fetch("http://internal/lock");
      const lockInfo = await response.json() as LockInfo;
      return new Response(JSON.stringify(lockInfo), { status: 200 });
    }

    let requestBody = await request.clone().text();

    if (!isValidJSON(requestBody)) {
      return new Response(null, { status: 400 });
    }

    const newLock = (await request.json()) as LockInfo;

    switch (request.method) {
      case "PUT":
      case "LOCK":
        const lockResponse = await stub.fetch("http://internal/lock", {
          method: "POST",
          body: JSON.stringify(newLock)
        });
        if (lockResponse.status === 200) {
          return new Response(null, { status: 200 });
        } else {
          return new Response(null, { status: 423 });
        }
      case "DELETE":
      case "UNLOCK":
        const unlockResponse = await stub.fetch("http://internal/unlock", {
          method: "POST",
          body: JSON.stringify(newLock)
        });
        if (unlockResponse.status === 200) {
          return new Response(null, { status: 200 });
        } else {
          return new Response(null, { status: 423 });
        }
      default:
        return new Response(null, { status: 405 });
    }
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
