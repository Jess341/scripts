// ==UserScript==
// @name         TinyGrail Helper
// @namespace    https://github.com/bangumi/scripts/tree/master/liaune
// @version      0.1.1
// @description  显示角色发行价，显示拍卖情况，把自己的圣殿排到最前面，股息高于低保隐藏签到
// @author       Liaune
// @include     /^https?://(bgm\.tv|bangumi\.tv|chii\.in)/(character|rakuen\/home|rakuen\/topic\/crt).*
// @grant        GM_addStyle
// ==/UserScript==
GM_addStyle(`
.assets #own.item .card {
  box-shadow: 0px 0px 5px #FFEB3B;
  border: 1px solid #FFC107;
}
.assets #own.item .name a {
  font-weight: bold;
  color: #0084b4;
}
.assets .item .card {
  background-size: cover;
  width: 90px;
  height: 120px;
  border-radius: 5px;
  box-shadow: 3px 3px 5px #d8d8d8;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}
.my_auction {
  color: #ffa7cc;
  margin-right: 5px;
}
.user_auction {
  color: #a7e3ff;
  margin-right: 5px;
}
`);
const You = $('#new_comment .reply_author a')[0] ? $('#new_comment .reply_author a')[0].innerText : '';
const api = 'https://tinygrail.com/api/';

function getData(url, callback) {
  if (!url.startsWith('http'))
    url = api + url;
  $.ajax({
    url: url,
    type: 'GET',
    xhrFields: { withCredentials: true },
    success: callback
  });
}

function postData(url, data, callback) {
  var d = JSON.stringify(data);
  if (!url.startsWith('http'))
    url = api + url;
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    data: d,
    xhrFields: { withCredentials: true },
    success: callback
  });
}

function formatNumber(number, decimals, dec_point, thousands_sep) {
  number = (number + '').replace(/[^0-9+-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.ceil(n * k) / k;
    };

  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  var re = /(-?\d+)(\d{3})/;
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, "$1" + sep + "$2");
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}
function showInitialPrice(charaId){
  getData(`chara/charts/${charaId}/2019-08-08`, function (d, s) {
    if (d.State === 0) {
      var price = d.Value[0].Begin;
      price = parseFloat(price).toFixed(2);
      $('#grailBox .title .text').append(`<span>发行价：${price}</span>`);
    }
  });
}

function showOwnTemple(){
  $('#grailBox .assets_box .assets .item').each(function(i,e){
    if(e.querySelector('.name a').innerText!=You){
      $('#grailBox .assets_box .assets').append(e);
    }
    else{
      e.id = 'own';
    }
  });
}

function loadUserAuctions(ids) {
  postData('chara/auction/list', ids, (d) => {
    if (d.State == 0) {
      d.Value.forEach((a) => {
        if (a.State != 0) {
          var userAuction = `<span class="user_auction" title="竞拍人数 / 竞拍数量">${formatNumber(a.State, 0)} / ${formatNumber(a.Type, 0)}</span>`;
          $(`#auctionHistoryButton`).before(userAuction);
        }
        if (a.Price != 0) {
          var myAuction = `<span class="my_auction" title="出价 / 数量">₵${formatNumber(a.Price, 2)} / ${formatNumber(a.Amount, 0)}</span>`;
          $(`#auctionHistoryButton`).before(myAuction);
        }
      });
    }
  });
}

function hideBonusButton(){
  getData('event/share/bonus/test', (d) => {
    if (d.State == 0) {
      if(d.Value.Share>1500*7) $('#bonusButton').hide();
      //else $('#shareBonusButton').hide();
    }
  });
}

let checkgrailBox= setInterval(function(){
  if($('#grailBox .assets_box').length){
    clearInterval(checkgrailBox);
    let charaId = document.location.pathname.split('/').pop();
    showInitialPrice(charaId);
    loadUserAuctions([charaId]);
    showOwnTemple();
  }
  if($('#grailBox.rakuen_home #bonusButton').length){
    clearInterval(checkgrailBox);
    hideBonusButton();
  }
},500);
