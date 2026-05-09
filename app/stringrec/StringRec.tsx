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

interface String {
  String_id?: number;
  manufacturer_id?: number;
  name?: string;
  gauge?: number;
  feel?: string;
  img_url?: string;
}

export default function StringRecommendation() {
  const [choice, setChoice] = useState<String[]>([]);
  const labels = ["🏆 Top Choice", "🥈 Second Best", "🥉 Third Best"]
  const router = useRouter();

  const stringRec = async () =>{
    router.push('/recommendation')
  
  }

  useEffect(() => {
    const getRec = async () => {
      const {data:{user}} = await supabase.auth.getUser();
      const { data: ans } = await supabase
        .from('assessment_response')
        .select('*')
        .eq('user_id', user?.id)
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

      // Step 1: Get Strings from Flask
      try {
        const res = await fetch('http://localhost:3001/api/stringrec', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answerF),
        });

        if (!res.ok) {
          console.error('Flask error:', res.status);
          return;
        }

      const rec = await res.json();
      setChoice(rec);
        } catch (err) {
        console.error('Recommendation fetch failed:', err);
      }


    };
    getRec();
    },[]);
    
  return (
    <div>
      
      <div className="-mt-15 max-w-[1250px] mx-auto px-4 py-12"/>
      

 
      <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: '1000', fontSize: '45px', marginBottom:'30px', fontFamily: outfit.style.fontFamily }}>
          String Recommendations
      </Typography>
      <div className="bg-white/70 backdrop-blur-sm shadow-xl  rounded-2xl p-22  mx-auto mt-8, max-w-[1400px]">

        <div className="justify-center flex flex-wrap gap-9">

          {choice.map((String, index) => (

            <div className="flex flex-col items-center w-96"> 
              
            <Typography variant = "caption" sx={{marginRight:'30px',color: '#000000', fontWeight: '900', fontSize:'30px', marginBottom:'24px', fontFamily: outfit.style.fontFamily}}>
              {labels[index] || ""}
                  
            </Typography>

            <div className="w-full rounded-xl shadow-md bg-white p-4">

              <Box>
                <Typography variant = "caption" sx={{color: '#2c97e2', textAlign: 'left', fontWeight: '500', fontSize:'22px', fontFamily: outfit.style.fontFamily}}>
                  
                  Name:  
                  </Typography>
                  <Typography variant = "caption" sx={{marginLeft:'8px', color: '#000000', textAlign: 'left', fontWeight: '500', fontSize:'22px' , fontFamily: dmSans.style.fontFamily}}>
                  
                  {String.name}
                  </Typography>

                  
                </Box>

                <Box>
                  <Typography variant = "caption" sx={{color: '#2c97e2', textAlign: 'left', fontWeight: '500', fontSize:'22px', fontFamily: outfit.style.fontFamily}}>
                  Gauge: 
                  </Typography>
                  <Typography variant = "caption" sx={{marginLeft:'8px',color: '#000000', textAlign: 'left', fontWeight: '500', fontSize:'22px', fontFamily: dmSans.style.fontFamily}}>
                  
                   {String.gauge}
                  </Typography>
                </Box>

                <Box>

                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'  }}>
                  <img
                    src={String.img_url}
                    alt={String.name}
                    style={{ border: '4px solid', width: '300px', height: '300px',  }}
                  />
                </Box>
              </Box>
              
            </div>
            </div>
          ))}
          <button
                onClick={stringRec}
                className={"transition-all mt-5 w-200 font-bold bg-[#FFC038] shadow-md duration-200 py-4 text-black rounded-full text-lg hover:opacity-70 cursor-pointer"}

                >See Recommended Rackets
            </button>
        </div>
      </div>
    </div>
  );
}