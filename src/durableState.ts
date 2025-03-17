import type { LockInfo } from "./types/terraform";
import { DurableObject } from "cloudflare:workers";

export class DurableState extends DurableObject {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle lock info request
    if (request.method === "GET" && url.pathname === "/lock") {
      const lockInfo = await this.getLockInfo();
      return new Response(JSON.stringify(lockInfo), {
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Handle lock request
    if (request.method === "POST" && url.pathname === "/lock") {
      const info = await request.json() as LockInfo;
      const result = await this.lock(info);
      return new Response(null, { 
        status: result ? 200 : 423 
      });
    }
    
    // Handle unlock request
    if (request.method === "POST" && url.pathname === "/unlock") {
      const info = await request.json() as LockInfo;
      const result = await this.unlock(info);
      return new Response(null, { 
        status: result ? 200 : 423 
      });
    }
    
    return new Response("Not found", { status: 404 });
  }

  async lock(info: LockInfo): Promise<boolean> {
    const currentLock: LockInfo =
      ((await this.ctx.storage.get("lock")) as LockInfo) || null;
    if (currentLock === null) {
      await this.ctx.storage.put("lock", info);
      console.log("State locked successfully by", info.ID);
      return true;
    } else {
      console.log(
        "Lock attempt failed: state is already locked by",
        currentLock.ID,
      );
      return false;
    }
  }

  async unlock(info: LockInfo): Promise<boolean> {
    const currentLock: LockInfo =
      ((await this.ctx.storage.get("lock")) as LockInfo) || null;
    if (currentLock && currentLock.ID === info.ID) {
      await this.ctx.storage.delete("lock");
      console.log("State unlocked successfully by", info.ID);
      return true;
    } else {
      console.log(
        "Unlock attempt failed: state is locked by",
        currentLock ? currentLock.ID : "none",
      );
      return false;
    }
  }

  async getLockInfo(): Promise<LockInfo> {
    const currentLock: LockInfo =
      ((await this.ctx.storage.get("lock")) as LockInfo) || null;
    console.log("Current lock info:", currentLock);
    return currentLock;
  }
}
