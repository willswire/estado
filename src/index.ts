import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { StateCreate } from "./endpoints/stateCreate";
import { StateDelete } from "./endpoints/stateDelete";
import { StateFetch } from "./endpoints/stateFetch";
import { StateLock } from "./endpoints/stateLock";
import { DurableState } from "./durableState";

export { DurableState };

export const router = OpenAPIRouter({
  docs_url: "/docs",
});

router.all("*", (request: Request) => {
  console.log(`Received request: ${request.method} ${request.url}`);
});

router.get("/:projectName", StateFetch);
router.post("/:projectName", StateCreate);
router.delete("/:projectName", StateDelete);
router.all("/:projectName/lock", StateLock);

router.all("*", () =>
  Response.json(
    {
      success: false,
      error: "Route not found",
    },
    { status: 404 },
  ),
);

export default {
  fetch: router.handle,
} satisfies ExportedHandler;
