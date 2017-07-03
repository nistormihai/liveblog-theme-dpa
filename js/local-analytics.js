'use strict';

/*
  Send request to local analytics endpoint
  to keep track of embedded liveblogs.
  Invoked at the same time as pageview.js,
  which pings third party analytics providers.
*/

var apiHost = window.hasOwnProperty('LB') ? window.LB.api_host.replace(/\/$/, '') : ''
  , blogId = window.hasOwnProperty('LB') ? window.LB.blog._id : ''
  , contextUrl = document.referrer;

apiHost += '/api/analytics/hit';

var localAnalytics = {
  createCookie: function(name, value, days) {
    var expires = '', date = new Date();

    if (days) {
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }

    document.cookie = name + "=" + value + expires + "; path=/";
  },

  readCookie: function(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');

    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];

      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }

    return null;
  },

  hit: function() {
    var parent = this;

    if (parent.readCookie('hit') || contextUrl === "") {
      return false; // exit early
    }

    var xmlhttp = new XMLHttpRequest();
    var jsonData = JSON.stringify({
      context_url: contextUrl,
      blog_id: blogId
    });

    xmlhttp.open('POST', apiHost);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');

    xmlhttp.onload = function() {
      if (xmlhttp.status === 200) {
        parent.createCookie('hit', jsonData, 2);
      }
    };

    xmlhttp.send(jsonData);
  },

  init: function() {
    window.addEventListener("sendpageview", this.hit.bind(this), false)
  }
}

module.exports = localAnalytics;
