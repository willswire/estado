import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
	Path,
} from "@cloudflare/itty-router-openapi";
import { State } from "../types";

export class StateDelete extends OpenAPIRoute {
	static schema: OpenAPIRouteSchema = {
		tags: ["States"],
		summary: "Delete a State",
		parameters: {
			stateSlug: Path(String, {
				description: "State slug",
			}),
		},
		responses: {
			"200": {
				description: "Returns if the state was deleted successfully",
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
		// Retrieve the validated slug
		const { stateSlug } = data.params;

		// Implement your own object deletion here

		// Return the deleted state for confirmation
		return {
			result: {
				state: {
					name: "Build something awesome with Cloudflare Workers",
					slug: stateSlug,
					description: "Lorem Ipsum",
					completed: true,
					due_date: "2022-12-24",
				},
			},
			success: true,
		};
	}
}
