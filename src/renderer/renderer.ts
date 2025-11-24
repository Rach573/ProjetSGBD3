import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './style/global.css';

// Entry point for the renderer: create and mount Vue application with router
createApp(App).use(router).mount('#app');