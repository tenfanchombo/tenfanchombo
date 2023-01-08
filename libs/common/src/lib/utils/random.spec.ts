import { RandomNumberGenerator } from './random';

describe('randomNumberGenerator', () => {
    it('should generate known numbers from a seed', () => {
        for (let i = 0; i < 3; i++) {
            let rng = new RandomNumberGenerator(12345);
            expect(rng.next(0xDEADBEEF)).toEqual(0x0CE09202);
            expect(rng.next(0xDEADBEEF)).toEqual(0xC88A50CE);
            expect(rng.next(0xDEADBEEF)).toEqual(0xDAC45851);

            rng = new RandomNumberGenerator(9999);
            expect(rng.next(0xDEADBEEF)).toEqual(0x46502A9B);
            expect(rng.next(0xDEADBEEF)).toEqual(0xD26F3713);
            expect(rng.next(0xDEADBEEF)).toEqual(0x4D96AB5D);
        }
    });

    it('should have uniformity', () => {
        const iterations = 1000000;
        const numSlots = 6;

        const rng = new RandomNumberGenerator(999);
        const slots = new Array(numSlots).fill(0);

        for (let i = 0; i < iterations; i++) {
            slots[rng.next(numSlots)]++;
        }

        const deviations = slots.map(slot => Math.abs(1 - (slot / (iterations / numSlots))));
        console.log(`distributions over ${iterations} iterations:`, slots);

        for (const deviation of deviations) {
            expect(deviation).toBeLessThan(0.005);
        }
    });
});
