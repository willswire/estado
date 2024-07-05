import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
} from "@cloudflare/itty-router-openapi";
import { State } from "../types";

export class StateCreate extends OpenAPIRoute {
	static schema: OpenAPIRouteSchema = {
		tags: ["States"],
		summary: "Create a new State",
		requestBody: State,
		responses: {
			"200": {
				description: "Returns the created state",
				schema: {
					success: Boolean,
					result: {
						state: State,
					},
				},
			},
		},
	};

	async handle(
		request: Request,
		env: any,
		context: any,
		data: Record<string, any>
	) {
		// Retrieve the validated request body
		const stateToCreate = data.body;

		// Implement your own object insertion here

		// return the new state
		return {
			success: true,
			state: {
				name: stateToCreate.name,
				slug: stateToCreate.slug,
				description: stateToCreate.description,
				completed: stateToCreate.completed,
				due_date: stateToCreate.due_date,
			},
		};
	}
}
