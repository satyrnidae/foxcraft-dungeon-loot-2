// Test manifest. Read by gametest/generate.js for the structures, environments and instances, and imported by gametest/mc/src/fdl_test.mcb
// for the poll function of each test.
// Every test is one test instance with its own environment, but the runner starts them all at once, and the scenarios share one arena, tags and
// scores. So each test gets a window on a global tick clock, start below, and its poll does nothing before it. Windows do not overlap,
// and a test that fails or times out can't hold up the next one. The clock only runs once the arena chunks are loaded, see gt_tick in
// generate.js. The structure holds a start test block, a command block the start block powers, an accept test block and a fail test block.
// The command block repeats a poll function, which counts ticks and runs the steps below. A step is [age, function under fdl_test], age 1
// is the first tick. Before each step the score #ok fdl_test is 1, a step fails the test by setting it to 0. The last step passing accepts
// the test. All scenarios build their stage at the origin marker at 100 64 100, see lib/begin in fdl_test.mcb. The structure is only the scaffold.
const gametest = {
	size: [8, 2, 1],
	// Ticks added to the last step for max_ticks. Room for the arena chunks to load before a test's clock starts
	margin: 300,
	tests: [
		{ id: "load_scoreboards", steps: [[1, "load/check"]] },
		{ id: "aura_post_attack", steps: [[1, "enchantments/aura/run"]] },
		{ id: "haemolymph_levels", steps: [[1, "enchantments/haemolymph/run"]] },
		{ id: "balm_levels", steps: [[1, "enchantments/balm/run"]] },
		{ id: "disarming_entity", steps: [[1, "strikes/disarm/run"]] },
		{ id: "poncho_post_attack", steps: [[1, "strikes/poncho/run"]] },
		{ id: "hammer_expiry", steps: [[1, "hammer/start"], [8, "hammer/check"]] },
		{ id: "hammer_expiry_hit", steps: [[1, "hammer/hit"]] },
		{ id: "sweep_common", steps: [[1, "sweep/common"]] },
		{ id: "sweep_uncommon", steps: [[1, "sweep/uncommon"]] },
		{ id: "sweep_rare", steps: [[1, "sweep/rare"]] },
		{ id: "sweep_epic", steps: [[1, "sweep/epic"]] },
		{ id: "sweep_mythic", steps: [[1, "sweep/mythic"]] },
		// Last, it removes the objectives the others use
		{ id: "uninstall", steps: [[1, "uninstall/run"], [3, "uninstall/reload"]] },
	],
};

// A test's window starts when the one before it has run its last step, plus slack for its cleanup
let start = 0;
for (const t of gametest.tests) {
	t.last = Math.max(...t.steps.map(([age]) => age));
	t.start = start;
	start += t.last + 10;
}

module.exports = { gametest };
