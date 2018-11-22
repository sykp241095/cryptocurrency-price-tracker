<template>
<div>
  <div id="coin-list">
    <table>
      <tbody>
        <tr v-for="coin in coins" v-if="coin.isFavorited" @click="focusedCoinSymbol = coin.symbol" :class="{active: coin.id === focusedCoin.id}">
          <td class="text-left currency">
            {{ coin.symbol }}
          </td>
          <td class="text-right">
            <b>{{ currencySymbol }}</b>{{ numberWithCommas((coin['price_'+currency.toLowerCase()] * 1).toFixed(4)) }}
            <span class="trend" :class="coin.percent_change_24h > 0 ? 'bg-green' : 'bg-red'">
                <label class="float-left">
                  {{ coin.percent_change_24h>=0?"+":"-" }}
                </label>{{ Math.abs(coin.percent_change_24h) }}%
              </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div id="coin-info">
    <table>
      <thead>
        <tr>
          <th colspan=2>
            {{ focusedCoin.symbol }}, {{ focusedCoin.name }} <span v-show="showChart">(30d, USD)</span>
            <img src="../img/close.svg" v-show="showChart" @click="showChart=false" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Changes 1h/24h</th>
          <td>{{ focusedCoin.percent_change_1h }}% / {{ focusedCoin.percent_change_24h }}%</td>
        </tr>
        <tr>
          <th>Volumns (24h)</th>
          <td>{{currencySymbol}}{{ numberWithCommas(parseInt(focusedCoin['24h_volume_'+currency.toLowerCase()], 10)) }}</td>
        </tr>
        <tr>
          <th>Market Cap</th>
          <td>{{currencySymbol}}{{ numberWithCommas(parseInt(focusedCoin["market_cap_"+currency.toLowerCase()], 10)) }}</td>
        </tr>
        <tr>
          <th>Circulation</th>
          <td>{{ numberWithCommas(parseInt(focusedCoin.available_supply, 10)) }}</td>
        </tr>
        <tr>
          <th>Max Supply</th>
          <td>{{ numberWithCommas(parseInt(focusedCoin.max_supply, 10)) }}</td>
        </tr>
      </tbody>
    </table>

    <div id="coin-chart-wrapper" v-show="showChart">
      <canvas id="coin-chart-body"></canvas>
    </div>
  </div>

  <div id="coin-ctrl">
    <table>
      <tbody>
        <tr>
          <td style="width: 8%" class='text-left'>
            <a href="https://coinmarketcap.com/" target="_blank"><img src="../img/icon.svg" /></a>
          </td>
          <td style="width: 17%" class="coin-ctrl-social">
            <social-sharing :url="link" title="Cryptocurrency Price Tracker" description="This extension can track any cryptocurrency's price, nearly realtime. Support both Chrome and Firefox" quote="Cryptocurrency Price Tracker" hashtags="bitcoin, btc, eth, ltc,cryptocurrency"
              twitter-user="sykp241095" inline-template>
              <div>
                <network network="twitter">
                  <i class="fa fa-twitter"></i>
                </network>
              </div>
            </social-sharing>
          </td>
          <td style="width: 50%" class="text-center text-grey text-small">
            {{ focusedCoin.last_updated ? moment(focusedCoin.last_updated, 'X').fromNow() : '' }}
          </td>
          <td style="width: 25%" class="text-right cursor-pointer">
            <img src="../img/chart.svg" @click="showChart=!showChart" /> &nbsp;
            <img src="../img/config.svg" @click="showConfigPanel=!showConfigPanel" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div id="ctrl-page" v-show="showConfigPanel">
    <div class="ctrl-page-title">
      <h2>Settings</h2>
      <span class="close" @click="showConfigPanel=false">
          <img src="../img/close.svg" />
        </span>
    </div>

    <div class="ctrl-page-currency">
      <span v-for="c in currencies" :class="{active: currency == c}" @click="currency=currency=='USD'?c:(currency==c?'USD':c)">
          {{ c }}
        </span>
    </div>

    <div class="ctrl-page-searchbar">
      <input type="text" placeholder="search" v-model="searchKeyword" />
    </div>

    <table class="ctrl-page-list">
      <tbody>
        <tr v-for="coin in filteredCoins">
          <td class="text-left" @click="coin.isFavorited=!coin.isFavorited">
            <input type="checkbox" v-model="coin.isFavorited" />
            <span :class="{'text-bold-and-italic': coin.isFavorited}">
                {{ coin.name }} {{ coin.symbol }}
              </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

