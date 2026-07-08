"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = runPipeline;
const parseResume_1 = require("./parseResume");
const extractRequirements_1 = require("./extractRequirements");
const gapAnalysis_1 = require("./gapAnalysis");
const scoreAgent_1 = require("./scoreAgent");
const verdictAgent_1 = require("./verdictAgent");
async function runPipeline(resumeText, jobDescription, onProgress) {
    onProgress('Parsing resume', 'started');
    const resumeData = await (0, parseResume_1.parseResume)(resumeText);
    onProgress('Parsing resume', 'completed', resumeData);
    onProgress('Extracting requirements', 'started');
    const requirements = await (0, extractRequirements_1.extractRequirements)(jobDescription);
    onProgress('Extracting requirements', 'completed', requirements);
    onProgress('Comparing data', 'started');
    const gapAnalysis = await (0, gapAnalysis_1.performGapAnalysis)(resumeData, requirements);
    onProgress('Comparing data', 'completed', gapAnalysis);
    onProgress('Scoring candidate', 'started');
    const score = await (0, scoreAgent_1.scoreCandidate)(resumeData, gapAnalysis);
    onProgress('Scoring candidate', 'completed', score);
    onProgress('Final verdict', 'started');
    const verdict = await (0, verdictAgent_1.generateVerdict)(score, gapAnalysis);
    onProgress('Final verdict', 'completed', verdict);
    return {
        resumeData,
        requirements,
        gapAnalysis,
        score,
        verdict
    };
}
