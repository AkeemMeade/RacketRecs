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
    "gauge": 0.67,
    "repulsion": 8,
    "control": 7

}

#translates questions to numeric metrics

translation_map = {
    "experience": {
        "Beginner": {
            "metrics": {

            }
        },

        "Intermediate": {
            "metrics": {

            }
        },
        "Advanced": {
            "metrics": {



            }
        }
    },

    "event": {

        "Singles": {
            "metrics": {

                "gauge": -0.3,
                "repulsion":+0.2,
                "control": +0.1

            }
        },
        "Doubles": {
            "metrics": {
                "gauge": +0.3,
                "repulsion":-0.2,
                "control": +0.1

            }
        },

        "Mixed": {
            "metrics": {


            }
        },

        "All": {
            "metrics": {

            }
        }
    },

    "playstyle": {
        "Agressive(Attacking / Smashing)": {
            "metrics": {
                "gauge": -0.3,
                "repulsion": +0.1,
            }
        },
        "Defensive(Control & Placement)": {
            "metrics": {
                "gauage": +0.1,
                "repulsion": +0.2,
            }
        },

        "Balanced": {

            "metrics": {

            }
        },

        "Not sure": {

            "metrics": {

            }
        }
    },
    "playloc": {

        "Front / Net": {

            "metrics": {

                "gauge": -0.3,
            }
        },
        "Backcourt": {

            "metrics": {

                "repulsion": +0.2,
            }
        },

        "Both": {

            "metrics": {

            }
        }
    },

    "movement": {
        "Fast / Explosive": {
            "metrics": {
                "gauge": -0.1,
                "repulsion":+0.2,
                "control": +0.3

            }
        },
        "Slower / Prefer easier swings": {
            "metrics": {
                "gauge": +0.3,
                "repulsion":-0.2,
                "control": +0.2

            }
        }
    },
    "strength": {
        "Strong (I can generate power easily)": {
            "metrics": {
                "gauge": +0.2,
                "control": +0.2

            }
        },
	#Defaults to baseline
        "Average": {
            "metrics": {

            }
        },
        "Weak (I struggle to generate power / hit to backcourt)": {

            "metrics": {

                "gauge": -0.3,
                "repulsion":+0.2,
                "control": +0.1

            }
        }
    },
    "injury": {
        "Wrist pain": {
            "metrics": {
                "gauge": -0.3,
            }

        },
        "Shoulder pain": {
            "metrics": {

                "repulsion": +0.2,
            }
        },
        "Both": {
            "metrics": {

                "control": +0.4

            }
        },

        "None": {
            "metrics": {
            }
        }
    },
    "feel": {
        "Stiff / precise": {
            "metrics": {
                "repulsion": +0.2,

            }
        },
        "Flexible / easier power generation": {
            "metrics": {
                "control": +0.2

            }
        },

        "Not sure": {
            "metrics": {
            }
        }
    },

}

#get data from supabase
string_supabase = supabase.table('string').select('*').execute()
strings = string_supabase.data
string_df = pd.DataFrame(strings)
string_df = string_df.drop_duplicates(subset='string_id')
string_df = string_df.drop_duplicates(subset='name', keep='first')


#standardizer

def standardizer(df):
    df['gauge'] = df['gauge'].astype(str).str.replace('mm','').astype(float)

    def std(col):

        if pd.isna(col):
            return {'control':6, 'durability':7 , 'repulsion':7 }

        x = str(col).lower().strip()

        #repulsion
        hrepulsion = ['high resilience', 'high repulsion']
        mrepulsion = ['medium repulsion']

        if any(i in x for i in hrepulsion):
            repulsion = 9

        elif any(i in x for i in mrepulsion):
            repulsion = 6
            
        else:
            repulsion = 7


        #durability
        hdurability = ['high durability', 'great durability']

        if any(i in x for i in hdurability):
            durability = 8

        else:
            durability = 6
            
        #control
        hcontrol = ['excellent control']
        mcontrol = ['hard feeling']
        scontrol = ['soft feeling']

        if any(i in x for i in hcontrol):
            control = 8


        elif any(i in x for i in mcontrol):
            control = 7

        elif any(i in x for i in scontrol):
            control = 5


        else:
            control = 6

        return {'control':control, 'durability':durability, 'repulsion':repulsion}


    

    updf = df['feel'].apply(std)

    df['control'] = updf.apply(lambda x: x['control'])
    df['repulsion'] = updf.apply(lambda x: x['repulsion'])
    df['durability'] = updf.apply(lambda x: x['durability'])

    df['gauge'] = df['gauge'].fillna(0.67)
    df['control'] = df['control'].fillna(6)
    df['durability'] = df['durability'].fillna(7)
    df['repulsion'] = df['repulsion'].fillna(7)
    df['img_url'] = df['img_url'].fillna('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKZAHUGnpur_EtqyBpo0IGMmOPgu75PjFVXQ&s')



    return df


string_df = standardizer(string_df)


#prepare information for training
excludes = ['string_id', 'name', 'manufacturer_id', 'img_url', 'feel']

col_categories = []
col_onehot = pd.get_dummies(string_df, columns=col_categories)

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
def get_string_rec(user_ans):
    scaled_user = user_vector(user_ans)
    distances, indices = knn.kneighbors(scaled_user)
    rec = string_df.iloc[indices[0]][['name', 'gauge', 'img_url']].to_dict(orient='records')
    return rec



