'use strict';
var angular = require("angular")
  , _ = require('../lodash-custom')
  , moment = require('moment')
  , Photoswipe = require('photoswipe/dist/photoswipe')
  , PhotoswipeUI = require('photoswipe/dist/photoswipe-ui-default');

require('moment/locale/de'); // Moment.js
moment.locale("de"); // Set Moment.js to german

angular.module('liveblog-embed')
.directive('lbBindHtml', [function() {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      attrs.$observe('htmlContent', function() {
        if (attrs.htmlLocation) {
          //need to inject the html in a specific element
          elem.find('[' + attrs.htmlLocation + ']').html(attrs.htmlContent);
        } else {
          //inject streaght in the elem
          elem.html(attrs.htmlContent);
        }
      });
    }
  };
}])

.directive('dateFromNowOrAbsolute', ['$interval', function($interval) {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var d = new Date(); // Now
      var date = scope.post.mainItem.displayDate

      d.setHours(d.getHours()-12); // Minus 12h
      var delta24h = moment(date).isBefore(d)

      function updateMoment() {
        elem.text(delta24h
          ? moment(date).format('DD.MM, HH:mm [Uhr]')
          : moment(date).fromNow());
      }

      var stopTime = $interval(updateMoment, 10*1000);

      elem.on('$destroy', function() {
        $interval.cancel(stopTime);
      });

      updateMoment();
    }
  };
}])

.directive('lbTwitterCard', [function() {
  return {
    restrict: 'E',
    link: function(scope, elem, attrs) {
      elem.html(attrs.lbTwitterContent);
    }
  };
}])

.directive('lbCreateSourceset', [function() {
  // Recreate the .text <figure> but with custom photo credits
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      var meta = scope.item.meta
        , srcset = 'bi 810w, th 240w, vi 540w'
        , mapObj = {
            bi: meta.media.renditions.baseImage.href,
            th: meta.media.renditions.thumbnail.href,
            vi: meta.media.renditions.viewImage.href
          };

      srcset = srcset.replace(/bi|or|th|vi/gi, function(matched) {
        return mapObj[matched];
      });

      attrs.$set('src', mapObj.vi);
      attrs.$set('srcset', srcset);
      attrs.$set('alt', meta.caption);
    }
  };
}])

.directive('lbGenericEmbed', [function() {
  return {
    scope: {item: '='},
    templateUrl: "template__generic-embed",
    link: function(scope, element) {
      scope.isEmbedCode = angular.isDefined(scope.item.meta.html);
    }
  };
}])

.directive('lbPostlist', [function() {
  return {
    restrict: 'E',
    scope: {
      timeline: '=',
      posts: '='
    },
    templateUrl: "template__postlist"
  };
}])

.directive('lbItems', [function() {
  return {
    restrict: 'E',
    scope: {
      items: '='
    },
    templateUrl: "template__items",
    link: function(scope, elem, attrs) {
      var num_images = 0;
      var pswpElement = document.getElementsByClassName("pswp")[0];

      scope.images = [];

      // Customize UI
      var options = {
        bgOpacity: 1,
        index: 2,
        spacing: 0,
        history: false,
        tapToClose: false,
        closeOnScroll: false,
        closeOnVerticalDrag: false,
        allowPanToNext: true,
        barsSize: {
          top: 0, bottom: 0
        }
      };

      for (var i = scope.items.length - 1; i >= 0; i--) {
        var item = scope.items[i];

        if (item.item_type === "image") {
          var media = item.meta.media;
          
          scope.images.push({
            w: media.renditions.baseImage.width, // image width
            h: media.renditions.baseImage.height, // image height
            src: media.renditions.baseImage.href, // path to image
            msrc: media.renditions.thumbnail.href, // small image placeholder,
            title: item.meta.caption
          })

          scope.items[i].image_index = num_images
          ++num_images;
        }
      }

      scope.openGallery = function(index) {
        options.index = scope.items[index].image_index;
        var gallery = new Photoswipe(pswpElement, PhotoswipeUI, scope.images, options);
        gallery.init();
      }
    }
  };
}])

.directive('lbPhotoswipeContainer', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: "js/views/photoswipe.html"
  };
}])

.directive('loadScript', ['$rootScope', '$timeout', function($rootScope, $timeout) {
  return {
    restrict: 'A',
    link: function(scope, elem, attrs) {
      if (!scope.isEmbedCode) return;

      var provider = scope.item.meta.provider_name.toLowerCase();
      $rootScope._log.debug("ng-loadscript", provider);

      /*
        Return early if embed lib is already loaded
        @param {DOM Element} elem - to avoid parsing the whole DOM tree,
        some embed libs provide the option to specify elements
      */

      var embedLibMethods = {
        instagram: function(elem) {
          if (!window.instgrm) return false;
          else $timeout(function() {
            window.instgrm.Embeds.process(elem)
          }, 100); // n-th instagrams need this
          
          return true;
        },

        twitter: function(elem) {
          if (!window.twttr) return false
          else $timeout(function() {
            if (twttr.hasOwnProperty("widgets")) {
              twttr.widgets.load(elem);
              $rootScope.$emit('setParentFrameHeight'); // resize iframe
            }
          }, 100);
          return true;
        },

        facebook: function(elem) {
          if (!window.FB) return false
          else $timeout(function() {
            if (FB.hasOwnProperty("XFBML")) {
              FB.XFBML.parse(elem);
              $rootScope.$emit('setParentFrameHeight'); // resize iframe
            }
          }, 100);
          return true;
        }
      }

      if (embedLibMethods.hasOwnProperty(provider)) {
        if (embedLibMethods[provider](elem[0]) === true) {
          $rootScope.$emit('setParentFrameHeight'); // resize iframe
          return; // Exits directive
        }
      }

      // Reverse engineer plaintext
      var html = scope.item.meta.html
        , matchSource = /<script.*?src="(.*?)"/
        , matchContent = /<script(?:.*?)>([^]*?)<\/script>/
        , content = html.match(matchContent)
        , src = html.match(matchSource);

      if (src && src.length) { 
        var script = document.createElement('script');
        script.src = src[1]; script.onload = $rootScope.$emit('setParentFrameHeight'); // resize iframe
        elem[0].parentNode.insertBefore(script, elem[0]);
      }

      // Evaluate any other script tag contents
      if (content && content.length) {
        eval(content[1])
      }
    }
  }
}])

;
