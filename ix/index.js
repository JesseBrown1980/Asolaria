// IX registry | PID: asolaria | Profile: asolaria
// Exports all IX modules as a single registry
const sovereigntyVerbs = require("./verbs/sovereignty");

module.exports = {
  // nouns (GET state)
  health:      require('./nouns/health'),
  sovereignty: require('./nouns/sovereignty'),
  nerve:       require('./nouns/nerve'),
  falcon:      require('./nouns/falcon'),
  // verbs (POST actions)
  dispatch:    require('./verbs/dispatch'),
  observe:     require('./verbs/observe'),
  sync:        require('./verbs/sync'),
  // sovereignty V6 verbs — exported both individually and as a namespaced bag
  ...sovereigntyVerbs,
  // sovereignty V6 verbs — wired through verb factory gate chain
  sovereigntyVerbs,
  // chains
  heartbeat:   require('./chains/heartbeat'),
  report:      require('./chains/report'),
  // gates
  sovereign:   require('./gates/sovereign'),
  // grammar
  verbFactory: require('./grammar/verb-factory'),
};
