import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Workspace from './components/Workspace';
import Footer from './components/Footer';

const API_BASE = 'http://localhost:8000';

function App() {
    const [backendStatus, setBackendStatus] = useState('Checking backend...');
    const [isConnected, setIsConnected] = useState(false);

    // ── Shared analysis state (lifted from Workspace) ──────
    const [analysisState, setAnalysisState] = useState({
        syllabusFile: null,
        jobFiles: [],
        pipelineSteps: { document_parsing: 'idle', text_extraction: 'idle', skill_identification: 'idle', alignment: 'idle' },
        curriculumSkills: [],
        industrySkills: [],
        alignmentData: null,
        explanations: null,
        readiness: null,
        perfData: null,
        analyzing: false,
        demoMode: false,
        demoStatus: null, // null | 'running' | 'done' | 'error'
        error: null,
    });

    // ── About modal state ──────────────────────────────────
    const [showAbout, setShowAbout] = useState(false);

    // ── Section refs for scroll navigation ─────────────────
    const topRef = useRef(null);
    const workspaceRef = useRef(null);
    const readinessRef = useRef(null);
    const judgeRef = useRef(null);

    // Derived: does an analysis exist?
    const hasAnalysis = analysisState.alignmentData !== null;

    // ── Health check ───────────────────────────────────────
    useEffect(() => {
        fetch(`${API_BASE}/health`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'ok') { setBackendStatus('Backend connected'); setIsConnected(true); }
                else { setBackendStatus('Backend not connected'); setIsConnected(false); }
            })
            .catch(() => { setBackendStatus('Backend not connected'); setIsConnected(false); });
    }, []);

    // ── Scroll navigation ──────────────────────────────────
    const scrollTo = useCallback((target) => {
        const refs = { top: topRef, workspace: workspaceRef, readiness: readinessRef, judge: judgeRef };
        if (target === 'about') { setShowAbout(true); return; }
        const ref = refs[target];
        if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    // ── Demo flow ──────────────────────────────────────────
    const runDemo = useCallback(async () => {
        // Prevent duplicate runs
        if (analysisState.analyzing || analysisState.demoStatus === 'running') return;

        setAnalysisState(prev => ({
            ...prev,
            analyzing: true,
            demoMode: true,
            demoStatus: 'running',
            error: null,
        }));

        try {
            const res = await fetch(`${API_BASE}/demo/run`, { method: 'POST' });
            if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Demo failed'); }
            const data = await res.json();

            setAnalysisState(prev => ({
                ...prev,
                syllabusFile: data.demo_files.syllabus,
                jobFiles: data.demo_files.jobs,
                pipelineSteps: data.steps,
                curriculumSkills: data.skills.curriculum,
                industrySkills: data.skills.industry,
                alignmentData: data.alignment,
                explanations: data.explanations,
                readiness: data.readiness,
                perfData: data.performance,
                analyzing: false,
                demoStatus: 'done',
                error: null,
            }));

            // Scroll to results after a beat
            setTimeout(() => {
                if (readinessRef.current) readinessRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);

        } catch (err) {
            setAnalysisState(prev => ({
                ...prev,
                analyzing: false,
                demoStatus: 'error',
                error: 'Demo unavailable — please run manual analysis',
            }));
        }
    }, [analysisState.analyzing, analysisState.demoStatus]);

    // ── Reset analysis ─────────────────────────────────────
    const resetAnalysis = useCallback(() => {
        setAnalysisState({
            syllabusFile: null,
            jobFiles: [],
            pipelineSteps: { document_parsing: 'idle', text_extraction: 'idle', skill_identification: 'idle', alignment: 'idle' },
            curriculumSkills: [],
            industrySkills: [],
            alignmentData: null,
            explanations: null,
            readiness: null,
            perfData: null,
            analyzing: false,
            demoMode: false,
            demoStatus: null,
            error: null,
        });
    }, []);

    // ── Hero button handlers ───────────────────────────────
    const handleStartAnalysis = useCallback(() => {
        scrollTo('workspace');
    }, [scrollTo]);

    const handleViewDemo = useCallback(() => {
        runDemo();
    }, [runDemo]);

    return (
        <div className="bg-background-light font-body text-slate-900 min-h-screen flex flex-col antialiased selection:bg-primary/20">
            <Navbar onNavigate={scrollTo} hasAnalysis={hasAnalysis} />
            <main className="flex-grow flex flex-col items-center w-full">
                <div className="w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 space-y-16">
                    <div ref={topRef}>
                        <Hero onStartAnalysis={handleStartAnalysis} onViewDemo={handleViewDemo} />
                    </div>
                    <Features />
                    <Workspace
                        analysisState={analysisState}
                        setAnalysisState={setAnalysisState}
                        workspaceRef={workspaceRef}
                        readinessRef={readinessRef}
                        judgeRef={judgeRef}
                        onRunDemo={runDemo}
                        onResetAnalysis={resetAnalysis}
                    />
                </div>
            </main>

            {/* ── About Modal ───────────────────────────────── */}
            {showAbout && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAbout(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-xl">analytics</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">About CurrAlign AI</h3>
                        </div>
                        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Problem Statement</h4>
                                <p>Academic curricula often lag behind rapidly evolving industry requirements, creating a skills gap that affects graduate employability. Manually comparing syllabi with job market demands is time-consuming and subjective.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Our Solution</h4>
                                <p>CurrAlign AI uses NLP-powered skill extraction and deterministic alignment analysis to automatically identify skill gaps, overlaps, and modernization opportunities between any curriculum and current job postings.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-1">Privacy-First, On-Device</h4>
                                <p>All processing runs locally on your device. No data is sent to external servers. Designed to leverage AMD Ryzen™ AI hardware for responsive, private analysis of sensitive educational documents.</p>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                            <span>Built for AMD Slingshot Hackathon</span>
                            <span>v2.4.0</span>
                        </div>
                    </div>
                </div>
            )}

            <Footer status={backendStatus} isConnected={isConnected} />
        </div>
    );
}

export default App;
