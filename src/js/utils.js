export function initializeCoins(coins, favoritedCoinSymbols) {
  // Initial `coins`, set `isFavorited` attr
  coins.forEach(function(coin, index) {
    if (favoritedCoinSymbols.indexOf(coin.symbol) >= 0) {
      coin.isFavorited = true;
    } else {
      coin.isFavorited = false;
    }
  });
}
