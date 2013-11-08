module.exports = function(app) {
  var helpersExtended = {};
  if (app) {
    var express = require('express');
    var helpers = require('express-helpers');
  }
  
  helpersExtended.renderValidationErrors = function (error_groups, html_options) {
    if (typeof error_groups !== 'string') {
      return error_groups;
    }
    if (typeof error_groups !== 'object') {
      return null;
    }
    if (Object.keys(error_groups)[0] !== 'ValidationError') {
      return null;
    }
    var html_options = html_options || {};
    html_options = _.extend({
      blockTagStart: '<ul>',
      blockTagEnd: '</ul>',
      itemTagStart: '<li>',
      itemTagEnd: '</li>'
    }, html_options);
    var errorMessage = [];
    _.each(error_groups, function (errors, err_type) {
      errorMessage.push(html_options.blockTagStart);
      _.each(errors, function (error, field) {
        errorMessage.push(html_options.itemTagStart);
        errorMessage.push(error.message);
        errorMessage.push(html_options.itemTagEnd);
      });
      errorMessage.push(html_options.blockTagEnd);
    });
    return errorMessage.join('');
  }

  
  if(app){
    //3.x support
    if(type.of(app) == 'function'){
      for (var name in helpersExtended) {
        app.locals[name] = helpersExtended[name];
      }
      
      //add dynamic helpersExtended
      app.use(function(req, res, next){
        res.locals.is_current_page = function(url){  
          var current_page = req.url,
              httpregex = /http:\/\/|https:\/\/|www\./g;
          return url === current_page ||  url.replace(httpregex,'')  === req.headers.host.replace(httpregex,'') + current_page
        }

        res.locals.link_to_unless_current = function(name, url, html_options){
          var current_page = req.url,
              httpregex = /http:\/\/|https:\/\/|www\./g;
          if(url != current_page && url.replace(httpregex,'')  != req.headers.host.replace(httpregex,'') + current_page)
            return link_to(name, url, html_options)
        }

        next();
      })
    }
    //2.x support 
    else if ((express.Server && app instanceof express.Server) || app instanceof express.HTTPServer || app instanceof express.HTTPSServer) {
      var obj = {};
      if ((express.Server && app instanceof express.Server) || app instanceof express.HTTPServer || app instanceof express.HTTPSServer) {
        for (name in helpersExtended) {
          obj[name] = helpersExtended[name];
        }
      }
      app.helpersExtended(obj);

      //add dynamic helpersExtended
      app.dynamicHelpers({
        is_current_page: function(req, res, next){
          var func = function(url){  
            var current_page = req.url,
                httpregex = /http:\/\/|https:\/\/|www\./g;
            return url === current_page ||  url.replace(httpregex,'')  === req.headers.host.replace(httpregex,'') + current_page
          }
          return func
        },
        link_to_unless_current: function(req, res, next){
          var func = function(name, url, html_options){
            var current_page = req.url,
                httpregex = /http:\/\/|https:\/\/|www\./g;
            if(url != current_page && url.replace(httpregex,'')  != req.headers.host.replace(httpregex,'') + current_page)
              return link_to(name, url, html_options)
          }
          return func;
        }
      })
    }
  }
  
  return helpersExtended;
}
