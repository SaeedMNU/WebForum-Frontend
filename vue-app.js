let mediaForum = new Vue({
    el: "#app",
    data: {
        sitename: "Media Forum",
        username: "Guest",
        dropdownOpen: false,
        currentPage: 'browse',
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
    },
});
