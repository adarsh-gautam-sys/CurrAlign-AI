import React, { useRef } from 'react';

const API_BASE = 'http://localhost:8000';

const Workspace = ({ analysisState, setAnalysisState, workspaceRef, readinessRef, judgeRef, onRunDemo, onResetAnalysis }) => {
    const {
        syllabusFile, jobFiles, pipelineSteps, curriculumSkills, industrySkills,
        alignmentData, explanations, readiness, perfData, analyzing, demoMode, demoStatus, error,
    } = analysisState;

    const syllabusInputRef = useRef(null);
    const jobsInputRef = useRef(null);

    const canAnalyze = syllabusFile !== null && jobFiles.length > 0 && !analyzing;
    const isDisabledByDemo = demoMode && analyzing;

    // ── Upload Handlers ────────────────────────────────────
    const handleSyllabusUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAnalysisState(p => ({ ...p, error: null }));
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/upload/syllabus`, { method: 'POST', body: formData });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Upload failed'); }
            const data = await res.json();
            setAnalysisState(p => ({ ...p, syllabusFile: data.filename }));
        } catch (err) { setAnalysisState(p => ({ ...p, error: `Syllabus upload failed: ${err.message}` })); }
        e.target.value = '';
    };

    const handleJobsUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setAnalysisState(p => ({ ...p, error: null }));
        const formData = new FormData();
        for (const file of files) formData.append('files', file);
        try {
            const res = await fetch(`${API_BASE}/upload/jobs`, { method: 'POST', body: formData });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Upload failed'); }
            setAnalysisState(p => ({ ...p, jobFiles: Array.from(files).map(f => f.name) }));
        } catch (err) { setAnalysisState(p => ({ ...p, error: `Job descriptions upload failed: ${err.message}` })); }
        e.target.value = '';
    };

    // ── Manual Analysis Handler ────────────────────────────
    const handleRunAnalysis = async () => {
        setAnalysisState(p => ({ ...p, error: null, analyzing: true }));
        try {
            const textRes = await fetch(`${API_BASE}/analyze/extract-text`, { method: 'POST' });
            if (!textRes.ok) { const d = await textRes.json(); throw new Error(d.detail || 'Text extraction failed'); }
            setAnalysisState(p => ({ ...p, pipelineSteps: { ...p.pipelineSteps, document_parsing: 'completed', text_extraction: 'completed' } }));

            const skillRes = await fetch(`${API_BASE}/analyze/extract-skills`, { method: 'POST' });
            if (!skillRes.ok) { const d = await skillRes.json(); throw new Error(d.detail || 'Skill extraction failed'); }
            const skillData = await skillRes.json();
            setAnalysisState(p => ({ ...p, pipelineSteps: skillData.steps, curriculumSkills: skillData.skills.curriculum || [], industrySkills: skillData.skills.industry || [] }));

            const alignRes = await fetch(`${API_BASE}/analyze/alignment`, { method: 'POST' });
            if (!alignRes.ok) { const d = await alignRes.json(); throw new Error(d.detail || 'Alignment failed'); }
            const alignData = await alignRes.json();
            setAnalysisState(p => ({ ...p, pipelineSteps: alignData.steps, alignmentData: alignData.alignment }));

            const explainRes = await fetch(`${API_BASE}/analyze/explain`, { method: 'POST' });
            if (!explainRes.ok) { const d = await explainRes.json(); throw new Error(d.detail || 'Explanation failed'); }
            const explainData = await explainRes.json();
            setAnalysisState(p => ({ ...p, explanations: explainData.explanations }));

            const readyRes = await fetch(`${API_BASE}/analyze/readiness`, { method: 'POST' });
            if (!readyRes.ok) { const d = await readyRes.json(); throw new Error(d.detail || 'Readiness scoring failed'); }
            const readyData = await readyRes.json();
            setAnalysisState(p => ({ ...p, readiness: readyData.readiness }));

            const perfRes = await fetch(`${API_BASE}/analyze/performance`, { method: 'POST' });
            if (!perfRes.ok) { const d = await perfRes.json(); throw new Error(d.detail || 'Performance profiling failed'); }
            const perfResult = await perfRes.json();
            setAnalysisState(p => ({ ...p, perfData: perfResult, analyzing: false }));
        } catch (err) {
            setAnalysisState(p => ({ ...p, error: `Analysis failed: ${err.message}`, analyzing: false }));
        }
    };

    // ── Helpers ─────────────────────────────────────────────
    const getStepStyles = (status) => {
        if (status === 'completed') return { circle: 'bg-green-50 border-green-300 text-green-500', title: 'text-slate-900 font-semibold', subtitle: 'text-slate-500' };
        return { circle: 'bg-slate-50 border-slate-200 text-slate-300', title: 'text-slate-400 font-semibold', subtitle: 'text-slate-400' };
    };

    const pipelineConfig = [
        { key: 'document_parsing', icon: 'document_scanner', title: 'Document Parsing', subtitle: 'Analyzing file structure', isLast: false },
        { key: 'text_extraction', icon: 'text_fields', title: 'Text Extraction', subtitle: 'Retrieving raw content', isLast: false },
        { key: 'skill_identification', icon: 'psychology', title: 'Skill & Topic Identification', subtitle: 'Detecting key concepts', isLast: false },
        { key: 'alignment', icon: 'compare_arrows', title: 'Curriculum-Industry Alignment', subtitle: 'Calculating gaps & matches', isLast: true },
    ];

    const getPipelineMessage = () => {
        if (pipelineSteps.alignment === 'completed') return 'All analysis steps completed successfully.';
        if (pipelineSteps.skill_identification === 'completed') return 'Skills extracted. Alignment analysis pending.';
        if (pipelineSteps.text_extraction === 'completed') return 'Text extraction complete. Skill identification pending.';
        return 'Once analysis starts, progress will be shown here in real time.';
    };

    const getAlignmentSummary = () => {
        if (!alignmentData) return [];
        const summaries = [];
        if (alignmentData.overlap.length > 0) summaries.push({ icon: 'check', color: 'emerald', title: 'Several core skills align well with industry needs.', detail: 'The curriculum provides a strong foundation in essential areas, ensuring students meet baseline expectations.' });
        else summaries.push({ icon: 'check', color: 'emerald', title: 'No direct skill overlap was found.', detail: 'Consider reviewing the syllabus for industry alignment opportunities.' });
        if (alignmentData.missing.length > 0) summaries.push({ icon: 'priority_high', color: 'orange', title: 'Key emerging skills are missing from the curriculum.', detail: 'To improve employability, consider integrating modules on modern technologies and in-demand industry skills.' });
        if (alignmentData.low_relevance.length > 0) summaries.push({ icon: 'update', color: 'slate', title: 'Some topics may require modernization.', detail: 'Review older methodologies and consider updating them to reflect current agile and iterative industry practices.' });
        return summaries;
    };

    const getReadinessStyles = (level) => {
        if (level === 'Strong Alignment') return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Strong' };
        if (level === 'Moderate Alignment') return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Moderate' };
        return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Low' };
    };

    return (
        <>
            {/* ── On-Device Performance & Execution ──────────── */}
            <section className="space-y-6">
                <h2 className="text-slate-900 text-2xl font-bold tracking-tight">On-Device Performance &amp; Execution</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-surface rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">memory</span>
                                <h4 className="font-bold text-slate-800 text-base">Execution Environment</h4>
                            </div>
                        </div>
                        <div className="p-6 flex-grow">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm font-medium text-slate-500">Execution Mode</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{perfData ? perfData.execution.mode : 'On-Device'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm font-medium text-slate-500">Hardware Target</span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">{perfData ? perfData.execution.hardware : 'AMD-optimized'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                                    <span className="text-sm font-medium text-slate-500">Data Flow</span>
                                    <span className="text-sm font-semibold text-slate-700">{perfData ? perfData.execution.data_flow : 'No cloud processing'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm font-medium text-slate-500">Privacy</span>
                                    <span className="text-sm font-semibold text-slate-700">{perfData ? perfData.execution.privacy : 'Local processing'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
                            <h4 className="font-bold text-slate-900 text-base mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-xl">speed</span> Performance Highlights
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: 'Document Processing', val: perfData?.performance?.document_processing || 'High Throughput', sub: 'Optimized local execution' },
                                    { label: 'Skill Extraction', val: perfData?.performance?.skill_extraction || 'Low Latency', sub: 'Real-time inference' },
                                    { label: 'Alignment Analysis', val: perfData?.performance?.alignment_analysis || 'Secure Compute', sub: 'Privacy-first design' },
                                ].map((item, i) => (
                                    <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">{item.label}</div>
                                        <div className="font-bold text-slate-900 text-lg">{item.val}</div>
                                        <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">bolt</span> {item.sub}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {perfData && (
                                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">computer</span> {perfData.system.os}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">memory</span> {perfData.system.cpu}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">code</span> Python {perfData.system.python}</span>
                                </div>
                            )}
                        </div>
                        <div className="bg-gradient-to-r from-red-50 to-white rounded-xl border border-red-100 shadow-sm p-4 flex items-start gap-3">
                            <span className="material-symbols-outlined text-red-500 mt-0.5">developer_board</span>
                            <div>
                                <h5 className="text-sm font-bold text-slate-900">Accelerated on AMD Hardware</h5>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">This application leverages AMD Ryzen™ AI neural processing units (NPUs) to parallelize heavy computational tasks in education workflows, ensuring responsive analysis without compromising data privacy.</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-slate-400 italic text-center">Performance indicators are based on local execution characteristics, not absolute benchmarking.</p>
                    </div>
                </div>
            </section>

            {/* ── Curriculum Analysis Workspace ──────────────── */}
            <section className="space-y-6" ref={workspaceRef} id="workspace">
                <h2 className="text-slate-900 text-2xl font-bold tracking-tight">Curriculum Analysis Workspace</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Left sidebar ──────────────────────────── */}
                    <div className="space-y-6 flex flex-col">
                        {/* Syllabus card */}
                        <div className="bg-surface rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm relative overflow-hidden">
                            <div className={`w-1.5 h-full absolute left-0 top-0 ${syllabusFile ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${syllabusFile ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-xl">description</span>
                            </div>
                            <div className="flex-grow"><h3 className="text-sm font-semibold text-slate-900 mb-1">Syllabus Document</h3><p className="text-xs text-slate-500">{syllabusFile || 'No files uploaded'}</p></div>
                            <span className={`material-symbols-outlined text-xl flex-shrink-0 ${syllabusFile ? 'text-green-500' : 'text-slate-300'}`}>{syllabusFile ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </div>
                        {/* Jobs card */}
                        <div className="bg-surface rounded-xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm relative overflow-hidden">
                            <div className={`w-1.5 h-full absolute left-0 top-0 ${jobFiles.length > 0 ? 'bg-green-400' : 'bg-slate-200'}`}></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${jobFiles.length > 0 ? 'bg-green-50 text-green-500' : 'bg-slate-100 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-xl">work_outline</span>
                            </div>
                            <div className="flex-grow"><h3 className="text-sm font-semibold text-slate-900 mb-1">Job Descriptions</h3><p className="text-xs text-slate-500">{jobFiles.length > 0 ? `${jobFiles.length} file${jobFiles.length > 1 ? 's' : ''} uploaded` : 'No files uploaded'}</p></div>
                            <span className={`material-symbols-outlined text-xl flex-shrink-0 ${jobFiles.length > 0 ? 'text-green-500' : 'text-slate-300'}`}>{jobFiles.length > 0 ? 'check_circle' : 'radio_button_unchecked'}</span>
                        </div>
                        {/* Pipeline */}
                        <div className="bg-surface rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col flex-grow">
                            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-slate-400">schema</span> Analysis Pipeline</h3>
                            <div className="relative space-y-0 pb-2 flex-grow">
                                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 -z-10"></div>
                                {pipelineConfig.map((step) => {
                                    const status = pipelineSteps[step.key]; const styles = getStepStyles(status);
                                    return (<div key={step.key} className={`flex gap-4 items-start ${step.isLast ? '' : 'pb-6'}`}><div className={`w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0 z-10 ${styles.circle}`}>{status === 'completed' ? <span className="material-symbols-outlined text-lg">check_circle</span> : <span className="material-symbols-outlined text-lg">{step.icon}</span>}</div><div className="pt-1"><h4 className={`text-sm ${styles.title}`}>{step.title}</h4><p className={`text-xs mt-0.5 ${styles.subtitle}`}>{step.subtitle}</p></div></div>);
                                })}
                            </div>
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex items-start gap-3"><span className="material-symbols-outlined text-blue-400 text-sm mt-0.5">info</span><p className="text-xs text-blue-600 leading-relaxed font-medium">{getPipelineMessage()}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right panel ──────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upload area */}
                        <div className={`bg-surface rounded-xl border border-slate-200 p-8 shadow-sm flex flex-col ${isDisabledByDemo ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-lg">cloud_upload</span></div>
                                <h3 className="text-lg font-bold text-slate-900">Upload Documents</h3>
                            </div>
                            <div className="flex-grow flex flex-col gap-6">
                                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 p-8 flex flex-col items-center justify-center text-center gap-4 transition-colors hover:bg-slate-50 hover:border-primary/40 group">
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors mb-2"><span className="material-symbols-outlined text-3xl">upload_file</span></div>
                                    <div>
                                        <h4 className="text-slate-900 font-semibold text-base mb-1">Drag and drop your files here</h4>
                                        <p className="text-slate-500 text-sm mb-6">Support for PDF, DOCX, and TXT files</p>
                                        <input type="file" ref={syllabusInputRef} className="hidden" accept=".pdf,.docx,.txt" onChange={handleSyllabusUpload} />
                                        <input type="file" ref={jobsInputRef} className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleJobsUpload} />
                                        <div className="flex flex-wrap justify-center gap-3">
                                            <button onClick={() => syllabusInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-primary hover:text-primary transition-all flex items-center gap-2"><span className="material-symbols-outlined text-lg">add</span> Select Syllabus</button>
                                            <button onClick={() => jobsInputRef.current?.click()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:border-primary hover:text-primary transition-all flex items-center gap-2"><span className="material-symbols-outlined text-lg">add</span> Select Job Desc.</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {error && <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-md text-xs font-medium border border-red-100/50"><span className="material-symbols-outlined text-sm">error</span> {error}</div>}
                            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                {!canAnalyze
                                    ? <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-md text-xs font-medium border border-amber-100/50"><span className="material-symbols-outlined text-sm">info</span>{analyzing ? 'Running analysis...' : 'Please upload both documents to run analysis'}</div>
                                    : <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-md text-xs font-medium border border-green-100/50"><span className="material-symbols-outlined text-sm">check_circle</span> Ready to analyze</div>}
                                <button disabled={!canAnalyze} onClick={handleRunAnalysis} className={`w-full md:w-auto text-sm font-bold px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${canAnalyze ? 'bg-primary hover:bg-primary-dark text-white shadow-sm shadow-primary/20 cursor-pointer' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                                    <span className="material-symbols-outlined text-lg">science</span><span>{analyzing ? 'Running...' : 'Run Alignment Analysis'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Judge Mode: Guided Demo ───────────────────── */}
            <section ref={judgeRef} id="judge-mode" className="w-full relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/50 to-white shadow-md p-0.5">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-6 md:p-8 relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-indigo-900 text-2xl font-bold tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-indigo-600">rate_review</span> Judge Mode: Guided Demo
                        </h2>
                        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>
                            Live Environment
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="flex flex-col justify-between">
                            <div>
                                <h3 className="text-indigo-900 font-bold text-lg mb-4">What this demo shows</h3>
                                <ul className="space-y-4">
                                    {[
                                        { t: 'Automated Skill Extraction', d: 'AI parses unstructured PDF/text documents to identify key curriculum topics and industry requirements.' },
                                        { t: 'Explainable Reasoning', d: 'The system provides "Why" explanations for alignment gaps, bridging the "black box" of AI decisions.' },
                                        { t: 'Real-time Privacy-First Analysis', d: 'Demonstrates on-device capability (when supported) for secure educational data processing.' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600"><span className="material-symbols-outlined text-sm font-bold">check</span></div>
                                            <div><span className="font-semibold text-slate-800 text-sm">{item.t}</span><p className="text-xs text-slate-500 mt-1">{item.d}</p></div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="mt-6 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-3 items-start">
                                <span className="material-symbols-outlined text-indigo-500 text-sm mt-0.5">info</span>
                                <p className="text-xs text-indigo-800 leading-snug"><strong>Note:</strong> This mode uses pre-loaded public demo data (Computer Science Syllabus vs. 2024 Tech Job Market) to showcase full system capabilities instantly.</p>
                            </div>
                        </div>
                        <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 p-6">
                            <h3 className="text-slate-900 font-bold text-base mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-slate-500 text-lg">touch_app</span> Demo Actions</h3>
                            <div className="flex-grow space-y-3">
                                {/* Run One-Click Demo */}
                                <button
                                    onClick={onRunDemo}
                                    disabled={demoStatus === 'running'}
                                    className={`w-full group relative flex items-center justify-between p-4 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 ${demoStatus === 'running' ? 'bg-indigo-400 cursor-wait' : demoStatus === 'done' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white shadow-indigo-200`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-2xl">{demoStatus === 'running' ? 'hourglass_top' : demoStatus === 'done' ? 'check_circle' : 'rocket_launch'}</span>
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{demoStatus === 'running' ? 'Running Demo Analysis…' : demoStatus === 'done' ? 'Demo Complete ✓' : 'Run One-Click Demo'}</div>
                                            <div className="text-[10px] text-indigo-200">{demoStatus === 'running' ? 'Processing all pipeline stages' : demoStatus === 'done' ? 'All sections populated' : 'Load all data & start analysis'}</div>
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined text-indigo-300 group-hover:text-white transition-colors">{demoStatus === 'done' ? 'done_all' : 'arrow_forward'}</span>
                                </button>
                                <div className="pt-2 space-y-2">
                                    <button onClick={onRunDemo} disabled={demoStatus === 'running'} className="w-full flex items-center justify-between bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors">
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">description</span> Load Sample Syllabus</span>
                                        <span className="material-symbols-outlined text-sm text-slate-300">add</span>
                                    </button>
                                    <button onClick={onRunDemo} disabled={demoStatus === 'running'} className="w-full flex items-center justify-between bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-indigo-600 px-4 py-2.5 rounded-lg text-xs font-medium transition-colors">
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-base">work_outline</span> Load Sample Job Descriptions</span>
                                        <span className="material-symbols-outlined text-sm text-slate-300">add</span>
                                    </button>
                                    <button onClick={onResetAnalysis} className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 px-4 py-2 rounded-lg text-xs font-medium transition-colors mt-2">
                                        <span className="material-symbols-outlined text-sm">restart_alt</span> Reset Analysis
                                    </button>
                                </div>
                            </div>
                            <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${demoStatus === 'running' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                <span className="text-xs font-medium text-slate-500">{demoStatus === 'running' ? 'Demo running…' : 'Demo ready — no setup required'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-4 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-400">
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">code</span><span>Designed for rapid hackathon evaluation</span></div>
                        <div className="hidden sm:block">v2.4.0-demo</div>
                    </div>
                </div>
            </section>

            {/* ── Identified Skills & Topics ─────────────────── */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Identified Skills &amp; Topics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-xl">school</span><h4 className="font-semibold text-slate-800 text-sm">Skills Identified in Curriculum</h4></div></div>
                        <div className="p-6">{curriculumSkills.length > 0 ? <div className="flex flex-wrap gap-2">{curriculumSkills.map((s, i) => <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{s}</span>)}</div> : <p className="text-xs text-slate-400 italic">Run analysis to extract skills from your syllabus.</p>}</div>
                    </div>
                    <div className="bg-surface rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-xl">business_center</span><h4 className="font-semibold text-slate-800 text-sm">Skills Identified in Job Descriptions</h4></div></div>
                        <div className="p-6">{industrySkills.length > 0 ? <div className="flex flex-wrap gap-2">{industrySkills.map((s, i) => <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{s}</span>)}</div> : <p className="text-xs text-slate-400 italic">Run analysis to extract skills from job descriptions.</p>}</div>
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3"><span className="material-symbols-outlined text-slate-400 text-sm mt-0.5">auto_awesome</span><p className="text-xs text-slate-600 leading-relaxed">Skills are automatically extracted and normalized using Natural Language Processing (NLP) models trained on education and recruitment datasets. Results may vary based on document quality.</p></div>
            </div>

            {/* ── Curriculum Readiness Summary ───────────────── */}
            <div className="space-y-6" ref={readinessRef} id="readiness">
                <h3 className="text-lg font-bold text-slate-900">Curriculum Readiness Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-surface rounded-xl border border-slate-200 shadow-sm p-8 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 mb-6"><span className="material-symbols-outlined text-primary text-xl">speed</span><h4 className="font-bold text-slate-900 text-base">Overall Industry Readiness</h4></div>
                        <div className="flex flex-col items-center justify-center py-6">
                            {readiness ? (() => { const rs = getReadinessStyles(readiness.level); return (<div className={`relative w-40 h-40 flex items-center justify-center rounded-full border-[6px] ${rs.border} ${rs.bg}`}><div className="text-center"><div className={`text-xl font-black ${rs.color}`}>{rs.label}</div><div className={`text-xs font-bold uppercase tracking-wide mt-1 ${rs.color}`}>Alignment</div></div></div>); })()
                                : <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-[6px] border-slate-100"><div className="text-center"><div className="text-lg font-black text-slate-300">—</div><div className="text-xs font-bold text-slate-300 uppercase tracking-wide mt-1">Awaiting<br />Analysis</div></div></div>}
                        </div>
                        <div className="space-y-3 mt-6">
                            {readiness ? readiness.summary_bullets.map((bullet, idx) => {
                                const icons = [{ bg: 'bg-emerald-100', icon: 'check', c: 'text-emerald-600' }, { bg: 'bg-amber-100', icon: 'warning', c: 'text-amber-600' }, { bg: 'bg-slate-100', icon: 'info', c: 'text-slate-500' }];
                                const s = icons[idx] || icons[2];
                                return <div key={idx} className="flex items-start gap-3"><div className={`w-5 h-5 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}><span className={`material-symbols-outlined ${s.c} text-[14px] font-bold`}>{s.icon}</span></div><p className="text-sm text-slate-600">{bullet}</p></div>;
                            }) : <div className="flex items-start gap-3"><div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="material-symbols-outlined text-slate-300 text-[14px]">remove</span></div><p className="text-sm text-slate-400 italic">Run analysis to see readiness</p></div>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 h-full">
                        {[
                            { icon: 'thumb_up', bg: 'bg-emerald-50', tc: 'text-emerald-600', title: 'Strength Areas', desc: 'Strong alignment with current market demands.', items: readiness?.strengths, pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                            { icon: 'trending_up', bg: 'bg-amber-50', tc: 'text-amber-600', title: 'Improvement Opportunities', desc: 'High-demand skills missing from syllabus.', items: readiness?.improvements, pillBg: 'bg-amber-50 text-amber-700 border-amber-100' },
                            { icon: 'update', bg: 'bg-slate-100', tc: 'text-slate-600', title: 'Review & Modernize', desc: 'Topics with declining industry relevance.', items: readiness?.review, pillBg: 'bg-slate-100 text-slate-600 border-slate-200' },
                        ].map((card, i) => (
                            <div key={i} className="bg-surface rounded-xl border border-slate-200 shadow-sm p-5 flex-1">
                                <div className="flex items-start gap-3"><div className={`w-8 h-8 rounded-lg ${card.bg} ${card.tc} flex items-center justify-center flex-shrink-0`}><span className="material-symbols-outlined text-lg">{card.icon}</span></div>
                                    <div><h4 className="text-sm font-bold text-slate-900 mb-1">{card.title}</h4><p className="text-xs text-slate-500 mb-3">{card.desc}</p>
                                        <div className="flex flex-wrap gap-2">{card.items && card.items.length > 0 ? card.items.map((s, j) => <span key={j} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${card.pillBg}`}>{s}</span>) : <span className="text-[10px] text-slate-400 italic">Awaiting analysis</span>}</div></div></div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4"><div className="hidden sm:flex w-10 h-10 rounded-full bg-blue-100 text-primary items-center justify-center flex-shrink-0"><span className="material-symbols-outlined text-xl">insights</span></div><div><h4 className="text-base font-bold text-slate-900 mb-1">Ready to update your curriculum?</h4><p className="text-sm text-slate-500">Use these insights to bridge the gap between academic outcomes and industry needs.</p></div></div>
                    <button className="flex-1 sm:flex-none items-center justify-center gap-2 bg-white text-slate-400 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed shadow-sm" disabled><span className="material-symbols-outlined text-sm">download</span> Export Summary</button>
                </div>
            </div>

            {/* ── Alignment Overview ─────────────────────────── */}
            <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900">Curriculum–Industry Alignment Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: 'check_circle', iconColor: 'text-emerald-500', title: 'Skill Overlap', items: alignmentData?.overlap, pillCls: 'bg-emerald-50 text-emerald-700 border-emerald-100', empty: 'No direct skill overlap found.', placeholder: 'Run analysis to see skill overlap.', footer: alignmentData ? `${alignmentData.overlap.length} matching skill${alignmentData.overlap.length !== 1 ? 's' : ''} found` : 'Awaiting analysis', footerIcon: 'info' },
                        { icon: 'warning', iconColor: 'text-orange-500', title: 'Missing Industry Skills', items: alignmentData?.missing, pillCls: 'bg-orange-50 text-orange-700 border-orange-100', empty: 'All industry skills are covered!', placeholder: 'Run analysis to see gaps.', footer: alignmentData ? `${alignmentData.missing.length} gap${alignmentData.missing.length !== 1 ? 's' : ''} identified` : 'Awaiting analysis', footerIcon: 'trending_up' },
                        { icon: 'low_priority', iconColor: 'text-slate-400', title: 'Low Industry Relevance', items: alignmentData?.low_relevance, pillCls: 'bg-slate-100 text-slate-600 border-slate-200', empty: 'All curriculum topics are industry-relevant!', placeholder: 'Run analysis to check relevance.', footer: alignmentData ? (alignmentData.low_relevance.length > 0 ? 'Consider reviewing' : 'All topics relevant') : 'Awaiting analysis', footerIcon: 'history' },
                    ].map((card, i) => (
                        <div key={i} className="bg-surface rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl"><div className="flex items-center gap-2"><span className={`material-symbols-outlined ${card.iconColor} text-xl`}>{card.icon}</span><h4 className="font-semibold text-slate-800 text-sm">{card.title}</h4></div></div>
                            <div className="p-6 flex-grow">{card.items ? (card.items.length > 0 ? <div className="flex flex-wrap gap-2">{card.items.map((s, j) => <span key={j} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${card.pillCls}`}>{s}</span>)}</div> : <p className="text-xs text-slate-400 italic">{card.empty}</p>) : <p className="text-xs text-slate-400 italic">{card.placeholder}</p>}</div>
                            <div className="px-6 pb-6 pt-2 border-t border-slate-50"><p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">{card.footerIcon}</span> {card.footer}</p></div>
                        </div>
                    ))}
                </div>
                {alignmentData && (
                    <div className="bg-surface rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
                        <h4 className="font-bold text-slate-900 text-base mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary text-xl">summarize</span> Alignment Summary</h4>
                        <div className="space-y-4">
                            {getAlignmentSummary().map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4"><div className={`mt-0.5 w-5 h-5 rounded-full bg-${item.color}-100 flex items-center justify-center flex-shrink-0`}><span className={`material-symbols-outlined text-${item.color}-600 text-xs font-bold`}>{item.icon}</span></div><p className="text-sm text-slate-600 leading-relaxed"><span className="font-medium text-slate-800">{item.title}</span> {item.detail}</p></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Why These Results? ─────────────────────────── */}
            {explanations && (
                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-900">Why These Results?</h3>
                    <div className="space-y-4">
                        {explanations.missing_explanations?.length > 0 && (
                            <div className="bg-surface rounded-xl border border-slate-200 p-6 shadow-sm"><div className="flex flex-col gap-4"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-orange-500 text-xl">psychology_alt</span><h4 className="font-bold text-slate-900 text-base">Missing Industry Skills Explanation</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><ul className="list-disc list-inside space-y-2 text-sm text-slate-600 marker:text-slate-300"><li>Identified as high-frequency keywords across uploaded job descriptions.</li><li>Contextual analysis shows these skills are required, not just optional.</li><li>No corresponding topic or learning outcome detected in the syllabus text.</li></ul><div className="bg-orange-50/50 rounded-lg p-4 border border-orange-100/60"><div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-orange-600 text-sm">lightbulb</span><span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Example</span></div><div className="text-sm"><span className="font-semibold text-slate-800">Skill: </span><span className="text-slate-700">'{explanations.missing_explanations[0].skill}'</span><br /><span className="font-semibold text-slate-800">Reason: </span><span className="text-slate-600">{explanations.missing_explanations[0].reason}</span></div></div></div></div></div>
                        )}
                        {explanations.overlap_explanations?.length > 0 && (
                            <div className="bg-surface rounded-xl border border-slate-200 p-6 shadow-sm"><div className="flex flex-col gap-4"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-emerald-500 text-xl">fact_check</span><h4 className="font-bold text-slate-900 text-base">Skill Overlap Explanation</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><ul className="list-disc list-inside space-y-2 text-sm text-slate-600 marker:text-slate-300"><li>Strong semantic match between syllabus learning outcomes and job requirements.</li><li>Both documents reference similar proficiency levels and contexts.</li><li>Validated presence in core curriculum modules.</li></ul><div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-100/60"><div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-emerald-600 text-sm">lightbulb</span><span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Example</span></div><div className="text-sm"><span className="font-semibold text-slate-800">Skill: </span><span className="text-slate-700">'{explanations.overlap_explanations[0].skill}'</span><br /><span className="font-semibold text-slate-800">Reason: </span><span className="text-slate-600">{explanations.overlap_explanations[0].reason}</span></div></div></div></div></div>
                        )}
                        {explanations.low_relevance_explanations?.length > 0 && (
                            <div className="bg-surface rounded-xl border border-slate-200 p-6 shadow-sm"><div className="flex flex-col gap-4"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-500 text-xl">manage_search</span><h4 className="font-bold text-slate-900 text-base">Low Industry Relevance Topics Explanation</h4></div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><ul className="list-disc list-inside space-y-2 text-sm text-slate-600 marker:text-slate-300"><li>Topic present in syllabus but absent or rarely mentioned in current job market data.</li><li>May be considered legacy or foundational theory with less direct application.</li><li>Suggestion to review necessity or modernize approach.</li></ul><div className="bg-slate-50 rounded-lg p-4 border border-slate-100"><div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-slate-500 text-sm">lightbulb</span><span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Example</span></div><div className="text-sm"><span className="font-semibold text-slate-800">Topic: </span><span className="text-slate-700">'{explanations.low_relevance_explanations[0].skill}'</span><br /><span className="font-semibold text-slate-800">Reason: </span><span className="text-slate-600">{explanations.low_relevance_explanations[0].reason}</span></div></div></div></div></div>
                        )}
                    </div>
                    <div className="flex justify-center mt-4"><p className="text-xs text-slate-400 italic max-w-2xl text-center">Disclaimer: These explanations are generated based on the specific documents uploaded and deterministic text analysis. Results may vary based on document quality and formatting.</p></div>
                </div>
            )}
        </>
    );
};

export default Workspace;
