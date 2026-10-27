import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  PieChart,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';

export const TOUR_STEPS = [
  {
    step: 1,
    id: 'welcome',
    title: 'Welcome to Cohesora',
    description: "Cohesora helps your team check content against approved brand rules before it goes public. Let's explore how it works.",
    targetSelector: '[data-tour="brand-header"]',
    tab: 'submissions',
    placement: 'bottom',
    icon: ShieldCheck
  },
  {
    step: 2,
    id: 'dashboard',
    title: 'Your Workspace at a Glance',
    description: 'Find recent reviews, pending tasks and important updates in one place.',
    targetSelector: '[data-tour="submissions-overview"]',
    tab: 'submissions',
    placement: 'bottom',
    icon: FileText
  },
  {
    step: 3,
    id: 'brand-rules',
    title: 'Keep Brand Rules Together',
    description: 'Manage approved terminology, product facts, promotional conditions, disclaimers and brand guidelines in one place.',
    targetSelector: '[data-tour="nav-rules"]',
    tab: 'rules',
    placement: 'bottom',
    icon: Layers
  },
  {
    step: 4,
    id: 'rule-sources',
    title: 'Know Which Rules Apply',
    description: "Check a rule's source, version and validity dates to understand whether it applies to your content.",
    targetSelector: '[data-tour="rules-registry-container"]',
    tab: 'rules',
    placement: 'bottom',
    icon: Layers
  },
  {
    step: 5,
    id: 'submit-content',
    title: 'Submit Content for Review',
    description: 'Submit a text draft or supported image so Cohesora can check it before publication.',
    targetSelector: '[data-tour="btn-new-submission"]',
    tab: 'submissions',
    placement: 'left',
    icon: FileText
  },
  {
    step: 6,
    id: 'campaign-context',
    title: 'Choose the Right Context',
    description: 'Select the available campaign and publishing channel so the review uses the relevant active brand rules.',
    targetSelector: '[data-tour="filter-toolbar"]',
    tab: 'submissions',
    placement: 'bottom',
    icon: Compass
  },
  {
    step: 7,
    id: 'review-content',
    title: 'See How Cohesora Checks Content',
    description: 'Cohesora combines defined rule checks with AI-assisted analysis and visual checks for supported creatives.',
    targetSelector: '[data-tour="review-checks-area"]',
    tab: 'submissions',
    placement: 'top',
    icon: Sparkles
  },
  {
    step: 8,
    id: 'findings-evidence',
    title: 'Understand Every Finding',
    description: 'See what was flagged and why. Claims without enough approved evidence are marked for verification rather than automatically treated as false.',
    targetSelector: '[data-tour="findings-evidence-panel"]',
    tab: 'submissions',
    placement: 'top',
    icon: ShieldCheck
  },
  {
    step: 9,
    id: 'corrections',
    title: 'Improve Your Content',
    description: 'Review suggested corrections, make changes and run the checks again to resolve outstanding issues.',
    targetSelector: '[data-tour="corrections-actions"]',
    tab: 'submissions',
    placement: 'top',
    icon: CheckCircle2
  },
  {
    step: 10,
    id: 'approvals-governance',
    title: 'Approve with Confidence',
    description: 'Authorised reviewers make the final decision. Review history helps your team track decisions and identify recurring problems.',
    targetSelector: '[data-tour="nav-insights"]',
    tab: 'insights',
    placement: 'bottom',
    icon: PieChart
  }
];

