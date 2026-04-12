"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {Card, CardContent, Box, Stack, Typography, Divider} from '@mui/material';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Racket{
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
}



export default function RecommendationEngine() {
  const [choice, setChoice] = useState([]);

  useEffect(() =>{

    const getRec = async() => {
      const{ data: ans} = await supabase
      .from('assessment_response')
      .select('*')
      .order('created_at', {ascending: false})
      .limit(1)
      .single();

      const answerF= {
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


      const res = await fetch('http://localhost:3001/api/recommend',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerF),


      });

      const rec = await res.json();
      setChoice(rec)
 


    }
    getRec();
    
  },[]);

  return(
    <div>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      

      <Box sx = {{justifyContent: 'center', display: 'flex'}}>
        <Card sx = {{width: 500,borderRadius:'16px', bgcolor: 'rgba(255, 255, 255, 0.85)' , mt:8}}>

          <Box sx = {{borderBottom : "4px solid #000000" }}>
            <Typography variant = "h5" sx={{textAlign: 'center', fontWeight: '1000', fontSize:'45px'}}>
              Recommendations
            </Typography>


          </Box>
          {/* Choice mapping */}
          {choice.map((racket, index) => (
            <CardContent key={index} sx={{borderBottom: index !== choice.length -1? '4px solid #000000': 'none'}}>

              <Box>

                <Box>
                  
                  <Typography variant = "h5" sx={{textAlign: 'left', fontWeight: '500', fontSize:'20px'}}>
                  
                  Name : {racket.name}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant = "h5" sx={{textAlign: 'left', fontWeight: '500', fontSize:'20px'}}>
                  Color: {racket.color}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant = "h5" sx={{textAlign: 'left', fontWeight: '500', fontSize:'20px'}}>
                  Price: ${racket.price}
                  </Typography>
                </Box>

                <Box>
                  <img 
                    src= {racket.img_url}
                    alt = {racket.name}
                    style={{

                      border: '4px solid'
                    }}
                  

                  
                  
                  
                  />
                  


                

                </Box>
    


              </Box>

            </CardContent>     


          ))}
      </Card>


      

      </Box>
      
    </div>


  );






}
