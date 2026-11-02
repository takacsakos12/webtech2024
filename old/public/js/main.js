Vue.use(VueResource);

new Vue({
  el: '#app',

  data() {
    return {
      user: { cart: [] },
      items: [],
      state: 'allbook',
      loading: false,
      searchQuery: '',
      selectedItem: {}
    };
  },

  created() {
    this.fetchData();
  },

  methods: {
    fetchData() {
      this.loading = true;
      this.$http.get('/api/users')
        .then(response => {
          this.user = response.body[0];
          return this.$http.get('/api/items');
        })
        .then(response => {
          this.items = response.body;
          this.smallLoadEffect();
        });
    },

    smallLoadEffect() {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, 300);
    },

    addCart(item) {
      if (item.raktarkeszlet <= 0) return;
      if (parseInt(this.user.money) < parseInt(item.ar)) return;

      if (this.user.cart.findIndex(k => k.id === item.id) === -1) {
        this.user.cart.push(item);
        this.user.money -= parseInt(item.ar);
        item.raktarkeszlet--;

        this.$http.put('/api/users', this.user);
        this.$http.put('/api/items/' + item.id, item);
      }
    },

    removeCart(item) {
      const index = this.user.cart.findIndex(k => k.id === item.id);
      if (index !== -1) {
        this.user.cart.splice(index, 1);
        this.user.money += parseInt(item.ar);
        item.raktarkeszlet++;

        this.$http.put('/api/users', this.user);
        this.$http.put('/api/items/' + item.id, item);
      }
    },

    saveUser() {
      this.$http.put('/api/users', this.user);
    }
  },

  watch: {
    state(newState) {
      this.smallLoadEffect();
    }
  },

  computed: {
    filteredItems() {
      return this.items.filter(item => {
        return JSON.stringify(item).toUpperCase().includes(this.searchQuery.toUpperCase());
      });
    }
  }
});
