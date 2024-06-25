new Vue({
    el: '#app',
    data: {
        items: []
    },
    created() {
        this.fetchItems();
    },
    methods: {
        fetchItems() {
            this.$http.get('/api/items')
                .then(response => {
                    this.items = response.body;
                });
        },
        addToCart(item) {
            alert(`Added ${item.termek_nev} to cart`);
            // Add the item to the cart. Implement the cart functionality as needed.
        }
    }
});
