// Every status effect X No Evil can roll. amplifier is the level minus one. An instant effect acts once and has no duration, any
// other effect lasts a random time between minSeconds and maxSeconds, which the function rolls when the cloud is made.
const effect = (id, amplifier, instant = false) => ({ id, amplifier, instant });

module.exports = {
    // Bounds in seconds for how long a timed effect lasts, rolled for each cloud
    minSeconds: 10,
    maxSeconds: 120,
    effects: [
        effect('speed', 1),
        effect('slowness', 2),
        effect('haste', 1),
        effect('mining_fatigue', 1),
        effect('strength', 1),
        effect('instant_health', 1, true),
        effect('instant_damage', 3, true),
        effect('jump_boost', 1),
        effect('nausea', 0),
        effect('regeneration', 1),
        effect('resistance', 1),
        effect('fire_resistance', 0),
        effect('water_breathing', 0),
        effect('invisibility', 0),
        effect('blindness', 0),
        effect('night_vision', 0),
        effect('hunger', 0),
        effect('weakness', 1),
        effect('poison', 0),
        effect('wither', 0),
        effect('health_boost', 1),
        effect('absorption', 1),
        effect('saturation', 0, true),
        effect('glowing', 0),
        effect('levitation', 0),
        effect('luck', 0),
        effect('unluck', 0),
        effect('slow_falling', 0),
        effect('conduit_power', 0),
        effect('dolphins_grace', 0),
        effect('bad_omen', 0),
        effect('hero_of_the_village', 0),
        effect('darkness', 0),
        effect('trial_omen', 0),
        effect('raid_omen', 0),
        effect('wind_charged', 0),
        effect('weaving', 0),
        effect('oozing', 0),
        effect('infested', 0),
        effect('breath_of_the_nautilus', 0)
    ]
};
