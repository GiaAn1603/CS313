// Search functionality for team members
const memberSearchForm = document.getElementById("search-form");
const memberSearchInput = document.getElementById("search-input");
// Sửa selector này - bỏ .mb-4 vì trong HTML không còn class này
const memberCards = document.querySelectorAll(".col-12.col-sm-6.col-md-4.col-lg-3");

// Search form submit event
memberSearchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  filterMembers();
});

// Search input event for real-time filtering
memberSearchInput.addEventListener("input", function () {
  filterMembers();
});

// Filter members based on search input
function filterMembers() {
  const searchTerm = memberSearchInput.value.toLowerCase().trim();

  memberCards.forEach((card) => {
    const cardText = card.textContent.toLowerCase();

    if (searchTerm === "" || cardText.includes(searchTerm)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}