</div>
</template>

<script>
'use strict';

import Vue from "vue"
var SocialSharing = require("vue-social-sharing")
Vue.use(SocialSharing)
const {
  detect
} = require('detect-browser')
const browser = detect()

let link = "https://addons.mozilla.org/en-US/firefox/addon/1-cryptocurrency-price-tracker/"
if (browser && browser.name == "chrome") {
  link = "https://chrome.google.com/webstore/detail/cryptocurrency-price-trac/ogikkjdnpheackljfelfkgbgdpmpjpfl"
}

import {
  initializeCoins
} from "../js/utils.js"

import {
  apiUrlTpl,
  currencies
} from "../js/consts.js"

import moment from "moment"
import Chart from "chart.js"

Vue.prototype.moment = moment


if (typeof(String.prototype.trim) === "undefined") {
  String.prototype.trim = function() {
    return String(this).replace(/^\s+|\s+$/g, '');
  };
}

function reStructuredData(data, days) {
  var then = moment().subtract(days + 1, 'days').unix() * 1000;
  return data.filter(function(point) {
    return point[0] > then;
  }).map(function(point, index, array) {
    return {
      x: moment(point[0]),
      y: point[1]
    }
  })
}

var chart = null;

function drawChartOfCoin(coin) {
  var dataUrl = "https://deals99.com/api/coinmarketcap/currencies/" + coin.id +
    "/";
  $.ajax({
    url: dataUrl,
    type: "GET",
    dataType: "json",
    success: function(data) {
      // Push latest datapoint to data array
      data.price_usd.push([coin.last_updated * 1000, parseFloat(coin.price_usd)
        .toFixed(4)
      ]);
      data = reStructuredData(data.price_usd, 30);
      if (chart) {
        chart.data.datasets[0].data = data;
        chart.update();
      } else {
        chart = new Chart($("#coin-chart-body"), {
          type: 'line',
          data: {
            datasets: [{
              label: ' Price(USD)',
              borderColor: "lightgrey",
              borderWidth: '1',
              fill: true,
              pointRadius: 2,
              data: data
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            legend: {
              display: false
            },
            scales: {
              xAxes: [{
                type: 'time',
                time: {
                  unit: 'day',
                  tooltipFormat: 'll HH:mm'
                },
                distribution: 'series',
                ticks: {
                  source: 'auto'
                },
                gridLines: {
                  display: false
                }
              }],
              yAxes: [{
                gridLines: {
                  color: 'rgb(50, 50, 50)',
                  lineWidth: '1',
                }
              }]
            },
            angleLines: {
              color: 'rgb(56, 56, 56)'
            },
            animation: {
              onComplete: function() {}
            }
          }
        });
      }
    }
  });
}

function setCurrency(currency) {
  if (currency == "USD") {
    localStorage.removeItem("currency");
  } else {
    localStorage.currency = currency;
  }
}

export default {
  props: ["initialCoins", "savedFavoritedCoinSymbols", "initialFocusedCoinSymbol", "savedCurrency"],
  data() {
    return {
      coins: this.initialCoins,
      favoritedCoinSymbols: this.savedFavoritedCoinSymbols,
      focusedCoinSymbol: this.initialFocusedCoinSymbol,
      currency: this.savedCurrency,
      searchKeyword: "",
      showConfigPanel: false,
      showChart: false,
      currencies: currencies,
      link: link
    }
  },
  computed: {
    focusedCoin: function() {
      for (var i = 0; i < this.coins.length; i++) {
        var coin = this.coins[i];
        if (coin.symbol == this.focusedCoinSymbol) {
          drawChartOfCoin(coin);
          return coin;
        }
      }
      return {};
    },
    filteredCoins: function() {
      var searchKeyword = this.searchKeyword.trim().toLowerCase();
      return this.coins.filter(function(coin) {
        return coin.symbol.toLowerCase().indexOf(
            searchKeyword) >= 0 || coin.name.toLowerCase()
          .indexOf(searchKeyword) >= 0
      });
    },
    favoritedCoins: function() {
      var self = this;
      return self.coins.filter(function(coin) {
        return self.favoritedCoinSymbols.indexOf(coin
          .symbol) >= 0;
      })
    },
    currencySymbol: function() {
      return {
        USD: "$",
        AUD: "$",
        CAD: "$",
        CHF: "CHF",
        CNY: "￥",
        GBP: "£",
        EUR: "€",
        JPY: "¥",
      }[this.currency] || ""
    }
  },
  methods: {
    // Refer: https://stackoverflow.com/a/2901298
    numberWithCommas: function(x) {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return parts.join(".");
    }
  },
  watch: {
    coins: {
      handler: function(newCoins, oldCoins) {
        var self = this,
          favoritedCoinSymbols = [];
        newCoins.forEach(function(coin, index) {
          if (coin.isFavorited) {
            favoritedCoinSymbols.push(coin.symbol);
          }
        })
        self.favoritedCoinSymbols = favoritedCoinSymbols
        localStorage.favoritedCoinSymbols = JSON.stringify(
          favoritedCoinSymbols);

        var isFocusedCoinAlive = favoritedCoinSymbols.some(
          function(
            symbol, index, symbols) {
            return self.focusedCoin.isFavorited == true &&
              self.focusedCoin.symbol == symbol;
          })
        if (!isFocusedCoinAlive) {
          if (favoritedCoinSymbols.length > 0) {
            self.focusedCoinSymbol = self.favoritedCoins[0].symbol;
          } else {
            self.focusedCoinSymbol = "";
          }
        }
      },
      deep: true
    },
    currency: function(newCurrency, oldCurrency) {
      var self = this;
      setCurrency(newCurrency);
      $.ajax({
        url: apiUrlTpl + newCurrency,
        type: "GET",
        dataType: "json",
        success: function(coins) {
          initializeCoins(coins, self.favoritedCoinSymbols);
          self.coins = coins;
        }
      });
    }
  }
}
</script>
<style lang="stylus">
$bodyWidth = 350px
// $bodyHeight = 590px
$coinListRowHeight = 50px
$coinListHeight = ($coinListRowHeight * 6)
$coinInfoRowHeight = 40px
$coinInfoHeight = ($coinInfoRowHeight * 6)
$fontSize = 18px
$searchBarHeight = 35px
$bodyHeight = $coinListHeight + $coinInfoHeight + $coinInfoRowHeight


::-webkit-scrollbar
  display none

::placeholder
  color lightgrey

*
  box-sizing border-box
  -webkit-font-smoothing antialiased

body
  color white
  word-wrap break-word
  background-color black
  border none
  padding 0
  margin 0
  font-size $fontSize
  width $bodyWidth
  height $bodyHeight
  overflow -moz-scrollbars-none

  h1, h2, h3, h4, h5, h6
    margin 0

  .text-bold-and-italic
    font-weight bold
    font-style italic

  .text-grey
    color grey

  .text-left
    text-align left

  .text-center
    text-align center

  .text-right
    text-align right

  .float-left
    float left

  .float-right
    float right

  .text-small
    font-size 0.9em

  .bg-green
    background-color rgb(139, 215, 116)

  .bg-red
    background-color rgb(215, 77, 62)

  .cursor-pointer
    cursor pointer

  table
    width 100%
    border-collapse collapse
    border none

    tbody>tr
      th, td
        border none
        padding 0 10px

  #coin-list
    height $coinListHeight
    overflow scroll

    table
      tbody>tr
        border-bottom 1px solid rgb(30, 30, 30)
        height $coinListRowHeight
        line-height (@height - 1px)

        &:hover, &.active
          background-color rgb(56, 56, 56)
          cursor pointer

        td
          &.currency
            font-weight bold

          span
            display inline-block
            line-height $fontSize
            padding 7px
            width 100px
            border-radius 4px

            &.trend
              margin-left 3px

              label
                position relative
                top -1px

  #coin-info, #coin-ctrl
    background-color rgb(33, 33, 33)

    table
      thead, tbody
        tr
          height $coinInfoRowHeight
          line-height (@height - 1px)

          th
            font-weight bolder

  #coin-info
    height $coinInfoHeight
    position relative

    table
      thead, tbody
        tr
          border-bottom 1px solid rgb(56, 56, 56)
      thead>tr
        th
          text-align center

          img
            position absolute
            right 10px
            top 10px
            height 20px
            cursor pointer

      tbody>tr
        th
          font-size ($fontSize * 0.8)
          text-align left

        td
          text-align right

    #coin-chart-wrapper
      position fixed
      width $bodyWidth
      top ($coinListHeight + $coinInfoRowHeight)
      height ($coinInfoRowHeight * 5)
      background-color rgb(33, 33, 33)

  #coin-ctrl
    table
      tbody
        tr
          td
            >a
              display block

            img
              display inline
              height ($fontSize * 0.8)
              cursor pointer
              margin-top (($coinInfoRowHeight - @height) / 2)

            &.coin-ctrl-social
              div
                height auto

                span
                  margin 0

                  i
                    cursor pointer

  #ctrl-page
    position fixed
    width $bodyWidth
    height $bodyHeight - $coinInfoRowHeight
    left 0
    top 0
    right 0
    bottom 0
    border none
    z-index 998
    background-color rgb(33, 33, 33)
    color white
    overflow scroll

    >.ctrl-page-title
      position relative
      height $coinListRowHeight
      line-height @height

      >h2
        text-align center
        font-size $fontSize

      >.close
        position absolute
        top 0
        right 0
        width 50px
        cursor pointer
        display inline-block
        text-align right
        padding-right 10px

        img
          width 16px
          height @width

    >.ctrl-page-currency
      width auto
      height $coinListRowHeight
      text-align left
      overflow-x scroll
      overflow-y hidden
      white-space nowrap

      >span
        display inline-block
        width 12%
        height 22px
        line-height @height
        margin 9px 2%
        text-align center
        font-size 14px
        font-weight bold
        cursor pointer
        background-color rgb(80, 80, 80)
        border-radius 10px

        &.active
          background-color white
          color rgb(33, 33, 33)

    >.ctrl-page-searchbar
      input[type="text"]
        width 100%
        font-size $fontSize
        height $searchBarHeight
        padding 0 10px
        border none
        box-shadow none
        outline 0 none
        background-color rgb(90, 90, 90)
        color white

    >table.ctrl-page-list
      display block
      height ($bodyHeight - $coinListRowHeight * 2 - $searchBarHeight - $coinInfoRowHeight)
      overflow scroll

      tbody>tr
        th, td
          height 40px
          line-height 40px
          cursor pointer
          border-bottom 1px solid rgb(56, 56, 56)
          width $bodyWidth

          input[type="checkbox"]
            position relative
            top -2px

  #load-page
    position fixed
    left 0
    top 0
    right 0
    bottom 0
    border none
    z-index 999
    background-color rgb(33, 33, 33)
    color white
    line-height $bodyHeight
    text-align center
</style>
