import Vue from 'vue'
import Router from 'vue-router'
import Bitontop from '@/components/Bitontop'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Bitontop',
      component: Bitontop
    }
  ]
})
