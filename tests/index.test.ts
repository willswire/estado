import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { describe, it, expect, afterAll } from "vitest";
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

  describe("stateFetch endpoint", () => {
    it("should fetch the state successfully", async () => {
      const request = new IncomingRequest("http://example.com/myproject", {
        method: "GET",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(JSON.parse(mockState));
    });

    it("should return 404 if no project name specified", async () => {
      const request = new IncomingRequest("http://example.com/", {
        method: "GET",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(404);
    });

    it("should return 204 if state does not exist", async () => {
      const request = new IncomingRequest("http://example.com/none", {
        method: "GET",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(204);
    });
  });

  describe("stateLock endpoint", () => {
    it("should lock state successfully with LOCK", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "LOCK",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
    });

    it("should return 423 if state is already locked", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "LOCK",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx); // Second lock attempt
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(423);
    });

    it("should return valid lock info", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "GET",
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(await response.json()).toEqual(JSON.parse(mockLockInfo));
    });

    it("should unlock state successfully with UNLOCK", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "UNLOCK",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx); // Then unlock
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
    });

    it("should lock state successfully with PUT", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "PUT",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
    });

    it("should unlock state successfully with DELETE", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "DELETE",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx); // Then unlock
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
    });

    it("should return 400 if no lock info provided", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "LOCK",
        body: null,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(400);
    });

    it("should return 423 if unlock is attempted with incorrect lock info", async () => {
      const lockRequest = new IncomingRequest(
        "http://example.com/myproject/lock",
        {
          method: "LOCK",
          body: mockLockInfo,
          headers: { "Content-Type": "application/json" },
        },
      );

      const incorrectUnlockRequest = new IncomingRequest(
        "http://example.com/myproject/lock",
        {
          method: "UNLOCK",
          body: JSON.stringify({ ...JSON.parse(mockLockInfo), ID: "wrong-id" }),
          headers: { "Content-Type": "application/json" },
        },
      );

      const ctx = createExecutionContext();
      const lockResponse = await worker.fetch(lockRequest, env, ctx); // Lock state first
      const unlockResponse = await worker.fetch(
        incorrectUnlockRequest,
        env,
        ctx,
      ); // Attempt to unlock with incorrect info
      await waitOnExecutionContext(ctx);

      expect(lockResponse.status).toBe(200);
      expect(unlockResponse.status).toBe(423);
    });

    it("should return 405 for unallowed methods", async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "POST",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx);
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(405);
    });

    afterAll(async () => {
      const request = new IncomingRequest("http://example.com/myproject/lock", {
        method: "UNLOCK",
        body: mockLockInfo,
        headers: { "Content-Type": "application/json" },
      });

      const ctx = createExecutionContext();
      const response = await worker.fetch(request, env, ctx); // Then unlock
      await waitOnExecutionContext(ctx);

      expect(response.status).toBe(200);
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
