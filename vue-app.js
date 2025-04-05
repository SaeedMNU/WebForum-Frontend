let mediaForum = new Vue({
    el: "#app",
    data: {
        sitename: "Media Forum",
        username: "Guest",
        dropdownOpen: false,
        currentPage: "browse",
        isLoginFormVisible: true,
        loginEmail: "",
        loginPassword: "",
        registerEmail: "",
        registerUsername: "",
        registerPassword: "",
        confirmPassword: "",
        isAuthenticated: false,
        idToken: "",
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
        editMode: false,
        editedBio: "",
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
        ],
        inList: false,
        showExtraActions: false,
        mediaEntry: null,
        userScore: "",
        userFavourited: false,
    },
    watch: {
        currentPage(newVal, oldVal) {
            if (newVal !== 'mediaInfo') {
                this.showExtraActions = false;
            }
            if (newVal !== 'profile') {
                this.editMode = false;
            }
        }
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

                    this.user.uid = data.localId;
                    this.user.email = data.email;
                    this.user.displayName = data.displayName || "";
                    this.user.username = data.displayName && data.displayName.trim() !== ""
                        ? data.displayName
                        : this.loginEmail;

                    localStorage.setItem("userUid", data.localId);

                    this.username = this.user.displayName || this.user.username || this.loginEmail;

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
        logoutUser() {
            localStorage.removeItem("idToken");
            this.isAuthenticated = false;
            this.username = "Guest";
            this.showPage("authentication");
            console.log("User logged out successfully.");
        },
        async searchMedia() {
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
                this.searchResults = [];
                this.visibleResults = [];
                this.showViewMore = false;
            }
        },
        updateVisibleResults() {
            this.visibleResults = this.searchResults.slice(0, this.maxResultsToShow);
        },
        loadMoreResults() {
            const currentCount = this.visibleResults.length;
            const additionalResults = this.searchResults.slice(currentCount, currentCount + this.maxResultsToShow);
            this.visibleResults = [...this.visibleResults, ...additionalResults];
            this.showViewMore = this.visibleResults.length < this.searchResults.length;
        },
        extractYear(dateString) {
            if (!dateString) return '';
            return dateString.split('-')[0];
        },
        async fetchUserMediaEntry(mediaId) {
            if (!this.isAuthenticated) {
                this.inList = false;
                return;
            }
            try {
                const response = await fetch(
                    `/api/medialist/entry?uid=${this.user.uid}&media_id=${mediaId}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + this.idToken
                        }
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    if (data.exists) {
                        this.inList = true;
                        this.mediaEntry = data.entry;
                        this.userScore = data.entry.score || "";
                        this.userFavourited = data.entry.favourited || false;
                    } else {
                        this.inList = false;
                        this.mediaEntry = null;
                        this.userScore = "";
                        this.userFavourited = false;
                    }
                } else {
                    console.error("Error fetching media entry:", await response.text());
                }
            } catch (error) {
                console.error("Exception in fetchUserMediaEntry:", error);
            }
        },
        async addMediaToList(mediaId) {
            try {
                const response = await fetch('/api/medialist/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + this.idToken
                    },
                    body: JSON.stringify({
                        uid: this.user.uid,
                        media_id: mediaId
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.added) {
                        await this.fetchUserMediaEntry(mediaId);
                        this.showExtraActions = true;
                    }
                } else {
                    console.error("Add error:", await response.text());
                }
            } catch (error) {
                console.error("Exception in addMediaToList:", error);
            }
        },
        toggleExtraActions() {
            this.showExtraActions = !this.showExtraActions;
        },
        async removeMediaFromList(mediaId) {
            try {
                const response = await fetch('/api/medialist/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + this.idToken
                    },
                    body: JSON.stringify({
                        uid: this.user.uid,
                        media_id: mediaId
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (!data.added) {
                        await this.fetchUserMediaEntry(mediaId);
                        this.showExtraActions = false;
                        console.log("Media removed from list.");
                    }
                } else {
                    console.error("Remove error:", await response.text());
                }
            } catch (error) {
                console.error("Exception in removeMediaFromList:", error);
            }
        },
        async updateMediaEntry() {
            try {
                const response = await fetch('/api/medialist/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + this.idToken
                    },
                    body: JSON.stringify({
                        uid: this.user.uid,
                        media_id: this.media.media_id,
                        score: this.userScore,
                        favourited: this.userFavourited
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log("Media entry updated successfully.");

                        await this.fetchUserMediaEntry(this.media.media_id);
                        await this.refreshMediaDetails(this.media._id);
                    } else {
                        console.error("Failed to update media entry.");
                    }
                } else {
                    console.error("Update error:", await response.text());
                }
            } catch (error) {
                console.error("Exception in updateMediaEntry:", error);
            }
        },
        async refreshMediaDetails(mediaObjectId) {
            try {
                const response = await fetch(`/api/media/details/${mediaObjectId}`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const updatedMedia = await response.json();

                    this.media.score = updatedMedia.score;
                    this.media.scored_by = updatedMedia.scored_by;
                    this.media.members = updatedMedia.members;
                    this.media.favourites = updatedMedia.favourites;
                } else {
                    console.error("Error refreshing media details:", await response.text());
                }
            } catch (error) {
                console.error("Error in refreshMediaDetails:", error);
            }
        },
        async viewMediaInfo(id) {
            try {
                const response = await fetch(`/api/media/details/${id}`);
                if (response.ok) {
                    const result = await response.json();
                    this.media = result;
                    this.showPage('mediaInfo');
                    this.searchQuery = '';

                    if (this.isAuthenticated) {
                        await this.fetchUserMediaEntry(this.media.media_id);
                    }
                } else {
                    console.error("Error fetching media details:", await response.text());
                }
            } catch (err) {
                console.error("Error fetching media details:", err);
            }
        },
        async getUserProfile() {
            let uid = this.user.uid;
            if (!uid) {
                uid = localStorage.getItem("userUid");
                if (uid) {
                    this.user.uid = uid;
                }
            }

            const token = localStorage.getItem("idToken");
            if (!token || !uid) return;

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
                    this.user = { ...this.user, ...profileData };
                } else {
                    console.error("Failed to load user profile data.");
                }
            } catch (error) {
                console.error("Error loading user profile:", error.message);
            }
        },
        toggleEditMode() {
            if (!this.editMode) {
                this.editedBio = this.user.bio || "";
                this.editMode = true;
            } else {
                this.updateProfile();
            }
        },
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
            this.editMode = false;
        },
        async handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const uid = this.user.uid;
            const token = localStorage.getItem("idToken");
            if (!uid || !token) return;

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
        this.checkAuthState();

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




