"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, Box, Typography } from '@mui/material';

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

  useEffect(() => {
    const getRec = async () => {
      const { data: ans } = await supabase
        .from('assessment_response')
        .select('*')
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
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <Box sx={{ justifyContent: 'center', display: 'flex' }}>
        <Card sx={{ width: 500, borderRadius: '16px', bgcolor: 'rgba(255, 255, 255, 0.85)', mt: 8 }}>
          <Box sx={{ borderBottom: '4px solid #000000' }}>
            <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: '1000', fontSize: '45px' }}>
              Recommendations
            </Typography>
          </Box>

          {choice.map((racket, index) => (
            <CardContent key={index} sx={{ borderBottom: index !== choice.length - 1 ? '4px solid #000000' : 'none' }}>
              <Box>
                <Typography variant="h5" sx={{ textAlign: 'left', fontWeight: '500', fontSize: '20px' }}>
                  Name: {racket.name}
                </Typography>
                <Typography variant="h5" sx={{ textAlign: 'left', fontWeight: '500', fontSize: '20px' }}>
                  Color: {racket.color}
                </Typography>
                <Typography variant="h5" sx={{ textAlign: 'left', fontWeight: '500', fontSize: '20px' }}>
                  Price: ${racket.price}
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
            </CardContent>
          ))}
        </Card>
      </Box>
    </div>
  );
}