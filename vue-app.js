let mediaForum = new Vue({
    el: "#app",
    data: {
        sitename: "Media Forum",
        username: "Guest",
        dropdownOpen: false,
        currentPage: 'browse',
    },
    methods: {
        toggleDropdown() {
            this.dropdownOpen = !this.dropdownOpen;
        },
        showPage(page) {
            this.currentPage = page;
            this.dropdownOpen = false;
        }
    },
});

as