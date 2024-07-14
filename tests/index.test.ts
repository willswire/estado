import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, beforeEach } from "vitest";
import worker from "../src";
import mockStateFile from "./terraform/terraform.json";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Estado Worker", () => {
  const mockState = JSON.stringify(mockStateFile);
  const mockLockInfo = JSON.stringify({
    ID: "mock-lock-id",
    operation: "apply",
    info: "Mock lock info for testing",
    who: "user@hostname",
    version: "0.14.0",
    created: new Date(), // Current date and time
    path: "/mock/path/to/statefile.tfstate",
  });

  describe("stateCreate endpoint", () => {
    it("should create or update state successfully", async () => {
      const request = new IncomingRequest("http://example.com/myproject", {
        method: "POST",
        body: mockState,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
    });

    it("should return 400 if no project name specified", async () => {
      const request = new IncomingRequest("http://example.com/", {
        method: "POST",
        body: mockState,
        headers: { "Content-Type": "application/json" },
      });
      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });

    it("should return 415 if invalid request data", async () => {
      const request = new IncomingRequest("http://example.com/myproject", {
        method: "POST",
        body: null,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(415);
    });
  });

  describe("stateDelete endpoint", () => {
    it("should delete state successfully", async () => {
      const request = new IncomingRequest("http://example.com/myproject", {
        method: "DELETE",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
    });

    it("should return 400 if no project name specified", async () => {
      const request = new IncomingRequest("http://example.com/", {
        method: "DELETE",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });

    it("should return 423 if state is currently locked", async () => {
      const lockRequest = new IncomingRequest(
        "http://example.com/myproject/lock",
        {
          method: "LOCK",
          body: mockLockInfo,
        },
      );

      const deleteRequest = new IncomingRequest(
        "http://example.com/myproject",
        {
          method: "DELETE",
        },
      );

      const ctx = createExecutionContext();
      const lockResponse = await worker.fetch(lockRequest, env, ctx);
      const deleteResponse = await worker.fetch(deleteRequest, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(lockResponse.status).toBe(200);
      expect(deleteResponse.status).toBe(423);
    });
  });
});
