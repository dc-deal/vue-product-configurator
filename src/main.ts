import { defineCustomElement } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'

// Register the configurator as a Custom Element (Web Component).
// Each <mbk-configurator> instance gets its own Vue app + Pinia store,
// configured via the `configureApp` hook (Vue 3.5+).
const MbkConfigurator = defineCustomElement(App, {
  configureApp(app) {
    app.use(createPinia())
  },
})

customElements.define('mbk-configurator', MbkConfigurator)
