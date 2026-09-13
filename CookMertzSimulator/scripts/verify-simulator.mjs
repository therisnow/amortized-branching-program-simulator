import { buildTrace } from '../lib/cook-simulator.ts';

const bit = (value, index) => ((value >> index) & 1);
let cases = 0;

for (const schedule of ['gray', 'naive']) {
  for (let inputMask = 0; inputMask < 16; inputMask += 1) {
    for (let catalystMask = 0; catalystMask < 2048; catalystMask += 1) {
      const config = {
        input: Array.from({ length: 4 }, (_, index) => bit(inputMask, index)),
        tauInput: Array.from({ length: 4 }, (_, index) => bit(catalystMask, index)),
        tauMonomial: [
          Array.from({ length: 3 }, (_, index) => bit(catalystMask, index + 4)),
          Array.from({ length: 3 }, (_, index) => bit(catalystMask, index + 7)),
        ],
        tauOutput: bit(catalystMask, 10),
        schedule,
      };
      const trace = buildTrace(config);
      const expectedQueries = schedule === 'gray' ? 16 : 32;
      const expectedToggles = schedule === 'gray' ? 4 : 8;
      const queryFrames = trace.frames.filter((frame) => frame.kind === 'query').length;
      const outputFrames = trace.frames.filter((frame) => frame.kind === 'output');

      if (
        trace.finalOutput !== trace.expectedOutput
        || !trace.registersRestored
        || trace.queryCount !== expectedQueries
        || queryFrames !== expectedQueries
        || trace.toggleCount !== expectedToggles
        || outputFrames.length !== 4
      ) {
        throw new Error(`Verification failed: schedule=${schedule}, input=${inputMask}, catalyst=${catalystMask}`);
      }

      cases += 1;
    }
  }
}

console.log(`Verified ${cases.toLocaleString('en-US')} configurations: output, restoration, four output rounds, and query counts all match.`);
