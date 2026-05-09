"use client";
import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, Box, Typography } from '@mui/material';
import { DM_Serif_Display, DM_Sans } from "next/font/google";
import { Outfit } from "next/font/google";
import {useRouter} from 'next/navigation';
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});
const outfit = Outfit({ subsets: ["latin"], weight: "400" });

const supabase = createClient();

interface Racket {
  racket_id?: number;
  manufacturer_id?: number;
  name?: string;
  balance?: string;
  stiffness?: string;
  price?: number;
  max_tension?: string;
  availability?: string;
  description?: string;
  color?: string;
  weight?: string;
  img_url?: string;
  summary?: string;
}

export default function RecommendationEngine() {
  const [choice, setChoice] = useState<Racket[]>([]);
  const labels = ["🏆 Top Choice", "🥈 Second Best", "🥉 Third Best"]
  const router = useRouter();

  const stringRec = async () =>{
    router.push('/stringrec')
  
  }

  useEffect(() => {
    const getRec = async () => {
      const {data:{user}} = await supabase.auth.getUser();
      const { data: ans } = await supabase
        .from('assessment_response')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const answerF = {
        experience: ans.experience,
        playstyle: ans.playstyle,
        playloc: ans.playloc,
        brand: ans.brand,
        movement: ans.movement,
        event: ans.event,
        strength: ans.strength,
        injury: ans.injury,
        feel: ans.feel,
        budget: ans.budget,
      };

      // Step 1: Get rackets from Flask
      try {
        const res = await fetch('http://localhost:3001/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answerF),
        });

        if (!res.ok) {
          console.error('Flask error:', res.status);
          return;
        }

        const rackets: Racket[] = await res.json();

        // Step 2: Generate summary for each racket
        const racketWithSummaries = await Promise.all(
          rackets.map(async (racket) => {
            try {
              const summaryRes = await fetch('/api/recommend-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [
                    {
                      role: 'user',
                      content: `The user has the following profile:
- Experience: ${answerF.experience}
- Playstyle: ${answerF.playstyle}
- Play location: ${answerF.playloc}
- Movement: ${answerF.movement}
- Strength: ${answerF.strength}
- Event: ${answerF.event}
- Injury: ${answerF.injury}
- Feel preference: ${answerF.feel}
- Budget: ${answerF.budget}

The recommended racket is:
- Name: ${racket.name}
- Balance: ${racket.balance}
- Stiffness: ${racket.stiffness}
- Max Tension: ${racket.max_tension}
- Weight: ${racket.weight}
- Price: $${racket.price}

In 2-3 sentences, explain why this racket is a good match for this user. Be specific and concise.`,
                    },
                  ],
                }),
              });

              const summaryData = await summaryRes.json();
              return { ...racket, summary: summaryData.reply };
            } catch (err) {
              console.error('Summary error:', err);
              return { ...racket, summary: '' };
            }
          })
        );

        setChoice(racketWithSummaries);
      } catch (err) {
        console.error('Recommendation fetch failed:', err);
      }
    };

    getRec();
  }, []);

  return (
    <div>
      
      <div className="-mt-15 max-w-[1250px] mx-auto px-4 py-12"/>
      

 
      <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: '1000', fontSize: '45px', marginBottom:'30px', fontFamily: outfit.style.fontFamily }}>
          Racket Recommendations
      </Typography>
      <div className="bg-white/70 backdrop-blur-sm shadow-xl  rounded-2xl p-22  mx-auto mt-8, max-w-[1400px]">

        <div className="justify-center flex flex-wrap gap-9">

          {choice.map((racket, index) => (

            <div className="flex flex-col items-center w-96"> 
              
            <Typography variant = "caption" sx={{marginRight:'30px', color: '#000000', fontWeight: '900', fontSize:'30px', marginBottom:'24px', fontFamily: outfit.style.fontFamily}}>
              {labels[index] || ""}
                  
            </Typography>

            <div className="w-full rounded-xl shadow-md bg-white p-4">

              <Box>
                <Typography variant = "caption" sx={{color: '#2c97e2', textAlign: 'left', fontWeight: '500', fontSize:'22px', fontFamily: outfit.style.fontFamily}}>
                  
                  Name:  
                  </Typography>
                  <Typography variant = "caption" sx={{marginLeft:'8px', color: '#000000', textAlign: 'left', fontWeight: '500', fontSize:'22px' , fontFamily: dmSans.style.fontFamily}}>
                  
                  {racket.name}
                  </Typography>

                  
                </Box>

                <Box>
                  <Typography variant = "caption" sx={{color: '#2c97e2', textAlign: 'left', fontWeight: '500', fontSize:'22px', fontFamily: outfit.style.fontFamily}}>
                  Color: 
                  </Typography>
                  <Typography variant = "caption" sx={{marginLeft:'8px',color: '#000000', textAlign: 'left', fontWeight: '500', fontSize:'22px', fontFamily: dmSans.style.fontFamily}}>
                  
                   {racket.color}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant = "caption" sx={{color: '#2c97e2', textAlign: 'left', fontWeight: '500', fontSize:'22px' , fontFamily: outfit.style.fontFamily}}>
                  Price: 
                  </Typography>

                  <Typography variant = "caption" sx={{marginLeft:'8px', color: '#000000', textAlign: 'left', fontWeight: '500', fontSize:'22px' , fontFamily: dmSans.style.fontFamily}}>
                  
                  ${racket.price}
                  </Typography>

                {racket.summary && (
                  <Typography sx={{ mt: 1, fontSize: '14px', color: '#444', fontStyle: 'italic' }}>
                    {racket.summary}
                  </Typography>
                )}

                <Box sx={{ mt: 1 }}>
                  <img
                    src={racket.img_url}
                    alt={racket.name}
                    style={{ border: '4px solid' }}
                  />
                </Box>
              </Box>
              
            </div>
            </div>
          ))}
          <button
                onClick={stringRec}
                className={"transition-all mt-5 w-200 font-bold bg-[#FFC038] shadow-md duration-200 py-4 text-black rounded-full text-lg hover:opacity-70"}

                >See Recommended Strings
            </button>
        </div>
      </div>
    </div>
  );
}