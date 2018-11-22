import Vue from 'vue'
Vue.config.productionTip = false
Vue.config.devtools = false
import ceHelper from '@ea-utils/ce-helper';

import '../popup.html'
import '../img/icon_16.png'
import '../img/icon_24.png'
import '../img/icon_32.png'
import '../img/icon_128.png'
import '../img/icon.svg'
import '../img/close.svg'
import '../img/chart.svg'
import '../img/config.svg'

$(function() {
  ceHelper("12")
})
