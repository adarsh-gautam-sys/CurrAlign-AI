import React from 'react';

const Features = () => {
    return (
        <section className="space-y-8">
            <div className="flex flex-col gap-3">
                <h2 className="text-slate-900 text-2xl font-bold tracking-tight">How It Works</h2>
                <p className="text-slate-600 max-w-2xl">Our tool simplifies the complex process of curriculum validation using advanced analytics to ensure your students are prepared for the real world.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-surface rounded-xl p-6 border border-slate-200 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                    </div>
                    <h3 className="text-slate-900 text-lg font-bold mb-2">Syllabus Upload</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Easily upload your course PDFs or text files. Our parser extracts key learning outcomes automatically.
                    </p>
                </div>
                <div className="group bg-surface rounded-xl p-6 border border-slate-200 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">work</span>
                    </div>
                    <h3 className="text-slate-900 text-lg font-bold mb-2">Job Market Comparison</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Compare your curriculum against thousands of real-time job listings to find critical alignment gaps.
                    </p>
                </div>
                <div className="group bg-surface rounded-xl p-6 border border-slate-200 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">lightbulb</span>
                    </div>
                    <h3 className="text-slate-900 text-lg font-bold mb-2">Explainable Results</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Get detailed, AI-generated insights on where your content aligns and suggestions for improvement.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Features;
