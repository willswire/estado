// LockInfo stores lock metadata.
//
// Only operation and info are required to be set by the caller of Lock.
// Most callers should use newLockInfo to create a LockInfo value with many
// of the fields populated with suitable default values.
export interface LockInfo {
	// Unique ID for the lock. newLockInfo provides a random ID, but this may
	// be overridden by the lock implementation. The final value of ID will be
	// returned by the call to Lock.
	ID: string;

	// Terraform operation, provided by the caller.
	operation: string;

	// Extra information to store with the lock, provided by the caller.
	info: string;

	// user@hostname when available
	who: string;

	// Terraform version
	version: string;

	// Time that the lock was taken.
	created: Date;

	// Path to the state file when applicable. Set by the Lock implementation.
	path: string;
}