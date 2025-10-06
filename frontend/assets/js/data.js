// Years grid functionality
document.addEventListener("DOMContentLoaded", function () {
  const yearsGrid = document.getElementById("years-grid");
  const currentYear = new Date().getFullYear();

  // Create year cards from 1975 to 2025
  function createYearsGrid() {
    for (let year = 1975; year <= 2025; year++) {
      const yearCard = document.createElement("a");
      yearCard.className = "year-card";
      yearCard.textContent = year;
      yearCard.href = `year.html?year=${year}`;

      // Highlight current year
      if (year === currentYear) {
        yearCard.classList.add("current-year");
      }

      yearsGrid.appendChild(yearCard);
    }
  }

  // Initialize
  createYearsGrid();
});
