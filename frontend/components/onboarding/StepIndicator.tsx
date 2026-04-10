/**
 * frontend/components/onboarding/StepIndicator.tsx
 * HuntAI - AI Job Hunter Agent
 * Visual dots for onboarding steps
 */

import React from "react";

interface StepIndicatorProps {
    currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    return (
        <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="flex items-center">
                    <div
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            s === currentStep
                                ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] scale-125"
                                : s < currentStep
                                ? "bg-green-500 scale-100"
                                : "bg-white/10"
                        }`}
                        title={`Step ${s}`}
                    />
                    {s < 5 && (
                        <div
                            className={`w-4 h-[1px] ml-2 transition-all duration-300 ${
                                s < currentStep ? "bg-green-500/50" : "bg-white/5"
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};

export default StepIndicator;
