// durableState.ts
import type { LockInfo } from "./types/terraform";
import { DurableObject } from "cloudflare:workers";

export class DurableState extends DurableObject {
    async lock(info: LockInfo): Promise<Boolean> {
        const currentLock: LockInfo = await this.ctx.storage.get("lock") || null;
        if (currentLock === null) {
            await this.ctx.storage.put("lock", info);
            console.log("State locked successfully by", info.ID);
            return true;
        } else {
            console.log("Lock attempt failed: state is already locked by", currentLock.ID);
            return false;
        }
    }

    async unlock(info: LockInfo): Promise<Boolean> {
        const currentLock: LockInfo = await this.ctx.storage.get("lock") || null;
        if (currentLock && currentLock.ID === info.ID) {
            await this.ctx.storage.delete("lock");
            console.log("State unlocked successfully by", info.ID);
            return true;
        } else {
            console.log("Unlock attempt failed: state is locked by", currentLock ? currentLock.ID : "none");
            return false;
        }
    }

    async getLockInfo(): Promise<LockInfo> {
        const currentLock: LockInfo = await this.ctx.storage.get("lock") || null;
        console.log("Current lock info:", currentLock);
        return currentLock;
    }
}