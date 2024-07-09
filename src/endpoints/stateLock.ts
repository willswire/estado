// stateLock.ts
import {
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path
} from "@cloudflare/itty-router-openapi";
import type { LockInfo } from "../types/terraform";
import { checkAuthorization, createResponse, getRequestData } from '../utils';

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
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        error: { type: "string", nullable: true },
                    }
                }
            },
            "400": {
                description: "No project name specified",
                schema: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        error: { type: "string" },
                    }
                }
            },
            "401": {
                description: "Invalid authentication credentials",
                schema: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        error: { type: "string" },
                    }
                }
            },
            "405": {
                description: "Method not allowed",
                schema: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        error: { type: "string" },
                    }
                }
            },
            "423": {
                description: "State is currently locked",
                schema: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        error: { type: "string" },
                    }
                }
            },
            "500": {
                description: "Unable to determine username",
                schema: {
                    type: "object",
                    properties: {
                        success: { type: "boolean" },
                        error: { type: "string" },
                    }
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
            return createResponse(false, 401, "Invalid authentication credentials");
        }

        const { username } = auth;
        const { projectName } = data.params;

        if (!projectName) {
            return createResponse(false, 400, "No project name specified");
        }

        const key = `${username}/${projectName}.tfstate`;
        const id = env.TF_STATE_LOCK.idFromName(key);
        const stub = env.TF_STATE_LOCK.get(id);
        const lockInfo: LockInfo = await stub.getLockInfo();
        const newLock = await getRequestData(request) as LockInfo || null;

        switch (request.method) {
            case "GET":
                return new Response(
                    JSON.stringify(lockInfo),
                    { status: 200 }
                );
            case "PUT":
            case "LOCK":
                if (await stub.lock(newLock)) {
                    return createResponse(true, 200, "Acquired state lock");
                } else {
                    return createResponse(false, 423, "State is currently locked");
                }
            case "DELETE":
            case "UNLOCK":
                if (await stub.unlock(newLock)) {
                    return createResponse(true, 200, "Deleted state lock");
                } else {
                    return createResponse(false, 423, "State is currently locked");
                }
            default:
                return createResponse(false, 405, "Method not allowed");
        }
    }
}