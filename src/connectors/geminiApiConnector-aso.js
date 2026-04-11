/**
 * geminiApiConnector-aso.js — ASO-aware wrapper around geminiApiConnector.
 */
const gemini = require("./geminiApiConnector");
const { withAso, registerConnector } = require("../aso-connector-middleware");

registerConnector("geminiApi", "generativelanguage.googleapis.com", 443);

const wrappedGenerateContent = withAso("geminiApi", gemini.runGeminiApiGenerateContent);
const wrappedMultimodal      = withAso("geminiApi", gemini.runGeminiApiMultimodal);
const wrappedEmbedContent    = withAso("geminiApi", gemini.runGeminiApiEmbedContent);
const wrappedExplainFile     = withAso("geminiApi", gemini.runGeminiApiExplainFile);

module.exports = {
  ...gemini,
  runGeminiApiGenerateContent: wrappedGenerateContent,
  runGeminiApiMultimodal:      wrappedMultimodal,
  runGeminiApiEmbedContent:    wrappedEmbedContent,
  runGeminiApiExplainFile:     wrappedExplainFile,
};
