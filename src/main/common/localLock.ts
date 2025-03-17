class NodeLock {
  private resourceName: { [key: string]: string } = {};
  constructor() {}

  public async acquire(key?: string): Promise<boolean> {
    const lockAcquiredStartime = new Date().getTime();
    console.log("acquiring Lock ::: ", key ?? "LOCK");
    return await new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        let lockAcquiredTemp = this.tryAcquireLock(key ?? "LOCK");
        if (lockAcquiredTemp) {
          clearInterval(interval);
          console.log(
            "lockAcquired ::: ",
            new Date().getTime() - lockAcquiredStartime,
            " ms",
            this.resourceName[key ?? "LOCK"],
            key ?? "LOCK"
          );
          resolve(true);
        }
        if (new Date().getTime() - lockAcquiredStartime > 5000) {
          clearInterval(interval);
          reject(new Error("Unable to acquire lock" + key ?? "LOCK" + " ::: " + this.resourceName[key ?? "LOCK"]));
        }
      }, 20);
    });
  }

  private tryAcquireLock(key: string): boolean {
    if (this.resourceName[key]) {
      return false;
    }
    this.resourceName[key] = "LOCK";
    return true; // Replace this with actual lock acquisition logic
  }

  public releaseLock(key = "LOCK") {
    console.log("releasing Lock ::: ", this.resourceName[key], key);
    if (this.resourceName[key]) {
      this.resourceName[key] = "";
      console.log("Lock released ::: ", this.resourceName[key], key);
      return true;
    }
    console.log("Lock not released ::: ", this.resourceName[key], key);
    return false;
  }
}

const lock = new NodeLock();
export const acquireNodeLock = async (key?: string) => await lock.acquire(key);
export const releaseNodeLock = (key?: string) => lock.releaseLock(key);

// (async () => {
//   console.log("acquireNodeLock ::: ", await acquireNodeLock());
//   setTimeout(() => {
//     console.log("releaseNodeLock ::: ", releaseNodeLock());
//   }, 5000);
// } )();
