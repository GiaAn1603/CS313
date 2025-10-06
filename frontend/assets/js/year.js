// Year page functionality
document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const year = urlParams.get("year");

  // Elements
  const yearTitle = document.getElementById("year-title");
  const yearSubtitle = document.getElementById("year-subtitle");
  const loadingSpinner = document.getElementById("loading-spinner");
  const stormsContainer = document.getElementById("storms-container");
  const noDataMessage = document.getElementById("no-data-message");
  const stormsTableBody = document.getElementById("storms-table-body");
  const stormsListTitle = document.getElementById("storms-list-title");

  // Summary elements
  const totalStormsEl = document.getElementById("total-storms");
  const maxWindEl = document.getElementById("max-wind");
  const uniqueStormsEl = document.getElementById("unique-storms");

  // Validate year parameter
  if (!year || year < 1975 || year > 2025) {
    showError("Invalid year selected");
    return;
  }

  // Update page title and header
  yearTitle.textContent = `Storm Data ${year}`;
  yearSubtitle.textContent = `Tropical cyclones and storms recorded in ${year}`;
  stormsListTitle.textContent = `Storms List - ${year}`;

  // Load storm data
  loadStormData(year);

  async function loadStormData(year) {
    // Show loading
    loadingSpinner.classList.remove("d-none");
    stormsContainer.classList.add("d-none");
    noDataMessage.classList.add("d-none");

    try {
      const stormData = await fetchAndParseCSV(year);

      if (stormData.length === 0) {
        showNoData();
        return;
      }

      displayStormData(stormData);
      updateSummaryStats(stormData);

      // Hide loading, show data
      loadingSpinner.classList.add("d-none");
      stormsContainer.classList.remove("d-none");
    } catch (error) {
      console.error("Error loading storm data:", error);
      showError("Failed to load storm data: " + error.message);
    }
  }

  async function fetchAndParseCSV(year) {
    // Fetch CSV file from data directory
    const response = await fetch("../../data/ibtracs_dataset.csv");

    if (!response.ok) {
      throw new Error(`CSV file not found`);
    }

    const csvText = await response.text();
    const allData = parseCSV(csvText);

    // Filter data for the selected year using SEASON column
    return filterDataBySeason(allData, year);
  }

  function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    // Parse headers
    const headers = lines[0].split(",").map((header) => header.trim());

    // Parse data rows
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((value) => value.trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      data.push(row);
    }

    return data;
  }

  function filterDataBySeason(data, year) {
    return data.filter((row) => {
      return row.SEASON === year;
    });
  }

  function displayStormData(data) {
    stormsTableBody.innerHTML = "";

    // Get unique storm IDs for grouping
    const uniqueStormIds = [...new Set(data.map((row) => row["STORM ID"]))].filter((id) => id);

    if (uniqueStormIds.length === 0) {
      showNoData();
      return;
    }

    uniqueStormIds.forEach((stormId) => {
      const stormEntries = data.filter((row) => row["STORM ID"] === stormId);
      const firstEntry = stormEntries[0];

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="storm-id">${stormId}</td>
        <td>${formatCoordinate(firstEntry.LAT)}</td>
        <td>${formatCoordinate(firstEntry.LON)}</td>
        <td><strong>${formatNumber(firstEntry["STORM SPEED"])}</strong></td>
        <td>${formatNumber(firstEntry["STORM DIR"])}°</td>
        <td>${formatNumber(firstEntry.DIST2LAND)}</td>
        <td><span class="badge bg-primary rounded-pill">${stormEntries.length}</span></td>
      `;
      stormsTableBody.appendChild(row);
    });
  }

  function formatCoordinate(coord) {
    if (!coord || coord === "N/A") return "N/A";
    const num = parseFloat(coord);
    return isNaN(num) ? "N/A" : num.toFixed(2) + "°";
  }

  function formatNumber(value) {
    if (!value || value === "N/A") return "N/A";
    const num = parseFloat(value);
    return isNaN(num) ? "N/A" : num.toFixed(1);
  }

  function updateSummaryStats(data) {
    const uniqueStormIds = [...new Set(data.map((row) => row["STORM ID"]))].filter((id) => id);

    totalStormsEl.textContent = data.length.toLocaleString();
    uniqueStormsEl.textContent = uniqueStormIds.length;

    // Calculate max wind from STORM SPEED column
    const windSpeeds = data.map((row) => {
      const wind = parseFloat(row["STORM SPEED"] || 0);
      return isNaN(wind) ? 0 : wind;
    });
    const maxWind = windSpeeds.length > 0 ? Math.max(...windSpeeds) : 0;
    maxWindEl.textContent = maxWind.toFixed(1);
  }

  function showNoData() {
    loadingSpinner.classList.add("d-none");
    stormsContainer.classList.add("d-none");
    noDataMessage.classList.remove("d-none");
  }

  function showError(message) {
    loadingSpinner.classList.add("d-none");
    stormsContainer.classList.add("d-none");
    noDataMessage.querySelector("h4").textContent = "Error";
    noDataMessage.querySelector("p").textContent = message;
    noDataMessage.classList.remove("d-none");
  }
});
