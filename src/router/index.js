import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import PluginManager from '@/views/PluginManager.vue'
import Settings from '@/views/Settings.vue'
import PluginView from '@/views/PluginView.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/plugins', name: 'plugins', component: PluginManager },
  { path: '/settings', name: 'settings', component: Settings },
  { path: '/plugin/:id', name: 'plugin', component: PluginView, props: true }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
