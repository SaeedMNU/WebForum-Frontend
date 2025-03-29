let mediaForum = new Vue({
    el: "#app",
    data: {
        sitename: "Media Forum",
        username: "Guest",
        dropdownOpen: false,
        currentPage: 'browse',
        // Fields for registration:
        registerEmail: "",
        registerUsername: "",
        registerPassword: "",
        confirmPassword: "",
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
    },
});
