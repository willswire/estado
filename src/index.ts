import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { StateCreate } from "./endpoints/stateCreate";
import { StateDelete } from "./endpoints/stateDelete";
import { StateFetch } from "./endpoints/stateFetch";
import { StateLock } from "./endpoints/stateLock";
import { DurableState } from "./durableState";

export { DurableState };

export const router = OpenAPIRouter({
    docs_url: "/",
});

router.all("*", (request) => {
    console.log(`Received request: ${request.method} ${request.url}`);
});

router.get("/states/:projectName", StateFetch);
router.post("/states/:projectName", StateCreate);
router.delete("/states/:projectName", StateDelete);
router.all("/states/:projectName/lock", StateLock);

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