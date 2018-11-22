import Vue from 'vue'
import Popup from '../vue/popup.vue'

import "node_modules/font-awesome/css/font-awesome.css"

import {
  initializeCoins
}
from './utils.js'

import {
  apiUrlTpl
}
from "./consts.js"

Vue.config.productionTip = false
Vue.config.devtools = false

// read coin symbols: ['BTC', 'ETH', ...], not coin object
function getFavoritedCoinSymbols() {
  // default favorited coins
  var favoritedCoinSymbols = ['BTC', 'ETH', 'BCH', 'XRP', 'LTC'],
    // set value for performance.
    savedFavoritedCoinSymbols = localStorage.favoritedCoinSymbols;
  if (savedFavoritedCoinSymbols != undefined &&
    savedFavoritedCoinSymbols != 'undefined') {
    favoritedCoinSymbols = JSON.parse(savedFavoritedCoinSymbols);
  }
  return favoritedCoinSymbols;
}

function getCurrency() {
  return localStorage.currency || 'USD';
}

document.addEventListener('DOMContentLoaded', () => {
  var savedCurrency = getCurrency();

  $.ajax({
    url: apiUrlTpl + savedCurrency,
    type: 'GET',
    dataType: 'json',
    success: function(coins) {
      // Load saved `favoritedCoinSymbols`
      var savedFavoritedCoinSymbols = getFavoritedCoinSymbols();

      // Init coins
      initializeCoins(coins, savedFavoritedCoinSymbols);

      // Initial `focusedCoin`
      // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/every
      var initialFocusedCoinSymbol = '';
      coins.every(function(coin, index, coins) {
        if (coin.isFavorited) {
          initialFocusedCoinSymbol = coin.symbol;
          return false;
        } else {
          return true;
        }
      });

      var vm = new Vue({
        el: '#main_wrapper',
        render: h => h(Popup, {
          props: {
            'initial-coins': coins,
            'saved-favorited-coin-symbols': savedFavoritedCoinSymbols,
            'initial-focused-coin-symbol': initialFocusedCoinSymbol,
            'saved-currency': savedCurrency
          }
        })
      });

      $('#load-page').hide();
    }
  })
});
