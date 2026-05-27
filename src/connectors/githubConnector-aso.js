/**
 * githubConnector-aso.js — ASO-aware wrapper around githubConnector.
 */
const github = require("./githubConnector");
const { withAso, registerConnector } = require("../aso-connector-middleware");

registerConnector("github", "api.github.com", 443);

const wrappedGetStatus  = withAso("github", github.getGithubIntegrationStatus);
const wrappedListRepos  = withAso("github", github.listGithubRepos);

module.exports = {
  ...github,
  getGithubIntegrationStatus: wrappedGetStatus,
  listGithubRepos:            wrappedListRepos,
};
