// stateCreate.ts
import {
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path,
	Query
} from "@cloudflare/itty-router-openapi";
import { checkAuthorization, createResponse, getRequestData } from '../utils';

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
				required: false
			})
        },
        responses: {
            "200": {
                description: "State created or updated successfully",
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

        const requestData = await request.arrayBuffer();
        if (!requestData) {
            return createResponse(false, 400, "Invalid request data");
        }

		const key = `${username}/${projectName}.tfstate`
		await env.TF_STATE_BUCKET.put(key, requestData);

        console.log("Created or updated state data for", projectName);

        return createResponse(true, 200, "State created or updated successfully");
    }
}