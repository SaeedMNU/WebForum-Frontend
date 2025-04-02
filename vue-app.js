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
        // Fields for registration:
        registerEmail: "",
        registerUsername: "",
        registerPassword: "",
        confirmPassword: "",
        // Authentication state:
        isAuthenticated: false,
        idToken: "",
        // New user profile object:
        user: {
            uid: "",
            email: "",
            username: "",
            displayName: "",
            profile_picture: "",
            bio: "",
            created_at: null,
            forum_posts_count: 0,
            social_posts_count: 0,
            likes_received: 0,
            dislikes_received: 0,
            completed_media_ids: [],
            website_role: "user",
            theme: ""
        },
        // properties for editing profile
        editMode: false,
        editedBio: "",
        // Other properties:
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
    computed: {
        joinedDate() {
            if (this.user.created_at) {
                let seconds = null;
                if (this.user.created_at.seconds) {
                    seconds = this.user.created_at.seconds;
                } else if (this.user.created_at._seconds) {
                    seconds = this.user.created_at._seconds;
                }
                if (seconds !== null) {
                    const date = new Date(seconds * 1000);
                    const year = date.getFullYear();
                    const month = ("0" + (date.getMonth() + 1)).slice(-2);
                    const day = ("0" + date.getDate()).slice(-2);
                    return `${year}/${month}/${day}`;
                }
            }
            return "Unknown";
        }
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
                const response = await fetch('http://localhost:5000/api/auth/register', {
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
                    this.idToken = data.idToken;
                    localStorage.setItem("idToken", data.idToken);

                    // Update the user object based on the login result
                    this.user.uid = data.localId;
                    this.user.email = data.email;
                    this.user.displayName = data.displayName || "";
                    this.user.username = data.displayName && data.displayName.trim() !== ""
                        ? data.displayName
                        : this.loginEmail;
                    // Save the uid in localStorage as well
                    localStorage.setItem("userUid", data.localId);

                    // Update the header username immediately
                    this.username = this.user.displayName || this.user.username || this.loginEmail;

                    // Load full profile details from Firestore
                    await this.getUserProfile();
                    this.showPage("home");
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
        async getUserProfile() {
            // First, ensure that uid is set. Try reading from localStorage if it's missing.
            let uid = this.user.uid;
            if (!uid) {
                uid = localStorage.getItem("userUid");
                if (uid) {
                    this.user.uid = uid;
                }
            }

            const token = localStorage.getItem("idToken");
            if (!token || !uid) return; // If we don't have token or uid, do not proceed.

            try {
                const response = await fetch(`http://localhost:5000/api/users/${uid}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const profileData = await response.json();
                    // Update the user object with the fetched data
                    this.user = { ...this.user, ...profileData };
                } else {
                    console.error("Failed to load user profile data.");
                }
            } catch (error) {
                console.error("Error loading user profile:", error.message);
            }
        },
        // Toggle between view and edit mode
        toggleEditMode() {
            if (!this.editMode) {
                // When entering edit mode, copy the existing bio into editedBio
                this.editedBio = this.user.bio || "";
                this.editMode = true;
            } else {
                // When saving changes, call updateProfile()
                this.updateProfile();
            }
        },

        // Update the user profile
        async updateProfile() {
            const token = localStorage.getItem("idToken");
            if (!token || !this.user.uid) return;

            try {
                const response = await fetch(`http://localhost:5000/api/users/${this.user.uid}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ bio: this.editedBio })
                });
                if (response.ok) {
                    const updatedProfile = await response.json();
                    this.user = { ...this.user, ...updatedProfile };
                    this.username = this.user.displayName || this.user.username || "Guest";
                    console.log("Profile updated successfully.");
                } else {
                    console.error("Failed to update profile.");
                }
            } catch (error) {
                console.error("Error updating profile:", error.message);
            }
            // Exit edit mode after saving.
            this.editMode = false;
        },
        // Called when the file input changes
        async handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const uid = this.user.uid;
            const token = localStorage.getItem("idToken");
            if (!uid || !token) return;

            // Creates a FormData object and append the file
            const formData = new FormData();
            formData.append("profilePicture", file);

            try {
                const response = await fetch(`http://localhost:5000/api/users/${uid}/uploadProfilePicture`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    },
                    body: formData
                });
                if (response.ok) {
                    const result = await response.json();
                    // Update the user object’s profile picture
                    this.user.profile_picture = result.profile_picture;
                    console.log("Profile picture updated:", result.profile_picture);
                } else {
                    console.error("Failed to update profile picture.");
                }
            } catch (error) {
                console.error("Error uploading file:", error.message);
            }
        },



    },
    created() {
        // Check auth state of user
        this.checkAuthState();

        // Restore session details if available
        const storedToken = localStorage.getItem("idToken");
        const storedUid = localStorage.getItem("userUid");
        if (storedToken && storedUid) {
            this.idToken = storedToken;
            this.user.uid = storedUid;
            this.isAuthenticated = true;
            this.getUserProfile();
        }
    }

});




