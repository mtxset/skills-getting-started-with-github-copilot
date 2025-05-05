document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Wrap the existing content in a two-column layout
  const appContainer = document.createElement("div");
  appContainer.className = "app-container";

  const contentColumn = document.createElement("div");
  contentColumn.className = "content-column";

  const rightColumn = document.createElement("div");
  rightColumn.className = "right-column";

  // Move activities list to the content column
  contentColumn.appendChild(activitiesList);

  // Create a container for search and registration
  const searchAndRegistration = document.createElement("div");
  searchAndRegistration.className = "search-and-registration";

  // Move search bar to the search and registration container
  const searchBar = document.getElementById("activity-search");
  searchAndRegistration.appendChild(searchBar);

  // Move signup form to the search and registration container
  searchAndRegistration.appendChild(signupForm);

  // Add search and registration container to the right column
  rightColumn.appendChild(searchAndRegistration);

  // Append both columns to the app container
  appContainer.appendChild(contentColumn);
  appContainer.appendChild(rightColumn);

  // Replace the body content with the app container
  document.body.innerHTML = "";
  document.body.appendChild(appContainer);

  // List to hold currently shown activities
  let currentActivities = []; // Holds activities and their details, including participants

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Update the current activities list
      currentActivities = Object.entries(activities);

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      currentActivities.forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        if (details.participants.length > 0) {
          activityCard.innerHTML += `
            <div class="participants">
              <strong>Participants:</strong>
              <ul>
                ${details.participants.map(participant => `
                  <li>${participant}</li>
                `).join("")}
              </ul>
            </div>
          `;
        }

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to search activities
  async function searchActivities(query) {
    try {
      const response = await fetch(`/search/activities?query=${encodeURIComponent(query)}`);
      const results = await response.json();
      console.log("Activity search results:", results);
      return results;
    } catch (error) {
      console.error("Error searching activities:", error);
      return [];
    }
  }

  // Function to search participants
  async function searchParticipants(query) {
    try {
      const response = await fetch(`/search/participants?query=${encodeURIComponent(query)}`);
      const results = await response.json();
      console.log("Participant search results:", results);
      return results;
    } catch (error) {
      console.error("Error searching participants:", error);
      return [];
    }
  }

  // Unified search function
  async function search(query) {
    try {
      const [activityResults, participantResults] = await Promise.all([
        searchActivities(query),
        searchParticipants(query),
      ]);
      console.log("Search results:", { activityResults, participantResults });
      return { activityResults, participantResults };
    } catch (error) {
      console.error("Error performing search:", error);
      return { activityResults: [], participantResults: [] };
    }
  }

  // Debounced search function
  let searchTimeout;
  searchBar.addEventListener("input", (event) => {
    clearTimeout(searchTimeout);
    const query = event.target.value.toLowerCase();

    searchTimeout = setTimeout(async () => {
      if (query.length === 0) {
        // If query is empty, display all activities from currentActivities
        activitiesList.innerHTML = "";
        currentActivities.forEach(([name, details]) => {
          const activityCard = document.createElement("div");
          activityCard.className = "activity-card";

          const spotsLeft = details.max_participants - details.participants.length;

          activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          `;

          if (details.participants.length > 0) {
            activityCard.innerHTML += `
              <div class="participants">
                <strong>Participants:</strong>
                <ul>
                  ${details.participants.map(participant => `
                    <li>${participant}</li>
                  `).join("")}
                </ul>
              </div>
            `;
          }

          activitiesList.appendChild(activityCard);
        });
      } else if (query.length > 2) {
        // Perform search for activities and participants
        const { activityResults, participantResults } = await search(query);

        // Clear and update activities list with matched results
        activitiesList.innerHTML = "";

        // Display activity search results
        if (activityResults.length > 0) {
          activityResults.forEach(({ activity_name }) => {
            const activityCard = document.createElement("div");
            activityCard.className = "activity-card";

            const activityDetails = currentActivities.find(([name]) => name === activity_name)?.[1];
            if (activityDetails) {
              const spotsLeft = activityDetails.max_participants - activityDetails.participants.length;

              activityCard.innerHTML = `
                <h4>${activity_name}</h4>
                <p>${activityDetails.description}</p>
                <p><strong>Schedule:</strong> ${activityDetails.schedule}</p>
                <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
              `;

              if (activityDetails.participants.length > 0) {
                activityCard.innerHTML += `
                  <div class="participants">
                    <strong>Participants:</strong>
                    <ul>
                      ${activityDetails.participants.map(participant => `
                        <li>${participant}</li>
                      `).join("")}
                    </ul>
                  </div>
                `;
              }

              activitiesList.appendChild(activityCard);
            }
          });
        }

        // Display participant search results
        if (participantResults.length > 0) {
          const participantSection = document.createElement("div");
          participantSection.className = "participant-results";
          participantSection.innerHTML = `
            <h4>Participant Search Results</h4>
            <ul>
              ${participantResults.map(({ email }) => `<li>${email}</li>`).join("")}
            </ul>
          `;
          activitiesList.appendChild(participantSection);
        }

        // If no results found, display a message
        if (activityResults.length === 0 && participantResults.length === 0) {
          activitiesList.innerHTML = "<p>No results found.</p>";
        }
      }
    }, 300); // Default delay of 300ms
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
