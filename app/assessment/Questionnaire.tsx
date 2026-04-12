"use client";
import { useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Outfit} from 'next/font/google';
import {useRouter} from 'next/navigation';

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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

//Answers for questions 1-10
const Answers_q1 = ['Beginner', 'Intermediate', 'Advanced']
const Answers_q2 = ['Singles', 'Doubles', 'Mixed', 'All']
const Answers_q3 = ['Agressive(Attacking / Smashing)', 'Defensive(Control & Placement)', 'Balanced', 'Not sure']
const Answers_q4 = ['Front / Net', 'Backcourt', 'Both']
const Answers_q5 = ['Fast / Explosive', 'Slower / Prefer easier swings']
const Answers_q6 = ['Strong (I can generate power easily)', 'Average', 'Weak (I struggle to generate power / hit to backcourt)']
const Answers_q7 = ['Wrist pain', 'Shoulder pain', 'Both', 'None']
const Answers_q8 = ['Stiff / precise', 'Flexible / easier power generation', 'Not sure']
const Answers_q9 = ['Under $50', '$50 - $100', '$100 - $200', '$200+', 'No preference']
const Answers_q10 = ['Yonex', 'Victor', 'Li-Ning', 'Hundred', 'Other', 'None']


export default function Questionnaire() {
  
  const [answer, setAnswer] = useState<Answer>({});
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  //Submits responses to supabase
  const dataSubmit = async () =>{
    const {error } = await supabase
    .from('assessment_response')
    .insert([answer]);
    setIsComplete(true);
    router.push('/recommendation');
  }

  return (
    <div >
      {/* gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

      <div className="mx-auto rounded-3xl p-10 shadow-xl bg-white/70 max-w-2xl">
        <h1 className={`${outfit.className} text-black  text-5xl font-bold mb-10 text-center `}>
        Player Assessment
      </h1>


      {/* Question 1*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What is your experience level?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q1.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.experience === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, experience: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 2*/}
      <p className={"text-black font-bold p-3 shadow-md text-lg mb-3"}>
        What event do you play?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q2.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.event === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, event: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 3*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What is your preferred playstyle?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q3.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.playstyle === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, playstyle: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 4*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        Where do you usually play on court?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q4.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.playloc === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, playloc: ans})}>
            {ans}
            </button>
        ))}

      </div>


      {/* Question 5*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        How would you describe your movement speed?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q5.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.movement === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, movement: ans})}>
            {ans}
            </button>
        ))}

      </div>


      {/* Question 6*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        How strong is your swing?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q6.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.strength === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, strength: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 7*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        Do you have any joint / muscle issues with any of the following?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q7.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.injury === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, injury: ans})}>
            {ans}
            </button>
        ))}

      </div>


      {/* Question 8*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What racket feel do you prefer?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q8.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.feel === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, feel: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 9*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What is your budget?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q9.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.budget === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, budget: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 10*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        Do you have any preferred brands?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q10.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.brand === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, brand: ans})}>
            {ans}
            </button>
        ))}

      </div>
            {/* Submit button */}
      <button
       onClick={dataSubmit}
       className={"transition-all font-bold w-full bg-[#FFC038] py-4 text-black rounded-full text-lg hover:opacity-70"}

       >Submit</button>

       {/* Data submission preview for testing */}
       <p>Data to be sent to supabase:{JSON.stringify(answer)}</p>

    </div>
        
      </div>
      
  );
}