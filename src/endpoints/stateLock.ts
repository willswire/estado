import {
	OpenAPIRoute,
	OpenAPIRouteSchema,
	Path
} from "@cloudflare/itty-router-openapi";
import type { LockInfo } from "../types/terraform";
import { Buffer } from 'node:buffer';

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
					success: Boolean,
					content: {
						"application/json": {
							schema: {
								type: "object",
								additionalProperties: true,
							},
						},
					},
				},
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
			"405": {
				description: "Method not allowed",
				schema: {
					success: Boolean,
					error: String,
				},	
			},
			"423": {
				description: "State is currently locked",
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

		const key = `${username}/${projectName}.tfstate`
		const id = env.TF_STATE_LOCK.idFromName(key);
		const stub = env.TF_STATE_LOCK.get(id);
		const lockInfo: LockInfo = await stub.getLockInfo();
		const newLock = (await request.json()) as LockInfo || null;

		// set a isLocked flag? and do responses below the switch?
		switch (request.method) {
			case "GET":
				return new Response(
					JSON.stringify(lockInfo),
					{
						status: 200
					}
				)
			case "PUT":
			case "LOCK":
				if (await stub.lock(newLock)) {
					return Response.json(
						{
							success: true,
							error: "Acquired state lock",
						},
						{
							status: 200,
						}
					)
				} else {
					return Response.json(
						{
							success: false,
							error: "State is currently locked",
						},
						{
							status: 423,
						}
					)	
				}
			case "DELETE":
			case "UNLOCK":
				if (await stub.unlock(newLock)) {
					return Response.json(
						{
							success: true,
							error: "Deleted state lock",
						},
						{
							status: 200,
						}
					)
				} else {
					return Response.json(
						{
							success: false,
							error: "State is currently locked",
						},
						{
							status: 423,
						}
					)	
				}
			default:
				return Response.json(
					{
						success: false,
						error: "Method not allowed",
					},
					{
						status: 405,
					}
				);
		}
	}
}
