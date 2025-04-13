let mediaForum = new Vue({
    el: "#app",
    data: {
        // Default site values for the app:
        sitename: "Media Forum",
        username: "Guest",
        dropdownOpen: false,
        currentPage: "home",
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
        authError: "",
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
        // For editing user site data:
        editMode: false,
        editedBio: "",
        // For dynamic media search and display:
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
            { key: "aired_from", label: "Aired from" },
            { key: "aired_to", label: "Aired to" },
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
        homeCategories: {
            discovery: [],
            interested: { genre: '', items: [] },
            fanOf: { studio: '', items: [] },
            moreFrom: { licensor: '', items: [] },
            rewindBackTo: { year: '', items: [] }
        },
        // User related media properties:
        inList: false,
        showExtraActions: false,
        mediaEntry: null,
        userScore: "",
        userFavourited: false,
        userMediaList: [],
        // Forum properties:
        forumCategories: ["General", "Media", "Industry"],
        loadedForums: [],
        showCreateForumForm: false,
        newForum: {
            category: "",
            name: "",
            description: ""
        },
        selectedForumName: '',
        selectedForumId: '',
        topics: [],
        userDisplayNames: {},
        showCreateTopicForm: false,
        newTopic: {
            title: '',
            content: ''
        },
        selectedTopicId: '',
        selectedTopicTitle: "",
        selectedTopicAuthor: "",
        selectedTopicAuthorDisplay: "",
        selectedTopicContent: '',
        posts: [],
        showCreatePostForm: false,
        newPost: {
            content: ''
        },
    },
    watch: {
        // Watch for changes in the current page and update certain states accordingly
        currentPage(newVal, oldVal) {
            if (newVal !== 'mediaInfo') {
                this.showExtraActions = false;
            }
            if (newVal !== 'profile') {
                this.editMode = false;
            }
            if (newVal === 'forum-topics' && this.selectedForumId) {
                this.fetchTopics();
            }
            if (newVal === "topic-posts" && this.selectedTopicId) {
                this.fetchPosts();
            }
            if (newVal !== 'forum') {
                this.showCreateForumForm = false;
            }
            if (newVal !== 'forum-topics') {
                this.showCreateTopicForm = false;
            }
            if (newVal !== 'topic-posts') {
                this.showCreatePostForm = false;
            }
        }
    },
    computed: {
        // Computed property to format the user's joined date
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
        // Method to toggle the dropdown menu
        toggleDropdown() {
            this.dropdownOpen = !this.dropdownOpen;
        },
        // Method to allow for page navigation & close the dropdown menu
        showPage(page) {
            this.currentPage = page;
            this.dropdownOpen = false;
        },
        // Method to toggle between login and registration forms
        toggleForm() {
            this.isLoginFormVisible = !this.isLoginFormVisible;
        },
        // Registration method that sends user data to the backend to authenticate using Firebase authentication
        async registerUser() {
            if (this.registerPassword !== this.confirmPassword) {
                this.authError = "Passwords do not match.";
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
                    this.authError = "";
                    this.isLoginFormVisible = true;
                    this.registerEmail = '';
                    this.registerUsername = '';
                    this.registerPassword = '';
                    this.confirmPassword = '';
                } else {
                    const error = await response.json();
                    this.authError = error.error;
                    console.error("Error during registration:", error.error);
                }
            } catch (error) {
                console.error("Unexpected error during registration:", error.message);
                this.authError = error.message;
            }
        },
        // Login method that sends user data to the backend to authenticate using Firebase authentication
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
                    this.authError = "";
                    this.isAuthenticated = true;
                    this.idToken = data.idToken;
                    localStorage.setItem("idToken", data.idToken);

                    this.user.uid = data.localId;
                    this.user.email = data.email;
                    this.user.displayName = data.displayName || "";
                    this.user.username = (data.displayName && data.displayName.trim() !== "")
                        ? data.displayName
                        : this.loginEmail;
                    localStorage.setItem("userUid", data.localId);
                    this.username = this.user.displayName || this.user.username || this.loginEmail;

                    // Load the full profile details
                    await this.getUserProfile();

                    this.fetchUserMediaList();
                    this.showPage("home");
                    this.loginEmail = '';
                    this.loginPassword = '';
                } else {
                    const errorData = await response.json();
                    this.authError = errorData.error || "Unknown login error.";
                    console.error("Error during login:", this.authError);
                    this.isAuthenticated = false;
                }
            } catch (error) {
                console.error("Unexpected error during login:", error.message);
                this.authError = error.message;
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


        // Fetch media items from the backend based on search query
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
                // Clear results if the search box is empty
                this.searchResults = [];
                this.visibleResults = [];
                this.showViewMore = false;
            }
        },
        // Display the initial subset of results
        updateVisibleResults() {
            this.visibleResults = this.searchResults.slice(0, this.maxResultsToShow);
        },
        // Load additional results (next set of 5)
        loadMoreResults() {
            const currentCount = this.visibleResults.length;
            const additionalResults = this.searchResults.slice(currentCount, currentCount + this.maxResultsToShow);
            this.visibleResults = [...this.visibleResults, ...additionalResults];
            this.showViewMore = this.visibleResults.length < this.searchResults.length;
        },
        // Extract the year from a date string (e.g., "2023-10-01" to "2023")
        extractYear(dateString) {
            if (!dateString) return '';
            return dateString.split('-')[0];
        },
        // Fetch full media details based on the media ID
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

        // When the media is NOT in the user's list, add it.
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
                        // After adding, update state and open extra actions.
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
        // Toggle the display of extra actions if the media is in the list.
        toggleExtraActions() {
            this.showExtraActions = !this.showExtraActions;
        },
        // Remove the media from the user's list.
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
                    // The toggle endpoint returns data.added === false if the item was removed.
                    if (!data.added) {
                        await this.fetchUserMediaEntry(mediaId); // This will update inList to false.
                        this.showExtraActions = false;
                    }
                } else {
                    console.error("error:", await response.text());
                }
            } catch (error) {
                console.error("Exception in removeMediaFromList:", error);
            }
        },
        // Update the score and favourite status for the media entry.
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
                        // Update the user's media entry data
                        await this.fetchUserMediaEntry(this.media.media_id);
                        // Refresh the aggregated media details using the MongoDB _id
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
        // Refresh aggregated media details based on the backend's mediaTitles collection.
        async refreshMediaDetails(mediaObjectId) {
            try {
                const response = await fetch(`/api/media/details/${mediaObjectId}`, {
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const updatedMedia = await response.json();
                    // Update the aggregated fields
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
        // When viewing media details, load the media and then check its status in the user's list.
        async viewMediaInfo(id) {
            try {
                const response = await fetch(`/api/media/details/${id}`);
                if (response.ok) {
                    const result = await response.json();
                    this.media = result;
                    this.showPage('mediaInfo');
                    this.searchQuery = '';

                    // After media details have loaded, check if the media is already in the user's list.
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
        async fetchHomeMedia() {
            try {
                const response = await fetch("http://localhost:5000/api/media/home");
                if (response.ok) {
                    const data = await response.json();
                    this.homeCategories = data;
                } else {
                    console.error("Failed to load home media data.");
                }
            } catch (error) {
                console.error("Error fetching home media:", error);
            }
        },
        async fetchUserMediaList() {
            try {
                const response = await fetch(`http://localhost:5000/api/mediaList/user-list?uid=${this.user.uid}`);
                const data = await response.json();
                this.userMediaList = data.mediaList;
            } catch (error) {
                console.error("Error loading user media list:", error);
            }
        },


        // Fetch the user's profile from the backend using the uid and token
        async getUserProfile() {
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
                this.updateProfile();
            }
        },
        // Update the user profile fields
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

            // Create a FormData object and append the file
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


        // Toggle the display of the create forum form
        toggleCreateForumForm() {
            this.showCreateForumForm = !this.showCreateForumForm;
        },
        // Fetch existing forums from the backend
        async fetchForums() {
            try {
                const response = await fetch("/api/forums");
                if (response.ok) {
                    this.loadedForums = await response.json();
                } else {
                    console.error("Error fetching forums:", await response.text());
                }
            } catch (error) {
                console.error("Exception fetching forums:", error);
            }
        },
        // Returns forums filtered by a given category.
        forumsByCategory(category) {
            return this.loadedForums.filter(forum => forum.category === category);
        },
        // Create a new forum by sending form data to the backend
        async createForum() {
            if (!this.newForum.name.trim() || !this.newForum.description.trim() || !this.newForum.category.trim()) {
                alert("Please fill in all required fields.");
                return;
            }
            try {
                const response = await fetch("/api/forums/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: this.newForum.name,
                        description: this.newForum.description,
                        category: this.newForum.category,
                        role: this.user.website_role
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("Forum created:", data.forum);
                    // Refresh the forums list.
                    await this.fetchForums();
                    this.toggleCreateForumForm();
                    this.newForum.category = "";
                    this.newForum.name = "";
                    this.newForum.description = "";
                } else {
                    console.error("Error creating forum:", await response.text());
                }
            } catch (error) {
                console.error("Exception while creating forum:", error);
            }
        },
        formatDate(dateStr) {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
        },

        // Select a forum to view its topics
        selectForum(forum) {
            this.selectedForumName = forum.name;
            this.selectedForumId = forum.forum_id || forum._id;
            this.currentPage = 'forum-topics';
        },
        // Toggle the display of the create topic form
        toggleCreateTopicForm() {
            this.showCreateTopicForm = !this.showCreateTopicForm;
        },
        // Create a new topic by sending form data to the backend
        async createTopic() {
            if (!this.newTopic.title.trim() || !this.newTopic.content.trim()) {
                alert('Please fill in all required fields.');
                return;
            }
            try {
                const response = await fetch('/api/topics/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        forum_id: this.selectedForumId,
                        title: this.newTopic.title,
                        content: this.newTopic.content,
                        author_uid: this.user.uid
                    })
                });
                if (response.ok) {
                    const data = await response.json();
                    this.fetchTopics();
                    this.toggleCreateTopicForm();
                    this.fetchForums();
                    this.newTopic.title = "";
                    this.newTopic.content = "";
                } else {
                    const errText = await response.text();
                    console.error('Error creating topic:', errText);
                }
            } catch (error) {
                console.error('Exception in createTopic:', error);
            }
        },
        // Fetch the display name of a user from Firestore using the given UID
        async getUserDisplayNameFromFirestore(uid) {
            try {
                const doc = await firebase.firestore().collection("users").doc(uid).get();
                if (doc.exists) {
                    return doc.data().displayName || uid;
                } else {
                    return uid;
                }
            } catch (error) {
                console.error("Error fetching display name for UID", uid, error);
                return uid;
            }
        },
        // Fetch display names for all authors in the topics array via UID
        async fetchUserDisplayNames() {
            const uniqueUIDs = new Set();
            this.topics.forEach(topic => uniqueUIDs.add(topic.author_uid));
            for (const uid of uniqueUIDs) {
                // Only fetch if not already in the cache
                if (!this.userDisplayNames[uid]) {
                    const displayName = await this.getUserDisplayNameFromFirestore(uid);
                    this.$set(this.userDisplayNames, uid, displayName);
                }
            }
        },
        // Fetch topics for the selected forum
        async fetchTopics() {
            try {
                const response = await fetch(`/api/topics/${this.selectedForumId}`);
                if (response.ok) {
                    const res = await response.json();
                    this.topics = res;
                } else {
                    console.error("Error fetching topics:", await response.text());
                }
            } catch (error) {
                console.error("Exception fetching topics:", error);
            }
        },


        // Select a topic to view its posts/discussion
        selectTopic(topic) {
            // Set selected topic data
            this.selectedTopicId = topic.topic_id;
            this.selectedTopicTitle = topic.title;
            this.selectedTopicAuthor = topic.author_uid;
            this.selectedTopicAuthorDisplay = topic.author_displayName || topic.author_uid;
            this.selectedTopicContent = topic.content;
            this.selectedTopicPostsCount = topic.posts_count;
            this.selectedTopicViews = topic.views;

            // Clear posts and navigate to topic-posts page
            this.posts = [];
            this.currentPage = 'topic-posts';
        },
        // Fetch posts for the selected topic
        async fetchPosts() {
            try {
                const response = await fetch(`/api/posts/${this.selectedTopicId}`);
                if (response.ok) {
                    const res = await response.json();
                    this.posts = res;
                } else {
                    const errorText = await response.text();
                    console.error("Error fetching posts:", errorText);
                }
            } catch (error) {
                console.error("Exception fetching posts:", error);
            }
        },
        // Create a new post in the selected topic
        async createPost() {
            if (!this.newPost.content.trim()) {
                alert("Please write some content for your reply.");
                return;
            }

            try {
                const response = await fetch("/api/posts/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        topic_id: this.selectedTopicId,
                        author_uid: this.user.uid,
                        content: this.newPost.content
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.posts.push(data.post);

                    this.fetchPosts();
                    this.newPost.content = "";
                    this.showCreatePostForm = false;
                } else {
                    console.error("Error creating post:", await response.text());
                    alert("Error creating post.");
                }
            } catch (error) {
                console.error("Exception in createPost:", error);
                alert("Error creating post.");
            }
        },
        // Toggle the display of the create post form
        toggleCreatePostForm() {
            this.showCreatePostForm = !this.showCreatePostForm;
        },

    },
    // Lifecycle hooks
    created() {
        // Check auth state
        this.checkAuthState();
        this.fetchForums();

        // If there is an idToken and userUid in localStorage, restore them
        const storedToken = localStorage.getItem("idToken");
        const storedUid = localStorage.getItem("userUid");
        if (storedToken && storedUid) {
            this.idToken = storedToken;
            this.user.uid = storedUid;
            this.isAuthenticated = true;
            this.getUserProfile();
            this.fetchUserMediaList();
        }

        this.fetchHomeMedia();
    }

});




