// stateCreate.ts
import {
    OpenAPIRoute,
    OpenAPIRouteSchema,
    Path,
	Query
} from "@cloudflare/itty-router-openapi";
import { checkAuthorization } from '../utils';

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
            return new Response("Invalid authentication credentials", {status: 401});
        }

        const { username } = auth;
        const { projectName } = data.params;

        if (!projectName) {
            return new Response("No project name specified", {status: 400});
        }

        const requestData = await request.arrayBuffer();
        if (!requestData) {
            return new Response("Invalid request data", {status: 400});
        }

		const key = `${username}/${projectName}.tfstate`
		await env.TF_STATE_BUCKET.put(key, requestData);

        console.log("Created or updated state data for", projectName);

        return new Response("State created or updated successfully");
    }
}