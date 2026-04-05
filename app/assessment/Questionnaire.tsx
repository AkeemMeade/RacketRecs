"use client";
import { useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Outfit} from 'next/font/google';

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

interface Answer{
  experience?: string;
  brand?: string;
  racket_budget?: string;
  string_budget?: string;
  injury?: string;
  game_type?: string;
  strung?: string;
  play_style?: string;
  sport_background?: string;
  age_range?: string;
}

const supabase = createClient();

//Answers for questions 1-5*
const Answers_q1 = ['Beginner', 'Intermediate', 'Advanced']
const Answers_q2 = ['Yonex', 'Victor', 'Li-Ning', 'None']
const Answers_q3 = ['$10 - $49.99', '$50 - $129.99', '$130 - $249.99', '$250+']
const Answers_q4 = ['$3 - $8.99', '$9 - $15.99', '$16 - $24.99', '$25+']
const Answers_q5 = ['Wrist', 'Elbow/Shoulder', 'Both', 'Neither']
const Answers_q6 = ['Singles', 'Doubles', 'Both']
const Answers_q7 = ['Yes', 'No']
const Answers_q8 = ['5-10', '11-15', '16+']
const Answers_q9 = ['Aggressive', 'Defensive', 'Balanced']
const Answers_q10 = ['Baseball', 'Tennis', 'Squash', 'None']


export default function Questionnaire() {
  
  const [answer, setAnswer] = useState<Answer>({});
  const [isComplete, setIsComplete] = useState(false);

  //Submits responses to supabase
  const dataSubmit = async () =>{
    const {error } = await supabase
    .from('assessment_response')
    .insert([answer]);
    setIsComplete(true);
  }


  //Page redirect for when assessment response is submitted
  if(isComplete){
    return(
      <div>
        <h1 className = "text-center text-xl mt-30" >
          Placeholder for recommendation engine:
          Generating recommendation... 
          </h1>
      </div>
    )
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
        Do you have a preferred brand?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q2.map((ans) => (
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

      {/* Question 3*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What is your budget for a racket?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q3.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.racket_budget === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, racket_budget: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 4*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What is your budget for a string?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q4.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.string_budget === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, string_budget: ans})}>
            {ans}
            </button>
        ))}

      </div>


      {/* Question 5*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        Do you have any injuries in the following areas?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q5.map((ans) => (
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


      {/* Question 6*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What version of badminton do you typically play?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q6.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.game_type === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, game_type: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 7*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        Do you want a racket that comes strung?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q7.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.strung === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, strung: ans})}>
            {ans}
            </button>
        ))}

      </div>


      {/* Question 8*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        What is your age range?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q8.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.age_range === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, age_range: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 9*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        How would you describe your play-style?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q9.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.play_style === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, play_style: ans})}>
            {ans}
            </button>
        ))}

      </div>

      {/* Question 10*/}
      <p className={"text-black  font-bold p-3 shadow-md text-lg mb-3"}>
        Have you played any of the following sports?
        </p>
      <div className="flex gap-5 mb-8 ">
        {Answers_q10.map((ans) => (
          <button 
          className = {`max-w-2xl w-full bg-[#FFC038] hover:opacity-70 text-black transition-all py-4 rounded-[16px] font-bold text-lg ${
            answer.sport_background === ans
            ? 'bg-[#FFC038] text-black'
            : 'bg-white/20 text-black'

          }`}
          key = {ans} onClick = {() => setAnswer({...answer, sport_background: ans})}>
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