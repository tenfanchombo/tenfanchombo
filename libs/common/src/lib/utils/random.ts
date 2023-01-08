const mask = 0xFFFFFFFF;

export class RandomNumberGenerator {
    constructor(seed?: number) {
        seed ??= new Date().getTime();
        this.w = (123456789 + seed) & mask;
        this.z = (987654321 - seed) & mask;
    }

    private w: number;
    private z: number;

    next(limit: number) {
        let value: number;
        const highestPermittedValue = Math.floor((mask + 1) / limit) * limit - 1;
        do {
            this.z = (36969 * (this.z & 65535) + (this.z >>> 16)) & mask;
            this.w = (18000 * (this.w & 65535) + (this.w >>> 16)) & mask;
            value = ((this.z << 16) + (this.w & 65535)) >>> 0;
        } while (value > highestPermittedValue);
        return value % limit;
    }
}
