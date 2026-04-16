/**
 * frontend/components/dashboard/JobGrid.tsx
 * HuntAI - AI Job Hunter Agent
 * Dynamic grid for job result cards
 */

import React from "react";
import JobCard from "./JobCard";
import { Job, PipelineStatus } from "../../types";

interface JobGridProps {
    jobs: Job[];
    status: PipelineStatus;
}

const JobGrid: React.FC<JobGridProps> = ({ jobs, status }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {jobs.map((job, index) => (
                <JobCard key={job.job_url || index} job={job} index={index} />
            ))}
            
            {/* Loading Placements (if running) */}
            {status === 'running' && (
                <div className="flex flex-col p-6 glass rounded-3xl border border-white/10 opacity-30 animate-pulse">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20" />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="h-4 bg-white/20 w-1/3 rounded-full" />
                            <div className="h-6 bg-white/10 w-full rounded-full" />
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/10" />
                    </div>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-6 bg-white/10 w-16 rounded-full" />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobGrid;
