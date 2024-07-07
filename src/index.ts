import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { StateCreate } from "./endpoints/stateCreate";
import { StateDelete } from "./endpoints/stateDelete";
import { StateFetch } from "./endpoints/stateFetch";
import { StateLock } from "./endpoints/stateLock";

export { DurableState } from "./durableState";

export const router = OpenAPIRouter({
	docs_url: "/",
});

router.get("/states/:projectName", StateFetch);
router.post("/states/:projectName", StateCreate);
router.delete("/states/:projectName", StateDelete);
router.all("/states/:projectName/lock", StateLock)

// 404 for everything else
router.all("*", () =>
	Response.json(
		{
			success: false,
			error: "Route not found",
		},
		{ status: 404 }
	)
);

export default {
	fetch: router.handle,
} satisfies ExportedHandler;
