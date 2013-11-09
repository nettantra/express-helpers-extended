module.exports = function(app) {
  var util = require('util');
  var inflection = require('inflection');
  var helpersExtended = {};
  if (app) {
    var express = require('express');
    var helpers = require('express-helpers');
  }
  
  helpersExtended.renderValidationErrors = function (err_params, html_options) {
    if (is.String(err_params)) {
      return err_params;
    }
    if (!is.Object(err_params) || !is.Object(err_params['errors'])) {
      return null;
    }
    var error_groups = err_params['errors'];
    if (Object.keys(error_groups)[0] !== 'ValidationError') {
      return null;
    }
    var model_name = err_params['model'];
    var Model = model_name ? global[model_name] : false;
    var html_options = html_options || {};
    html_options = _.extend({
      blockTagStart: '<ul>',
      blockTagEnd: '</ul>',
      itemTagStart: '<li>',
      itemTagEnd: '</li>'
    }, html_options);
    var errorMessages = [];
    _.each(error_groups, function (errors, err_type) {
      errorMessages.push(html_options.blockTagStart);
      _.each(errors, function (attribute_errors, attribute_name) {
        var customValidationMessages = {};
        if (Model) {
          customValidationMessages = is.Object(Model['customValidationMessages']) ? Model['customValidationMessages'][attribute_name] : {};
          customValidationMessages = is.Object(customValidationMessages) ? customValidationMessages : {};
        }
        _.each(attribute_errors, function (error) {
          errorMessages.push(html_options.itemTagStart);
          var errorMessage = is.String( customValidationMessages[error.rule] ) ? util.format(customValidationMessages[error.rule], inflection.humanize(attribute_name)) : error.message;
          //console.log(customValidationMessages);
          //var errorMessage = error.message;
          errorMessages.push(errorMessage);
          errorMessages.push(html_options.itemTagEnd);
        });
      });
      errorMessages.push(html_options.blockTagEnd);
    });
    return errorMessages.join('');
  }

  var is=
  {
    Null:function(a){return a===null;},
    Undefined:function(a){return a===undefined;},
    nt:function(a){return(a===null||a===undefined);},
    Function:function(a){return(typeof(a)==='function')?a.constructor.toString().match(/Function/)!==null:false;},
    String:function(a){return(typeof(a)==='string')?true:(typeof(a)==='object')?a.constructor.toString().match(/string/i)!==null:false;    },
    Array:function(a){return(typeof(a)==='object')?a.constructor.toString().match(/array/i)!==null||a.length!==undefined:false;},
    Boolean:function(a){return(typeof(a)==='boolean')?true:(typeof(a)==='object')?a.constructor.toString().match(/boolean/i)!==null:false;},
    Date:function(a){return(typeof(a)==='date')?true:(typeof(a)==='object')?a.constructor.toString().match(/date/i)!==null:false;},
    HTML:function(a){return(typeof(a)==='object')?a.constructor.toString().match(/html/i)!==null:false;},
    Number:function(a){return(typeof(a)==='number')?true:(typeof(a)==='object')?a.constructor.toString().match(/Number/)!==null:false;},
    Object:function(a){return(typeof(a)==='object')?a.constructor.toString().match(/object/i)!==null:false;},
    RegExp:function(a){return(typeof(a)==='function')?a.constructor.toString().match(/regexp/i)!==null:false;}
  };

  var type={
    of:function(a){
      for(var i in is){
        if(is[i](a))
          return i.toLowerCase();
      }
    }
  };
  
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
