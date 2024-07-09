// stateDelete.ts
import {
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path
} from "@cloudflare/itty-router-openapi";
import { checkAuthorization, createResponse } from '../utils';

export class StateDelete extends OpenAPIRoute {
    static schema: OpenAPIRouteSchema = {
        tags: ["States"],
        summary: "Delete the remote state.",
        parameters: {
            projectName: Path(String, {
                description: "Project name",
            })
        },
        responses: {
            "200": {
                description: "State deleted successfully",
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
            "423": {
                description: "State is currently locked",
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
        const lockInfo = await stub.getLockInfo();

        if (lockInfo) {
            console.log(`State is currently locked by ${lockInfo.ID}`);
            return createResponse(false, 423, "State is currently locked");
        }

        await stub.delete();

        console.log("Deleted state data for", projectName);

        return createResponse(true, 200, "State deleted successfully");
    }
}