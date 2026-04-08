from supabase import create_client
import supabase_env
import json
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

supabase = create_client(supabase_env.NEXT_PUBLIC_SUPABASE_URL, supabase_env.NEXT_PUBLIC_SUPABASE_ANON_KEY )

#question importance
question_weights = {
    "experience": 4,
    "brand": 1,
    "injury": 3,
    "event": 1,
    "playstyle": 1,
    "playloc": 1,
    "movement": 1,
    "strength": 2,
    "feel": 2,
    "budget": 4,
}


#translates questions to numeric metrics
translation_map = {
    "experience": {
        "Beginner": {
            "metrics": {
                "weight": 75,
                "max_tension": 24,

                "balance_Even Balance": 0.7,
                "balance_Head-light": 0.3,
                "stiffness_Flexible": 0.8,
                "stiffness_Medium": 0.2,
                "budget": 80
            }
        },
        "Intermediate": {
            "metrics": {
                "weight": 85,
                "max_tension": 27,

                "balance_Head-light": 0.2,
                "balance_Even Balance": 0.6,
                "balance_Head-heavy": 0.2,
                "stiffness_Flexible": 0.2,
                "stiffness_Medium": 0.6,
                "stiffness_Stiff": 0.2,
                "budget": 140
            }
        },

        "Advanced": {
            "metrics": {
                "weight": 95,
                "max_tension": 32,
                "balance_Even Balance": 0.3,
                "balance_Head-heavy": 0.7,
                "stiffness_Medium": 0.3,
                "stiffness_Stiff": 0.7,
                "budget": 180
            }
        }
    },

    "event": {
        "Singles": {
            "metrics": {
                "weight": 90,
                "max_tension": 32,
                "balance_Even Balance": 0.3,
                "balance_Head-heavy": 0.7,
                "stiffness_Medium": 0.3,
                "stiffness_Stiff": 0.7,
            }
        },
        "Doubles": {
            "metrics": {
                "weight": 80,
                "max_tension": 24,
                "balance_Head-light": 0.7,
                "balance_Even Balance": 0.3,
                "stiffness_Medium": 0.4,
                "stiffness_Stiff": 0.6,
            }
        },
        "Mixed": {
            "metrics": {
                "weight": 85,
                "max_tension": 27,
                "balance_Head-light": 0.1,
                "balance_Even Balance": 0.7,
                "balance_Head-heavy": 0.2,
                "stiffness_Medium": 0.7,
                "stiffness_Stiff": 0.3,

            }
        },
        "All": {
            "metrics": {
                "weight": 85,
                "max_tension": 27,
                "balance_Head-light": 0.1,
                "balance_Even Balance": 0.7,
                "balance_Head-heavy": 0.2,
                "stiffness_Medium": 0.7,
                "stiffness_Stiff": 0.3,
            }
        }
    },

    "playstyle": {

        "Agressive(Attacking / Smashing)": {
            "metrics": {
                "weight": 90,
                "max_tension": 28,
                "balance_Even Balance": 0.3,
                "balance_Head-heavy": 0.7,
                "stiffness_Medium": 0.3,
                "stiffness_Stiff": 0.7,
            }
        },
        "Defensive(Control & Placement)": {
            "metrics": {

                "weight": 83,
                "max_tension": 24,
                "balance_Head-light": 0.7,
                "balance_Even Balance": 0.3,
                "stiffness_Flexible": 0.7,
                "stiffness_Medium": 0.3,
            }
        },
        "Balanced": {

            "metrics": {

                "weight": 83,
                "max_tension": 24,
                "balance_Head-light": 0.1,
                "balance_Even Balance": 0.8,
                "balance_Head-heavy": 0.1,
                "stiffness_Flexible": 0.1,
                "stiffness_Medium": 0.8,
                "stiffness_Stiff": 0.1,
            }
        },
        "Not sure": {

            "metrics": {

                "weight": 83,
                "max_tension": 24,
                "balance_Head-light": 0.1,
                "balance_Even Balance": 0.8,
                "balance_Head-heavy": 0.1,
                "stiffness_Flexible": 0.1,
                "stiffness_Medium": 0.8,
                "stiffness_Stiff": 0.1,
            }
        }
    },
    "playloc": {

        "Front / Net": {

            "metrics": {
                "weight": 83,
                "max_tension": 24,
                "balance_Head-light": 0.7,
                "balance_Even Balance": 0.3,
                "stiffness_Flexible": 0.7,
                "stiffness_Medium": 0.3,
            }
        },
        "Backcourt": {

            "metrics": {

                "weight": 90,
                "max_tension": 28,
                "balance_Even Balance": 0.3,
                "balance_Head-heavy": 0.7,
                "stiffness_Medium": 0.3,
                "stiffness_Stiff": 0.7,
            }
        },
        "Both": {

            "metrics": {

                "weight": 83,
                "max_tension": 24,
                "balance_Head-light": 0.1,
                "balance_Even Balance": 0.8,
                "balance_Head-heavy": 0.1,
                "stiffness_Flexible": 0.1,
                "stiffness_Medium": 0.8,
                "stiffness_Stiff": 0.1,
            }
        }
    },
    "movement": {

        "Fast / Explosive": {
            "metrics": {
                "weight": 90,
                "max_tension": 30,
                "balance_Even Balance": 0.3,
                "balance_Head-heavy": 0.7,
                "stiffness_Medium": 0.3,
                "stiffness_Stiff": 0.7,
            }
        },

        "Slower / Prefer easier swings": {
            "metrics": {
                "weight": 75,
                "max_tension": 22,
                "balance_Head-light": 0.7,
                "balance_Even Balance": 0.3,
                "stiffness_Flexible": 0.7,
                "stiffness_Medium": 0.3,
            }
        }
    },

    "strength": {
        "Strong (I can generate power easily)": {
            "metrics": {

                "weight": 90,
                "max_tension": 30,
                "balance_Even Balance": 0.3,
                "balance_Head-heavy": 0.7,
                "stiffness_Medium": 0.3,
                "stiffness_Stiff": 0.7,
            }
        },
        "Average": {

            "metrics": {

                "weight": 83,
                "max_tension": 24,
                "balance_Head-light": 0.1,
                "balance_Even Balance": 0.8,
                "balance_Head-heavy": 0.1,
                "stiffness_Flexible": 0.1,
                "stiffness_Medium": 0.8,
                "stiffness_Stiff": 0.1,
            }
        },

        "Weak (I struggle to generate power / hit to backcourt)": {

            "metrics": {

                "weight": 75,
                "max_tension": 22,
                "balance_Head-light": 0.7,
                "balance_Even Balance": 0.3,
                "stiffness_Flexible": 0.7,
                "stiffness_Medium": 0.3,
            }
        }
    },
    "injury": {
        "Wrist pain": {
            "metrics": {
                "max_tension": 25
            }

        },
        "Shoulder pain": {
            "metrics": {
                "max_tension": 28
            }
        },
        "Both": {
            "metrics": {
                "max_tension": 28
            }
        },

        "None": {
            "metrics": {
                "max_tension": 28
            }
        }
    },
    "feel": {
        "Stiff / precise": {
            "metrics": {
                "stiffness_Medium": 0.2,
                "stiffness_Stiff": 0.8,
            }
        },
        "Flexible / easier power generation": {
            "metrics": {
                "stiffness_Flexible": 0.8,
                "stiffness_Medium": 0.2,
            }
        },
        "Not sure": {
            "metrics": {
                "stiffness_Medium": 1,
            }
        }
    },
    "budget": {
        "Under $50": {
            "metrics": {
                "price": 30
            }
        },
        "$50 - $100": {
            "metrics": {
                "price": 75
            }
        },
        "$100 - $200": {
            "metrics": {
                "price": 150
            }
        },
        "$200+": {
            "metrics": {
                "price": 300
            }
        },
        "No preference": {
            "metrics": {
                "price": 150
            }
        }
    },
    "brand": {
        "Yonex": {
            "metrics": {
                "manufacturer_id": 9
            }
        },
        "Victor": {
            "metrics": {
                "manufacturer_id": 8
            }
        },
        "Li-Ning": {
            "metrics": {
                "manufacturer_id": 7
            }
        },
        "Hundred": {
            "metrics": {
                "manufacturer_id": 2
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
racket_supabase = supabase.table('racket_training').select('*').execute()
rackets = racket_supabase.data
racket_df = pd.DataFrame(rackets)

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
    vec = np.zeros(len(cols))
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