export function OnboardingTour({
  isOpen,
  onClose,
  activeTab,
  onNavigateTab
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [targetFound, setTargetFound] = useState(false);
  const tooltipRef = useRef(null);

  const step = TOUR_STEPS[currentStepIndex];
  const StepIcon = step?.icon || Sparkles;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Measure and position target
  const updatePosition = useCallback(() => {
    if (!isOpen || !step) return;

    let el = document.querySelector(step.targetSelector);
    // If not found, look for fallback containers
    if (!el && step.tab === 'submissions') {
      el = document.querySelector('[data-tour="submissions-overview"]');
    }
    if (!el && step.tab === 'rules') {
      el = document.querySelector('[data-tour="rules-registry-container"]') || document.querySelector('[data-tour="nav-rules"]');
    }
    if (!el && step.tab === 'insights') {
      el = document.querySelector('[data-tour="nav-insights"]');
    }

    if (el) {
      setTargetFound(true);
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right
      });

      // Scroll into view gently if outside visible viewport
      const inView =
        rect.top >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight);
      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      // Compute tooltip placement
      const tooltipWidth = Math.min(380, window.innerWidth - 32);
      const tooltipHeight = 220;
      const padding = 16;
      let top = 0;
      let left = 0;

      const placement = step.placement || 'bottom';

      if (placement === 'bottom') {
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (placement === 'top') {
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
      } else if (placement === 'left') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
      } else if (placement === 'right') {
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
      }

      // Constrain inside viewport
      left = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, left));
      if (top < 16) {
        top = rect.bottom + padding;
      }
      if (top + tooltipHeight > window.innerHeight - 16) {
        top = Math.max(16, rect.top - tooltipHeight - padding);
      }

      setTooltipPos({ top, left });
    } else {
      setTargetFound(false);
      setTargetRect(null);
      // Center in viewport as graceful fallback
      const tooltipWidth = Math.min(420, window.innerWidth - 32);
      setTooltipPos({
        top: Math.max(40, window.innerHeight / 2 - 120),
        left: Math.max(16, window.innerWidth / 2 - tooltipWidth / 2)
      });
    }
  }, [isOpen, step]);

  // Navigate tab if necessary when step changes
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.tab && activeTab !== step.tab && onNavigateTab) {
      onNavigateTab(step.tab);
    }

    // Give DOM a tick to render destination page
    const timer = setTimeout(() => {
      updatePosition();
    }, 180);

    return () => clearTimeout(timer);
  }, [isOpen, currentStepIndex, step?.tab, activeTab, onNavigateTab, updatePosition]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updatePosition]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('cohesora_tour_completed', 'true');
    } catch (e) {}
    onClose();
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('cohesora_tour_completed', 'true');
    } catch (e) {}
    onClose();
  };

  if (!isOpen || !step) return null;

  return (
    <div
      role="dialog"
      aria-label="Cohesora Interactive Product Tour"
      aria-modal="true"
      className="fixed inset-0 z-[9999] pointer-events-auto"
    >
      {/* Target spotlight cutout */}
      {targetRect && targetFound && (
        <div
          className="fixed rounded-xl border-3 border-[#F59E0B] transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(11, 30, 54, 0.72), 0 0 25px rgba(245, 158, 11, 0.45)'
          }}
        />
      )}

      {/* Fallback dim backdrop if no specific rect */}
      {(!targetRect || !targetFound) && (
        <div className="fixed inset-0 bg-[#0B1E36]/75 backdrop-blur-[1px] transition-opacity duration-200" />
      )}

      {/* Popover Card */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] w-[90vw] max-w-[390px] bg-white border-3 border-[#0B1E36] rounded-2xl shadow-[6px_6px_0px_#0B1E36] p-5 animate-in fade-in zoom-in-95 duration-200 select-none"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left
        }}
      >
        {/* Step Counter & Progress bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 font-mono font-black text-[11px] uppercase tracking-wider border border-amber-300">
              <StepIcon className="w-3.5 h-3.5 text-amber-700" />
              <span>Step {step.step} of 10</span>
            </span>
          </div>

          <button
            onClick={handleSkip}
            aria-label="Exit onboarding tour"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#0B1E36] hover:bg-slate-100 transition cursor-pointer"
            title="Skip Tour (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress track */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-200">
          <div
            className="bg-[#F59E0B] h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(step.step / 10) * 100}%` }}
          />
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-[#0B1E36] tracking-tight leading-snug mb-2 flex items-center gap-2">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 font-sans leading-relaxed mb-5">
          {step.description}
        </p>

        {/* Footer controls */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handleSkip}
            className="text-[11px] font-mono font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer uppercase tracking-wider"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-bold text-[#0B1E36] bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-300 cursor-pointer"
                title="Previous step (Left Arrow)"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-black text-[#0B1E36] bg-[#F59E0B] hover:bg-[#D97706] rounded-lg transition border-2 border-[#0B1E36] shadow-[2px_2px_0px_#0B1E36] cursor-pointer"
              title={isLastStep ? 'Complete onboarding tour' : 'Next step (Right Arrow / Enter)'}
            >
              <span>{isLastStep ? 'Finish Tour' : 'Next'}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0B1E36]" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5 text-[#0B1E36]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
