// Utilidades comuns dos jogos do Kit Foco (PT-BR)
var KF = {
  best: function (key, val, lowerIsBetter) {
    var k = 'kf_best_' + key, cur = null;
    try { cur = JSON.parse(localStorage.getItem(k)); } catch (e) {}
    if (val === undefined) return cur;
    var better = cur === null || (lowerIsBetter ? val < cur : val > cur);
    if (better) { try { localStorage.setItem(k, JSON.stringify(val)); } catch (e) {} }
    return better;
  },
  shuffle: function (a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  },
  $: function (s) { return document.querySelector(s); },
  vib: function (ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
};
