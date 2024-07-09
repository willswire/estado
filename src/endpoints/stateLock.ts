// stateLock.ts
import {
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path
} from "@cloudflare/itty-router-openapi";
import type { LockInfo } from "../types/terraform";
import { checkAuthorization } from '../utils';

export class StateLock extends OpenAPIRoute {
    static schema: OpenAPIRouteSchema = {
        tags: ["States"],
        summary: "Lock or Unlock the remote state for edits.",
        parameters: {
            projectName: Path(String, {
                description: "Project name",
            })
        },
        responses: {
            "200": {
                description: "Returns if the state was locked successfully",
                schema: {
                    type: "string"
                }
            },
            "400": {
                description: "No project name specified",
                schema: {
                    type: "string"
                }
            },
            "401": {
                description: "Invalid authentication credentials",
                schema: {
                    type: "string"
                }
            },
            "405": {
                description: "Method not allowed",
                schema: {
                    type: "string"
                }
            },
            "423": {
                description: "State is currently locked",
                schema: {
                    type: "string"
                }
            },
            "500": {
                description: "Unable to determine username",
                schema: {
                    type: "string"
                }
            }
        }
    };

    async handle(
        request: Request,
        env: any,
        context: any,
        data: Record<string, any>
    ) {
        const auth = checkAuthorization(request);
        if (!auth) {
            return new Response("Invalid authentication credentials", {status: 401})
        }

        const { username } = auth;
        const { projectName } = data.params;

        if (!projectName) {
            return new Response("No project name specified", {status: 400})
        }

        const key = `${username}/${projectName}.tfstate`;
        const id = env.TF_STATE_LOCK.idFromName(key);
        const stub = env.TF_STATE_LOCK.get(id);
        const lockInfo: LockInfo = await stub.getLockInfo();
        const newLock = await request.json() as LockInfo || null;

        switch (request.method) {
            case "GET":
                return new Response(
                    JSON.stringify(lockInfo),
                    { status: 200 }
                );
            case "PUT":
            case "LOCK":
                if (await stub.lock(newLock)) {
                    return new Response("Acquired state lock")
                } else {
                    return new Response("State is currently locked", {status: 423})
                }
            case "DELETE":
            case "UNLOCK":
                if (await stub.unlock(newLock)) {
                    return new Response("Unlocked state")
                } else {
                    return new Response("State is currently locked", {status: 423})
                }
            default:
                return new Response("Method not allowed", {status: 405})
        }
    }
}