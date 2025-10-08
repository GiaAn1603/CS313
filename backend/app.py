from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model package từ pickle
with open('../model/storm_prediction_models.pkt', 'rb') as f:
    model_package = pickle.load(f)
lat_models = model_package['lat_models']
lon_models = model_package['lon_models']
features = model_package['features']  # List features gốc (~40)

# Haversine distance (tính km giữa 2 điểm LAT/LON)
def haversine_distance(lat1, lon1, lat2, lon2):
  R = 6371  # Bán kính Trái Đất (km)
  lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
  dlat = lat2 - lat1
  dlon = lon2 - lon1
  a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
  return 2 * R * np.arcsin(np.sqrt(a))

@app.route('/', methods=['GET'])
def home():
  return jsonify({'message': 'Backend API for Storm Trajectory Prediction'})

@app.route('/predict', methods=['POST'])
def predict_trajectory():
  try:
    data = request.json  # Input JSON: {'LAT': 20.5, 'LON': 120.0, ...}
    
    # Align input với features (fill 0, Pipeline impute median như train)
    input_df = pd.DataFrame([data])
    input_df = input_df.reindex(columns=features, fill_value=0)
    
    # Predict LAT/LON cho 3 horizons
    predictions = {}
    current_lat = data.get('LAT', 0)
    current_lon = data.get('LON', 0)
    for horizon in ['6H', '12H', '24H']:
      pred_lat = lat_models[horizon].predict(input_df)[0]  # Pipeline tự xử lý
      pred_lon = lon_models[horizon].predict(input_df)[0]
      dist_km = haversine_distance(current_lat, current_lon, pred_lat, pred_lon)
      
      predictions[horizon] = {
        'lat': round(float(pred_lat), 4),
        'lon': round(float(pred_lon), 4),
        'distance_from_current_km': round(float(dist_km), 2)
      }
    
    return jsonify({
      'status': 'success',
      'predictions': predictions,
      'message': 'Storm trajectory prediction completed!'
    })
  
  except Exception as e:
    return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
  app.run(debug=True, host='0.0.0.0', port=5000)
