import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
	Path,
} from "@cloudflare/itty-router-openapi";
import { State } from "../types";

export class StateFetch extends OpenAPIRoute {
	static schema: OpenAPIRouteSchema = {
		tags: ["States"],
		summary: "Get a single State by slug",
		parameters: {
			stateSlug: Path(String, {
				description: "State slug",
			}),
		},
		responses: {
			"200": {
				description: "Returns a single state if found",
				schema: {
					success: Boolean,
					result: {
						state: State,
					},
				},
			},
			"404": {
				description: "State not found",
				schema: {
					success: Boolean,
					error: String,
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
		// Retrieve the validated slug
		const { stateSlug } = data.params;

		// Implement your own object fetch here

		const exists = true;

		// @ts-ignore: check if the object exists
		if (exists === false) {
			return Response.json(
				{
					success: false,
					error: "Object not found",
				},
				{
					status: 404,
				}
			);
		}

		return {
			success: true,
			state: {
				name: "my state",
				slug: stateSlug,
				description: "this needs to be done",
				completed: false,
				due_date: new Date().toISOString().slice(0, 10),
			},
		};
	}
}
