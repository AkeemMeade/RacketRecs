from supabase import create_client
import supabase_env
import json
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
import re

supabase = create_client(supabase_env.NEXT_PUBLIC_SUPABASE_URL, supabase_env.NEXT_PUBLIC_SUPABASE_ANON_KEY )

#question importance
question_weights = {
    "experience": 2.5,
    "brand": 1,
    "injury": 3,
    "event": 1.5,
    "playstyle": 2,
    "playloc": 2,
    "movement": 2,
    "strength": 1.5,
    "feel":1.5,
    "budget": 2,
}

#baseline metrics
baseline = {

    "weight" : 85,
    "max_tension": 28,
    "price": 140,
    "manufacturer_id": 0,
    "balance_Even Balance": 0.6,
    "balance_Head-light": 0.2,
    "balance_Head-heavy": 0.2,
    "stiffness_Medium": 0.6,
    "stiffness_Stiff": 0.2,
    "stiffness_Flexible": 0.2



}

#translates questions to numeric metrics

translation_map = {
    "experience": {
        #Beginners need a lighter weight, less tension, cheaper, more head-light, more flexible racket
        "Beginner": {
            "metrics": {
                "weight": -7,
                "max_tension": -2,
                "price": -50,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.3,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.3
            }
        },
        #Baseline stays the same
        "Intermediate": {
            "metrics": {

            }
        },
        #Advanced players need a heavier weight, more tension, more costly, more head-heavy, more stiff racket
        "Advanced": {
            "metrics": {
                "weight": +7,
                "max_tension": +2,
                "price": +50,
                "balance_Even Balance": -0.1,
                "balance_Head-light": -0.2,
                "balance_Head-heavy": +0.3,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.3,
                "stiffness_Flexible": -0.2
            }
        }
    },

    "event": {
        # Singles players need a heavier weight, more tension, more head-heavy, more stiff racket

        "Singles": {
            "metrics": {
                "weight": +5,
                "max_tension": +2,
                "balance_Even Balance": -0.1,
                "balance_Head-light": -0.2,
                "balance_Head-heavy": +0.3,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.3,
                "stiffness_Flexible": -0.2
            }
        },
        #Doubles players need a lighter weight, less tension, more head-light, more flexible racket
        "Doubles": {
            "metrics": {
                "weight": -5,
                "max_tension": -2,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.3,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.3
            }
        },
        #Mixed players need a more versatile racket
        #Defaults to baseline
        "Mixed": {
            "metrics": {


            }
        },
        #Players who play all need a more versatile racket
        #Defaults to baseline
        "All": {
            "metrics": {

            }
        }
    },

    "playstyle": {
	#Aggressive players need a heavier weight, more tension, more costly, more head-heavy, more stiff racket
        "Agressive(Attacking / Smashing)": {
            "metrics": {
                "weight": +7,
                "max_tension": +2,
                "price": +50,
                "balance_Even Balance": -0.1,
                "balance_Head-light": -0.2,
                "balance_Head-heavy": +0.3,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.3,
                "stiffness_Flexible": -0.2
            }
        },
	#Defensive players need a lighter weight, less tension, cheaper, more head-light, more flexible racket
        "Defensive(Control & Placement)": {
            "metrics": {

                "weight": -7,
                "max_tension": -2,
                "price": -50,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.3,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.3
            }
        },
        # Balanced players need a more versatile racket
        # Defaults to baseline
        "Balanced": {

            "metrics": {

            }
        },
        #Players who aren't sure need a more versatile racket
        # Defaults to baseline
        "Not sure": {

            "metrics": {

            }
        }
    },
    "playloc": {

        # Front \ Net players need a more head-light, more flexible racket
        "Front / Net": {

            "metrics": {


                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.3,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.3
            }
        },
        #Backcourt players need a more head-heavy, more stiff racket
        "Backcourt": {

            "metrics": {


                "balance_Even Balance": -0.1,
                "balance_Head-light": -0.2,
                "balance_Head-heavy": +0.3,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.3,
                "stiffness_Flexible": -0.2
            }
        },
        #Players who play both need a more versatile racket
        #Default to baseline
        "Both": {

            "metrics": {

            }
        }
    },

    "movement": {
    	#Faster players need a heavier weight, more tension, more head-heavy, more stiff racket
        "Fast / Explosive": {
            "metrics": {
                "weight": +8,
                "max_tension": +2,
                "balance_Even Balance": -0.1,
                "balance_Head-light": -0.2,
                "balance_Head-heavy": +0.4,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.4,
                "stiffness_Flexible": -0.2
            }
        },
        #Slower players need a lighter weight, less tension, more head-light, more flexible racket
        "Slower / Prefer easier swings": {
            "metrics": {
                "weight": -8,
                "max_tension": -2,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.4,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.4
            }
        }
    },
    #Stronger players need a heavier weight, more tension, more head-heavy, more stiff racket
    "strength": {
        "Strong (I can generate power easily)": {
            "metrics": {

                "weight": +8,
                "max_tension": +2,
                "balance_Even Balance": -0.1,
                "balance_Head-light": -0.2,
                "balance_Head-heavy": +0.4,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.4,
                "stiffness_Flexible": -0.2
            }
        },
	#Defaults to baseline
        "Average": {
            "metrics": {

            }
        },
	#Players with less strength need a lighter weight, less tension, more head-light, more flexible racket
        "Weak (I struggle to generate power / hit to backcourt)": {

            "metrics": {

                "weight": -8,
                "max_tension": -2,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.4,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.4
            }
        }
    },
    "injury": {
        #Players with an injured wrist need less tension and a more head-light racket.
        "Wrist pain": {
            "metrics": {

                "max_tension": -4,
                "balance_Head-light": +0.2,
                "balance_Head-heavy": -0.2,
            }

        },
        #Players with shoulder pain need a lighter, less tense, more head-light and more flexible racket
        "Shoulder pain": {
            "metrics": {

                "weight": -6,
                "max_tension": -5,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.3,
                "balance_Head-heavy": -0.2,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.2,
                "stiffness_Flexible": +0.3
            }
        },
        #Players with both injuries need an even lighter, less tense , more head-light and more flexible racket
        "Both": {
            "metrics": {

                "weight": -8,
                "max_tension": -6,
                "balance_Even Balance": -0.1,
                "balance_Head-light": +0.4,
                "balance_Head-heavy": -0.3,
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.3,
                "stiffness_Flexible": +0.4
            }
        },
        #Players with neither have no changes
        #Defaults to baseline
        "None": {
            "metrics": {
            }
        }
    },
    "feel": {
        # Players who want a more stiff/precise feel need a more stiff racket
        "Stiff / precise": {
            "metrics": {
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": +0.4,
                "stiffness_Flexible": -0.3
            }
        },
        #Players who want to generate more power / have a more flexible feel need a more flexible racket
        "Flexible / easier power generation": {
            "metrics": {
                "stiffness_Medium": -0.1,
                "stiffness_Stiff": -0.3,
                "stiffness_Flexible": +0.4
            }
        },
        #Players who aren't sure have no changes
        #Defaults to baseline
        "Not sure": {
            "metrics": {
            }
        }
    },
    "budget": {
        "Under $50": {
            "metrics": {
                "price": -110
            }
        },
        "$50 - $100": {
            "metrics": {
                "price": -65
            }
        },
        "$100 - $200": {
            "metrics": {
                "price": +10
            }
        },
        "$200+": {
            "metrics": {
                "price": +50
            }
        },
        "No preference": {
            "metrics": {
            }
        }
    },
    "brand": {
        "Yonex": {
            "metrics": {
                "manufacturer_id": 6
            }
        },
        "Victor": {
            "metrics": {
                "manufacturer_id": 9
            }
        },
        "Li-Ning": {
            "metrics": {
                "manufacturer_id": 16
            }
        },
        "Hundred": {
            "metrics": {
                "manufacturer_id": 17
            }
        },
        "Other": {
            "metrics": {
                "manufacturer_id": 0
            }
        },
        "None": {
            "metrics": {
                "manufacturer_id": 0
            }
        }
    }
}

