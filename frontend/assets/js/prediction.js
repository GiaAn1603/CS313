document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("prediction-form");
  const resetBtn = document.getElementById("reset-btn");
  const resultContent = document.getElementById("result-content");
  const loading = document.getElementById("loading");
  const noResult = document.getElementById("no-result");
  const wsInput = document.getElementById("ws");
  const wsIntensity = document.getElementById("ws-intensity");
  const wsBar = document.getElementById("ws-bar");

  let map = null;
  let markers = [];

  // Update wind speed intensity indicator
  wsInput.addEventListener("input", function () {
    const wsValue = parseFloat(this.value) || 0;
    let intensity = "Calm";
    let percentage = 0;

    if (wsValue < 20) {
      intensity = "Calm";
      percentage = 25;
    } else if (wsValue < 34) {
      intensity = "Moderate";
      percentage = 50;
    } else if (wsValue < 48) {
      intensity = "Strong";
      percentage = 75;
    } else {
      intensity = "Severe";
      percentage = 100;
    }

    wsIntensity.textContent = intensity;
    wsBar.style.width = percentage + "%";
  });

  // Xử lý sự kiện submit form
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Hiển thị loading
    loading.style.display = "block";
    noResult.style.display = "none";

    // Thu thập dữ liệu từ form
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      if (value.trim() !== "") {
        data[key] = parseFloat(value);
      }
    });

    // Gửi request đến API
    fetch("http://localhost:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((result) => {
        // Ẩn loading
        loading.style.display = "none";

        // Hiển thị kết quả
        displayResult(result, data);
      })
      .catch((error) => {
        // Ẩn loading
        loading.style.display = "none";

        // Hiển thị lỗi
        resultContent.innerHTML = `
                <div class="error-message">
                  <strong>Error:</strong> ${error.message}
                  <br><small>Make sure the backend server is running on port 5000</small>
                </div>
              `;
      });
  });

  // Xử lý sự kiện reset form
  resetBtn.addEventListener("click", function () {
    form.reset();
    wsIntensity.textContent = "Moderate";
    wsBar.style.width = "50%";
    resultContent.innerHTML = `
            <div class="no-result" id="no-result">
              <i class="fas fa-wind fa-3x mb-3 text-muted"></i>
              <h5>No Prediction Yet</h5>
              <p>Enter storm parameters and click "Predict Trajectory" to see detailed analysis and visualization.</p>
            </div>
          `;
    noResult = document.getElementById("no-result");

    // Clear map
    if (map) {
      markers.forEach((marker) => map.removeLayer(marker));
      markers = [];
    }
  });

  // Hiển thị kết quả với visualizations
  function displayResult(result, inputData) {
    if (result.status === "success") {
      const predictions = result.predictions;
      const currentLat = inputData.LAT;
      const currentLon = inputData.LON;

      let html = `
              <div class="success-message">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Prediction Complete!</strong> ${result.message}
              </div>

              <!-- Storm Path Visualization -->
              <div class="storm-path mb-4">
                <h5><i class="fas fa-route me-2"></i>Storm Trajectory Path</h5>
                <div class="path-line" id="path-line"></div>
                <div class="path-points">
                  <div class="path-point">
                    <div class="point-circle current"></div>
                    <div class="point-label">Current</div>
                    <div class="point-time">Now</div>
                  </div>
                  <div class="path-point">
                    <div class="point-circle future"></div>
                    <div class="point-label">6H</div>
                    <div class="point-time">${predictions["6H"].distance_from_current_km} km</div>
                  </div>
                  <div class="path-point">
                    <div class="point-circle future"></div>
                    <div class="point-label">12H</div>
                    <div class="point-time">${predictions["12H"].distance_from_current_km} km</div>
                  </div>
                  <div class="path-point">
                    <div class="point-circle future"></div>
                    <div class="point-label">24H</div>
                    <div class="point-time">${predictions["24H"].distance_from_current_km} km</div>
                  </div>
                </div>
              </div>

              <!-- Statistics -->
              <div class="stats-grid mb-4">
                <div class="stat-card">
                  <div class="stat-value">${predictions["24H"].distance_from_current_km}</div>
                  <div class="stat-label">Total Distance</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${(
                    predictions["24H"].distance_from_current_km / 24
                  ).toFixed(1)}</div>
                  <div class="stat-label">Speed (km/h)</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${calculateDirection(
                    currentLat,
                    currentLon,
                    predictions["24H"].lat,
                    predictions["24H"].lon
                  )}</div>
                  <div class="stat-label">Direction</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${getIntensityLevel(inputData.WS)}</div>
                  <div class="stat-label">Intensity</div>
                </div>
              </div>

              <!-- Interactive Map -->
              <div class="mb-4">
                <h5><i class="fas fa-map me-2"></i>Interactive Map</h5>
                <div class="map-container" id="storm-map"></div>
              </div>

              <!-- Detailed Predictions -->
              <h5 class="mb-3"><i class="fas fa-clock me-2"></i>Detailed Predictions</h5>
            `;

      // Thêm thông tin dự đoán cho từng khoảng thời gian
      for (const [horizon, prediction] of Object.entries(predictions)) {
        html += `
                <div class="prediction-card">
                  <div class="prediction-title">
                    <i class="fas fa-${getHorizonIcon(horizon)}"></i>
                    Prediction after ${horizon}
                  </div>
                  <div class="prediction-details">
                    <div class="prediction-item">
                      <span class="prediction-label">Coordinates:</span>
                      <div class="prediction-value">${prediction.lat}°N, ${prediction.lon}°E</div>
                    </div>
                    <div class="prediction-item">
                      <span class="prediction-label">Distance Traveled:</span>
                      <div class="prediction-value">${prediction.distance_from_current_km} km</div>
                    </div>
                    <div class="prediction-item">
                      <span class="prediction-label">Estimated Region:</span>
                      <div class="prediction-value">${getRegionName(
                        prediction.lat,
                        prediction.lon
                      )}</div>
                    </div>
                    <div class="prediction-item">
                      <span class="prediction-label">Movement:</span>
                      <div class="prediction-value">${(
                        prediction.distance_from_current_km / getHours(horizon)
                      ).toFixed(1)} km/h</div>
                    </div>
                  </div>
                </div>
              `;
      }

      resultContent.innerHTML = html;

      // Initialize map
      initializeMap(currentLat, currentLon, predictions);
    } else {
      resultContent.innerHTML = `
              <div class="error-message">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Prediction Error:</strong> ${result.message}
              </div>
            `;
    }
  }

  // Helper functions
  function getHours(horizon) {
    switch (horizon) {
      case "6H":
        return 6;
      case "12H":
        return 12;
      case "24H":
        return 24;
      default:
        return 1;
    }
  }

  function getHorizonIcon(horizon) {
    switch (horizon) {
      case "6H":
        return "clock";
      case "12H":
        return "hourglass-half";
      case "24H":
        return "calendar-day";
      default:
        return "clock";
    }
  }

  function getIntensityLevel(ws) {
    if (!ws) return "Unknown";
    if (ws < 34) return "Tropical Storm";
    if (ws < 64) return "Category 1-2";
    return "Category 3+";
  }

  function getRegionName(lat, lon) {
    // Simple region detection based on coordinates
    if (lat > 35) return "Northern Region";
    if (lat < 5) return "Southern Region";
    if (lon > 140) return "Western Pacific";
    if (lon < 100) return "Indian Ocean";
    return "South China Sea";
  }

  function calculateDirection(lat1, lon1, lat2, lon2) {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const angle = (Math.atan2(lon2 - lon1, lat2 - lat1) * 180) / Math.PI;
    const index = Math.round((angle % 360) / 22.5);
    return directions[(index + 16) % 16];
  }

  // Map functions
  function initializeMap(currentLat, currentLon, predictions) {
    // Clear existing map
    if (map) {
      map.remove();
    }

    // Initialize new map
    map = L.map("storm-map").setView([currentLat, currentLon], 5);

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Clear existing markers
    markers = [];

    // Add current position marker
    const currentMarker = L.marker([currentLat, currentLon]).addTo(map).bindPopup(`
              <b>Current Position</b><br>
              Latitude: ${currentLat}°<br>
              Longitude: ${currentLon}°<br>
              Time: Now
            `);
    markers.push(currentMarker);

    // Add prediction markers
    Object.entries(predictions).forEach(([horizon, prediction]) => {
      const marker = L.marker([prediction.lat, prediction.lon]).addTo(map).bindPopup(`
                <b>Prediction after ${horizon}</b><br>
                Latitude: ${prediction.lat}°<br>
                Longitude: ${prediction.lon}°<br>
                Distance: ${prediction.distance_from_current_km} km
              `);
      markers.push(marker);

      // Add line connecting points
      if (horizon === "6H") {
        L.polyline(
          [
            [currentLat, currentLon],
            [prediction.lat, prediction.lon],
          ],
          { color: "red", weight: 3 }
        ).addTo(map);
      }
    });

    // Fit map to show all markers
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
});
