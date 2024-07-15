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
    const stub = env.TF_STATE_LOCK.get(id) as unknown as DurableState; // Casting to DurableState

    if (request.method === "GET") {
      const lockInfo: LockInfo = await stub.getLockInfo();
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
        if (await stub.lock(newLock)) {
          return new Response(null, { status: 200 });
        } else {
          return new Response(null, { status: 423 });
        }
      case "DELETE":
      case "UNLOCK":
        if (await stub.unlock(newLock)) {
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