#get data from supabase
racket_supabase = supabase.table('racket').select('*').execute()
rackets = racket_supabase.data
racket_df = pd.DataFrame(rackets)

#get price and merge
price_supabase = supabase.table('racket_retailer').select('racket_id, price').execute()
prices = price_supabase.data
price_df = pd.DataFrame(prices)
price_df= price_df.drop_duplicates(subset='racket_id', keep='first')
racket_df = racket_df.merge(price_df, on='racket_id', how='left')
racket_df = racket_df.drop_duplicates(subset='racket_id')
racket_df = racket_df.drop_duplicates(subset='name', keep='first')

#standardizes the racket database
def standardizer(df):
    #max_tension column
    df['max_tension'] = df['max_tension'].astype(str).str[:2]
    df['max_tension'] = pd.to_numeric(df['max_tension'], errors='coerce')

    #weight
    grams = {
        2: 92,
        3:87,
        4:82,
        5:77
    }
    def std_weight(col):
        if pd.isna(col):
            return None
        val = re.search(r'(\d+)U', str(col))
        if val:
            n = int(val.group(1))
            return grams.get(n, 84)

        gval = re.search(r'(\d+)', str(col))
        if gval:
            return int(gval.group(1))


        return 85
    df['weight'] = df['weight'].apply(std_weight)

    #stiffness
    def std_stiffness(col):

        if pd.isna(col):
            return None

        x = str(col).lower().strip()

        flexible = ['flexible', 'hi-flex', 'soft', 's○○○○●f', 's○○○●○f']
        stiff = ['stiff', 'extra stiff', 'hard', 'slightly stiff', 's ○●○○○ f', 's●○○○○f', 's○●○○○f']
        medium = ['S○○●○○F', 'medium']

        if any(i in x for i in flexible):
            return 'Flexible'

        if any(i in x for i in medium):
            return 'Medium'

        if any(i in x for i in stiff):
            return 'Stiff'

        return None

    df['stiffness'] = df['stiffness'].apply(std_stiffness)

    #balance

    def std_balance(col):

        if pd.isna(col):
            return None


        x = str(col).lower().strip()

        heavy = ['head heavy', 'head-heavy', 'power']
        even = ['even', 'balance']
        light = ['head light', 'head-light']

        if any(i in x for i in even):
            return 'Even Balance'

        if any(i in x for i in heavy ):
            return 'Head-heavy'

        if any(i in x for i in light ):
            return 'Head-light'

        if 'mm' in x:
            mm = re.search(r'(\d+)', x)
            if mm:
                val = int(mm.group(1))
                if val >= 305:
                    return 'Head-heavy'
                elif val <= 295:
                    return 'Head-light'
                else:
                    return 'Even Balance'





        return None


    df['balance'] = df['balance'].apply(std_balance)

    df['max_tension'] = df['max_tension'].fillna(27)
    df['weight'] = df['weight'].fillna(85)
    df['balance'] = df['balance'].fillna('Even Balance')
    df['stiffness'] = df['stiffness'].fillna('Medium')
    df['price'] = df['price'].fillna(140)
    df['manufacturer_id'] = df['manufacturer_id'].fillna(0)




    return df


