import type { LockInfo } from "./types/terraform";
import { DurableObject } from "cloudflare:workers";

export class DurableState extends DurableObject {
	async lock(info: LockInfo): Promise<Boolean> {
		let currentLock: LockInfo = (await this.ctx.storage.get("lock")) || null;
		if (currentLock === null) {
			await this.ctx.storage.put("lock", info)
			return true
		} else {
			return false
		}
	}

	async unlock(info: LockInfo): Promise<Boolean> {
		let currentLock: LockInfo = (await this.ctx.storage.get("lock")) || null;
		if (currentLock.ID === info.ID) {
			await this.ctx.storage.delete("lock");
			return true
		} else {
			return false
		}
	}

	async getLockInfo(): Promise<LockInfo> {
		let currentLock: LockInfo = (await this.ctx.storage.get("lock")) || null;
		return currentLock;
	}
}