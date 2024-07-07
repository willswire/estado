import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
	Path,
} from "@cloudflare/itty-router-openapi";
import { Buffer } from 'node:buffer';

export class StateFetch extends OpenAPIRoute {
	static schema: OpenAPIRouteSchema = {
		tags: ["States"],
		summary: "Returns the current remote state from the durable storage. Doesn't support locking",
		parameters: {
			projectName: Path(String, {
				description: "Project name",
			}),
		},
		responses: {
			"200": {
				description: "Returns state file",
				content: {
					"application/json": {
						schema: {
							type: "object",
							additionalProperties: true,
						},
					},
				},
			},
			"204": {
				description: "State file does not exist"
			},
			"400": {
				description: "No project name specified",
				schema: {
					success: Boolean,
					error: String,
				},
			},
			"401": {
				description: "Invalid authentication credentials",
				schema: {
					success: Boolean,
					error: String,
				},	
			},
			"500": {
				description: "Unable to determine username",
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
		console.log("Handeling a state fetch...")
		// Retrieve the authorization details
		const authorization = request.headers.get("Authorization");

		if (!authorization) {
			return Response.json(
				{
					success: false,
					error: "No authentication information provided",
				},
				{
					status: 401,
				}
			);
		}

		const [basic, credentials] = authorization.split(" ");

		if (basic !== "Basic") {
			return Response.json(
				{
					success: false,
					error: "Only basic authentication is supported",
				},
				{
					status: 401,
				}
			);
		}

		const [username, password] = Buffer.from(credentials, "base64")
			.toString()
			.split(":");

		if (!username || username === "") {
			return Response.json(
				{
					success: false,
					error: "Username cannot be empty",
				},
				{
					status: 401,
				}
			);
		}

		if (!password || password === "") {
			return Response.json(
				{
					success: false,
					error: "Password cannot be empty",
				},
				{
					status: 401,
				}
			);
		}

		// Retrieve the validated slug
		const { projectName } = data.params;

		if (!projectName || projectName === "") {
			return Response.json(
				{
					success: false,
					error: "No project name specified",
				},
				{
					status: 400,
				}
			);
		}

		// Implement your own object fetch here
		const key: String = `${username}/${projectName}.tfstate`
		const state: R2ObjectBody = await env.TF_STATE_BUCKET.get(key);

		// @ts-ignore: check if the object exists
		if (state === null) {
			return new Response(null, {status: 204})
		}

		// Return the state JSON directly
		return new Response(await state.text(), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}
}
