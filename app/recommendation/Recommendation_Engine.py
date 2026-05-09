from flask import Flask, jsonify, request
from flask_cors import CORS
from MachineLearning import get_rec
from StringRecommendation import get_string_rec
import math
app= Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

def clean_nan(obj):
    if isinstance(obj, float) and math.isnan(obj):
        return None
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nan(v) for v in obj]
    return obj


#routes the data to react
@app.route('/api/recommend', methods = ['POST'])
def recommend():
    user_ans = request.get_json()
    rec = get_rec(user_ans)
    return jsonify(clean_nan(rec))

@app.route('/api/stringrec', methods = ['POST'])
def recommend_string():
    user_ans = request.get_json()
    rec = get_string_rec(user_ans)
    return jsonify(clean_nan(rec))

@app.route('/')
def message():
    return jsonify({"text": "Flask setup"})

if __name__=='__main__':
    app.run(debug = True, port=3001)
