import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, ArrowRight, RefreshCw, Download } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

type Status = 'idle' | 'analyzing' | 'complete' | 'error';

interface AgentStep {
  name: string;
  status: 'pending' | 'started' | 'completed' | 'failed';
  output?: any;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [titleCompany, setTitleCompany] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>([
    { name: 'Parsing resume', status: 'pending' },
    { name: 'Extracting requirements', status: 'pending' },
    { name: 'Comparing data', status: 'pending' },
    { name: 'Scoring candidate', status: 'pending' },
    { name: 'Final verdict', status: 'pending' },
  ]);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setErrorMsg('File size exceeds 5MB limit.');
        return;
      }
      setFile(selectedFile);
      setErrorMsg('');
    }
  };

  const handleAnalyze = async () => {
    if (!file || !jobDescription) {
      setErrorMsg('Please provide both a resume and a job description.');
      return;
    }

    setStatus('analyzing');
    setErrorMsg('');
    setResult(null);
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobDescription', jobDescription);
      formData.append('titleCompany', titleCompany);

      const uploadRes = await fetch('http://localhost:3000/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { resumeId } = await uploadRes.json();

      const eventSource = new EventSource(`http://localhost:3000/api/analyze/${resumeId}`);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'step') {
          setSteps(prev => prev.map(s => 
            s.name === data.payload.stepName 
              ? { ...s, status: data.payload.status, output: data.payload.output }
              : s
          ));
        } else if (data.event === 'complete') {
          setResult(data.payload);
          setStatus('complete');
          eventSource.close();
        } else if (data.event === 'error') {
          throw new Error(data.payload.message);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err);
        eventSource.close();
        setStatus('error');
        setErrorMsg('Connection error during analysis.');
      };

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  const reset = () => {
    setStatus('idle');
    setFile(null);
    setJobDescription('');
    setTitleCompany('');
    setResult(null);
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));
  };

  const renderUploadScreen = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-text">AI Resume Judge</h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto">Upload a resume and job description to get an objective, agentic analysis of a candidate's fit.</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800 transition-all">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Candidate Resume
            </h2>
            <div className="relative group cursor-pointer">
              <input type="file" onChange={handleFileChange} accept=".pdf,.docx" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700 group-hover:border-primary/50'}`}>
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-10 h-10 text-primary" />
                    <span className="font-medium text-primary truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    <Upload className="w-10 h-10 mb-2 opacity-50" />
                    <p className="font-medium">Drag & drop or click to upload</p>
                    <p className="text-xs">Supports PDF, DOCX (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Job Description
            </h2>
            <input 
              type="text" 
              placeholder="Job Title & Company (Optional)" 
              value={titleCompany}
              onChange={e => setTitleCompany(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
            <textarea 
              placeholder="Paste the full job description here..." 
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              className="w-full h-40 px-4 py-3 rounded-xl bg-background border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <div className="mt-8 text-center">
          <button 
            onClick={handleAnalyze}
            disabled={!file || !jobDescription}
            className="px-8 py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/30 flex items-center gap-2 mx-auto"
          >
            Run Agentic Analysis <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalyzingScreen = () => (
    <div className="max-w-3xl mx-auto space-y-8 mt-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto" />
        <h2 className="text-3xl font-bold tracking-tight text-text">Agents at Work</h2>
        <p className="text-text-muted">Analyzing resume and cross-referencing with requirements...</p>
      </div>

      <div className="bg-surface rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-800">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
          {steps.map((step, idx) => (
            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-surface shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 shadow-sm relative">
                {step.status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : step.status === 'started' ? (
                  <div className="w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                ) : step.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full" />
                )}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-background p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <h3 className={`font-semibold ${step.status === 'started' ? 'text-primary' : 'text-text'}`}>{step.name}</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    step.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    step.status === 'started' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {step.status}
                  </span>
                </div>
                {step.output && step.status === 'completed' && (
                  <div className="text-xs text-text-muted mt-2 truncate">
                    {idx === 0 && `${step.output.skills?.length || 0} skills extracted`}
                    {idx === 1 && `${step.output.mustHaves?.length || 0} must-haves identified`}
                    {idx === 2 && `${step.output.analysis?.filter((a:any)=>a.status==='Met').length || 0} requirements met`}
                    {idx === 3 && `Score: ${step.output.overallScore}/100`}
                    {idx === 4 && `${step.output.decision}`}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResultScreen = () => {
    if (!result) return null;
    const { score, verdict, gapAnalysis } = result;

    const verdictColor = 
      verdict.decision === 'Hired' ? 'bg-green-500' :
      verdict.decision === 'Not Hired' ? 'bg-red-500' : 'bg-amber-500';
    
    const verdictBg = 
      verdict.decision === 'Hired' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/50' :
      verdict.decision === 'Not Hired' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/50' : 
      'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/50';

    const verdictText = 
      verdict.decision === 'Hired' ? 'text-green-700 dark:text-green-400' :
      verdict.decision === 'Not Hired' ? 'text-red-700 dark:text-red-400' : 
      'text-amber-700 dark:text-amber-400';

    const radarData = [
      { subject: 'Skills', A: score.categories.skillsMatch, fullMark: 100 },
      { subject: 'Experience', A: score.categories.experienceRelevance, fullMark: 100 },
      { subject: 'Projects', A: score.categories.projectDepth, fullMark: 100 },
      { subject: 'Education', A: score.categories.educationFit, fullMark: 100 },
      { subject: 'Presentation', A: score.categories.overallPresentation, fullMark: 100 },
    ];

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-text">Analysis Report</h2>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-4 py-2 bg-surface hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all flex items-center gap-2 text-sm font-medium">
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={reset} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="w-4 h-4" /> New Analysis
            </button>
          </div>
        </div>

        {/* Verdict Banner */}
        <div className={`p-8 rounded-2xl border ${verdictBg} flex flex-col md:flex-row items-center gap-8 shadow-sm relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-2 h-full ${verdictColor}`} />
          <div className="flex-1 space-y-2">
            <h3 className={`text-sm font-bold uppercase tracking-wider ${verdictText}`}>Final Verdict</h3>
            <div className="text-4xl font-black text-text">{verdict.decision}</div>
            <p className="text-text-muted mt-2">{verdict.justification}</p>
          </div>
          <div className="text-center bg-background p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 min-w-[200px]">
            <div className="text-sm font-medium text-text-muted mb-1">Overall Match</div>
            <div className="text-5xl font-bold text-primary">{score.overallScore}<span className="text-2xl text-gray-400">/100</span></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Radar Chart */}
          <div className="lg:col-span-1 bg-surface p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold mb-4">Score Breakdown</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Candidate" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-text-muted mt-4 text-center">{score.reasoning}</p>
          </div>

          {/* Gap Analysis */}
          <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Gap Analysis</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-semibold text-sm text-text-muted">Requirement</th>
                    <th className="pb-3 font-semibold text-sm text-text-muted">Type</th>
                    <th className="pb-3 font-semibold text-sm text-text-muted">Status</th>
                    <th className="pb-3 font-semibold text-sm text-text-muted">Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {gapAnalysis.analysis.map((item: any, idx: number) => (
                    <tr key={idx} className="group">
                      <td className="py-4 pr-4 font-medium text-sm">{item.requirement}</td>
                      <td className="py-4 pr-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${item.type === 'must-have' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${
                          item.status === 'Met' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 
                          item.status === 'Partial' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' : 
                          'text-red-600 bg-red-50 dark:bg-red-900/20'
                        }`}>
                          {item.status === 'Met' && <CheckCircle className="w-3 h-3" />}
                          {item.status === 'Missing' && <XCircle className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-text-muted">{item.evidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {verdict.improvementSuggestions?.length > 0 && (
          <div className="bg-surface p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Areas for Improvement
            </h3>
            <ul className="grid md:grid-cols-2 gap-4">
              {verdict.improvementSuggestions.map((sugg: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3 bg-background p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">{idx + 1}</div>
                  <span className="text-sm text-text">{sugg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-12 md:pt-20 pb-24">
      {status === 'idle' && renderUploadScreen()}
      {(status === 'analyzing' || (status === 'error' && !result)) && renderAnalyzingScreen()}
      {status === 'complete' && renderResultScreen()}
      
      {status === 'error' && !result && (
        <div className="max-w-md mx-auto mt-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-3 text-sm shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0" /> 
          <span className="flex-1">{errorMsg}</span>
          <button onClick={reset} className="underline font-semibold hover:opacity-80">Try again</button>
        </div>
      )}
    </div>
  );
}

export default App;
