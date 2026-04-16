"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Outfit } from "next/font/google";
import { useRouter } from "next/navigation";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

interface Answer{
  experience?: string;
  event?: string;
  playstyle?: string;
  playloc?: string;
  movement?: string;
  strength?: string;
  injury?: string;
  feel?: string;
  budget?: string;
  brand?: string;
}


const supabase = createClient();

const questions = [
  {
    key: "experience",
    label: "What is your experience level?",
    answers: ["Beginner", "Intermediate", "Advanced"],
  },
  {
    key: "event",
    label: "What event do you play?",
    answers: ["Singles", "Doubles", "Mixed", "All"],
  },
  {
    key: "playstyle",
    label: "What is your preferred playstyle?",
    answers: [
      "Aggressive (Attacking / Smashing)",
      "Defensive (Control & Placement)",
      "Balanced",
      "Not sure",
    ],
  },
  {
    key: "playloc",
    label: "Where do you usually play on court?",
    answers: ["Front / Net", "Backcourt", "Both"],
  },
  {
    key: "movement",
    label: "How would you describe your movement speed?",
    answers: ["Fast / Explosive", "Slower / Prefer easier swings"],
  },
  {
    key: "strength",
    label: "How strong is your swing?",
    answers: [
      "Strong (I can generate power easily)",
      "Average",
      "Weak (I struggle to generate power)",
    ],
  },
  {
    key: "injury",
    label: "Do you have any joint or muscle issues?",
    answers: ["Wrist pain", "Shoulder pain", "Both", "None"],
  },
  {
    key: "feel",
    label: "What racket feel do you prefer?",
    answers: [
      "Stiff / precise",
      "Flexible / easier power generation",
      "Not sure",
    ],
  },
  {
    key: "budget",
    label: "What is your budget?",
    answers: [
      "Under $50",
      "$50 - $100",
      "$100 - $200",
      "$200+",
      "No preference",
    ],
  },
  {
    key: "brand",
    label: "Do you have any preferred brands?",
    answers: ["Yonex", "Victor", "Li-Ning", "Hundred", "Other", "None"],
  },
];

export default function Questionnaire() {
  const [answer, setAnswer] = useState<Answer>({});
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const current = questions[currentStep];
  const selectedValue = answer[current.key as keyof Answer];
  const isLast = currentStep === questions.length - 1;

  const handleNext = () => {
    if (currentStep < questions.length - 1) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const dataSubmit = async () => {
    await supabase.from("assessment_response").insert([answer]);
    router.push("/recommendation");
  };

  return (
    <div className={`${outfit.className} min-h-screen`}>
      
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10"/>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-white drop-shadow-sm mb-1">
            Player Assessment
          </h1>
          <p className="text-white/80 text-sm">
            Question {currentStep + 1} of {questions.length}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl p-8">
          <p className="text-lg font-bold text-slate-800 mb-6">
            {current.label}
          </p>

          <div className="flex flex-col gap-3">
            {current.answers.map((ans) => {
              const isSelected = selectedValue === ans;
              return (
                <button
                  key={ans}
                  onClick={() => setAnswer({ ...answer, [current.key]: ans })}
                  className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-sm transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "bg-[#FFC038] border-[#FFC038] text-white shadow-md scale-[1.01]"
                      : "bg-white border-gray-200 text-slate-700 hover:border-[#FFC038] hover:bg-amber-50"
                  }`}
                >
                  {ans}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-2.5 rounded-full border-2 border-gray-200 text-slate-600 text-sm font-semibold hover:border-gray-400 transition disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            {isLast ? (
              <button
                onClick={dataSubmit}
                disabled={!selectedValue}
                className="px-8 py-2.5 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Submit →
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!selectedValue}
                className="px-8 py-2.5 rounded-full bg-[#FFC038] text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
