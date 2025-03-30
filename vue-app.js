let mediaForum = new Vue({
    el: "#app",
    data: {
        sitename: "Media Forum",
        username: "Guest",
        dropdownOpen: false,
        currentPage: "profile",
        isLoginFormVisible: true,
        // Fields for login:
        loginEmail: "",
        loginPassword: "",
        // Fields for registration (already available):
        registerEmail: "",
        registerUsername: "",
        registerPassword: "",
        confirmPassword: "",
        // Authentication state:
        isAuthenticated: false,
        idToken: "",
        searchQuery: "",
        searchResults: [],
        visibleResults: [],
        maxResultsToShow: 5,
        selectedMedia: null,
        showViewMore: false,
        media: {},
        titlesFields: [
            { key: "title_english", label: "English Title" },
            { key: "title_japanese", label: "Japanese Title" },
            { key: "title_synonyms", label: "Synonyms" }
        ],
        detailsFields: [
            { key: "type", label: "Type" },
            { key: "status", label: "Status" },
            { key: "volumes", label: "Volumes" },
            { key: "chapters", label: "Chapters" },
            { key: "episodes", label: "Episodes" },
            { key: "aired_from", label: "Aired" },
            { key: "aired_to", label: "To" },
            { key: "published_from", label: "Published from" },
            { key: "published_to", label: "Published to" },
            { key: "source", label: "Source" },
            { key: "duration", label: "Duration" },
            { key: "rating", label: "Rating" },
            { key: "premiered_season", label: "Premiered Season" },
            { key: "premiered_year", label: "Premiered Year" },
            { key: "broadcast_day", label: "Broadcast Day" },
            { key: "broadcast_time", label: "Broadcast Time" },
            { key: "genres", label: "Genres" },
            { key: "themes", label: "Themes" },
            { key: "demographics", label: "Demographics" },
            { key: "authors", label: "Authors" },
            { key: "serializations", label: "Serializations" },
            { key: "studios", label: "Studios" },
            { key: "producers", label: "Producers" },
            { key: "licensors", label: "Licensors" }
        ]
    },
    methods: {
        toggleDropdown() {
            this.dropdownOpen = !this.dropdownOpen;
        },
        showPage(page) {
            this.currentPage = page;
            this.dropdownOpen = false;
        },
        toggleForm() {
            this.isLoginFormVisible = !this.isLoginFormVisible;
        },
        async registerUser() {
            if (this.registerPassword !== this.confirmPassword) {
                console.error("Passwords do not match.");
                return;
            }

            const payload = {
                email: this.registerEmail,
                password: this.registerPassword,
                username: this.registerUsername
            };

            try {
                const response = await fetch('http://localhost:5000/api/auth/register', { // Ensure the URL is correct
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const result = await response.json();
                    this.showPage("home");
                } else {
                    const error = await response.json();
                    console.error("Error during registration:", error.error);
                }
            } catch (error) {
                console.error("Unexpected error during registration:", error.message);
            }
        },
        // Login method that sends credentials to the backend /login route
        async loginUser() {
            try {
                const response = await fetch("http://localhost:5000/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: this.loginEmail,
                        password: this.loginPassword
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("Login successful:", data);
                    this.isAuthenticated = true;
                    this.username = data.email;
                    this.idToken = data.idToken;
                    // Save the token to localStorage for session persistence
                    localStorage.setItem("idToken", data.idToken);
                    this.showPage("browse");
                } else {
                    console.error("Error during login.");
                    this.isAuthenticated = false;
                }
            } catch (error) {
                console.error("Unexpected error during login:", error.message);
                this.isAuthenticated = false;
            }
        },
        // Check authentication state by sending the token to a backend /authState endpoint
        async checkAuthState() {
            const token = localStorage.getItem("idToken");
            if (token) {
                try {
                    const response = await fetch("http://localhost:5000/api/auth/authState", {
                        method: "GET",
                        headers: {
                            "Authorization": `Bearer ${token}`
                        }
                    });
                    if (response.ok) {
                        const result = await response.json();
                        this.isAuthenticated = result.isAuthenticated;
                        this.username = result.displayName || "Guest";
                    } else {
                        this.isAuthenticated = false;
                        localStorage.removeItem("idToken");
                    }
                } catch (err) {
                    console.error("Error checking auth state:", err.message);
                    this.isAuthenticated = false;
                    localStorage.removeItem("idToken");
                }
            } else {
                this.isAuthenticated = false;
            }
        },
        // Logout method
        logoutUser() {
            localStorage.removeItem("idToken");
            this.isAuthenticated = false;
            this.username = "Guest";
            this.showPage("authentication");
            console.log("User logged out successfully.");
        },
        async searchMedia() {
            // Fetch media items from the backend based on search query
            if (this.searchQuery.trim().length > 0) {
                try {
                    const response = await fetch(`/api/media/search/${encodeURIComponent(this.searchQuery)}`);
                    if (response.ok) {
                        const results = await response.json();
                        this.searchResults = results;
                        this.updateVisibleResults();
                        this.showViewMore = this.searchResults.length > this.maxResultsToShow;
                    } else {
                        this.searchResults = [];
                        this.visibleResults = [];
                        this.showViewMore = false;
                    }
                } catch (err) {
                    console.error("Error during search:", err);
                }
            } else {
                // Clear results if the search box is empty
                this.searchResults = [];
                this.visibleResults = [];
                this.showViewMore = false;
            }
        },
        updateVisibleResults() {
            // Display the initial subset of results
            this.visibleResults = this.searchResults.slice(0, this.maxResultsToShow);
        },
        loadMoreResults() {
            // Load additional results (next set of 5)
            const currentCount = this.visibleResults.length;
            const additionalResults = this.searchResults.slice(currentCount, currentCount + this.maxResultsToShow);
            this.visibleResults = [...this.visibleResults, ...additionalResults];
            this.showViewMore = this.visibleResults.length < this.searchResults.length;
        },
        extractYear(dateString) {
            if (!dateString) return ''; // Handle missing date
            return dateString.split('-')[0]; // Extract the year
        },
        async viewMediaInfo(id) {
            try {
                const response = await fetch(`/api/media/details/${id}`);
                if (response.ok) {
                    const result = await response.json();
                    this.media = result;
                    this.showPage('mediaInfo');
                    this.searchQuery = '';
                } else {
                    console.error("Error fetching media details:", await response.text());
                }
            } catch (err) {
                console.error("Error fetching media details:", err);
            }
        },

    },
    created() {
        // Check authentication state when the app is created
        this.checkAuthState();
    }
});




