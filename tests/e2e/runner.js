// tests/e2e/runner.js
/**
 * HyperNova E2E Standalone CLI Test Runner
 * Executes all 4 test tiers (Tiers 1–4) and reports comprehensive results.
 * Exits with code 0 on 100% pass, non-zero on any failure.
 */

const { TestHarness } = require('./framework');
const path = require('path');

const harness = new TestHarness();

// Register all test tiers
const registerTier1 = require('./tier1_features');
const registerTier2 = require('./tier2_boundaries');
const registerTier3 = require('./tier3_combinations');
const registerTier4 = require('./tier4_scenarios');

registerTier1(harness);
registerTier2(harness);
registerTier3(harness);
registerTier4(harness);

// Parse CLI flags (e.g. node tests/e2e/runner.js --tier=tier1)
const tierArg = process.argv.find((a) => a.startsWith('--tier='));
const filterTier = tierArg ? tierArg.split('=')[1] : null;

(async () => {
  try {
    const success = await harness.run(filterTier);
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Fatal unhandled error running test suite:', err);
    process.exit(1);
  }
})();
