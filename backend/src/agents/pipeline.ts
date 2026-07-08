import { parseResume } from './parseResume';
import { extractRequirements } from './extractRequirements';
import { performGapAnalysis } from './gapAnalysis';
import { scoreCandidate } from './scoreAgent';
import { generateVerdict } from './verdictAgent';

export type PipelineResult = {
  resumeData: any;
  requirements: any;
  gapAnalysis: any;
  score: any;
  verdict: any;
};

export async function runPipeline(
  resumeText: string,
  jobDescription: string,
  onProgress: (stepName: string, status: 'started' | 'completed' | 'failed', output?: any) => void
): Promise<PipelineResult> {
  
  onProgress('Parsing resume', 'started');
  const resumeData = await parseResume(resumeText);
  onProgress('Parsing resume', 'completed', resumeData);

  onProgress('Extracting requirements', 'started');
  const requirements = await extractRequirements(jobDescription);
  onProgress('Extracting requirements', 'completed', requirements);

  onProgress('Comparing data', 'started');
  const gapAnalysis = await performGapAnalysis(resumeData, requirements);
  onProgress('Comparing data', 'completed', gapAnalysis);

  onProgress('Scoring candidate', 'started');
  const score = await scoreCandidate(resumeData, gapAnalysis);
  onProgress('Scoring candidate', 'completed', score);

  onProgress('Final verdict', 'started');
  const verdict = await generateVerdict(score, gapAnalysis);
  onProgress('Final verdict', 'completed', verdict);

  return {
    resumeData,
    requirements,
    gapAnalysis,
    score,
    verdict
  };
}