racket_df = standardizer(racket_df)



#prepare information for training
excludes = ['racket_id', 'name', 'color', 'availability', 'description', 'img_url']

col_categories = ['balance', 'stiffness']
col_onehot = pd.get_dummies(racket_df, columns=col_categories)

cols = [ i for i in col_onehot if i not in excludes]

scale = StandardScaler()

x = col_onehot[cols].values

scaled_x = scale.fit_transform(x)

#knn model
knn = NearestNeighbors(n_neighbors=3, metric='euclidean')
knn.fit(scaled_x)


#creates user vector from user answers
def user_vector(user_ans):

    vec = np.array([baseline.get(col, 0) for col in cols], dtype=float)
    col_index = {k: i for i, k in enumerate(cols)}

    for question, answer in user_ans.items():
        if question not in translation_map:
            continue

        if answer not in translation_map[question]:
            continue

        metrics = translation_map[question][answer].get("metrics", {})
        weight = question_weights.get(question, 1)

        for key_metric, value_metric in metrics.items():
            if key_metric in col_index:
                index = col_index[key_metric]
                vec[index] += weight * value_metric

    vec = vec.reshape(1, -1)
    scaled = scale.transform(vec)
    return scaled

#generates recommendation
def get_rec(user_ans):
    scaled_user = user_vector(user_ans)
    distances, indices = knn.kneighbors(scaled_user)
    rec = racket_df.iloc[indices[0]][['name', 'price', 'img_url', 'color']].to_dict(orient='records')
    return rec


