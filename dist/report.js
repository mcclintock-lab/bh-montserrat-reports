require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
module.exports = function(el) {
  var $el, $toggler, app, e, node, nodeid, toc, toggler, togglers, view, _i, _len, _ref;
  $el = $(el);
  app = window.app;
  toc = app.getToc();
  if (!toc) {
    console.log('No table of contents found');
    return;
  }
  togglers = $el.find('a[data-toggle-node]');
  _ref = togglers.toArray();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    nodeid = $toggler.data('toggle-node');
    try {
      view = toc.getChildViewById(nodeid);
      node = view.model;
      $toggler.attr('data-visible', !!node.get('visible'));
      $toggler.data('tocItem', view);
    } catch (_error) {
      e = _error;
      $toggler.attr('data-not-found', 'true');
    }
  }
  return togglers.on('click', function(e) {
    e.preventDefault();
    $el = $(e.target);
    view = $el.data('tocItem');
    if (view) {
      view.toggleVisibility(e);
      return $el.attr('data-visible', !!view.model.get('visible'));
    } else {
      return alert("Layer not found in the current Table of Contents. \nExpected nodeid " + ($el.data('toggle-node')));
    }
  });
};


},{}],3:[function(require,module,exports){
module.exports = function(el, rasterLayersList) {
  var $el, $toggler, app, extent, height, layer, mapImage, toc, toggled, toggler, togglers, url, width, _i, _len, _ref, _results,
    _this = this;
  $el = $(el);
  app = window.app;
  togglers = $el.find('a[data-raster-url]');
  _ref = togglers.toArray();
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    toggler = _ref[_i];
    $toggler = $(toggler);
    url = $toggler.data('raster-url');
    width = $toggler.data('width');
    height = $toggler.data('height');
    extent = $toggler.data('extent').split(',');
    toggled = $toggler.data('toggled');
    if (!url || !width || !height || !extent) {
      throw new Error("Raster links must include data-raster-url, data-width, data-height, and data-extent attributes");
    }
    layer = new esri.layers.MapImageLayer({
      visible: toggled
    });
    mapImage = new esri.layers.MapImage({
      'extent': {
        'xmin': extent[0],
        'ymin': extent[1],
        'xmax': extent[2],
        'ymax': extent[3],
        'spatialReference': {
          'wkid': 3857
        }
      },
      'href': url
    });
    toc = $("<div class=\"tableOfContents\">\n<div class=\"tableOfContentsItem\" data-dp-status=\"\" data-type=\"sketch\" data-loading=\"false\">\n  <div unselectable=\"on\" class=\"item\" data-visibility=\"" + toggled + "\" data-checkoffonly=\"\" data-hidechildren=\"no\" data-selected=\"false\">\n    <span unselectable=\"on\" class=\"loading\">&nbsp;</span>\n    <span unselectable=\"on\" class=\"expander\"></span>\n    <span unselectable=\"on\" class=\"visibility\"></span>\n    <span unselectable=\"on\" class=\"icon\" style=\"\"></span>\n    <span unselectable=\"on\" class=\"name\">" + ($toggler.text()) + "</span>\n    <span unselectable=\"on\" class=\"context\"></span>\n    <span unselectable=\"on\" class=\"description\" style=\"display: none;\"></span>\n  </div>\n</div>\n</div>");
    $toggler.replaceWith(toc);
    $toggler = toc.find('.tableOfContentsItem');
    layer.addImage(mapImage);
    rasterLayersList.push(layer);
    window.app.projecthomepage.map.addLayer(layer);
    $toggler.data('layer', layer);
    _results.push($toggler.on('click', function(e) {
      var item;
      item = $(e.target).closest('.tableOfContentsItem');
      layer = item.data('layer');
      item.find('.item').attr('data-visibility', !layer.visible);
      layer.setVisibility(!layer.visible);
      return e.preventDefault();
    }));
  }
  return _results;
};


},{}],4:[function(require,module,exports){
var JobItem,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

JobItem = (function(_super) {
  __extends(JobItem, _super);

  JobItem.prototype.className = 'reportResult';

  JobItem.prototype.events = {};

  JobItem.prototype.bindings = {
    "h6 a": {
      observe: "serviceName",
      updateView: true,
      attributes: [
        {
          name: 'href',
          observe: 'serviceUrl'
        }
      ]
    },
    ".startedAt": {
      observe: ["startedAt", "status"],
      visible: function() {
        var _ref;
        return (_ref = this.model.get('status')) !== 'complete' && _ref !== 'error';
      },
      updateView: true,
      onGet: function() {
        if (this.model.get('startedAt')) {
          return "Started " + moment(this.model.get('startedAt')).fromNow() + ". ";
        } else {
          return "";
        }
      }
    },
    ".status": {
      observe: "status",
      onGet: function(s) {
        switch (s) {
          case 'pending':
            return "waiting in line";
          case 'running':
            return "running analytical service";
          case 'complete':
            return "completed";
          case 'error':
            return "an error occurred";
          default:
            return s;
        }
      }
    },
    ".queueLength": {
      observe: "queueLength",
      onGet: function(v) {
        var s;
        s = "Waiting behind " + v + " job";
        if (v.length > 1) {
          s += 's';
        }
        return s + ". ";
      },
      visible: function(v) {
        return (v != null) && parseInt(v) > 0;
      }
    },
    ".errors": {
      observe: 'error',
      updateView: true,
      visible: function(v) {
        return (v != null ? v.length : void 0) > 2;
      },
      onGet: function(v) {
        if (v != null) {
          return JSON.stringify(v, null, '  ');
        } else {
          return null;
        }
      }
    }
  };

  function JobItem(model) {
    this.model = model;
    JobItem.__super__.constructor.call(this);
  }

  JobItem.prototype.render = function() {
    this.$el.html("<h6><a href=\"#\" target=\"_blank\"></a><span class=\"status\"></span></h6>\n<div>\n  <span class=\"startedAt\"></span>\n  <span class=\"queueLength\"></span>\n  <pre class=\"errors\"></pre>\n</div>");
    return this.stickit();
  };

  return JobItem;

})(Backbone.View);

module.exports = JobItem;


},{}],5:[function(require,module,exports){
var ReportResults,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportResults = (function(_super) {
  __extends(ReportResults, _super);

  ReportResults.prototype.defaultPollingInterval = 3000;

  function ReportResults(sketch, deps) {
    var url;
    this.sketch = sketch;
    this.deps = deps;
    this.poll = __bind(this.poll, this);
    this.url = url = "/reports/" + this.sketch.id + "/" + (this.deps.join(','));
    ReportResults.__super__.constructor.call(this);
  }

  ReportResults.prototype.poll = function() {
    var _this = this;
    return this.fetch({
      success: function() {
        var payloadSize, problem, result, _i, _len, _ref, _ref1;
        _this.trigger('jobs');
        _ref = _this.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          result = _ref[_i];
          if ((_ref1 = result.get('status')) !== 'complete' && _ref1 !== 'error') {
            if (!_this.interval) {
              _this.interval = setInterval(_this.poll, _this.defaultPollingInterval);
            }
            return;
          }
          console.log(_this.models[0].get('payloadSizeBytes'));
          payloadSize = Math.round(((_this.models[0].get('payloadSizeBytes') || 0) / 1024) * 100) / 100;
          console.log("FeatureSet sent to GP weighed in at " + payloadSize + "kb");
        }
        if (_this.interval) {
          window.clearInterval(_this.interval);
        }
        if (problem = _.find(_this.models, function(r) {
          return r.get('error') != null;
        })) {
          return _this.trigger('error', "Problem with " + (problem.get('serviceName')) + " job");
        } else {
          return _this.trigger('finished');
        }
      },
      error: function(e, res, a, b) {
        var json, _ref, _ref1;
        if (res.status !== 0) {
          if ((_ref = res.responseText) != null ? _ref.length : void 0) {
            try {
              json = JSON.parse(res.responseText);
            } catch (_error) {

            }
          }
          if (_this.interval) {
            window.clearInterval(_this.interval);
          }
          return _this.trigger('error', (json != null ? (_ref1 = json.error) != null ? _ref1.message : void 0 : void 0) || 'Problem contacting the SeaSketch server');
        }
      }
    });
  };

  return ReportResults;

})(Backbone.Collection);

module.exports = ReportResults;


},{}],"N/I/xq":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, enableRasterLayers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

enableRasterLayers = require('./enableRasterLayers.coffee');

round = require('./utils.coffee').round;

ReportResults = require('./reportResults.coffee');

t = require('../templates/templates.js');

templates = {
  reportLoading: t['node_modules/seasketch-reporting-api/reportLoading']
};

JobItem = require('./jobItem.coffee');

CollectionView = require('views/collectionView');

RecordSet = (function() {
  function RecordSet(data, tab, sketchClassId) {
    this.data = data;
    this.tab = tab;
    this.sketchClassId = sketchClassId;
  }

  RecordSet.prototype.toArray = function() {
    var data,
      _this = this;
    if (this.sketchClassId) {
      data = _.find(this.data.value, function(v) {
        var _ref, _ref1, _ref2;
        return ((_ref = v.features) != null ? (_ref1 = _ref[0]) != null ? (_ref2 = _ref1.attributes) != null ? _ref2['SC_ID'] : void 0 : void 0 : void 0) === _this.sketchClassId;
      });
      if (!data) {
        throw "Could not find data for sketchClass " + this.sketchClassId;
      }
    } else {
      if (_.isArray(this.data.value)) {
        data = this.data.value[0];
      } else {
        data = this.data.value;
      }
    }
    return _.map(data.features, function(feature) {
      return feature.attributes;
    });
  };

  RecordSet.prototype.raw = function(attr) {
    var attrs;
    attrs = _.map(this.toArray(), function(row) {
      return row[attr];
    });
    attrs = _.filter(attrs, function(attr) {
      return attr !== void 0;
    });
    if (attrs.length === 0) {
      this.tab.reportError("Could not get attribute " + attr + " from results");
      throw "Could not get attribute " + attr;
    } else if (attrs.length === 1) {
      return attrs[0];
    } else {
      return attrs;
    }
  };

  RecordSet.prototype.int = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, parseInt);
    } else {
      return parseInt(raw);
    }
  };

  RecordSet.prototype.float = function(attr, decimalPlaces) {
    var raw;
    if (decimalPlaces == null) {
      decimalPlaces = 2;
    }
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return round(val, decimalPlaces);
      });
    } else {
      return round(raw, decimalPlaces);
    }
  };

  RecordSet.prototype.bool = function(attr) {
    var raw;
    raw = this.raw(attr);
    if (_.isArray(raw)) {
      return _.map(raw, function(val) {
        return val.toString().toLowerCase() === 'true';
      });
    } else {
      return raw.toString().toLowerCase() === 'true';
    }
  };

  return RecordSet;

})();

ReportTab = (function(_super) {
  __extends(ReportTab, _super);

  function ReportTab() {
    this.enableRasterLayers = __bind(this.enableRasterLayers, this);
    this.renderJobDetails = __bind(this.renderJobDetails, this);
    this.startEtaCountdown = __bind(this.startEtaCountdown, this);
    this.reportJobs = __bind(this.reportJobs, this);
    this.showError = __bind(this.showError, this);
    this.reportError = __bind(this.reportError, this);
    this.reportRequested = __bind(this.reportRequested, this);
    this.remove = __bind(this.remove, this);
    _ref = ReportTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  ReportTab.prototype.name = 'Information';

  ReportTab.prototype.dependencies = [];

  ReportTab.prototype.initialize = function(model, options) {
    this.model = model;
    this.options = options;
    this.app = window.app;
    this.rasterLayers = [];
    _.extend(this, this.options);
    this.reportResults = new ReportResults(this.model, this.dependencies);
    this.listenToOnce(this.reportResults, 'error', this.reportError);
    this.listenToOnce(this.reportResults, 'jobs', this.renderJobDetails);
    this.listenToOnce(this.reportResults, 'jobs', this.reportJobs);
    this.listenTo(this.reportResults, 'finished', _.bind(this.render, this));
    return this.listenToOnce(this.reportResults, 'request', this.reportRequested);
  };

  ReportTab.prototype.render = function() {
    throw 'render method must be overidden';
  };

  ReportTab.prototype.show = function() {
    var _ref1, _ref2;
    this.$el.show();
    this.visible = true;
    if (((_ref1 = this.dependencies) != null ? _ref1.length : void 0) && !this.reportResults.models.length) {
      return this.reportResults.poll();
    } else if (!((_ref2 = this.dependencies) != null ? _ref2.length : void 0)) {
      this.render();
      return this.$('[data-attribute-type=UrlField] .value, [data-attribute-type=UploadField] .value').each(function() {
        var html, name, text, url, _i, _len, _ref3;
        text = $(this).text();
        html = [];
        _ref3 = text.split(',');
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          url = _ref3[_i];
          if (url.length) {
            name = _.last(url.split('/'));
            html.push("<a target=\"_blank\" href=\"" + url + "\">" + name + "</a>");
          }
        }
        return $(this).html(html.join(', '));
      });
    }
  };

  ReportTab.prototype.hide = function() {
    this.$el.hide();
    return this.visible = false;
  };

  ReportTab.prototype.remove = function() {
    var layer, _i, _len, _ref1;
    window.clearInterval(this.etaInterval);
    this.stopListening();
    _ref1 = this.rasterLayers;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      layer = _ref1[_i];
      this.app.projecthomepage.map.removeLayer(layer);
    }
    return ReportTab.__super__.remove.call(this);
  };

  ReportTab.prototype.reportRequested = function() {
    return this.$el.html(templates.reportLoading.render({}));
  };

  ReportTab.prototype.reportError = function(msg, cancelledRequest) {
    if (!cancelledRequest) {
      if (msg === 'JOB_ERROR') {
        return this.showError('Error with specific job');
      } else {
        return this.showError(msg);
      }
    }
  };

  ReportTab.prototype.showError = function(msg) {
    this.$('.progress').remove();
    this.$('p.error').remove();
    return this.$('h4').text("An Error Occurred").after("<p class=\"error\" style=\"text-align:center;\">" + msg + "</p>");
  };

  ReportTab.prototype.reportJobs = function() {
    if (!this.maxEta) {
      this.$('.progress .bar').width('100%');
    }
    return this.$('h4').text("Analyzing Designs");
  };

  ReportTab.prototype.startEtaCountdown = function() {
    var _this = this;
    if (this.maxEta) {
      _.delay(function() {
        return _this.reportResults.poll();
      }, (this.maxEta + 1) * 1000);
      return _.delay(function() {
        _this.$('.progress .bar').css('transition-timing-function', 'linear');
        _this.$('.progress .bar').css('transition-duration', "" + (_this.maxEta + 1) + "s");
        return _this.$('.progress .bar').width('100%');
      }, 500);
    }
  };

  ReportTab.prototype.renderJobDetails = function() {
    var item, job, maxEta, _i, _j, _len, _len1, _ref1, _ref2, _results,
      _this = this;
    maxEta = null;
    _ref1 = this.reportResults.models;
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      job = _ref1[_i];
      if (job.get('etaSeconds')) {
        if (!maxEta || job.get('etaSeconds') > maxEta) {
          maxEta = job.get('etaSeconds');
        }
      }
    }
    if (maxEta) {
      this.maxEta = maxEta;
      this.$('.progress .bar').width('5%');
      this.startEtaCountdown();
    }
    this.$('[rel=details]').css('display', 'block');
    this.$('[rel=details]').click(function(e) {
      e.preventDefault();
      _this.$('[rel=details]').hide();
      return _this.$('.details').show();
    });
    _ref2 = this.reportResults.models;
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      job = _ref2[_j];
      item = new JobItem(job);
      item.render();
      _results.push(this.$('.details').append(item.el));
    }
    return _results;
  };

  ReportTab.prototype.getResult = function(id) {
    var result, results;
    results = this.getResults();
    result = _.find(results, function(r) {
      return r.paramName === id;
    });
    if (result == null) {
      throw new Error('No result with id ' + id);
    }
    return result.value;
  };

  ReportTab.prototype.getFirstResult = function(param, id) {
    var e, result;
    result = this.getResult(param);
    try {
      return result[0].features[0].attributes[id];
    } catch (_error) {
      e = _error;
      throw "Error finding " + param + ":" + id + " in gp results";
    }
  };

  ReportTab.prototype.getResults = function() {
    var results;
    results = this.reportResults.map(function(result) {
      return result.get('result').results;
    });
    if (!(results != null ? results.length : void 0)) {
      throw new Error('No gp results');
    }
    return _.filter(results, function(result) {
      var _ref1;
      return (_ref1 = result.paramName) !== 'ResultCode' && _ref1 !== 'ResultMsg';
    });
  };

  ReportTab.prototype.recordSet = function(dependency, paramName, sketchClassId) {
    var dep, param;
    if (sketchClassId == null) {
      sketchClassId = false;
    }
    if (__indexOf.call(this.dependencies, dependency) < 0) {
      throw new Error("Unknown dependency " + dependency);
    }
    dep = this.reportResults.find(function(r) {
      return r.get('serviceName') === dependency;
    });
    if (!dep) {
      console.log(this.reportResults.models);
      throw new Error("Could not find results for " + dependency + ".");
    }
    param = _.find(dep.get('result').results, function(param) {
      return param.paramName === paramName;
    });
    if (!param) {
      console.log(dep.get('data').results);
      throw new Error("Could not find param " + paramName + " in " + dependency);
    }
    return new RecordSet(param, this, sketchClassId);
  };

  ReportTab.prototype.enableTablePaging = function() {
    return this.$('[data-paging]').each(function() {
      var $table, i, noRowsMessage, pageSize, pages, parent, rows, ul, _i, _len, _ref1;
      $table = $(this);
      pageSize = $table.data('paging');
      rows = $table.find('tbody tr').length;
      pages = Math.ceil(rows / pageSize);
      if (pages > 1) {
        $table.append("<tfoot>\n  <tr>\n    <td colspan=\"" + ($table.find('thead th').length) + "\">\n      <div class=\"pagination\">\n        <ul>\n          <li><a href=\"#\">Prev</a></li>\n        </ul>\n      </div>\n    </td>\n  </tr>\n</tfoot>");
        ul = $table.find('tfoot ul');
        _ref1 = _.range(1, pages + 1);
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          ul.append("<li><a href=\"#\">" + i + "</a></li>");
        }
        ul.append("<li><a href=\"#\">Next</a></li>");
        $table.find('li a').click(function(e) {
          var $a, a, n, offset, text;
          e.preventDefault();
          $a = $(this);
          text = $a.text();
          if (text === 'Next') {
            a = $a.parent().parent().find('.active').next().find('a');
            if (a.text() !== 'Next') {
              return a.click();
            }
          } else if (text === 'Prev') {
            a = $a.parent().parent().find('.active').prev().find('a');
            if (a.text() !== 'Prev') {
              return a.click();
            }
          } else {
            $a.parent().parent().find('.active').removeClass('active');
            $a.parent().addClass('active');
            n = parseInt(text);
            $table.find('tbody tr').hide();
            offset = pageSize * (n - 1);
            return $table.find("tbody tr").slice(offset, n * pageSize).show();
          }
        });
        $($table.find('li a')[1]).click();
      }
      if (noRowsMessage = $table.data('no-rows')) {
        if (rows === 0) {
          parent = $table.parent();
          $table.remove();
          parent.removeClass('tableContainer');
          return parent.append("<p>" + noRowsMessage + "</p>");
        }
      }
    });
  };

  ReportTab.prototype.enableLayerTogglers = function() {
    return enableLayerTogglers(this.$el);
  };

  ReportTab.prototype.enableRasterLayers = function() {
    return enableRasterLayers(this.$el, this.rasterLayers);
  };

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"XqZ11q","./enableLayerTogglers.coffee":2,"./enableRasterLayers.coffee":3,"./jobItem.coffee":4,"./reportResults.coffee":5,"./utils.coffee":"ZTw9RP","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('N/I/xq');
},{}],"ZTw9RP":[function(require,module,exports){
module.exports = {
  round: function(number, decimalPlaces) {
    var multiplier;
    if (!_.isNumber(number)) {
      number = parseFloat(number);
    }
    multiplier = Math.pow(10, decimalPlaces);
    return Math.round(number * multiplier) / multiplier;
  }
};


},{}],"api/utils":[function(require,module,exports){
module.exports=require('ZTw9RP');
},{}],"api/templates":[function(require,module,exports){
module.exports=require('XqZ11q');
},{}],"XqZ11q":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,123,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("doNotExport",c,p,1),c,p,1,0,0,"")){_.b(_.rp("attributes/attributeItem",c,p,"    "));};});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}],12:[function(require,module,exports){
var EnvironmentTab, ReportTab, d3, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

d3 = window.d3;

EnvironmentTab = (function(_super) {
  __extends(EnvironmentTab, _super);

  function EnvironmentTab() {
    this.roundData = __bind(this.roundData, this);
    this.roundVals = __bind(this.roundVals, this);
    this.addTarget = __bind(this.addTarget, this);
    this.getAllValues = __bind(this.getAllValues, this);
    this.renderHistoValues = __bind(this.renderHistoValues, this);
    this.drawBars = __bind(this.drawBars, this);
    this.drawCoralBars = __bind(this.drawCoralBars, this);
    this.getHasConservationZone = __bind(this.getHasConservationZone, this);
    this.getHasZoneWithNoGoal = __bind(this.getHasZoneWithNoGoal, this);
    this.getHasZoneWithGoal = __bind(this.getHasZoneWithGoal, this);
    _ref = EnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EnvironmentTab.prototype.name = 'Environment';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.template = templates.environment;

  EnvironmentTab.prototype.dependencies = ['MontserratHabitatToolbox', 'MontserratCoralToolbox', 'MontserratSnapAndGroupToolbox'];

  EnvironmentTab.prototype.render = function() {
    var all_sandg_vals, context, coral_count, d3IsPresent, habitats, hasConservationZone, hasZoneWithGoal, hasZoneWithNoGoal, isCollection, nogoal_coral_count, nogoal_habitats, sandg, _ref1;
    isCollection = this.model.isCollection();
    d3IsPresent = (_ref1 = window.d3) != null ? _ref1 : {
      "true": false
    };
    if (isCollection) {
      hasConservationZone = this.getHasConservationZone(this.model.getChildren());
      hasZoneWithGoal = this.getHasZoneWithGoal(this.model.getChildren());
      hasZoneWithNoGoal = this.getHasZoneWithNoGoal(this.model.getChildren());
    } else {
      hasConservationZone = true;
      hasZoneWithGoal = this.getHasZoneWithGoal([this.model]);
      hasZoneWithNoGoal = this.getHasZoneWithNoGoal([this.model]);
    }
    habitats = this.recordSet('MontserratHabitatToolbox', 'Habitats').toArray();
    habitats = _.sortBy(habitats, function(h) {
      return parseFloat(h.PERC);
    });
    habitats = habitats.reverse();
    this.addTarget(habitats);
    nogoal_habitats = this.recordSet('MontserratHabitatToolbox', 'NonReserveHabitats').toArray();
    nogoal_habitats = _.sortBy(nogoal_habitats, function(h) {
      return parseFloat(h.PERC);
    });
    nogoal_habitats = nogoal_habitats.reverse();
    sandg = this.recordSet('MontserratSnapAndGroupToolbox', 'SnapAndGroup').toArray()[0];
    all_sandg_vals = this.getAllValues(sandg.HISTO);
    'herb_bio = @recordSet(\'MontserratBiomassToolbox\', \'HerbivoreBiomass\').toArray()[0]\nall_herb_vals = @getAllValues herb_bio.HISTO\n@roundVals herb_bio\n\ntotal_bio = @recordSet(\'MontserratBiomassToolbox\', \'TotalBiomass\').toArray()[0]\nall_total_values = @getAllValues total_bio.HISTO\n@roundVals total_bio\n\nfish_bio = @recordSet(\'MontserratBiomassToolbox\', \'FishAbundance\').toArray()[0]\nall_fish_vals = @getAllValues fish_bio.HISTO\n@roundVals fish_bio';
    coral_count = this.recordSet('MontserratCoralToolbox', 'Coral').toArray();
    nogoal_coral_count = this.recordSet('MontserratCoralToolbox', 'NonReserveCoral').toArray();
    this.roundData(habitats);
    this.roundData(nogoal_habitats);
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      habitats: habitats,
      nogoal_habitats: nogoal_habitats,
      d3IsPresent: d3IsPresent,
      coral_count: coral_count,
      sandg: sandg,
      hasD3: window.d3,
      hasConservationZone: hasConservationZone,
      hasZoneWithGoal: hasZoneWithGoal,
      hasZoneWithNoGoal: hasZoneWithNoGoal
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    this.renderHistoValues(sandg, all_sandg_vals, ".sandg_viz", "#66cdaa", "Abundance of Juvenile Snapper and Grouper", "Count");
    this.drawCoralBars(coral_count, 0);
    return this.drawCoralBars(nogoal_coral_count, 3);
  };

  EnvironmentTab.prototype.getHasZoneWithGoal = function(sketches) {
    var attr, sketch, zonesWithGoalCount, _i, _j, _len, _len1, _ref1;
    zonesWithGoalCount = 0;
    for (_i = 0, _len = sketches.length; _i < _len; _i++) {
      sketch = sketches[_i];
      _ref1 = sketch.getAttributes();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        if (attr.exportid === "ZONE_TYPE") {
          if (attr.value === "Sanctuary" || attr.value === "Marine Reserve - Partial Take") {
            zonesWithGoalCount += 1;
          }
        }
      }
    }
    return zonesWithGoalCount > 0;
  };

  EnvironmentTab.prototype.getHasZoneWithNoGoal = function(sketches) {
    var attr, sketch, zonesWithNoGoalCount, _i, _j, _len, _len1, _ref1;
    zonesWithNoGoalCount = 0;
    for (_i = 0, _len = sketches.length; _i < _len; _i++) {
      sketch = sketches[_i];
      _ref1 = sketch.getAttributes();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        if (attr.exportid === "ZONE_TYPE") {
          console.log("attr value: ", attr.value);
          if (attr.value !== "Sanctuary" && attr.value !== "Marine Reserve - Partial Take") {
            zonesWithNoGoalCount += 1;
          }
        }
      }
    }
    return zonesWithNoGoalCount > 0;
  };

  EnvironmentTab.prototype.getHasConservationZone = function(sketches) {
    var attr, hasConservationZone, sketch, _i, _j, _len, _len1, _ref1;
    hasConservationZone = false;
    for (_i = 0, _len = sketches.length; _i < _len; _i++) {
      sketch = sketches[_i];
      _ref1 = sketch.getAttributes();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        if (attr.exportid === "ZONE_TYPE") {
          hasConservationZone = attr.value === "Sanctuary" || attr.value === "Marine Reserve - Partial Take" || attr.value === "Mooring Anchorage Zone" || attr.value === "Recreation Zone";
        }
      }
    }
    return hasConservationZone;
  };

  EnvironmentTab.prototype.drawCoralBars = function(coral_counts, start_dex) {
    var coral, count, index, isCollection, label, name, outside_sketch_start, range, suffix, total, _i, _len, _results;
    if (window.d3) {
      isCollection = this.model.isCollection();
      suffix = "sketch";
      if (isCollection) {
        suffix = "collection";
      }
      _results = [];
      for (_i = 0, _len = coral_counts.length; _i < _len; _i++) {
        coral = coral_counts[_i];
        name = coral.NAME;
        count = parseInt(coral.COUNT);
        total = parseInt(coral.TOT);
        outside_sketch_start = total * 0.48;
        label = count + "/" + total + " of the known observations are found within this " + suffix;
        range = [
          {
            bg: "#8e5e50",
            start: 0,
            end: count,
            "class": 'in-sketch',
            value: count,
            name: label
          }, {
            bg: '#dddddd',
            start: count,
            end: total,
            "class": 'outside-sketch',
            value: total,
            label_start: outside_sketch_start,
            name: ''
          }
        ];
        if (name === "Orbicella annularis") {
          index = start_dex;
        } else if (name === "Orbicella faveolata") {
          index = start_dex + 1;
        } else {
          index = start_dex + 2;
        }
        _results.push(this.drawBars(range, index, total));
      }
      return _results;
    }
  };

  EnvironmentTab.prototype.drawBars = function(range, index, max_value) {
    var chart, el, x;
    el = this.$('.viz')[index];
    x = d3.scale.linear().domain([0, max_value]).range([0, 400]);
    chart = d3.select(el);
    return chart.selectAll("div.range").data(range).enter().append("div").style("width", function(d) {
      return Math.round(x(d.end - d.start), 0) + 'px';
    }).attr("class", function(d) {
      return "range " + d["class"];
    }).append("span").text(function(d) {
      return "" + d.name;
    }).style("left", function(d) {
      if (d.label_start) {
        return x(d.label_start) + 'px';
      } else {
        return '';
      }
    }).attr("class", function(d) {
      return "label-" + d["class"];
    });
  };

  EnvironmentTab.prototype.renderHistoValues = function(biomass, histo_vals, graph, color, x_axis_label, legend_label) {
    var bin_size, bmax, bmin, count, el, height, hv, i, incr, len, margin, max, max_count_val, max_histo_val, mean, min, min_max_line_y, num_bins, num_in_bins, q_colors, q_end, q_start, quantile_range, quantiles, svg, width, x, xAxis, y, yAxis, _i, _j, _len;
    if (window.d3) {
      mean = biomass.SCORE;
      bmin = biomass.MIN;
      bmax = biomass.MAX;
      len = histo_vals.length;
      max_histo_val = histo_vals[len - 1];
      quantile_range = {
        "Q0": "very low",
        "Q20": "low",
        "Q40": "mid",
        "Q60": "high",
        "Q80": "very high"
      };
      q_colors = ["#47ae43", "#6c0", "#ee0", "#eb4", "#ecbb89", "#eeaba0"];
      num_bins = 10;
      bin_size = 10;
      quantiles = [];
      max_count_val = 0;
      num_in_bins = Math.ceil(len / num_bins);
      incr = max_histo_val / num_bins;
      for (i = _i = 0; 0 <= num_bins ? _i < num_bins : _i > num_bins; i = 0 <= num_bins ? ++_i : --_i) {
        q_start = i * bin_size;
        q_end = q_start + bin_size;
        min = i * incr;
        max = min + incr;
        count = 0;
        for (_j = 0, _len = histo_vals.length; _j < _len; _j++) {
          hv = histo_vals[_j];
          if (hv >= min && hv < max) {
            count += 1;
          }
        }
        max_count_val = Math.max(count, max_count_val);
        val = {
          start: q_start,
          end: q_end,
          bg: q_colors[Math.floor(i / 2)],
          bin_count: count,
          bin_min: min,
          bin_max: max
        };
        quantiles.push(val);
      }
      this.$(graph).html('');
      el = this.$(graph)[0];
      margin = {
        top: 40,
        right: 20,
        bottom: 40,
        left: 45
      };
      width = 400 - margin.left - margin.right;
      height = 350 - margin.top - margin.bottom;
      x = d3.scale.linear().domain([0, max_histo_val]).range([0, width]);
      y = d3.scale.linear().range([height, 0]).domain([0, max_count_val]);
      xAxis = d3.svg.axis().scale(x).orient("bottom");
      yAxis = d3.svg.axis().scale(y).orient("left");
      min_max_line_y = max_count_val - 20;
      svg = d3.select(this.$(graph)[0]).append("svg").attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + ", " + margin.top + ")");
      svg.append("g").attr("class", "x axis").attr("transform", "translate(0,270)").call(xAxis).append("text").attr("x", width / 2).attr("y", 0).attr("dy", "3em").style("text-anchor", "middle").text(x_axis_label);
      svg.append("g").attr("class", "y axis").call(yAxis).append("text").attr("y", -40).attr("x", -80).attr("transform", "rotate(-90)").attr("dy", ".71em").style("text-anchor", "end").text(legend_label);
      svg.selectAll(".bar").data(quantiles).enter().append("rect").attr("class", "bar").attr("x", function(d, i) {
        return x(d.bin_min);
      }).attr("width", function(d) {
        return width / num_bins;
      }).attr("y", function(d) {
        return y(d.bin_count);
      }).attr("height", function(d) {
        return height - y(d.bin_count);
      }).style('fill', function(d) {
        return color;
      });
      svg.selectAll(".scoreLine").data([Math.round(mean)]).enter().append("line").attr("class", "scoreLine").attr("x1", function(d) {
        return (x(d)) + 'px';
      }).attr("y1", function(d) {
        return (y(max_count_val) - 9) + 'px';
      }).attr("x2", function(d) {
        return x(d) + 'px';
      }).attr("y2", function(d) {
        return height + 'px';
      });
      svg.selectAll(".score").data([Math.round(mean)]).enter().append("text").attr("class", "score").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 9) + 'px';
      }).text("▼");
      svg.selectAll(".scoreText").data([Math.round(mean)]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
        return (x(d) - 22) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 22) + 'px';
      }).text(function(d) {
        return "Mean: " + d;
      });
      svg.selectAll(".minScoreLine").data([Math.round(bmin)]).enter().append("line").attr("class", "minScoreLine").attr("x1", function(d) {
        return (x(d)) + 'px';
      }).attr("y1", function(d) {
        return (y(max_count_val) - 6) + 'px';
      }).attr("x2", function(d) {
        return x(d) + 'px';
      }).attr("y2", function(d) {
        return height + 'px';
      });
      svg.selectAll(".minScore").data([Math.round(bmin)]).enter().append("text").attr("class", "minScore").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val)) + 'px';
      }).text("▼");
      svg.selectAll(".minScoreText").data([Math.round(bmin)]).enter().append("text").attr("class", "minScoreText").attr("x", function(d) {
        return (x(d) - 21) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 12) + 'px';
      }).text(function(d) {
        return "Min: " + d;
      });
      svg.selectAll(".maxScoreLine").data([Math.round(bmax)]).enter().append("line").attr("class", "maxScoreLine").attr("x1", function(d) {
        return (x(d)) + 'px';
      }).attr("y1", function(d) {
        return (y(max_count_val) - 18) + 'px';
      }).attr("x2", function(d) {
        return x(d) + 'px';
      }).attr("y2", function(d) {
        return height + 'px';
      });
      svg.selectAll(".maxScore").data([Math.round(bmax)]).enter().append("text").attr("class", "maxScore").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 18) + 'px';
      }).text("▼");
      svg.selectAll(".maxScoreText").data([Math.round(bmax)]).enter().append("text").attr("class", "maxScoreText").attr("x", function(d) {
        return (x(d) - 30) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 30) + 'px';
      }).text(function(d) {
        return "Max: " + d;
      });
      if (graph === ".herb_viz") {
        this.$(graph).append('<div class="legends"><div class="legend"><span class="herb-swatch">&nbsp;</span>Biomass in Region</div><div class="legend-sketch-values">▼ Sketch Values</div></div>');
      }
      if (graph === ".fish_viz") {
        this.$(graph).append('<div class="legends"><div class="legend"><span class="fish-swatch">&nbsp;</span>Fish Count in Region</div><div class="legend-sketch-values">▼ Sketch Values</div></div>');
      }
      if (graph === ".total_viz") {
        this.$(graph).append('<div class="legends"><div class="legend"><span class="total-swatch">&nbsp;</span>Biomass in Region</div><div class="legend-sketch-values">▼ Sketch Values</div></div>');
      }
      return this.$(graph).append('<br style="clear:both;">');
    }
  };

  EnvironmentTab.prototype.getAllValues = function(all_str) {
    var all_vals, e, sorted_vals;
    try {
      all_vals = all_str.substring(1, all_str.length - 1);
      all_vals = all_vals.split(", ");
      sorted_vals = _.sortBy(all_vals, function(d) {
        return parseFloat(d);
      });
      return sorted_vals;
    } catch (_error) {
      e = _error;
      return [];
    }
  };

  EnvironmentTab.prototype.addTarget = function(data) {
    var d, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      if (d.HAB_TYPE === "Artificial Reef") {
        d.MEETS_GOAL = false;
        _results.push(d.NO_GOAL = true);
      } else {
        d.MEETS_10_GOAL = parseFloat(d.PERC) > 10.0;
        d.MEETS_20_GOAL = parseFloat(d.PERC) > 20.0;
        _results.push(d.MEETS_30_GOAL = parseFloat(d.PERC) > 30.0);
      }
    }
    return _results;
  };

  EnvironmentTab.prototype.roundVals = function(d) {
    d.MEAN = parseFloat(d.MEAN).toFixed(1);
    d.MAX = parseFloat(d.MAX).toFixed(1);
    return d.MIN = parseFloat(d.MIN).toFixed(1);
  };

  EnvironmentTab.prototype.roundData = function(data) {
    var d, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      if (d.AREA_SQKM < 0.1 && d.AREA_SQKM > 0.00001) {
        _results.push(d.AREA_SQKM = "< 0.1 ");
      } else {
        _results.push(d.AREA_SQKM = parseFloat(d.AREA_SQKM).toFixed(1));
      }
    }
    return _results;
  };

  return EnvironmentTab;

})(ReportTab);

module.exports = EnvironmentTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"XqZ11q","../templates/templates.js":16,"reportTab":"N/I/xq"}],13:[function(require,module,exports){
var OverviewTab, ReportTab, d3, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

_partials = require('../node_modules/seasketch-reporting-api/templates/templates.js');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    this.processMinDimension = __bind(this.processMinDimension, this);
    this.drawBars = __bind(this.drawBars, this);
    this.drawFishPotBars = __bind(this.drawFishPotBars, this);
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['SizeAndConnectivity', 'DiveAndFishingValue', 'Distance', 'MinDimensionToolbox', 'MontserratBiomassToolbox'];

  OverviewTab.prototype.render = function() {
    var connectivity, context, ddv, dfv, displaced_dive_value, displaced_fishing_value, err, fishpot_count, fishpot_total, fishpots, isCollection, isConservationZone, meetsMinWidthGoal, minDistKM, minWidth, size;
    size = this.recordSet('SizeAndConnectivity', 'Size').toArray()[0];
    size.PERC = Number((parseFloat(size.SIZE_SQKM) / 340.06) * 100.0).toFixed(1);
    connectivity = this.recordSet('SizeAndConnectivity', 'Connectivity').toArray();
    isCollection = this.model.isCollection();
    try {
      dfv = this.recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0];
      ddv = this.recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0];
    } catch (_error) {
      err = _error;
      console.log("error: ", err);
    }
    'try\n  satest = @recordSet(\'SATestToolbox\', \'ResultMsg\')\n  console.log("-->> Spatial Analyst Test on 10.5: ", satest.data.value)\ncatch e\n  console.log("Spatial Analyst 10.5 failed", e)\n\ntry\n  satest = @recordSet(\'SATestToolbox10.4\', \'ResultMsg\')\n  console.log("-->> Spatial Analyst Test on 10.4: ", satest.data.value)\ncatch e\n  console.log("Spatial Analyst 10.4 failed", e)';
    if (dfv) {
      if (dfv.PERCENT < 0.01) {
        displaced_fishing_value = "< 0.01";
      } else {
        displaced_fishing_value = parseFloat(dfv.PERCENT).toFixed(2);
      }
    } else {
      displaced_fishing_value = "unknown";
    }
    if (ddv) {
      if (ddv.PERCENT < 0.01) {
        displaced_dive_value = "< 0.01";
      } else {
        displaced_dive_value = parseFloat(ddv.PERCENT).toFixed(2);
      }
    } else {
      displaced_dive_value = "unknown";
    }
    minDistKM = this.recordSet('Distance', 'Distance').toArray()[0];
    if (minDistKM) {
      minDistKM = parseFloat(minDistKM.MaxDist).toFixed(2);
    } else {
      minDistKM = "Unknown";
    }
    minWidth = this.recordSet('MinDimensionToolbox', 'Dimensions').toArray();
    console.log("minwidth: ", minWidth);
    if ((minWidth != null ? minWidth.length : void 0) > 0) {
      isConservationZone = true;
      if (isCollection) {
        this.processMinDimension(minWidth);
      } else {
        meetsMinWidthGoal = parseFloat(minWidth[0].WIDTH) > 1.0;
      }
    } else {
      isConservationZone = false;
      meetsMinWidthGoal = false;
    }
    fishpots = this.recordSet('MontserratBiomassToolbox', 'FishPot').toArray();
    if ((fishpots != null ? fishpots.length : void 0) > 0) {
      fishpot_count = fishpots[0].COUNT;
      fishpot_total = fishpots[0].TOTAL;
    } else {
      fishpot_count = 0;
      fishpot_total = 157;
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      hasD3: window.d3,
      size: size,
      connectivity: connectivity,
      displaced_fishing_value: displaced_fishing_value,
      displaced_dive_value: displaced_dive_value,
      minDistKM: minDistKM,
      isConservationZone: isConservationZone,
      meetsMinWidthGoal: meetsMinWidthGoal,
      min_dim: minWidth,
      fishpot_count: fishpot_count,
      fishpot_total: fishpot_total
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    return this.drawFishPotBars(fishpot_count, fishpot_total);
  };

  OverviewTab.prototype.drawFishPotBars = function(fishpot_count, fishpot_total) {
    var count, isCollection, label, outside_sketch_start, range, suffix, total;
    if (window.d3) {
      isCollection = this.model.isCollection();
      suffix = "sketch";
      if (isCollection) {
        suffix = "collection";
      }
      count = fishpot_count;
      total = fishpot_total;
      outside_sketch_start = total * 0.48;
      label = count + "/" + total + " of the fish pots within Montserrat's waters are found within this " + suffix;
      range = [
        {
          bg: "#8e5e50",
          start: 0,
          end: count,
          "class": 'in-sketch',
          value: count,
          name: label
        }, {
          bg: '#dddddd',
          start: count,
          end: total,
          "class": 'outside-sketch',
          value: total,
          label_start: outside_sketch_start,
          name: ''
        }
      ];
      return this.drawBars(range, total);
    }
  };

  OverviewTab.prototype.drawBars = function(range, max_value) {
    var chart, el, x;
    el = this.$('.viz')[0];
    x = d3.scale.linear().domain([0, max_value]).range([0, 400]);
    chart = d3.select(el);
    return chart.selectAll("div.range").data(range).enter().append("div").style("width", function(d) {
      return Math.round(x(d.end - d.start), 0) + 'px';
    }).attr("class", function(d) {
      return "range " + d["class"];
    }).append("span").text(function(d) {
      return "" + d.name;
    }).style("left", function(d) {
      if (d.label_start) {
        return x(d.label_start) + 'px';
      } else {
        return '';
      }
    }).attr("class", function(d) {
      return "label-pots-" + d["class"];
    });
  };

  OverviewTab.prototype.processMinDimension = function(data) {
    var d, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      if (parseFloat(d.WIDTH) > 1.0) {
        _results.push(d.MEETS_THRESH = true);
      } else {
        _results.push(d.MEETS_THRESH = false);
      }
    }
    return _results;
  };

  return OverviewTab;

})(ReportTab);

module.exports = OverviewTab;


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"XqZ11q","../templates/templates.js":16,"reportTab":"N/I/xq"}],14:[function(require,module,exports){
var EnvironmentTab, OverviewTab, TradeoffsTab;

OverviewTab = require('./overview.coffee');

TradeoffsTab = require('./tradeoffs.coffee');

EnvironmentTab = require('./environment.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, TradeoffsTab]);
  return report.stylesheets(['./report.css']);
});


},{"./environment.coffee":12,"./overview.coffee":13,"./tradeoffs.coffee":15}],15:[function(require,module,exports){
var ReportTab, TradeoffsTab, d3, key, partials, templates, val, _partials, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

_partials = require('api/templates');

partials = [];

for (key in _partials) {
  val = _partials[key];
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val;
}

TradeoffsTab = (function(_super) {
  var calc_ttip, formatAxis, getColors, getStrokeColor;

  __extends(TradeoffsTab, _super);

  function TradeoffsTab() {
    this.roundData = __bind(this.roundData, this);
    this.scatterplot = __bind(this.scatterplot, this);
    this.renderTradeoffs = __bind(this.renderTradeoffs, this);
    this.setupScatterPlot = __bind(this.setupScatterPlot, this);
    _ref = TradeoffsTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  TradeoffsTab.prototype.name = 'Tradeoffs';

  TradeoffsTab.prototype.className = 'tradeoffs';

  TradeoffsTab.prototype.template = templates.tradeoffs;

  TradeoffsTab.prototype.dependencies = ['MontserratTradeoffAnalysis'];

  TradeoffsTab.prototype.render = function() {
    var conservation_max, conservation_min, conservation_vals, context, diving_max, diving_min, diving_vals, fishing_max, fishing_min, fishing_vals, isCollection, item, tradeoff_data, tradeoffs,
      _this = this;
    tradeoff_data = this.recordSet('MontserratTradeoffAnalysis', 'Scores').toArray();
    this.roundData(tradeoff_data);
    tradeoffs = ['Fishing and Diving', 'Fishing and Conservation', 'Diving and Conservation'];
    fishing_vals = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tradeoff_data.length; _i < _len; _i++) {
        item = tradeoff_data[_i];
        _results.push(item.Fishing);
      }
      return _results;
    })();
    diving_vals = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tradeoff_data.length; _i < _len; _i++) {
        item = tradeoff_data[_i];
        _results.push(item.Diving);
      }
      return _results;
    })();
    conservation_vals = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = tradeoff_data.length; _i < _len; _i++) {
        item = tradeoff_data[_i];
        _results.push(item.Conservation);
      }
      return _results;
    })();
    fishing_min = Math.min(fishing_vals);
    fishing_max = Math.max(fishing_vals);
    diving_min = Math.min(diving_vals);
    diving_max = Math.max(diving_vals);
    conservation_min = Math.min(conservation_vals);
    conservation_max = Math.max(conservation_vals);
    isCollection = this.model.isCollection();
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      tradeoffs: tradeoffs,
      isCollection: isCollection
    };
    this.$el.html(this.template.render(context, partials));
    this.$('.chosen').chosen({
      disable_search_threshold: 10,
      width: '380px'
    });
    this.$('.chosen').change(function() {
      return _.defer(_this.renderTradeoffs);
    });
    if (window.d3) {
      this.setupScatterPlot(tradeoff_data, '.fishing-v-diving', "Value of Fishing", "Value of Diving", "Fishing", "Diving", fishing_min, fishing_max, diving_min, diving_max);
      this.setupScatterPlot(tradeoff_data, '.fishing-v-conservation', "Value of Fishing", "Value of Conservation", "Fishing", "Conservation", fishing_min, fishing_max, conservation_min, conservation_max);
      return this.setupScatterPlot(tradeoff_data, '.diving-v-conservation', "Value of Diving", "Value of Conservation", "Diving", "Conservation", diving_min, diving_max, conservation_min, conservation_max);
    }
  };

  TradeoffsTab.prototype.setupScatterPlot = function(tradeoff_data, chart_name, xlab, ylab, mouseXProp, mouseYProp, fishingMin, fishingMax, divingMin, divingMax) {
    var ch, h, halfh, halfw, margin, thechart, tooltip, totalh, totalw, verticalRule, w;
    h = 380;
    w = 380;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    halfh = h + margin.top + margin.bottom;
    totalh = halfh * 2;
    halfw = w + margin.left + margin.right;
    totalw = halfw * 2;
    thechart = this.scatterplot(chart_name, mouseXProp, mouseYProp, fishingMin, fishingMax, divingMin, divingMax).xvar(0).yvar(1).xlab(xlab).ylab(ylab).height(h).width(w).margin(margin);
    ch = d3.select(this.$(chart_name));
    ch.datum(tradeoff_data).call(thechart);
    tooltip = d3.select("body").append("div").attr("class", "chart-tooltip").attr("id", "chart-tooltip").text("data");
    verticalRule = d3.select("body").append("div").attr("class", "verticalRule").style("position", "absolute").style("z-index", "19").style("width", "1px").style("height", "250px").style("top", "10px").style("bottom", "30px").style("left", "0px").style("background", "black");
    thechart.pointsSelect().on("mouseover", function(d) {
      return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + window.app.sketches.get(d.PROPOSAL).attributes.name + "</strong><li>" + xlab + ": " + d[mouseXProp] + "</li><li> " + ylab + ": " + d[mouseYProp] + "</li></ul>");
    });
    thechart.pointsSelect().on("mousemove", function(d) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
    });
    thechart.pointsSelect().on("mouseout", function(d) {
      return tooltip.style("visibility", "hidden");
    });
    thechart.labelsSelect().on("mouseover", function(d) {
      return tooltip.style("visibility", "visible").html("<ul><strong>Proposal: " + window.app.sketches.get(d.PROPOSAL).attributes.name + "</strong><li> " + xlab + ": " + d[mouseXProp] + "</li><li> " + ylab + ": " + d[mouseYProp] + "</li></ul>");
    });
    thechart.labelsSelect().on("mousemove", function(d) {
      return tooltip.style("top", (event.pageY - 10) + "px").style("left", (calc_ttip(event.pageX, d, tooltip)) + "px");
    });
    return thechart.labelsSelect().on("mouseout", function(d) {
      return tooltip.style("visibility", "hidden");
    });
  };

  TradeoffsTab.prototype.renderTradeoffs = function() {
    var name;
    name = this.$('.chosen').val();
    if (name === "Fishing and Diving") {
      this.$('.fvd_container').show();
      this.$('.fvc_container').hide();
      return this.$('.dvc_container').hide();
    } else if (name === "Fishing and Conservation") {
      this.$('.fvd_container').hide();
      this.$('.fvc_container').show();
      return this.$('.dvc_container').hide();
    } else if (name === "Diving and Conservation") {
      this.$('.fvd_container').hide();
      this.$('.fvc_container').hide();
      return this.$('.dvc_container').show();
    }
  };

  calc_ttip = function(xloc, data, tooltip) {
    var tdiv, tleft, tw;
    tdiv = tooltip[0][0].getBoundingClientRect();
    tleft = tdiv.left;
    tw = tdiv.width;
    if (xloc + tw > tleft + tw) {
      return xloc - (tw + 10);
    }
    return xloc + 10;
  };

  TradeoffsTab.prototype.scatterplot = function(chart_name, xval, yval, fishingMin, fishingMax, divingMin, divingMax) {
    var axispos, chart, el, height, horizontalRule, labelsSelect, legendSelect, legendheight, margin, nxticks, nyticks, pointsSelect, pointsize, rectcolor, verticalRule, view, width, xlab, xlim, xscale, xticks, ylab, ylim, yscale, yticks;
    view = this;
    width = 380;
    height = 600;
    margin = {
      left: 40,
      top: 5,
      right: 40,
      bottom: 40,
      inner: 5
    };
    axispos = {
      xtitle: 25,
      ytitle: 30,
      xlabel: 5,
      ylabel: 1
    };
    xlim = null;
    ylim = null;
    nxticks = 5;
    xticks = null;
    nyticks = 5;
    yticks = null;
    rectcolor = "white";
    pointsize = 5;
    xlab = "X";
    ylab = "Y score";
    yscale = d3.scale.linear();
    xscale = d3.scale.linear();
    legendheight = 300;
    pointsSelect = null;
    labelsSelect = null;
    legendSelect = null;
    verticalRule = null;
    horizontalRule = null;
    if (window.d3) {
      view.$(chart_name).html('');
      el = view.$(chart_name)[0];
    }
    chart = function(selection) {
      return selection.each(function(data) {
        var currelem, g, labels, na_value, panelheight, paneloffset, panelwidth, points, svg, x, xaxis, xrange, xs, y, yaxis, yrange, ys;
        x = data.map(function(d) {
          return parseFloat(d[xval]);
        });
        y = data.map(function(d) {
          return parseFloat(d[yval]);
        });
        paneloffset = 0;
        panelwidth = width;
        panelheight = height;
        if (!(xlim != null)) {
          xlim = [d3.min(x) - 0.25, parseFloat(d3.max(x) + 0.25)];
        }
        if (!(ylim != null)) {
          ylim = [d3.min(y) - 0.25, parseFloat(d3.max(y) + 0.25)];
        }
        na_value = d3.min(x.concat(y)) - 100;
        currelem = d3.select(view.$(chart_name)[0]);
        svg = d3.select(view.$(chart_name)[0]).append("svg").data([data]);
        svg.append("g");
        svg.attr("width", width + margin.left + margin.right).attr("height", height + margin.top + margin.bottom + data.length * 35);
        g = svg.select("g");
        g.append("rect").attr("x", paneloffset + margin.left).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", rectcolor).attr("stroke", "none");
        xrange = [margin.left + paneloffset + margin.inner, margin.left + paneloffset + panelwidth - margin.inner];
        yrange = [margin.top + panelheight - margin.inner, margin.top + margin.inner];
        xscale.domain(xlim).range(xrange);
        yscale.domain(ylim).range(yrange);
        xs = d3.scale.linear().domain(xlim).range(xrange);
        ys = d3.scale.linear().domain(ylim).range(yrange);
        if (!(yticks != null)) {
          yticks = ys.ticks(nyticks);
        }
        if (!(xticks != null)) {
          xticks = xs.ticks(nxticks);
        }
        xaxis = g.append("g").attr("class", "x axis");
        xaxis.selectAll("empty").data(xticks).enter().append("line").attr("x1", function(d) {
          return xscale(d);
        }).attr("x2", function(d) {
          return xscale(d);
        }).attr("y1", margin.top).attr("y2", margin.top + height).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        xaxis.selectAll("empty").data(xticks).enter().append("text").attr("x", function(d) {
          return xscale(d);
        }).attr("y", margin.top + height + axispos.xlabel).text(function(d) {
          return formatAxis(xticks)(d);
        });
        xaxis.append("text").attr("class", "xaxis-title").attr("x", margin.left + width / 2).attr("y", margin.top + height + axispos.xtitle).text(xlab);
        xaxis.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return margin.left;
        }).attr("cy", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30) + 6;
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i % 17;
          col = getColors(val);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1");
        xaxis.selectAll("empty").data(data).enter().append("text").attr("class", "legend-text").attr("x", function(d, i) {
          return margin.left + 20;
        }).attr("y", function(d, i) {
          return margin.top + height + axispos.xtitle + ((i + 1) * 30);
        }).text(function(d) {
          return window.app.sketches.get(d.PROPOSAL).attributes.name;
        });
        yaxis = g.append("g").attr("class", "y axis");
        yaxis.selectAll("empty").data(yticks).enter().append("line").attr("y1", function(d) {
          return yscale(d);
        }).attr("y2", function(d) {
          return yscale(d);
        }).attr("x1", margin.left).attr("x2", margin.left + width).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 1).style("pointer-events", "none");
        yaxis.selectAll("empty").data(yticks).enter().append("text").attr("y", function(d) {
          return yscale(d);
        }).attr("x", margin.left - axispos.ylabel).text(function(d) {
          return formatAxis(yticks)(d);
        });
        yaxis.append("text").attr("class", "title").attr("y", margin.top - 8 + (height / 2)).attr("x", margin.left - axispos.ytitle).text(ylab).attr("transform", "rotate(270," + (margin.left - axispos.ytitle) + "," + (margin.top + height / 2) + ")");
        labels = g.append("g").attr("id", "labels");
        labelsSelect = labels.selectAll("empty").data(data).enter().append("text").text(function(d) {
          return window.app.sketches.get(d.PROPOSAL).attributes.name;
        }).attr("x", function(d, i) {
          var overlap_xstart, string_end, xpos;
          xpos = xscale(x[i]);
          string_end = xpos + this.getComputedTextLength();
          overlap_xstart = xpos - (this.getComputedTextLength() + 5);
          if (overlap_xstart < 50) {
            overlap_xstart = 50;
          }
          if (string_end > width) {
            return overlap_xstart;
          }
          return xpos + 5;
        }).attr("y", function(d, i) {
          var ypos;
          ypos = yscale(y[i]);
          if (ypos < 50) {
            return ypos + 10;
          }
          return ypos - 5;
        });
        points = g.append("g").attr("id", "points");
        pointsSelect = points.selectAll("empty").data(data).enter().append("circle").attr("cx", function(d, i) {
          return xscale(x[i]);
        }).attr("cy", function(d, i) {
          return yscale(y[i]);
        }).attr("class", function(d, i) {
          return "pt" + i;
        }).attr("r", pointsize).attr("fill", function(d, i) {
          var col;
          val = i;
          col = getColors([val]);
          return col;
        }).attr("stroke", function(d, i) {
          var col;
          val = Math.floor(i / 17) % 5;
          col = getStrokeColor(val);
          return col;
        }).attr("stroke-width", "1").attr("opacity", function(d, i) {
          if (((x[i] != null) || xNA.handle) && ((y[i] != null) || yNA.handle)) {
            return 1;
          }
          return 0;
        });
        return g.append("rect").attr("x", margin.left + paneloffset).attr("y", margin.top).attr("height", panelheight).attr("width", panelwidth).attr("fill", "none").attr("stroke", "black").attr("stroke-width", "none");
      });
    };
    chart.width = function(value) {
      if (!arguments.length) {
        return width;
      }
      width = value;
      return chart;
    };
    chart.height = function(value) {
      if (!arguments.length) {
        return height;
      }
      height = value;
      return chart;
    };
    chart.margin = function(value) {
      if (!arguments.length) {
        return margin;
      }
      margin = value;
      return chart;
    };
    chart.axispos = function(value) {
      if (!arguments.length) {
        return axispos;
      }
      axispos = value;
      return chart;
    };
    chart.xlim = function(value) {
      if (!arguments.length) {
        return xlim;
      }
      xlim = value;
      return chart;
    };
    chart.nxticks = function(value) {
      if (!arguments.length) {
        return nxticks;
      }
      nxticks = value;
      return chart;
    };
    chart.xticks = function(value) {
      if (!arguments.length) {
        return xticks;
      }
      xticks = value;
      return chart;
    };
    chart.ylim = function(value) {
      if (!arguments.length) {
        return ylim;
      }
      ylim = value;
      return chart;
    };
    chart.nyticks = function(value) {
      if (!arguments.length) {
        return nyticks;
      }
      nyticks = value;
      return chart;
    };
    chart.yticks = function(value) {
      if (!arguments.length) {
        return yticks;
      }
      yticks = value;
      return chart;
    };
    chart.rectcolor = function(value) {
      if (!arguments.length) {
        return rectcolor;
      }
      rectcolor = value;
      return chart;
    };
    chart.pointcolor = function(value) {
      var pointcolor;
      if (!arguments.length) {
        return pointcolor;
      }
      pointcolor = value;
      return chart;
    };
    chart.pointsize = function(value) {
      if (!arguments.length) {
        return pointsize;
      }
      pointsize = value;
      return chart;
    };
    chart.pointstroke = function(value) {
      var pointstroke;
      if (!arguments.length) {
        return pointstroke;
      }
      pointstroke = value;
      return chart;
    };
    chart.xlab = function(value) {
      if (!arguments.length) {
        return xlab;
      }
      xlab = value;
      return chart;
    };
    chart.ylab = function(value) {
      if (!arguments.length) {
        return ylab;
      }
      ylab = value;
      return chart;
    };
    chart.xvar = function(value) {
      var xvar;
      if (!arguments.length) {
        return xvar;
      }
      xvar = value;
      return chart;
    };
    chart.yvar = function(value) {
      var yvar;
      if (!arguments.length) {
        return yvar;
      }
      yvar = value;
      return chart;
    };
    chart.yscale = function() {
      return yscale;
    };
    chart.xscale = function() {
      return xscale;
    };
    chart.pointsSelect = function() {
      return pointsSelect;
    };
    chart.labelsSelect = function() {
      return labelsSelect;
    };
    chart.legendSelect = function() {
      return legendSelect;
    };
    chart.verticalRule = function() {
      return verticalRule;
    };
    chart.horizontalRule = function() {
      return horizontalRule;
    };
    return chart;
  };

  TradeoffsTab.prototype.roundData = function(data) {
    var d, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      d = data[_i];
      d.Fishing = parseFloat(d.Fishing).toFixed(2);
      _results.push(d.Diving = parseFloat(d.Diving).toFixed(2));
    }
    return _results;
  };

  getColors = function(i) {
    var colors;
    colors = ["LightGreen", "LightPink", "LightSkyBlue", "Moccasin", "BlueViolet", "Gainsboro", "DarkGreen", "DarkTurquoise", "maroon", "navy", "LemonChiffon", "orange", "red", "silver", "teal", "white", "black"];
    return colors[i];
  };

  getStrokeColor = function(i) {
    var scolors;
    scolors = ["black", "white", "gray", "brown", "Navy"];
    return scolors[i];
  };

  formatAxis = function(d) {
    var ndig;
    d = d[1] - d[0];
    ndig = Math.floor(Math.log(d % 10) / Math.log(10));
    if (ndig > 0) {
      ndig = 0;
    }
    ndig = Math.abs(ndig);
    return d3.format("." + ndig + "f");
  };

  return TradeoffsTab;

})(ReportTab);

module.exports = TradeoffsTab;


},{"../templates/templates.js":16,"api/templates":"XqZ11q","reportTab":"N/I/xq"}],16:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,20,3523,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Benthic Habitats ");if(_.s(_.f("isCollection",c,p,1),c,p,0,107,125,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("in Marine Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The following table describes the overlap between ");if(_.s(_.f("isCollection",c,p,1),c,p,0,324,368,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("the marine reserve sketches within your plan");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("your sketch");};_.b(" and the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right. The MNI 2016 benthic habitat map was digitized by hand using a combination of in situ observations on scuba/free dive at survey sites (n = approx. 600) and drop camera deployments (n = 343) as part of the Waitt Institute Scientific Assessment. Preliminary context for mapping was gleaned from benthic maps depicted in Wild et. al 2007 and IRF 1993. These maps provided valuable insight into dominant benthic features and the interpretation of site observations. ");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 10% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 20% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 30% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("\n" + i);_.b("            <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("            <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("            <th>Area (% of Total)</th>");_.b("\n" + i);_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,1481,3011,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_10_GOAL",c,p,1),c,p,0,1550,1623,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_10_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,1707,1774,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_20_GOAL",c,p,1),c,p,0,2009,2082,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_20_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,2166,2233,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_30_GOAL",c,p,1),c,p,0,2468,2541,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_30_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,2625,2692,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("           ");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("        <tfoot>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td colspan=\"6\" style=\"padding-left:10px;text-align:left;\">");_.b("\n" + i);_.b("              <sup>*</sup>Indicates whether the selected Marine Reserves zones have reached th conservation goal of preserving 10/20/30% of each habitat. A green check indicates that the goal is met, red x means that the goal is not met, and a gray dash indicates that there is no goal for that habitat.");_.b("\n" + i);_.b("            </td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tfoot>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b(" </div>");_.b("\n");});c.pop();}if(_.s(_.f("hasZoneWithNoGoal",c,p,1),c,p,0,3566,5042,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Benthic Habitats ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3653,3675,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("in Non Marine Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The following table describes the overlap of ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3869,3935,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("the sketches in your plan that are <b>NOT</b> marine reserves with");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("your sketch and");};_.b(" the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right. The MNI 2016 benthic habitat map was digitized by hand using a combination of in situ observations on scuba/free dive at survey sites (n = approx. 600) and drop camera deployments (n = 343) as part of the Waitt Institute Scientific Assessment. Preliminary context for mapping was gleaned from benthic maps depicted in Wild et. al 2007 and IRF 1993. These maps provided valuable insight into dominant benthic features and the interpretation of site observations. ");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("            <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("            <th>Area (% of Total)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("nogoal_habitats",c,p,1),c,p,0,4840,4981,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b(" </div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,5086,6514,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>IUCN Listed Coral ");if(_.s(_.f("isCollection",c,p,1),c,p,0,5174,5191,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("- Marine Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58e671fc4af25d590ba4ccef\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Three IUCN listed corals have been observed within Montserrat waters. The following graphics show the number of the known observations that are found within the selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,5510,5541,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<b>marine reserve</b> sketches ");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(".");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,5625,5974,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_a\">");_.b("\n" + i);_.b("            <div><i>Orbicella annularis </i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_f\">");_.b("\n" + i);_.b("            <div><i>Orbicella faveolata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"acro\">");_.b("\n" + i);_.b("            <div><i>Acropora palmata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Name<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("              <th>Total</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("coral_count",c,p,1),c,p,0,6292,6436,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b(" </div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("hasZoneWithNoGoal",c,p,1),c,p,0,6558,7994,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>IUCN Listed Coral ");if(_.s(_.f("isCollection",c,p,1),c,p,0,6646,6667,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("- Non Marine Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58e671fc4af25d590ba4ccef\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Three IUCN listed corals have been observed within Montserrat waters. The following graphics show the number of the known observations that are found within the selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,6986,7021,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <b>non marine reserve</b> sketches");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(".");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,7105,7454,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_a\">");_.b("\n" + i);_.b("            <div><i>Orbicella annularis </i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_f\">");_.b("\n" + i);_.b("            <div><i>Orbicella faveolata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"acro\">");_.b("\n" + i);_.b("            <div><i>Acropora palmata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Name<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("              <th>Total</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("coral_count",c,p,1),c,p,0,7772,7916,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b(" </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Nursery Areas</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum abundance measurements of nursery areas that were taken within your ");if(_.s(_.f("isCollection",c,p,1),c,p,0,8223,8233,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(", in relation to the distribution of abundance within Montserrat waters.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,8389,8501,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div class=\"in-report-header\">Nursery Areas</div>");_.b("\n" + i);_.b("      <div id=\"sandg_viz\" class=\"sandg_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("sandg",c,p,1),c,p,0,8797,8993,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Nursery Areas</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("   <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Fish Biomass</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        These charts show the minimum, mean and maximum fish biomass value taken within your sketched zone, in relation to the distribution of biomass measured around the island. Biomass was calculated for Herbivores and All Species at regular points along Montserrat's coast.");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,9450,9687,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <div class=\"in-report-header\">Herbivore Biomass</div>");_.b("\n" + i);_.b("        <div id=\"herb_viz\" class=\"herb_viz\"></div>");_.b("\n" + i);_.b("        <div class=\"in-report-header\">All Species Biomass</div>");_.b("\n" + i);_.b("        <div id=\"total_viz\" class=\"total_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("              <th>Mean</th>");_.b("\n" + i);_.b("              <th>Minimum</th>");_.b("\n" + i);_.b("              <th>Maximum</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("herb",c,p,1),c,p,0,10006,10210,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <tr>");_.b("\n" + i);_.b("                <td>Herbivores</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("herb.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("herb.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("herb.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              </tr>");_.b("\n");});c.pop();}if(_.s(_.f("total",c,p,1),c,p,0,10242,10445,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <tr>");_.b("\n" + i);_.b("                <td>Totals</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("total.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("total.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("total.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b("   </div>");_.b("\n" + i);_.b("\n" + i);_.b("   <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Fish Abundance</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        These charts show the minimum, mean and maximum fish abundance value taken within your sketched zone.");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,10739,10797,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <div id=\"fish_viz\" class=\"fish_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("              <th>Mean</th>");_.b("\n" + i);_.b("              <th>Minimum</th>");_.b("\n" + i);_.b("              <th>Maximum</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("fish",c,p,1),c,p,0,11116,11320,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <tr>");_.b("\n" + i);_.b("                <td>Herbivores</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("fish.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("fish.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("fish.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              </tr>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b("    </div>");_.b("\n" + i);_.b("  -->");_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,76,86,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.d("size.SIZE_SQKM",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.d("size.PERC",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance from Port Little Bay</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The farthest point in the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,444,454,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.f("minDistKM",c,p,0)));_.b(" km</strong> (over water) from the Port Little Bay.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value<a href=\"#\" data-toggle-node=\"57e2c33beb275bba1ec6fd46\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,783,793,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Montserrat's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Dive Value<a href=\"#\" data-toggle-node=\"57e2c302eb275bba1ec6fd3d\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1228,1238,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Montserrat's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("<h4>Fish Pots <a href=\"#\" data-toggle-node=\"58ed7cb54af25d590ba4fc3c\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,1632,1744,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div>");_.b("\n" + i);_.b("      <div class=\"viz\" id=\"fish_pots\">");_.b("\n" + i);_.b("        <div><i>Fish Pots</i></div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("    </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("          <th>Total</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("fishpot_count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("fishpot_total",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("isConservationZone",c,p,1),c,p,0,2131,2760,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <div style=\"padding-left:10px\">");_.b("\n" + i);if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,2265,2320,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"big-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("          <div class=\"big-red-x\"></div>");_.b("\n");};_.b("        <div style=\"display:inline;padding-left:5px;font-size:1.1em\">");_.b("\n" + i);_.b("          This zone <b>");if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,2560,2566,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" meets");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("does not meet");};_.b("</b> the conservation goal of having a minimum width of <b>at least 1km</b>.");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}};if(_.s(_.f("isCollection",c,p,1),c,p,0,2819,4357,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Marine Reserve Zones should have a minimum width of at least 1 kilometer to meet conservation goals.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td style=\"width:60px;text-align:center;\">Meets 1km Goal?</td>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("min_dim",c,p,1),c,p,0,3250,3635,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_THRESH",c,p,1),c,p,0,3320,3393,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_THRESH",c,p,1),c,p,1,0,0,"")){_.b("                  <div class=\"small-red-x\"></div>");_.b("\n");};_.b("              </td>");_.b("\n" + i);_.b("              <td style=\"text-align:left;\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("   </div>");_.b("\n" + i);_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Connectivity</h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("            <td>Distance to Nearest Zone (km)</td>");_.b("\n" + i);_.b("            <td>Nearest Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("connectivity",c,p,1),c,p,0,3988,4138,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("DIST_KM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NEAR_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <em>Note:</em> The connectivity analytic has been developed for demonstration purposes, and does not account for the least cost path around land.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["tradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,70,1081,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p style=\"margin-left:18px;\">");_.b("\n" + i);_.b("  		<em>Tradeoff analysis is currently in development, and should be used for demonstration purposes only. These analytics will allow users to plot multiple plan options against each other in terms of their impact on fishing, dive and conservation value for Montserrat.</em>");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("  	<div style=\"margin-left:18px;margin-bottom:15px\">");_.b("\n" + i);_.b("	  	<span>Select a Set of Tradeoff Scores to View:</span></br>");_.b("\n" + i);_.b("		<select class=\"chosen\">");_.b("\n" + i);if(_.s(_.f("tradeoffs",c,p,1),c,p,0,549,674,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <option class=\"");_.b(_.v(_.d(". == \"Fishing and Diving\" ? 'default-chosen-selection' : ''",c,p,0)));_.b("\"  value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("		</select>");_.b("\n" + i);_.b("	</div>");_.b("\n" + i);_.b("  	<div id=\"fvd_container\" class=\"fvd_container\"><div  id=\"fishing-v-diving\" class=\"fishing-v-diving\"></div></div>");_.b("\n" + i);_.b("    <div id=\"fvc_container\" class=\"fvc_container\"><div  id=\"fishing-v-conservation\" class=\"fishing-v-conservation\"></div></div>");_.b("\n" + i);_.b("    <div id=\"dvc_container\" class=\"dvc_container\"><div  id=\"diving-v-conservation\" class=\"diving-v-conservation\"></div></div>");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("  	  	<p>");_.b("\n" + i);_.b("  			<i>No tradeoff analysis available for individual zones.</i>");_.b("\n" + i);_.b("  		</p>");_.b("\n");};_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[14])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L19lbXB0eS5qcyIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlUmFzdGVyTGF5ZXJzLmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL2pvYkl0ZW0uY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0UmVzdWx0cy5jb2ZmZWUiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9yZXBvcnRUYWIuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvdXRpbHMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiLCIvVXNlcnMvc2Vhc2tldGNoL0Rlc2t0b3AvR2l0SHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9zY3JpcHRzL2Vudmlyb25tZW50LmNvZmZlZSIsIi9Vc2Vycy9zZWFza2V0Y2gvRGVza3RvcC9HaXRIdWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvb3ZlcnZpZXcuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvc2NyaXB0cy9yZXBvcnQuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvc2NyaXB0cy90cmFkZW9mZnMuY29mZmVlIiwiL1VzZXJzL3NlYXNrZXRjaC9EZXNrdG9wL0dpdEh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0FDQUEsQ0FBTyxDQUFVLENBQUEsR0FBWCxDQUFOLEVBQWtCO0NBQ2hCLEtBQUEsMkVBQUE7Q0FBQSxDQUFBLENBQUE7Q0FBQSxDQUNBLENBQUEsR0FBWTtDQURaLENBRUEsQ0FBQSxHQUFNO0FBQ0MsQ0FBUCxDQUFBLENBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBQSxHQUFPLHFCQUFQO0NBQ0EsU0FBQTtJQUxGO0NBQUEsQ0FNQSxDQUFXLENBQUEsSUFBWCxhQUFXO0NBRVg7Q0FBQSxNQUFBLG9DQUFBO3dCQUFBO0NBQ0UsRUFBVyxDQUFYLEdBQVcsQ0FBWDtDQUFBLEVBQ1MsQ0FBVCxFQUFBLEVBQWlCLEtBQVI7Q0FDVDtDQUNFLEVBQU8sQ0FBUCxFQUFBLFVBQU87Q0FBUCxFQUNPLENBQVAsQ0FEQSxDQUNBO0FBQytCLENBRi9CLENBRThCLENBQUUsQ0FBaEMsRUFBQSxFQUFRLENBQXdCLEtBQWhDO0NBRkEsQ0FHeUIsRUFBekIsRUFB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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6W251bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJtb2R1bGUuZXhwb3J0cyA9IChlbCwgcmFzdGVyTGF5ZXJzTGlzdCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG5cblxuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS1yYXN0ZXItdXJsXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgdXJsID0gJHRvZ2dsZXIuZGF0YSgncmFzdGVyLXVybCcpXG4gICAgd2lkdGggPSAkdG9nZ2xlci5kYXRhKCd3aWR0aCcpXG4gICAgaGVpZ2h0ID0gJHRvZ2dsZXIuZGF0YSgnaGVpZ2h0JylcbiAgICBleHRlbnQgPSAkdG9nZ2xlci5kYXRhKCdleHRlbnQnKS5zcGxpdCgnLCcpXG4gICAgdG9nZ2xlZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZWQnKVxuICAgIGlmICF1cmwgb3IgIXdpZHRoIG9yICFoZWlnaHQgb3IgIWV4dGVudFxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmFzdGVyIGxpbmtzIG11c3QgaW5jbHVkZSBkYXRhLXJhc3Rlci11cmwsIGRhdGEtd2lkdGgsIGRhdGEtaGVpZ2h0LCBhbmQgZGF0YS1leHRlbnQgYXR0cmlidXRlc1wiKVxuICAgIGxheWVyID0gbmV3IGVzcmkubGF5ZXJzLk1hcEltYWdlTGF5ZXIoe3Zpc2libGU6IHRvZ2dsZWR9KVxuICAgIG1hcEltYWdlID0gbmV3IGVzcmkubGF5ZXJzLk1hcEltYWdlKCdleHRlbnQnOiB7ICd4bWluJzogZXh0ZW50WzBdLCAneW1pbic6IGV4dGVudFsxXSwgJ3htYXgnOiBleHRlbnRbMl0sICd5bWF4JzogZXh0ZW50WzNdLCAnc3BhdGlhbFJlZmVyZW5jZSc6IHsgJ3draWQnOiAzODU3IH19LFxuICAgICdocmVmJzogdXJsKVxuICAgIHRvYyA9ICQgXCJcIlwiXG4gICAgICA8ZGl2IGNsYXNzPVwidGFibGVPZkNvbnRlbnRzXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwidGFibGVPZkNvbnRlbnRzSXRlbVwiIGRhdGEtZHAtc3RhdHVzPVwiXCIgZGF0YS10eXBlPVwic2tldGNoXCIgZGF0YS1sb2FkaW5nPVwiZmFsc2VcIj5cbiAgICAgICAgPGRpdiB1bnNlbGVjdGFibGU9XCJvblwiIGNsYXNzPVwiaXRlbVwiIGRhdGEtdmlzaWJpbGl0eT1cIiN7dG9nZ2xlZH1cIiBkYXRhLWNoZWNrb2Zmb25seT1cIlwiIGRhdGEtaGlkZWNoaWxkcmVuPVwibm9cIiBkYXRhLXNlbGVjdGVkPVwiZmFsc2VcIj5cbiAgICAgICAgICA8c3BhbiB1bnNlbGVjdGFibGU9XCJvblwiIGNsYXNzPVwibG9hZGluZ1wiPiZuYnNwOzwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiB1bnNlbGVjdGFibGU9XCJvblwiIGNsYXNzPVwiZXhwYW5kZXJcIj48L3NwYW4+XG4gICAgICAgICAgPHNwYW4gdW5zZWxlY3RhYmxlPVwib25cIiBjbGFzcz1cInZpc2liaWxpdHlcIj48L3NwYW4+XG4gICAgICAgICAgPHNwYW4gdW5zZWxlY3RhYmxlPVwib25cIiBjbGFzcz1cImljb25cIiBzdHlsZT1cIlwiPjwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiB1bnNlbGVjdGFibGU9XCJvblwiIGNsYXNzPVwibmFtZVwiPiN7JHRvZ2dsZXIudGV4dCgpfTwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiB1bnNlbGVjdGFibGU9XCJvblwiIGNsYXNzPVwiY29udGV4dFwiPjwvc3Bhbj5cbiAgICAgICAgICA8c3BhbiB1bnNlbGVjdGFibGU9XCJvblwiIGNsYXNzPVwiZGVzY3JpcHRpb25cIiBzdHlsZT1cImRpc3BsYXk6IG5vbmU7XCI+PC9zcGFuPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICBcIlwiXCJcbiAgICAkdG9nZ2xlci5yZXBsYWNlV2l0aCh0b2MpXG4gICAgJHRvZ2dsZXIgPSB0b2MuZmluZCgnLnRhYmxlT2ZDb250ZW50c0l0ZW0nKTtcbiAgICBsYXllci5hZGRJbWFnZShtYXBJbWFnZSk7XG4gICAgcmFzdGVyTGF5ZXJzTGlzdC5wdXNoIGxheWVyXG4gICAgd2luZG93LmFwcC5wcm9qZWN0aG9tZXBhZ2UubWFwLmFkZExheWVyKGxheWVyKVxuICAgICR0b2dnbGVyLmRhdGEoJ2xheWVyJywgbGF5ZXIpXG4gICAgJHRvZ2dsZXIub24gJ2NsaWNrJywgKGUpID0+XG4gICAgICBpdGVtID0gJChlLnRhcmdldCkuY2xvc2VzdCgnLnRhYmxlT2ZDb250ZW50c0l0ZW0nKVxuICAgICAgbGF5ZXIgPSBpdGVtLmRhdGEoJ2xheWVyJylcbiAgICAgIGl0ZW0uZmluZCgnLml0ZW0nKS5hdHRyKCdkYXRhLXZpc2liaWxpdHknLCAhbGF5ZXIudmlzaWJsZSlcbiAgICAgIGxheWVyLnNldFZpc2liaWxpdHkoIWxheWVyLnZpc2libGUpXG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5lbmFibGVSYXN0ZXJMYXllcnMgPSByZXF1aXJlICcuL2VuYWJsZVJhc3RlckxheWVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBAcmFzdGVyTGF5ZXJzID0gW11cbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIGZvciBsYXllciBpbiBAcmFzdGVyTGF5ZXJzXG4gICAgICBAYXBwLnByb2plY3Rob21lcGFnZS5tYXAucmVtb3ZlTGF5ZXIobGF5ZXIpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKEBtYXhFdGEgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tAbWF4RXRhICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhU2Vjb25kcycpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBlbmFibGVSYXN0ZXJMYXllcnM6ICgpID0+XG4gICAgZW5hYmxlUmFzdGVyTGF5ZXJzKEAkZWwsIEByYXN0ZXJMYXllcnMpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDEyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJkb05vdEV4cG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5cbmQzID0gd2luZG93LmQzXG5cbmNsYXNzIEVudmlyb25tZW50VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbnZpcm9ubWVudCdcbiAgY2xhc3NOYW1lOiAnZW52aXJvbm1lbnQnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZW52aXJvbm1lbnRcbiAgZGVwZW5kZW5jaWVzOlsgXG4gICAgJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCdcbiAgICAnTW9udHNlcnJhdENvcmFsVG9vbGJveCdcbiAgICAnTW9udHNlcnJhdFNuYXBBbmRHcm91cFRvb2xib3gnXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKCkgICBcbiAgICBkM0lzUHJlc2VudCA9IHdpbmRvdy5kMyA/IHRydWUgIDogZmFsc2VcbiAgICBpZiBpc0NvbGxlY3Rpb25cbiAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmUgPSBAZ2V0SGFzQ29uc2VydmF0aW9uWm9uZSBAbW9kZWwuZ2V0Q2hpbGRyZW4oKVxuICAgICAgaGFzWm9uZVdpdGhHb2FsID0gQGdldEhhc1pvbmVXaXRoR29hbCBAbW9kZWwuZ2V0Q2hpbGRyZW4oKVxuICAgICAgaGFzWm9uZVdpdGhOb0dvYWwgPSBAZ2V0SGFzWm9uZVdpdGhOb0dvYWwgQG1vZGVsLmdldENoaWxkcmVuKClcbiAgICBlbHNlXG4gICAgICBoYXNDb25zZXJ2YXRpb25ab25lID0gdHJ1ZVxuICAgICAgaGFzWm9uZVdpdGhHb2FsID0gQGdldEhhc1pvbmVXaXRoR29hbCBbQG1vZGVsXVxuICAgICAgaGFzWm9uZVdpdGhOb0dvYWwgPSBAZ2V0SGFzWm9uZVdpdGhOb0dvYWwgW0Btb2RlbF1cblxuXG4gICAgIyBjcmVhdGUgcmFuZG9tIGRhdGEgZm9yIHZpc3VhbGl6YXRpb25cbiAgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCcsICdIYWJpdGF0cycpLnRvQXJyYXkoKVxuICAgIGhhYml0YXRzID0gXy5zb3J0QnkgaGFiaXRhdHMsIChoKSAtPiAgcGFyc2VGbG9hdChoLlBFUkMpXG4gICAgaGFiaXRhdHMgPSBoYWJpdGF0cy5yZXZlcnNlKClcblxuICAgIEBhZGRUYXJnZXQgaGFiaXRhdHNcblxuICAgIG5vZ29hbF9oYWJpdGF0cyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCcsICdOb25SZXNlcnZlSGFiaXRhdHMnKS50b0FycmF5KClcbiAgICBub2dvYWxfaGFiaXRhdHMgPSBfLnNvcnRCeSBub2dvYWxfaGFiaXRhdHMsIChoKSAtPiAgcGFyc2VGbG9hdChoLlBFUkMpXG4gICAgbm9nb2FsX2hhYml0YXRzID0gbm9nb2FsX2hhYml0YXRzLnJldmVyc2UoKVxuXG4gICAgc2FuZGcgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0U25hcEFuZEdyb3VwVG9vbGJveCcsICdTbmFwQW5kR3JvdXAnKS50b0FycmF5KClbMF1cbiAgICBhbGxfc2FuZGdfdmFscyA9IEBnZXRBbGxWYWx1ZXMgc2FuZGcuSElTVE9cbiAgICAnJydcbiAgICBoZXJiX2JpbyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdIZXJiaXZvcmVCaW9tYXNzJykudG9BcnJheSgpWzBdXG4gICAgYWxsX2hlcmJfdmFscyA9IEBnZXRBbGxWYWx1ZXMgaGVyYl9iaW8uSElTVE9cbiAgICBAcm91bmRWYWxzIGhlcmJfYmlvXG5cbiAgICB0b3RhbF9iaW8gPSBAcmVjb3JkU2V0KCdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnLCAnVG90YWxCaW9tYXNzJykudG9BcnJheSgpWzBdXG4gICAgYWxsX3RvdGFsX3ZhbHVlcyA9IEBnZXRBbGxWYWx1ZXMgdG90YWxfYmlvLkhJU1RPXG4gICAgQHJvdW5kVmFscyB0b3RhbF9iaW9cblxuICAgIGZpc2hfYmlvID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEJpb21hc3NUb29sYm94JywgJ0Zpc2hBYnVuZGFuY2UnKS50b0FycmF5KClbMF1cbiAgICBhbGxfZmlzaF92YWxzID0gQGdldEFsbFZhbHVlcyBmaXNoX2Jpby5ISVNUT1xuICAgIEByb3VuZFZhbHMgZmlzaF9iaW9cbiAgICAnJydcblxuICAgIGNvcmFsX2NvdW50ID0gQHJlY29yZFNldCgnTW9udHNlcnJhdENvcmFsVG9vbGJveCcsICdDb3JhbCcpLnRvQXJyYXkoKVxuICAgIG5vZ29hbF9jb3JhbF9jb3VudCA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRDb3JhbFRvb2xib3gnLCAnTm9uUmVzZXJ2ZUNvcmFsJykudG9BcnJheSgpXG4gICAgICAgIFxuICAgIEByb3VuZERhdGEgaGFiaXRhdHNcbiAgICBAcm91bmREYXRhIG5vZ29hbF9oYWJpdGF0c1xuXG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cblxuICAgICAgaGFiaXRhdHM6IGhhYml0YXRzXG4gICAgICBub2dvYWxfaGFiaXRhdHM6IG5vZ29hbF9oYWJpdGF0c1xuXG4gICAgICBkM0lzUHJlc2VudDogZDNJc1ByZXNlbnRcbiAgICAgICNoZXJiOiBoZXJiX2Jpb1xuICAgICAgI2Zpc2g6IGZpc2hfYmlvXG4gICAgICAjdG90YWw6IHRvdGFsX2Jpb1xuICAgICAgY29yYWxfY291bnQ6IGNvcmFsX2NvdW50XG4gICAgICBzYW5kZzogc2FuZGdcbiAgICAgIGhhc0QzOiB3aW5kb3cuZDNcbiAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmU6IGhhc0NvbnNlcnZhdGlvblpvbmVcbiAgICAgIGhhc1pvbmVXaXRoR29hbDogaGFzWm9uZVdpdGhHb2FsXG4gICAgICBoYXNab25lV2l0aE5vR29hbDogaGFzWm9uZVdpdGhOb0dvYWxcbiAgICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbiAgICBAcmVuZGVySGlzdG9WYWx1ZXMoc2FuZGcsIGFsbF9zYW5kZ192YWxzLCBcIi5zYW5kZ192aXpcIiwgXCIjNjZjZGFhXCIsXCJBYnVuZGFuY2Ugb2YgSnV2ZW5pbGUgU25hcHBlciBhbmQgR3JvdXBlclwiLCBcIkNvdW50XCIgKVxuICAgICNAcmVuZGVySGlzdG9WYWx1ZXMoaGVyYl9iaW8sIGFsbF9oZXJiX3ZhbHMsIFwiLmhlcmJfdml6XCIsIFwiIzY2Y2RhYVwiLFwiSGVyYml2b3JlIEJpb21hc3MgKGcvbV4yKVwiLCBcIkJpb21hc3MgUGVyIFRyYW5zZWN0XCIpXG4gICAgI0ByZW5kZXJIaXN0b1ZhbHVlcyh0b3RhbF9iaW8sIGFsbF90b3RhbF92YWx1ZXMsIFwiLnRvdGFsX3ZpelwiLCBcIiNmYTgwNzJcIiwgXCJUb3RhbCBCaW9tYXNzIChnL21eMilcIiwgXCJCaW9tYXNzIFBlciBUcmFuc2VjdFwiKVxuICAgICNAcmVuZGVySGlzdG9WYWx1ZXMoZmlzaF9iaW8sIGFsbF9maXNoX3ZhbHMsIFwiLmZpc2hfdml6XCIsIFwiIzY4OTdiYlwiLCBcIlRvdGFsIEZpc2ggQ291bnRcIiwgXCJOdW1iZXIgb2YgRmlzaCBTcGVjaWVzXCIpXG5cbiAgICBAZHJhd0NvcmFsQmFycyhjb3JhbF9jb3VudCwgMClcbiAgICBAZHJhd0NvcmFsQmFycyhub2dvYWxfY29yYWxfY291bnQsIDMpXG5cbiAgZ2V0SGFzWm9uZVdpdGhHb2FsOiAoc2tldGNoZXMpID0+XG4gICAgem9uZXNXaXRoR29hbENvdW50ID0gMFxuICAgIGZvciBza2V0Y2ggaW4gc2tldGNoZXNcbiAgICAgIGZvciBhdHRyIGluIHNrZXRjaC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgICAgaWYgYXR0ci5leHBvcnRpZCA9PSBcIlpPTkVfVFlQRVwiXG4gICAgICAgICAgaWYgKGF0dHIudmFsdWUgPT0gXCJTYW5jdHVhcnlcIiBvciBhdHRyLnZhbHVlID09IFwiTWFyaW5lIFJlc2VydmUgLSBQYXJ0aWFsIFRha2VcIilcbiAgICAgICAgICAgIHpvbmVzV2l0aEdvYWxDb3VudCs9MVxuICAgICAgICAgIFxuICAgIHJldHVybiB6b25lc1dpdGhHb2FsQ291bnQgPiAwXG5cbiAgZ2V0SGFzWm9uZVdpdGhOb0dvYWw6IChza2V0Y2hlcykgPT5cbiAgICB6b25lc1dpdGhOb0dvYWxDb3VudCA9IDBcbiAgICBmb3Igc2tldGNoIGluIHNrZXRjaGVzXG4gICAgICBmb3IgYXR0ciBpbiBza2V0Y2guZ2V0QXR0cmlidXRlcygpXG4gICAgICAgIGlmIGF0dHIuZXhwb3J0aWQgPT0gXCJaT05FX1RZUEVcIlxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiYXR0ciB2YWx1ZTogXCIsIGF0dHIudmFsdWUpXG4gICAgICAgICAgaWYgKGF0dHIudmFsdWUgIT0gXCJTYW5jdHVhcnlcIiBhbmQgYXR0ci52YWx1ZSAhPSBcIk1hcmluZSBSZXNlcnZlIC0gUGFydGlhbCBUYWtlXCIpXG4gICAgICAgICAgICB6b25lc1dpdGhOb0dvYWxDb3VudCs9MVxuXG4gICAgcmV0dXJuIHpvbmVzV2l0aE5vR29hbENvdW50ID4gMFxuXG4gIGdldEhhc0NvbnNlcnZhdGlvblpvbmU6IChza2V0Y2hlcykgPT5cbiAgICBoYXNDb25zZXJ2YXRpb25ab25lID0gZmFsc2VcbiAgICBmb3Igc2tldGNoIGluIHNrZXRjaGVzXG4gICAgICBmb3IgYXR0ciBpbiBza2V0Y2guZ2V0QXR0cmlidXRlcygpXG4gICAgICAgIGlmIGF0dHIuZXhwb3J0aWQgPT0gXCJaT05FX1RZUEVcIlxuICAgICAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmUgPSAoYXR0ci52YWx1ZSA9PSBcIlNhbmN0dWFyeVwiIG9yIGF0dHIudmFsdWUgPT0gXCJNYXJpbmUgUmVzZXJ2ZSAtIFBhcnRpYWwgVGFrZVwiIG9yIGF0dHIudmFsdWUgPT0gXCJNb29yaW5nIEFuY2hvcmFnZSBab25lXCIgb3IgYXR0ci52YWx1ZSA9PSBcIlJlY3JlYXRpb24gWm9uZVwiKVxuICAgICAgICAgIFxuICAgIHJldHVybiBoYXNDb25zZXJ2YXRpb25ab25lXG5cblxuICBkcmF3Q29yYWxCYXJzOiAoY29yYWxfY291bnRzLCBzdGFydF9kZXgpID0+XG4gICAgIyBDaGVjayBpZiBkMyBpcyBwcmVzZW50LiBJZiBub3QsIHdlJ3JlIHByb2JhYmx5IGRlYWxpbmcgd2l0aCBJRVxuXG4gICAgICBpZiB3aW5kb3cuZDNcbiAgICAgICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgICAgIHN1ZmZpeCA9IFwic2tldGNoXCJcbiAgICAgICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICAgICAgc3VmZml4PVwiY29sbGVjdGlvblwiXG4gICAgICAgIGZvciBjb3JhbCBpbiBjb3JhbF9jb3VudHNcbiAgICAgICAgICBcbiAgICAgICAgICBuYW1lID0gY29yYWwuTkFNRVxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoY29yYWwuQ09VTlQpXG4gICAgICAgICAgdG90YWwgPSBwYXJzZUludChjb3JhbC5UT1QpXG4gICAgICAgICAgb3V0c2lkZV9za2V0Y2hfc3RhcnQgPSB0b3RhbCowLjQ4XG5cbiAgICAgICAgICBsYWJlbCA9IGNvdW50K1wiL1wiK3RvdGFsK1wiIG9mIHRoZSBrbm93biBvYnNlcnZhdGlvbnMgYXJlIGZvdW5kIHdpdGhpbiB0aGlzIFwiK3N1ZmZpeFxuICAgICAgICAgIHJhbmdlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZzogXCIjOGU1ZTUwXCJcbiAgICAgICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICAgICAgZW5kOiBjb3VudFxuICAgICAgICAgICAgICBjbGFzczogJ2luLXNrZXRjaCdcbiAgICAgICAgICAgICAgdmFsdWU6IGNvdW50XG4gICAgICAgICAgICAgIG5hbWU6IGxhYmVsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZzogJyNkZGRkZGQnXG4gICAgICAgICAgICAgIHN0YXJ0OiBjb3VudFxuICAgICAgICAgICAgICBlbmQ6IHRvdGFsXG4gICAgICAgICAgICAgIGNsYXNzOiAnb3V0c2lkZS1za2V0Y2gnXG4gICAgICAgICAgICAgIHZhbHVlOiB0b3RhbFxuICAgICAgICAgICAgICBsYWJlbF9zdGFydDogb3V0c2lkZV9za2V0Y2hfc3RhcnRcbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG5cbiAgICAgICAgICBpZiBuYW1lID09IFwiT3JiaWNlbGxhIGFubnVsYXJpc1wiXG4gICAgICAgICAgICBpbmRleCA9IHN0YXJ0X2RleFxuICAgICAgICAgIGVsc2UgaWYgbmFtZSA9PSBcIk9yYmljZWxsYSBmYXZlb2xhdGFcIlxuICAgICAgICAgICAgaW5kZXggPSBzdGFydF9kZXgrMVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGV4ID0gc3RhcnRfZGV4KzJcblxuICAgICAgICAgIEBkcmF3QmFycyhyYW5nZSwgaW5kZXgsIHRvdGFsKVxuXG5cbiAgZHJhd0JhcnM6IChyYW5nZSwgaW5kZXgsIG1heF92YWx1ZSkgPT5cblxuICAgIGVsID0gQCQoJy52aXonKVtpbmRleF1cbiAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oWzAsIG1heF92YWx1ZV0pXG4gICAgICAucmFuZ2UoWzAsIDQwMF0pXG5cbiAgICBjaGFydCA9IGQzLnNlbGVjdChlbClcbiAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgIC5kYXRhKHJhbmdlKVxuICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGQpIC0+IE1hdGgucm91bmQoeChkLmVuZCAtIGQuc3RhcnQpLDApICsgJ3B4JylcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQpIC0+IFwicmFuZ2UgXCIgKyBkLmNsYXNzKVxuICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiI3tkLm5hbWV9XCIpXG4gICAgICAgIC5zdHlsZShcImxlZnRcIiwgKGQpIC0+IGlmIGQubGFiZWxfc3RhcnQgdGhlbiB4KGQubGFiZWxfc3RhcnQpKydweCcgZWxzZSAnJylcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJsYWJlbC1cIitkLmNsYXNzKVxuXG4gIHJlbmRlckhpc3RvVmFsdWVzOiAoYmlvbWFzcywgaGlzdG9fdmFscywgZ3JhcGgsIGNvbG9yLCB4X2F4aXNfbGFiZWwsIGxlZ2VuZF9sYWJlbCkgPT5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIG1lYW4gPSBiaW9tYXNzLlNDT1JFXG4gICAgICBibWluID0gYmlvbWFzcy5NSU5cbiAgICAgIGJtYXggPSBiaW9tYXNzLk1BWFxuXG4gICAgICBsZW4gPSBoaXN0b192YWxzLmxlbmd0aFxuICAgICAgbWF4X2hpc3RvX3ZhbCA9IGhpc3RvX3ZhbHNbbGVuLTFdXG4gICAgICBxdWFudGlsZV9yYW5nZSA9IHtcIlEwXCI6XCJ2ZXJ5IGxvd1wiLCBcIlEyMFwiOiBcImxvd1wiLFwiUTQwXCI6IFwibWlkXCIsXCJRNjBcIjogXCJoaWdoXCIsXCJRODBcIjogXCJ2ZXJ5IGhpZ2hcIn1cbiAgICAgIHFfY29sb3JzID0gW1wiIzQ3YWU0M1wiLCBcIiM2YzBcIiwgXCIjZWUwXCIsIFwiI2ViNFwiLCBcIiNlY2JiODlcIiwgXCIjZWVhYmEwXCJdXG5cblxuICAgICAgbnVtX2JpbnMgPSAxMFxuICAgICAgYmluX3NpemUgPSAxMFxuICAgICAgXG4gICAgICBxdWFudGlsZXMgPSBbXVxuICAgICAgbWF4X2NvdW50X3ZhbCA9IDBcbiAgICAgIG51bV9pbl9iaW5zID0gTWF0aC5jZWlsKGxlbi9udW1fYmlucylcbiAgICAgIGluY3IgPSBtYXhfaGlzdG9fdmFsL251bV9iaW5zXG5cbiAgICAgIGZvciBpIGluIFswLi4ubnVtX2JpbnNdXG4gICAgICAgIFxuICAgICAgICBxX3N0YXJ0ID0gaSpiaW5fc2l6ZVxuICAgICAgICBxX2VuZCA9IHFfc3RhcnQrYmluX3NpemVcbiAgICAgICAgbWluID0gaSppbmNyXG4gICAgICAgIG1heCA9IG1pbitpbmNyXG4gICAgICAgIGNvdW50PTBcblxuICAgICAgICAjVE9ETzogbG9vayBmb3IgYSBtb3JlIGVmZmljaWVudCB3YXkgdG8gZG8gdGhpc1xuICAgICAgICBmb3IgaHYgaW4gaGlzdG9fdmFsc1xuICAgICAgICAgIGlmIGh2ID49IG1pbiBhbmQgaHYgPCBtYXhcbiAgICAgICAgICAgIGNvdW50Kz0xXG5cblxuICAgICAgICBtYXhfY291bnRfdmFsID0gTWF0aC5tYXgoY291bnQsIG1heF9jb3VudF92YWwpXG4gICAgICAgIFxuICAgICAgICB2YWwgPSB7XG4gICAgICAgICAgc3RhcnQ6IHFfc3RhcnRcbiAgICAgICAgICBlbmQ6IHFfZW5kXG4gICAgICAgICAgYmc6IHFfY29sb3JzW01hdGguZmxvb3IoaS8yKV1cbiAgICAgICAgICBiaW5fY291bnQ6IGNvdW50XG4gICAgICAgICAgYmluX21pbjogbWluXG4gICAgICAgICAgYmluX21heDogbWF4XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHF1YW50aWxlcy5wdXNoKHZhbClcblxuICAgIFxuICAgICAgQCQoZ3JhcGgpLmh0bWwoJycpXG4gICAgICBlbCA9IEAkKGdyYXBoKVswXSAgXG5cbiAgICAgICMgSGlzdG9ncmFtXG4gICAgICBtYXJnaW4gPSBcbiAgICAgICAgdG9wOiA0MFxuICAgICAgICByaWdodDogMjBcbiAgICAgICAgYm90dG9tOiA0MFxuICAgICAgICBsZWZ0OiA0NVxuXG4gICAgICB3aWR0aCA9IDQwMCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0XG4gICAgICAjbm90ZTogdXNpbmcgdGhpcyB0byB0cmFuc2xhdGUgdGhlIHggYXhpcyB3YXMgY2F1c2luZyBhIHByb2JsZW0sXG4gICAgICAjc28gaSBqdXN0IGhhcmRjb2RlZCBpdCBmb3Igbm93Li4uXG4gICAgICBoZWlnaHQgPSAzNTAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbVxuICAgICAgXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4X2hpc3RvX3ZhbF0pXG4gICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuXG4gICAgICB5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhfY291bnRfdmFsXSlcblxuICAgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh4KVxuICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG5cbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgbWluX21heF9saW5lX3kgPSBtYXhfY291bnRfdmFsIC0gMjBcbiAgICAgIHN2ZyA9IGQzLnNlbGVjdChAJChncmFwaClbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwyNzApXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIzZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLnRleHQoeF9heGlzX2xhYmVsKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIC5jYWxsKHlBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC00MClcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQobGVnZW5kX2xhYmVsKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuYmFyXCIpXG4gICAgICAgICAgLmRhdGEocXVhbnRpbGVzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhclwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgLT4geChkLmJpbl9taW4pKVxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgKGQpIC0+IHdpZHRoL251bV9iaW5zKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkLmJpbl9jb3VudCkpXG4gICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgKGQpIC0+IGhlaWdodCAtIHkoZC5iaW5fY291bnQpKVxuICAgICAgICAgIC5zdHlsZSAnZmlsbCcsIChkKSAtPiBjb2xvclxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDkpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSA5KSArICdweCcpXG4gICAgICAgIC50ZXh0KFwi4pa8XCIpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVUZXh0XCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDIyICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAyMikgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCJNZWFuOiBcIitkKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWluU2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1pbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDYpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1pbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtaW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWluU2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSAyMSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMTIpICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiTWluOiBcIitkKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWF4U2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1heCldKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDE4KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+ICh4KGQpKyAncHgnKSlcbiAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4gaGVpZ2h0ICsgJ3B4JylcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtYXgpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWF4U2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeCgoZCkpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMTgpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChibWF4KV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1heFNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gMzAgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIk1heDogXCIrZClcblxuICAgICAgXG4gICAgICBpZiBncmFwaCA9PSBcIi5oZXJiX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwiaGVyYi1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+QmlvbWFzcyBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgIGlmIGdyYXBoID09IFwiLmZpc2hfdml6XCJcbiAgICAgICAgQCQoZ3JhcGgpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gY2xhc3M9XCJmaXNoLXN3YXRjaFwiPiZuYnNwOzwvc3Bhbj5GaXNoIENvdW50IGluIFJlZ2lvbjwvZGl2PjxkaXYgY2xhc3M9XCJsZWdlbmQtc2tldGNoLXZhbHVlc1wiPuKWvCBTa2V0Y2ggVmFsdWVzPC9kaXY+PC9kaXY+J1xuICAgICAgaWYgZ3JhcGggPT0gXCIudG90YWxfdml6XCJcbiAgICAgICAgQCQoZ3JhcGgpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gY2xhc3M9XCJ0b3RhbC1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+QmlvbWFzcyBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgICBcbiAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xuXG4gIGdldEFsbFZhbHVlczogKGFsbF9zdHIpID0+XG4gICAgdHJ5XG4gICAgICBhbGxfdmFscyA9IGFsbF9zdHIuc3Vic3RyaW5nKDEsIGFsbF9zdHIubGVuZ3RoIC0gMSlcbiAgICAgIGFsbF92YWxzID0gYWxsX3ZhbHMuc3BsaXQoXCIsIFwiKVxuICAgICAgc29ydGVkX3ZhbHMgPSBfLnNvcnRCeSBhbGxfdmFscywgKGQpIC0+ICBwYXJzZUZsb2F0KGQpXG4gICAgICByZXR1cm4gc29ydGVkX3ZhbHNcbiAgICBjYXRjaCBlXG4gICAgICByZXR1cm4gW11cbiAgICBcbiAgYWRkVGFyZ2V0OiAoZGF0YSkgPT5cbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBpZiBkLkhBQl9UWVBFID09IFwiQXJ0aWZpY2lhbCBSZWVmXCJcbiAgICAgICAgZC5NRUVUU19HT0FMID0gZmFsc2VcbiAgICAgICAgZC5OT19HT0FMID0gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBkLk1FRVRTXzEwX0dPQUwgPSAocGFyc2VGbG9hdChkLlBFUkMpID4gMTAuMClcbiAgICAgICAgZC5NRUVUU18yMF9HT0FMID0gKHBhcnNlRmxvYXQoZC5QRVJDKSA+IDIwLjApXG4gICAgICAgIGQuTUVFVFNfMzBfR09BTCA9IChwYXJzZUZsb2F0KGQuUEVSQykgPiAzMC4wKVxuXG4gIHJvdW5kVmFsczogKGQpID0+ICAgIFxuICAgICAgZC5NRUFOID0gcGFyc2VGbG9hdChkLk1FQU4pLnRvRml4ZWQoMSlcbiAgICAgIGQuTUFYID0gcGFyc2VGbG9hdChkLk1BWCkudG9GaXhlZCgxKVxuICAgICAgZC5NSU4gPSBwYXJzZUZsb2F0KGQuTUlOKS50b0ZpeGVkKDEpXG5cbiAgcm91bmREYXRhOiAoZGF0YSkgPT5cbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBpZiBkLkFSRUFfU1FLTSA8IDAuMSBhbmQgZC5BUkVBX1NRS00gPiAwLjAwMDAxXG4gICAgICAgIGQuQVJFQV9TUUtNID0gXCI8IDAuMSBcIlxuICAgICAgZWxzZVxuICAgICAgICBkLkFSRUFfU1FLTSA9IHBhcnNlRmxvYXQoZC5BUkVBX1NRS00pLnRvRml4ZWQoMSlcblxubW9kdWxlLmV4cG9ydHMgPSBFbnZpcm9ubWVudFRhYiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5kMyA9IHdpbmRvdy5kM1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBPdmVydmlld1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnT3ZlcnZpZXcnXG4gIGNsYXNzTmFtZTogJ292ZXJ2aWV3J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLm92ZXJ2aWV3XG4gIGRlcGVuZGVuY2llczpbIFxuICAgICdTaXplQW5kQ29ubmVjdGl2aXR5J1xuICAgICdEaXZlQW5kRmlzaGluZ1ZhbHVlJ1xuICAgICdEaXN0YW5jZSdcbiAgICAnTWluRGltZW5zaW9uVG9vbGJveCdcbiAgICAnTW9udHNlcnJhdEJpb21hc3NUb29sYm94J1xuXG4gIF1cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgIyBjcmVhdGUgcmFuZG9tIGRhdGEgZm9yIHZpc3VhbGl6YXRpb25cbiAgICBzaXplID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdTaXplJykudG9BcnJheSgpWzBdXG4gICAgXG4gICAgc2l6ZS5QRVJDID0gTnVtYmVyKChwYXJzZUZsb2F0KHNpemUuU0laRV9TUUtNKS8zNDAuMDYpKjEwMC4wKS50b0ZpeGVkKDEpXG4gICAgY29ubmVjdGl2aXR5ID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdDb25uZWN0aXZpdHknKS50b0FycmF5KClcbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcblxuICAgIHRyeVxuICAgICAgZGZ2ID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdGaXNoaW5nVmFsdWUnKS50b0FycmF5KClbMF1cbiAgICAgIGRkdiA9IEByZWNvcmRTZXQoJ0RpdmVBbmRGaXNoaW5nVmFsdWUnLCAnRGl2ZVZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgY2F0Y2ggZXJyXG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yOiBcIixlcnIpXG4gICAgJycnXG4gICAgdHJ5XG4gICAgICBzYXRlc3QgPSBAcmVjb3JkU2V0KCdTQVRlc3RUb29sYm94JywgJ1Jlc3VsdE1zZycpXG4gICAgICBjb25zb2xlLmxvZyhcIi0tPj4gU3BhdGlhbCBBbmFseXN0IFRlc3Qgb24gMTAuNTogXCIsIHNhdGVzdC5kYXRhLnZhbHVlKVxuICAgIGNhdGNoIGVcbiAgICAgIGNvbnNvbGUubG9nKFwiU3BhdGlhbCBBbmFseXN0IDEwLjUgZmFpbGVkXCIsIGUpXG4gICAgXG4gICAgdHJ5XG4gICAgICBzYXRlc3QgPSBAcmVjb3JkU2V0KCdTQVRlc3RUb29sYm94MTAuNCcsICdSZXN1bHRNc2cnKVxuICAgICAgY29uc29sZS5sb2coXCItLT4+IFNwYXRpYWwgQW5hbHlzdCBUZXN0IG9uIDEwLjQ6IFwiLCBzYXRlc3QuZGF0YS52YWx1ZSlcbiAgICBjYXRjaCBlXG4gICAgICBjb25zb2xlLmxvZyhcIlNwYXRpYWwgQW5hbHlzdCAxMC40IGZhaWxlZFwiLCBlKVxuICAgICcnJ1xuICAgIGlmIGRmdlxuICAgICAgaWYgZGZ2LlBFUkNFTlQgPCAwLjAxXG4gICAgICAgIGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlID0gXCI8IDAuMDFcIlxuICAgICAgZWxzZVxuICAgICAgICBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZSA9IHBhcnNlRmxvYXQoZGZ2LlBFUkNFTlQpLnRvRml4ZWQoMilcbiAgICBlbHNlXG4gICAgICBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZSA9IFwidW5rbm93blwiXG5cbiAgICBpZiBkZHZcbiAgICAgIGlmIGRkdi5QRVJDRU5UIDwgMC4wMVxuICAgICAgICBkaXNwbGFjZWRfZGl2ZV92YWx1ZSA9IFwiPCAwLjAxXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWUgPSBwYXJzZUZsb2F0KGRkdi5QRVJDRU5UKS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWUgPSBcInVua25vd25cIlxuXG4gICAgbWluRGlzdEtNID0gQHJlY29yZFNldCgnRGlzdGFuY2UnLCAnRGlzdGFuY2UnKS50b0FycmF5KClbMF1cbiAgICBpZiBtaW5EaXN0S01cbiAgICAgIG1pbkRpc3RLTSA9IHBhcnNlRmxvYXQobWluRGlzdEtNLk1heERpc3QpLnRvRml4ZWQoMilcbiAgICBlbHNlXG4gICAgICBtaW5EaXN0S00gPSBcIlVua25vd25cIlxuXG4gICAgbWluV2lkdGggPSBAcmVjb3JkU2V0KCdNaW5EaW1lbnNpb25Ub29sYm94JywgJ0RpbWVuc2lvbnMnKS50b0FycmF5KClcbiAgICBjb25zb2xlLmxvZyhcIm1pbndpZHRoOiBcIiwgbWluV2lkdGgpXG4gICAgaWYgbWluV2lkdGg/Lmxlbmd0aCA+IDBcblxuICAgICAgaXNDb25zZXJ2YXRpb25ab25lID0gdHJ1ZVxuICAgICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICAgIEBwcm9jZXNzTWluRGltZW5zaW9uIG1pbldpZHRoXG4gICAgICBlbHNlXG4gICAgICAgIG1lZXRzTWluV2lkdGhHb2FsID0gKHBhcnNlRmxvYXQobWluV2lkdGhbMF0uV0lEVEgpID4gMS4wKVxuICAgIGVsc2VcbiAgICAgIGlzQ29uc2VydmF0aW9uWm9uZSA9IGZhbHNlXG4gICAgICBtZWV0c01pbldpZHRoR29hbCA9IGZhbHNlXG5cbiAgICBmaXNocG90cyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdGaXNoUG90JykudG9BcnJheSgpXG4gICAgaWYgZmlzaHBvdHM/Lmxlbmd0aCA+IDBcblxuICAgICAgZmlzaHBvdF9jb3VudCA9IGZpc2hwb3RzWzBdLkNPVU5UXG4gICAgICBmaXNocG90X3RvdGFsID0gZmlzaHBvdHNbMF0uVE9UQUxcbiAgICBlbHNlXG4gICAgICBmaXNocG90X2NvdW50ID0gMFxuICAgICAgZmlzaHBvdF90b3RhbCA9IDE1N1xuXG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIGhhc0QzOiB3aW5kb3cuZDNcbiAgICAgIHNpemU6IHNpemVcbiAgICAgIGNvbm5lY3Rpdml0eTogY29ubmVjdGl2aXR5XG4gICAgICBcbiAgICAgIGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlOiBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZVxuICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWU6IGRpc3BsYWNlZF9kaXZlX3ZhbHVlXG4gICAgXG4gICAgICBtaW5EaXN0S006IG1pbkRpc3RLTVxuICAgICAgaXNDb25zZXJ2YXRpb25ab25lOiBpc0NvbnNlcnZhdGlvblpvbmVcbiAgICAgIG1lZXRzTWluV2lkdGhHb2FsOiBtZWV0c01pbldpZHRoR29hbFxuICAgICAgbWluX2RpbSA6bWluV2lkdGhcblxuICAgICAgZmlzaHBvdF9jb3VudDogZmlzaHBvdF9jb3VudFxuICAgICAgZmlzaHBvdF90b3RhbDogZmlzaHBvdF90b3RhbFxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcbiAgICBAZHJhd0Zpc2hQb3RCYXJzKGZpc2hwb3RfY291bnQsIGZpc2hwb3RfdG90YWwpXG5cblxuICBkcmF3RmlzaFBvdEJhcnM6IChmaXNocG90X2NvdW50LCBmaXNocG90X3RvdGFsKSA9PlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgICBzdWZmaXggPSBcInNrZXRjaFwiXG5cbiAgICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgICBzdWZmaXg9XCJjb2xsZWN0aW9uXCJcblxuICAgICAgY291bnQgPSBmaXNocG90X2NvdW50XG4gICAgICB0b3RhbCA9IGZpc2hwb3RfdG90YWxcbiAgICAgIG91dHNpZGVfc2tldGNoX3N0YXJ0ID0gdG90YWwqMC40OFxuXG4gICAgICBsYWJlbCA9IGNvdW50K1wiL1wiK3RvdGFsK1wiIG9mIHRoZSBmaXNoIHBvdHMgd2l0aGluIE1vbnRzZXJyYXQncyB3YXRlcnMgYXJlIGZvdW5kIHdpdGhpbiB0aGlzIFwiK3N1ZmZpeFxuICAgICAgcmFuZ2UgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBiZzogXCIjOGU1ZTUwXCJcbiAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgIGVuZDogY291bnRcbiAgICAgICAgICBjbGFzczogJ2luLXNrZXRjaCdcbiAgICAgICAgICB2YWx1ZTogY291bnRcbiAgICAgICAgICBuYW1lOiBsYWJlbFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYmc6ICcjZGRkZGRkJ1xuICAgICAgICAgIHN0YXJ0OiBjb3VudFxuICAgICAgICAgIGVuZDogdG90YWxcbiAgICAgICAgICBjbGFzczogJ291dHNpZGUtc2tldGNoJ1xuICAgICAgICAgIHZhbHVlOiB0b3RhbFxuICAgICAgICAgIGxhYmVsX3N0YXJ0OiBvdXRzaWRlX3NrZXRjaF9zdGFydFxuICAgICAgICAgIG5hbWU6ICcnXG4gICAgICAgIH1cbiAgICAgIF1cblxuICAgICAgQGRyYXdCYXJzKHJhbmdlLCB0b3RhbCkgIFxuXG4gIGRyYXdCYXJzOiAocmFuZ2UsIG1heF92YWx1ZSkgPT5cbiAgICBlbCA9IEAkKCcudml6JylbMF1cbiAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oWzAsIG1heF92YWx1ZV0pXG4gICAgICAucmFuZ2UoWzAsIDQwMF0pXG5cbiAgICBjaGFydCA9IGQzLnNlbGVjdChlbClcbiAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgIC5kYXRhKHJhbmdlKVxuICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGQpIC0+IE1hdGgucm91bmQoeChkLmVuZCAtIGQuc3RhcnQpLDApICsgJ3B4JylcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQpIC0+IFwicmFuZ2UgXCIgKyBkLmNsYXNzKVxuICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiI3tkLm5hbWV9XCIpXG4gICAgICAgIC5zdHlsZShcImxlZnRcIiwgKGQpIC0+IGlmIGQubGFiZWxfc3RhcnQgdGhlbiB4KGQubGFiZWxfc3RhcnQpKydweCcgZWxzZSAnJylcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJsYWJlbC1wb3RzLVwiK2QuY2xhc3MpXG5cbiAgcHJvY2Vzc01pbkRpbWVuc2lvbjogKGRhdGEpID0+XG5cbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBpZiBwYXJzZUZsb2F0KGQuV0lEVEgpID4gMS4wXG4gICAgICAgIGQuTUVFVFNfVEhSRVNIID0gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBkLk1FRVRTX1RIUkVTSCA9IGZhbHNlXG5cbm1vZHVsZS5leHBvcnRzID0gT3ZlcnZpZXdUYWIiLCJPdmVydmlld1RhYiA9IHJlcXVpcmUgJy4vb3ZlcnZpZXcuY29mZmVlJ1xuVHJhZGVvZmZzVGFiID0gcmVxdWlyZSAnLi90cmFkZW9mZnMuY29mZmVlJ1xuRW52aXJvbm1lbnRUYWIgPSByZXF1aXJlICcuL2Vudmlyb25tZW50LmNvZmZlZSdcblxud2luZG93LmFwcC5yZWdpc3RlclJlcG9ydCAocmVwb3J0KSAtPlxuICByZXBvcnQudGFicyBbT3ZlcnZpZXdUYWIsIEVudmlyb25tZW50VGFiLCBUcmFkZW9mZnNUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuZDMgPSB3aW5kb3cuZDNcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJ2FwaS90ZW1wbGF0ZXMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBUcmFkZW9mZnNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ1RyYWRlb2ZmcydcbiAgY2xhc3NOYW1lOiAndHJhZGVvZmZzJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLnRyYWRlb2Zmc1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnTW9udHNlcnJhdFRyYWRlb2ZmQW5hbHlzaXMnXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG4gICAgdHJhZGVvZmZfZGF0YSA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRUcmFkZW9mZkFuYWx5c2lzJywgJ1Njb3JlcycpLnRvQXJyYXkoKVxuICAgIEByb3VuZERhdGEgdHJhZGVvZmZfZGF0YVxuXG4gICAgdHJhZGVvZmZzID0gWydGaXNoaW5nIGFuZCBEaXZpbmcnLCAnRmlzaGluZyBhbmQgQ29uc2VydmF0aW9uJywgJ0RpdmluZyBhbmQgQ29uc2VydmF0aW9uJ11cbiAgICBcbiAgICBmaXNoaW5nX3ZhbHMgPSAoaXRlbS5GaXNoaW5nIGZvciBpdGVtIGluIHRyYWRlb2ZmX2RhdGEpXG4gICAgZGl2aW5nX3ZhbHMgPSAoaXRlbS5EaXZpbmcgZm9yIGl0ZW0gaW4gdHJhZGVvZmZfZGF0YSlcbiAgICBjb25zZXJ2YXRpb25fdmFscyA9IChpdGVtLkNvbnNlcnZhdGlvbiBmb3IgaXRlbSBpbiB0cmFkZW9mZl9kYXRhKVxuXG4gICAgZmlzaGluZ19taW4gPSBNYXRoLm1pbiBmaXNoaW5nX3ZhbHNcbiAgICBmaXNoaW5nX21heCA9IE1hdGgubWF4IGZpc2hpbmdfdmFsc1xuXG4gICAgZGl2aW5nX21pbiA9IE1hdGgubWluIGRpdmluZ192YWxzXG4gICAgZGl2aW5nX21heCA9IE1hdGgubWF4IGRpdmluZ192YWxzXG5cbiAgICBjb25zZXJ2YXRpb25fbWluID0gTWF0aC5taW4gY29uc2VydmF0aW9uX3ZhbHNcbiAgICBjb25zZXJ2YXRpb25fbWF4ID0gTWF0aC5tYXggY29uc2VydmF0aW9uX3ZhbHNcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKSAgIFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgdHJhZGVvZmZzOiB0cmFkZW9mZnNcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAJCgnLmNob3NlbicpLmNob3Nlbih7ZGlzYWJsZV9zZWFyY2hfdGhyZXNob2xkOiAxMCwgd2lkdGg6JzM4MHB4J30pXG4gICAgQCQoJy5jaG9zZW4nKS5jaGFuZ2UgKCkgPT5cbiAgICAgIF8uZGVmZXIgQHJlbmRlclRyYWRlb2Zmc1xuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCh0cmFkZW9mZl9kYXRhLCAnLmZpc2hpbmctdi1kaXZpbmcnLCBcIlZhbHVlIG9mIEZpc2hpbmdcIiwgXG4gICAgICAgIFwiVmFsdWUgb2YgRGl2aW5nXCIsIFwiRmlzaGluZ1wiLCBcIkRpdmluZ1wiLCBmaXNoaW5nX21pbiwgZmlzaGluZ19tYXgsIGRpdmluZ19taW4sIGRpdmluZ19tYXgpXG5cbiAgICAgIEBzZXR1cFNjYXR0ZXJQbG90KHRyYWRlb2ZmX2RhdGEsICcuZmlzaGluZy12LWNvbnNlcnZhdGlvbicsIFwiVmFsdWUgb2YgRmlzaGluZ1wiLCBcbiAgICAgICAgXCJWYWx1ZSBvZiBDb25zZXJ2YXRpb25cIiwgXCJGaXNoaW5nXCIsIFwiQ29uc2VydmF0aW9uXCIsIGZpc2hpbmdfbWluLCBmaXNoaW5nX21heCwgY29uc2VydmF0aW9uX21pbiwgY29uc2VydmF0aW9uX21heClcblxuICAgICAgQHNldHVwU2NhdHRlclBsb3QodHJhZGVvZmZfZGF0YSwgJy5kaXZpbmctdi1jb25zZXJ2YXRpb24nLCBcIlZhbHVlIG9mIERpdmluZ1wiLCBcbiAgICAgICAgXCJWYWx1ZSBvZiBDb25zZXJ2YXRpb25cIiwgXCJEaXZpbmdcIiwgXCJDb25zZXJ2YXRpb25cIiwgZGl2aW5nX21pbiwgZGl2aW5nX21heCwgY29uc2VydmF0aW9uX21pbiwgY29uc2VydmF0aW9uX21heClcblxuICBzZXR1cFNjYXR0ZXJQbG90OiAodHJhZGVvZmZfZGF0YSwgY2hhcnRfbmFtZSwgeGxhYiwgeWxhYiwgbW91c2VYUHJvcCwgbW91c2VZUHJvcCwgZmlzaGluZ01pbiwgZmlzaGluZ01heCwgZGl2aW5nTWluLCBkaXZpbmdNYXgpID0+XG4gICAgICBoID0gMzgwXG4gICAgICB3ID0gMzgwXG4gICAgICBtYXJnaW4gPSB7bGVmdDo0MCwgdG9wOjUsIHJpZ2h0OjQwLCBib3R0b206IDQwLCBpbm5lcjo1fVxuICAgICAgaGFsZmggPSAoaCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20pXG4gICAgICB0b3RhbGggPSBoYWxmaCoyXG4gICAgICBoYWxmdyA9ICh3K21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgIHRvdGFsdyA9IGhhbGZ3KjJcblxuICAgICAgI21ha2Ugc3VyZSBpdHMgQHNjYXR0ZXJwbG90IHRvIHBhc3MgaW4gdGhlIHJpZ2h0IGNvbnRleHQgKHRhYikgZm9yIGQzXG4gICAgICB0aGVjaGFydCA9IEBzY2F0dGVycGxvdChjaGFydF9uYW1lLCBtb3VzZVhQcm9wLCBtb3VzZVlQcm9wLCBmaXNoaW5nTWluLCBmaXNoaW5nTWF4LCBkaXZpbmdNaW4sIGRpdmluZ01heCkueHZhcigwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueXZhcigxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueGxhYih4bGFiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueWxhYih5bGFiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGVpZ2h0KGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aWR0aCh3KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFyZ2luKG1hcmdpbilcblxuICAgICAgY2ggPSBkMy5zZWxlY3QoQCQoY2hhcnRfbmFtZSkpXG4gICAgICBjaC5kYXR1bSh0cmFkZW9mZl9kYXRhKVxuICAgICAgICAuY2FsbCh0aGVjaGFydClcbiAgICAgIFxuICAgICAgdG9vbHRpcCA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAuYXR0cihcImlkXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAudGV4dChcImRhdGFcIilcblxuICAgICBcbiAgICAgIHZlcnRpY2FsUnVsZSA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInZlcnRpY2FsUnVsZVwiKVxuICAgICAgICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwiYWJzb2x1dGVcIilcbiAgICAgICAgICAuc3R5bGUoXCJ6LWluZGV4XCIsIFwiMTlcIilcbiAgICAgICAgICAuc3R5bGUoXCJ3aWR0aFwiLCBcIjFweFwiKVxuICAgICAgICAgIC5zdHlsZShcImhlaWdodFwiLCBcIjI1MHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwidG9wXCIsIFwiMTBweFwiKVxuICAgICAgICAgIC5zdHlsZShcImJvdHRvbVwiLCBcIjMwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIFwiMHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiYmFja2dyb3VuZFwiLCBcImJsYWNrXCIpO1xuXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IFxuXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK3dpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZStcIjwvc3Ryb25nPjxsaT5cIit4bGFiK1wiOiBcIitkW21vdXNlWFByb3BdK1wiPC9saT48bGk+IFwiK3lsYWIrXCI6IFwiK2RbbW91c2VZUHJvcF0rXCI8L2xpPjwvdWw+XCIpXG4gICAgICAgIFxuICAgICAgdGhlY2hhcnQucG9pbnRzU2VsZWN0KClcblxuICAgICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IFxuICAgICAgICAgIHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuICAgICAgXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIikuaHRtbChcIjx1bD48c3Ryb25nPlByb3Bvc2FsOiBcIit3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUrXCI8L3N0cm9uZz48bGk+IFwiK3hsYWIrXCI6IFwiK2RbbW91c2VYUHJvcF0rXCI8L2xpPjxsaT4gXCIreWxhYitcIjogXCIrZFttb3VzZVlQcm9wXStcIjwvbGk+PC91bD5cIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cblxuICByZW5kZXJUcmFkZW9mZnM6ICgpID0+XG4gICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcbiAgICBpZiBuYW1lID09IFwiRmlzaGluZyBhbmQgRGl2aW5nXCJcbiAgICAgIEAkKCcuZnZkX2NvbnRhaW5lcicpLnNob3coKVxuICAgICAgQCQoJy5mdmNfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmR2Y19jb250YWluZXInKS5oaWRlKClcbiAgICBlbHNlIGlmIG5hbWUgPT0gXCJGaXNoaW5nIGFuZCBDb25zZXJ2YXRpb25cIlxuICAgICAgQCQoJy5mdmRfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmZ2Y19jb250YWluZXInKS5zaG93KClcbiAgICAgIEAkKCcuZHZjX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgIGVsc2UgaWYgbmFtZSA9PSBcIkRpdmluZyBhbmQgQ29uc2VydmF0aW9uXCJcbiAgICAgIEAkKCcuZnZkX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgICAgQCQoJy5mdmNfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmR2Y19jb250YWluZXInKS5zaG93KClcblxuXG4gIGNhbGNfdHRpcCA9ICh4bG9jLCBkYXRhLCB0b29sdGlwKSAtPlxuICAgIHRkaXYgPSB0b29sdGlwWzBdWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdGxlZnQgPSB0ZGl2LmxlZnRcbiAgICB0dyA9IHRkaXYud2lkdGhcbiAgICByZXR1cm4geGxvYy0odHcrMTApIGlmICh4bG9jK3R3ID4gdGxlZnQrdHcpXG4gICAgcmV0dXJuIHhsb2MrMTBcblxuXG4gIHNjYXR0ZXJwbG90OiAoY2hhcnRfbmFtZSwgeHZhbCwgeXZhbCwgZmlzaGluZ01pbiwgZmlzaGluZ01heCwgZGl2aW5nTWluLCBkaXZpbmdNYXgpID0+XG4gICAgdmlldyA9IEBcbiAgICB3aWR0aCA9IDM4MFxuICAgIGhlaWdodCA9IDYwMFxuICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgYXhpc3BvcyA9IHt4dGl0bGU6MjUsIHl0aXRsZTozMCwgeGxhYmVsOjUsIHlsYWJlbDoxfVxuICAgIHhsaW0gPSBudWxsXG4gICAgeWxpbSA9IG51bGxcbiAgICBueHRpY2tzID0gNVxuICAgIHh0aWNrcyA9IG51bGxcbiAgICBueXRpY2tzID0gNVxuICAgIHl0aWNrcyA9IG51bGxcbiAgICBcbiAgICByZWN0Y29sb3IgPSBcIndoaXRlXCJcbiAgICBwb2ludHNpemUgPSA1ICMgZGVmYXVsdCA9IG5vIHZpc2libGUgcG9pbnRzIGF0IG1hcmtlcnNcbiAgICB4bGFiID0gXCJYXCJcbiAgICB5bGFiID0gXCJZIHNjb3JlXCJcbiAgICB5c2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIHhzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgbGVnZW5kaGVpZ2h0ID0gMzAwXG4gICAgcG9pbnRzU2VsZWN0ID0gbnVsbFxuICAgIGxhYmVsc1NlbGVjdCA9IG51bGxcbiAgICBsZWdlbmRTZWxlY3QgPSBudWxsXG4gICAgdmVydGljYWxSdWxlID0gbnVsbFxuICAgIGhvcml6b250YWxSdWxlID0gbnVsbFxuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICAjY2xlYXIgb3V0IHRoZSBvbGQgdmFsdWVzXG4gICAgICB2aWV3LiQoY2hhcnRfbmFtZSkuaHRtbCgnJylcbiAgICAgIGVsID0gdmlldy4kKGNoYXJ0X25hbWUpWzBdXG5cbiAgICAjIyB0aGUgbWFpbiBmdW5jdGlvblxuICAgIGNoYXJ0ID0gKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5lYWNoIChkYXRhKSAtPlxuICAgICAgICB4ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZFt4dmFsXSlcbiAgICAgICAgeSA9IGRhdGEubWFwIChkKSAtPiBwYXJzZUZsb2F0KGRbeXZhbF0pXG5cbiAgICAgICAgcGFuZWxvZmZzZXQgPSAwXG4gICAgICAgIHBhbmVsd2lkdGggPSB3aWR0aFxuICAgICAgICBwYW5lbGhlaWdodCA9IGhlaWdodFxuXG4gICAgICAgIHhsaW0gPSBbZDMubWluKHgpLTAuMjUsIHBhcnNlRmxvYXQoZDMubWF4KHgpKzAuMjUpXSBpZiAhKHhsaW0/KVxuICAgICAgICB5bGltID0gW2QzLm1pbih5KS0wLjI1LCBwYXJzZUZsb2F0KGQzLm1heCh5KSswLjI1KV0gaWYgISh5bGltPylcblxuICAgICAgICAjIEknbGwgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyBzb21ldGhpbmcgc21hbGxlciB0aGFuIHdoYXQncyBvYnNlcnZlZFxuICAgICAgICBuYV92YWx1ZSA9IGQzLm1pbih4LmNvbmNhdCB5KSAtIDEwMFxuICAgICAgICBjdXJyZWxlbSA9IGQzLnNlbGVjdCh2aWV3LiQoY2hhcnRfbmFtZSlbMF0pXG4gICAgICAgIHN2ZyA9IGQzLnNlbGVjdCh2aWV3LiQoY2hhcnRfbmFtZSlbMF0pLmFwcGVuZChcInN2Z1wiKS5kYXRhKFtkYXRhXSlcbiAgICAgICAgc3ZnLmFwcGVuZChcImdcIilcblxuICAgICAgICAjIFVwZGF0ZSB0aGUgb3V0ZXIgZGltZW5zaW9ucy5cbiAgICAgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20rZGF0YS5sZW5ndGgqMzUpXG4gICAgICAgIGcgPSBzdmcuc2VsZWN0KFwiZ1wiKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgLmF0dHIoXCJ4XCIsIHBhbmVsb2Zmc2V0K21hcmdpbi5sZWZ0KVxuICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCByZWN0Y29sb3IpXG4gICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIm5vbmVcIilcblxuXG4gICAgICAgICMgc2ltcGxlIHNjYWxlcyAoaWdub3JlIE5BIGJ1c2luZXNzKVxuICAgICAgICB4cmFuZ2UgPSBbbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrbWFyZ2luLmlubmVyLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldCtwYW5lbHdpZHRoLW1hcmdpbi5pbm5lcl1cbiAgICAgICAgeXJhbmdlID0gW21hcmdpbi50b3ArcGFuZWxoZWlnaHQtbWFyZ2luLmlubmVyLCBtYXJnaW4udG9wK21hcmdpbi5pbm5lcl1cbiAgICAgICAgeHNjYWxlLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzY2FsZS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuICAgICAgICB4cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcblxuICAgICAgICAjIGlmIHl0aWNrcyBub3QgcHJvdmlkZWQsIHVzZSBueXRpY2tzIHRvIGNob29zZSBwcmV0dHkgb25lc1xuICAgICAgICB5dGlja3MgPSB5cy50aWNrcyhueXRpY2tzKSBpZiAhKHl0aWNrcz8pXG4gICAgICAgIHh0aWNrcyA9IHhzLnRpY2tzKG54dGlja3MpIGlmICEoeHRpY2tzPylcblxuICAgICAgICAjIHgtYXhpc1xuICAgICAgICB4YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgbWFyZ2luLnRvcCtoZWlnaHQpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueGxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHh0aWNrcykoZCkpXG4gICAgICAgIHhheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwieGF4aXMtdGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrd2lkdGgvMilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeGxhYilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4gbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKzYpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGkgJSAxN1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnModmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcblxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmQtdGV4dFwiKVxuXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmdpbi5sZWZ0KzIwKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IHJldHVybiB3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUpXG4gICAgICAgICMgeS1heGlzXG4gICAgICAgIHlheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgbWFyZ2luLmxlZnQrd2lkdGgpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueWxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHl0aWNrcykoZCkpXG4gICAgICAgIHlheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcC04KyhoZWlnaHQvMikpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueXRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHlsYWIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMjcwLCN7bWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGV9LCN7bWFyZ2luLnRvcCtoZWlnaHQvMn0pXCIpXG5cblxuICAgICAgICBsYWJlbHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwibGFiZWxzXCIpXG4gICAgICAgIGxhYmVsc1NlbGVjdCA9XG4gICAgICAgICAgbGFiZWxzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLnRleHQoKGQpLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHhwb3MgPSB4c2NhbGUoeFtpXSlcbiAgICAgICAgICAgICAgICAgIHN0cmluZ19lbmQgPSB4cG9zK3RoaXMuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKClcbiAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0geHBvcy0odGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSs1KVxuICAgICAgICAgICAgICAgICAgaWYgb3ZlcmxhcF94c3RhcnQgPCA1MFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwX3hzdGFydCA9IDUwXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3ZlcmxhcF94c3RhcnQgaWYgc3RyaW5nX2VuZCA+IHdpZHRoXG4gICAgICAgICAgICAgICAgICByZXR1cm4geHBvcys1XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICB5cG9zID0geXNjYWxlKHlbaV0pXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcysxMCBpZiAoeXBvcyA8IDUwKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHlwb3MtNVxuICAgICAgICAgICAgICAgICAgKVxuXG5cbiAgICAgICAgcG9pbnRzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJpZFwiLCBcInBvaW50c1wiKVxuICAgICAgICBwb2ludHNTZWxlY3QgPVxuICAgICAgICAgIHBvaW50cy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiB4c2NhbGUoeFtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiB5c2NhbGUoeVtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKFt2YWxdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxIGlmICh4W2ldPyBvciB4TkEuaGFuZGxlKSBhbmQgKHlbaV0/IG9yIHlOQS5oYW5kbGUpXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMClcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldClcbiAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgICBcblxuICAgICMjIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyc1xuICAgIGNoYXJ0LndpZHRoID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHdpZHRoIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aWR0aCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuaGVpZ2h0ID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGhlaWdodCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgaGVpZ2h0ID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5tYXJnaW4gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbWFyZ2luIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBtYXJnaW4gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmF4aXNwb3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gYXhpc3BvcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgYXhpc3BvcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG54dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG54dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG55dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG55dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucmVjdGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHJlY3Rjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcmVjdGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c2l6ZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHNpemUgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c2l6ZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzdHJva2UgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzdHJva2UgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c3Ryb2tlID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geXNjYWxlXG5cbiAgICBjaGFydC54c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHhzY2FsZVxuXG4gICAgY2hhcnQucG9pbnRzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBwb2ludHNTZWxlY3RcblxuICAgIGNoYXJ0LmxhYmVsc1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGFiZWxzU2VsZWN0XG5cbiAgICBjaGFydC5sZWdlbmRTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxlZ2VuZFNlbGVjdFxuXG4gICAgY2hhcnQudmVydGljYWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB2ZXJ0aWNhbFJ1bGVcblxuICAgIGNoYXJ0Lmhvcml6b250YWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiBob3Jpem9udGFsUnVsZVxuXG4gICAgIyByZXR1cm4gdGhlIGNoYXJ0IGZ1bmN0aW9uXG4gICAgY2hhcnRcblxuICByb3VuZERhdGE6IChkYXRhKSA9PiBcbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBkLkZpc2hpbmcgPSBwYXJzZUZsb2F0KGQuRmlzaGluZykudG9GaXhlZCgyKVxuICAgICAgZC5EaXZpbmcgPSBwYXJzZUZsb2F0KGQuRGl2aW5nKS50b0ZpeGVkKDIpXG5cbiAgZ2V0Q29sb3JzID0gKGkpIC0+XG4gICAgY29sb3JzID0gW1wiTGlnaHRHcmVlblwiLCBcIkxpZ2h0UGlua1wiLCBcIkxpZ2h0U2t5Qmx1ZVwiLCBcIk1vY2Nhc2luXCIsIFwiQmx1ZVZpb2xldFwiLCBcIkdhaW5zYm9yb1wiLCBcIkRhcmtHcmVlblwiLCBcIkRhcmtUdXJxdW9pc2VcIiwgXCJtYXJvb25cIiwgXCJuYXZ5XCIsIFwiTGVtb25DaGlmZm9uXCIsIFwib3JhbmdlXCIsICBcInJlZFwiLCBcInNpbHZlclwiLCBcInRlYWxcIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdXG4gICAgcmV0dXJuIGNvbG9yc1tpXVxuXG4gIGdldFN0cm9rZUNvbG9yID0gKGkpIC0+XG4gICAgc2NvbG9ycyA9IFtcImJsYWNrXCIsIFwid2hpdGVcIiwgXCJncmF5XCIsIFwiYnJvd25cIiwgXCJOYXZ5XCJdXG4gICAgcmV0dXJuIHNjb2xvcnNbaV1cblxuICAjIGZ1bmN0aW9uIHRvIGRldGVybWluZSByb3VuZGluZyBvZiBheGlzIGxhYmVsc1xuICBmb3JtYXRBeGlzID0gKGQpIC0+XG4gICAgZCA9IGRbMV0gLSBkWzBdXG4gICAgbmRpZyA9IE1hdGguZmxvb3IoIE1hdGgubG9nKGQgJSAxMCkgLyBNYXRoLmxvZygxMCkgKVxuICAgIG5kaWcgPSAwIGlmIG5kaWcgPiAwXG4gICAgbmRpZyA9IE1hdGguYWJzKG5kaWcpXG4gICAgZDMuZm9ybWF0KFwiLiN7bmRpZ31mXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVHJhZGVvZmZzVGFiIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImhhc1pvbmVXaXRoR29hbFwiLGMscCwxKSxjLHAsMCwyMCwzNTIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5CZW50aGljIEhhYml0YXRzIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEwNywxMjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImluIE1hcmluZSBSZXNlcnZlc1wiKTt9KTtjLnBvcCgpO31fLmIoXCI8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1ODA3OWRkNWExZWMzNmY1NTk1ZmIyYjBcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSBmb2xsb3dpbmcgdGFibGUgZGVzY3JpYmVzIHRoZSBvdmVybGFwIGJldHdlZW4gXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzI0LDM2OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidGhlIG1hcmluZSByZXNlcnZlIHNrZXRjaGVzIHdpdGhpbiB5b3VyIHBsYW5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ5b3VyIHNrZXRjaFwiKTt9O18uYihcIiBhbmQgdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LiBUaGUgTU5JIDIwMTYgYmVudGhpYyBoYWJpdGF0IG1hcCB3YXMgZGlnaXRpemVkIGJ5IGhhbmQgdXNpbmcgYSBjb21iaW5hdGlvbiBvZiBpbiBzaXR1IG9ic2VydmF0aW9ucyBvbiBzY3ViYS9mcmVlIGRpdmUgYXQgc3VydmV5IHNpdGVzIChuID0gYXBwcm94LiA2MDApIGFuZCBkcm9wIGNhbWVyYSBkZXBsb3ltZW50cyAobiA9IDM0MykgYXMgcGFydCBvZiB0aGUgV2FpdHQgSW5zdGl0dXRlIFNjaWVudGlmaWMgQXNzZXNzbWVudC4gUHJlbGltaW5hcnkgY29udGV4dCBmb3IgbWFwcGluZyB3YXMgZ2xlYW5lZCBmcm9tIGJlbnRoaWMgbWFwcyBkZXBpY3RlZCBpbiBXaWxkIGV0LiBhbCAyMDA3IGFuZCBJUkYgMTk5My4gVGhlc2UgbWFwcyBwcm92aWRlZCB2YWx1YWJsZSBpbnNpZ2h0IGludG8gZG9taW5hbnQgYmVudGhpYyBmZWF0dXJlcyBhbmQgdGhlIGludGVycHJldGF0aW9uIG9mIHNpdGUgb2JzZXJ2YXRpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk1lZXRzIDEwJSBHb2FsPzxzdXA+Kjwvc3VwPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjQwcHg7XFxcIj5NZWV0cyAyMCUgR29hbD88c3VwPio8L3N1cD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDo0MHB4O1xcXCI+TWVldHMgMzAlIEdvYWw/PHN1cD4qPC9zdXA+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjI1cHg7XFxcIj5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXJlYSAoc3EuIGttLik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BcmVhICglIG9mIFRvdGFsKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDE0ODEsMzAxMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfMTBfR09BTFwiLGMscCwxKSxjLHAsMCwxNTUwLDE2MjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfMTBfR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwwLDE3MDcsMTc3NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJuby1nb2FsXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfMjBfR09BTFwiLGMscCwxKSxjLHAsMCwyMDA5LDIwODIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfMjBfR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwwLDIxNjYsMjIzMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJuby1nb2FsXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfMzBfR09BTFwiLGMscCwxKSxjLHAsMCwyNDY4LDI1NDEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfMzBfR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwwLDI2MjUsMjY5MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJuby1nb2FsXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFSRUFfU1FLTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIHN0eWxlPVxcXCJwYWRkaW5nLWxlZnQ6MTBweDt0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDxzdXA+Kjwvc3VwPkluZGljYXRlcyB3aGV0aGVyIHRoZSBzZWxlY3RlZCBNYXJpbmUgUmVzZXJ2ZXMgem9uZXMgaGF2ZSByZWFjaGVkIHRoIGNvbnNlcnZhdGlvbiBnb2FsIG9mIHByZXNlcnZpbmcgMTAvMjAvMzAlIG9mIGVhY2ggaGFiaXRhdC4gQSBncmVlbiBjaGVjayBpbmRpY2F0ZXMgdGhhdCB0aGUgZ29hbCBpcyBtZXQsIHJlZCB4IG1lYW5zIHRoYXQgdGhlIGdvYWwgaXMgbm90IG1ldCwgYW5kIGEgZ3JheSBkYXNoIGluZGljYXRlcyB0aGF0IHRoZXJlIGlzIG5vIGdvYWwgZm9yIHRoYXQgaGFiaXRhdC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNab25lV2l0aE5vR29hbFwiLGMscCwxKSxjLHAsMCwzNTY2LDUwNDIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0PkJlbnRoaWMgSGFiaXRhdHMgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzY1MywzNjc1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJpbiBOb24gTWFyaW5lIFJlc2VydmVzXCIpO30pO2MucG9wKCk7fV8uYihcIjxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4MDc5ZGQ1YTFlYzM2ZjU1OTVmYjJiMFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGZvbGxvd2luZyB0YWJsZSBkZXNjcmliZXMgdGhlIG92ZXJsYXAgb2YgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzg2OSwzOTM1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ0aGUgc2tldGNoZXMgaW4geW91ciBwbGFuIHRoYXQgYXJlIDxiPk5PVDwvYj4gbWFyaW5lIHJlc2VydmVzIHdpdGhcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ5b3VyIHNrZXRjaCBhbmRcIik7fTtfLmIoXCIgdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LiBUaGUgTU5JIDIwMTYgYmVudGhpYyBoYWJpdGF0IG1hcCB3YXMgZGlnaXRpemVkIGJ5IGhhbmQgdXNpbmcgYSBjb21iaW5hdGlvbiBvZiBpbiBzaXR1IG9ic2VydmF0aW9ucyBvbiBzY3ViYS9mcmVlIGRpdmUgYXQgc3VydmV5IHNpdGVzIChuID0gYXBwcm94LiA2MDApIGFuZCBkcm9wIGNhbWVyYSBkZXBsb3ltZW50cyAobiA9IDM0MykgYXMgcGFydCBvZiB0aGUgV2FpdHQgSW5zdGl0dXRlIFNjaWVudGlmaWMgQXNzZXNzbWVudC4gUHJlbGltaW5hcnkgY29udGV4dCBmb3IgbWFwcGluZyB3YXMgZ2xlYW5lZCBmcm9tIGJlbnRoaWMgbWFwcyBkZXBpY3RlZCBpbiBXaWxkIGV0LiBhbCAyMDA3IGFuZCBJUkYgMTk5My4gVGhlc2UgbWFwcyBwcm92aWRlZCB2YWx1YWJsZSBpbnNpZ2h0IGludG8gZG9taW5hbnQgYmVudGhpYyBmZWF0dXJlcyBhbmQgdGhlIGludGVycHJldGF0aW9uIG9mIHNpdGUgb2JzZXJ2YXRpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjIyNXB4O1xcXCI+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFyZWEgKHNxLiBrbS4pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXJlYSAoJSBvZiBUb3RhbCk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibm9nb2FsX2hhYml0YXRzXCIsYyxwLDEpLGMscCwwLDQ4NDAsNDk4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBUkVBX1NRS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1pvbmVXaXRoR29hbFwiLGMscCwxKSxjLHAsMCw1MDg2LDY1MTQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0PklVQ04gTGlzdGVkIENvcmFsIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDUxNzQsNTE5MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiLSBNYXJpbmUgUmVzZXJ2ZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNThlNjcxZmM0YWYyNWQ1OTBiYTRjY2VmXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaHJlZSBJVUNOIGxpc3RlZCBjb3JhbHMgaGF2ZSBiZWVuIG9ic2VydmVkIHdpdGhpbiBNb250c2VycmF0IHdhdGVycy4gVGhlIGZvbGxvd2luZyBncmFwaGljcyBzaG93IHRoZSBudW1iZXIgb2YgdGhlIGtub3duIG9ic2VydmF0aW9ucyB0aGF0IGFyZSBmb3VuZCB3aXRoaW4gdGhlIHNlbGVjdGVkIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDU1MTAsNTU0MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGI+bWFyaW5lIHJlc2VydmU8L2I+IHNrZXRjaGVzIFwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInpvbmVcIik7fTtfLmIoXCIuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNEM1wiLGMscCwxKSxjLHAsMCw1NjI1LDU5NzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxkaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgaWQ9XFxcIm9yYl9hXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPk9yYmljZWxsYSBhbm51bGFyaXMgPC9pPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidml6XFxcIiBpZD1cXFwib3JiX2ZcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxkaXY+PGk+T3JiaWNlbGxhIGZhdmVvbGF0YTwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgaWQ9XFxcImFjcm9cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxkaXY+PGk+QWNyb3BvcmEgcGFsbWF0YTwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDo0MHB4O1xcXCI+TmFtZTxzdXA+Kjwvc3VwPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjIyNXB4O1xcXCI+Q291bnQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPlRvdGFsPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvcmFsX2NvdW50XCIsYyxwLDEpLGMscCwwLDYyOTIsNjQzNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkNPVU5UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJUT1RcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiKTt9O18uYihcIiA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1pvbmVXaXRoTm9Hb2FsXCIsYyxwLDEpLGMscCwwLDY1NTgsNzk5NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+SVVDTiBMaXN0ZWQgQ29yYWwgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNjY0Niw2NjY3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCItIE5vbiBNYXJpbmUgUmVzZXJ2ZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNThlNjcxZmM0YWYyNWQ1OTBiYTRjY2VmXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaHJlZSBJVUNOIGxpc3RlZCBjb3JhbHMgaGF2ZSBiZWVuIG9ic2VydmVkIHdpdGhpbiBNb250c2VycmF0IHdhdGVycy4gVGhlIGZvbGxvd2luZyBncmFwaGljcyBzaG93IHRoZSBudW1iZXIgb2YgdGhlIGtub3duIG9ic2VydmF0aW9ucyB0aGF0IGFyZSBmb3VuZCB3aXRoaW4gdGhlIHNlbGVjdGVkIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDY5ODYsNzAyMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiIDxiPm5vbiBtYXJpbmUgcmVzZXJ2ZTwvYj4gc2tldGNoZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ6b25lXCIpO307Xy5iKFwiLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDAsNzEwNSw3NDU0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJvcmJfYVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPGRpdj48aT5PcmJpY2VsbGEgYW5udWxhcmlzIDwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgaWQ9XFxcIm9yYl9mXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPk9yYmljZWxsYSBmYXZlb2xhdGE8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJhY3JvXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPkFjcm9wb3JhIHBhbG1hdGE8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc0QzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk5hbWU8c3VwPio8L3N1cD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyMjVweDtcXFwiPkNvdW50PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjb3JhbF9jb3VudFwiLGMscCwxKSxjLHAsMCw3NzcyLDc5MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVE9UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5OdXJzZXJ5IEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhlc2UgY2hhcnRzIHNob3cgdGhlIG1pbmltdW0sIG1lYW4gYW5kIG1heGltdW0gYWJ1bmRhbmNlIG1lYXN1cmVtZW50cyBvZiBudXJzZXJ5IGFyZWFzIHRoYXQgd2VyZSB0YWtlbiB3aXRoaW4geW91ciBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw4MjIzLDgyMzMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ6b25lXCIpO307Xy5iKFwiLCBpbiByZWxhdGlvbiB0byB0aGUgZGlzdHJpYnV0aW9uIG9mIGFidW5kYW5jZSB3aXRoaW4gTW9udHNlcnJhdCB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMCw4Mzg5LDg1MDEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPk51cnNlcnkgQXJlYXM8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJzYW5kZ192aXpcXFwiIGNsYXNzPVxcXCJzYW5kZ192aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyNTBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NaW5pbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWF4aW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5kZ1wiLGMscCwxKSxjLHAsMCw4Nzk3LDg5OTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5OdXJzZXJ5IEFyZWFzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJzYW5kZy5TQ09SRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwic2FuZGcuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJzYW5kZy5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGg0PkZpc2ggQmlvbWFzczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGVzZSBjaGFydHMgc2hvdyB0aGUgbWluaW11bSwgbWVhbiBhbmQgbWF4aW11bSBmaXNoIGJpb21hc3MgdmFsdWUgdGFrZW4gd2l0aGluIHlvdXIgc2tldGNoZWQgem9uZSwgaW4gcmVsYXRpb24gdG8gdGhlIGRpc3RyaWJ1dGlvbiBvZiBiaW9tYXNzIG1lYXN1cmVkIGFyb3VuZCB0aGUgaXNsYW5kLiBCaW9tYXNzIHdhcyBjYWxjdWxhdGVkIGZvciBIZXJiaXZvcmVzIGFuZCBBbGwgU3BlY2llcyBhdCByZWd1bGFyIHBvaW50cyBhbG9uZyBNb250c2VycmF0J3MgY29hc3QuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwwLDk0NTAsOTY4NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5IZXJiaXZvcmUgQmlvbWFzczwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBpZD1cXFwiaGVyYl92aXpcXFwiIGNsYXNzPVxcXCJoZXJiX3ZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5BbGwgU3BlY2llcyBCaW9tYXNzPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGlkPVxcXCJ0b3RhbF92aXpcXFwiIGNsYXNzPVxcXCJ0b3RhbF92aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjI1MHB4O1xcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5NZWFuPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5NaW5pbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5NYXhpbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhlcmJcIixjLHAsMSksYyxwLDAsMTAwMDYsMTAyMTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+SGVyYml2b3JlczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImhlcmIuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImhlcmIuTUFYXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwidG90YWxcIixjLHAsMSksYyxwLDAsMTAyNDIsMTA0NDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+VG90YWxzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInRvdGFsLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInRvdGFsLk1JTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJ0b3RhbC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8aDQ+RmlzaCBBYnVuZGFuY2U8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlc2UgY2hhcnRzIHNob3cgdGhlIG1pbmltdW0sIG1lYW4gYW5kIG1heGltdW0gZmlzaCBhYnVuZGFuY2UgdmFsdWUgdGFrZW4gd2l0aGluIHlvdXIgc2tldGNoZWQgem9uZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDAsMTA3MzksMTA3OTcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPGRpdiBpZD1cXFwiZmlzaF92aXpcXFwiIGNsYXNzPVxcXCJmaXNoX3ZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjUwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPk1pbmltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPk1heGltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaFwiLGMscCwxKSxjLHAsMCwxMTExNiwxMTMyMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5IZXJiaXZvcmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImZpc2guU0NPUkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiZmlzaC5NSU5cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiZmlzaC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAtLT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDc2LDg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZChcInNpemUuU0laRV9TUUtNXCIsYyxwLDApKSk7Xy5iKFwiIHNxLiBrbTwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmQoXCJzaXplLlBFUkNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXN0YW5jZSBmcm9tIFBvcnQgTGl0dGxlIEJheTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGZhcnRoZXN0IHBvaW50IGluIHRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw0NDQsNDU0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1pbkRpc3RLTVwiLGMscCwwKSkpO18uYihcIiBrbTwvc3Ryb25nPiAob3ZlciB3YXRlcikgZnJvbSB0aGUgUG9ydCBMaXR0bGUgQmF5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1N2UyYzMzYmViMjc1YmJhMWVjNmZkNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGVhdG1hcCBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw3ODMsNzkzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoXCIpO307Xy5iKFwiIG92ZXJsYXBzIHdpdGggYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZmlzaGluZyB2YWx1ZSB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGl2ZSBWYWx1ZTxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU3ZTJjMzAyZWIyNzViYmExZWM2ZmQzZFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoZWF0bWFwIGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEyMjgsMTIzOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaFwiKTt9O18uYihcIiBvdmVybGFwcyB3aXRoIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJkaXNwbGFjZWRfZGl2ZV92YWx1ZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIHRvdGFsIGRpdmUgdmFsdWUgd2l0aGluIE1vbnRzZXJyYXQncyB3YXRlcnMsIGJhc2VkIG9uIHRoZSB1c2VyIHJlcG9ydGVkIHZhbHVlIG9mIGRpdmUgc2l0ZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGg0PkZpc2ggUG90cyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1OGVkN2NiNTRhZjI1ZDU5MGJhNGZjM2NcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDAsMTYzMiwxNzQ0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGRpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJmaXNoX3BvdHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdj48aT5GaXNoIFBvdHM8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJoYXNEM1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjI1cHg7XFxcIj5Db3VudDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiZmlzaHBvdF9jb3VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJmaXNocG90X3RvdGFsXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJpc0NvbnNlcnZhdGlvblpvbmVcIixjLHAsMSksYyxwLDAsMjEzMSwyNzYwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGg0Pk1pbmltdW0gU2l6ZSBHb2FsPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IHN0eWxlPVxcXCJwYWRkaW5nLWxlZnQ6MTBweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1lZXRzTWluV2lkdGhHb2FsXCIsYyxwLDEpLGMscCwwLDIyNjUsMjMyMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImJpZy1ncmVlbi1jaGVja1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm1lZXRzTWluV2lkdGhHb2FsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcImJpZy1yZWQteFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgPGRpdiBzdHlsZT1cXFwiZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtmb250LXNpemU6MS4xZW1cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICBUaGlzIHpvbmUgPGI+XCIpO2lmKF8ucyhfLmYoXCJtZWV0c01pbldpZHRoR29hbFwiLGMscCwxKSxjLHAsMCwyNTYwLDI1NjYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiBtZWV0c1wiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIm1lZXRzTWluV2lkdGhHb2FsXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiZG9lcyBub3QgbWVldFwiKTt9O18uYihcIjwvYj4gdGhlIGNvbnNlcnZhdGlvbiBnb2FsIG9mIGhhdmluZyBhIG1pbmltdW0gd2lkdGggb2YgPGI+YXQgbGVhc3QgMWttPC9iPi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9fTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDI4MTksNDM1NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8aDQ+TWluaW11bSBTaXplIEdvYWw8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgTWFyaW5lIFJlc2VydmUgWm9uZXMgc2hvdWxkIGhhdmUgYSBtaW5pbXVtIHdpZHRoIG9mIGF0IGxlYXN0IDEga2lsb21ldGVyIHRvIG1lZXQgY29uc2VydmF0aW9uIGdvYWxzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQgc3R5bGU9XFxcIndpZHRoOjYwcHg7dGV4dC1hbGlnbjpjZW50ZXI7XFxcIj5NZWV0cyAxa20gR29hbD88L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5ab25lIE5hbWU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWluX2RpbVwiLGMscCwxKSxjLHAsMCwzMjUwLDM2MzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfVEhSRVNIXCIsYyxwLDEpLGMscCwwLDMzMjAsMzM5MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtZ3JlZW4tY2hlY2tcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJNRUVUU19USFJFU0hcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzbWFsbC1yZWQteFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cXFwidGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uIHRhYmxlQ29udGFpbmVyXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8aDQ+Q29ubmVjdGl2aXR5PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+Wm9uZSBOYW1lPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+RGlzdGFuY2UgdG8gTmVhcmVzdCBab25lIChrbSk8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5OZWFyZXN0IFpvbmUgTmFtZTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjb25uZWN0aXZpdHlcIixjLHAsMSksYyxwLDAsMzk4OCw0MTM4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiRElTVF9LTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkVBUl9OQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxlbT5Ob3RlOjwvZW0+IFRoZSBjb25uZWN0aXZpdHkgYW5hbHl0aWMgaGFzIGJlZW4gZGV2ZWxvcGVkIGZvciBkZW1vbnN0cmF0aW9uIHB1cnBvc2VzLCBhbmQgZG9lcyBub3QgYWNjb3VudCBmb3IgdGhlIGxlYXN0IGNvc3QgcGF0aCBhcm91bmQgbGFuZC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1widHJhZGVvZmZzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+VHJhZGVvZmZzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDcwLDEwODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgXHQ8cCBzdHlsZT1cXFwibWFyZ2luLWxlZnQ6MThweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDxlbT5UcmFkZW9mZiBhbmFseXNpcyBpcyBjdXJyZW50bHkgaW4gZGV2ZWxvcG1lbnQsIGFuZCBzaG91bGQgYmUgdXNlZCBmb3IgZGVtb25zdHJhdGlvbiBwdXJwb3NlcyBvbmx5LiBUaGVzZSBhbmFseXRpY3Mgd2lsbCBhbGxvdyB1c2VycyB0byBwbG90IG11bHRpcGxlIHBsYW4gb3B0aW9ucyBhZ2FpbnN0IGVhY2ggb3RoZXIgaW4gdGVybXMgb2YgdGhlaXIgaW1wYWN0IG9uIGZpc2hpbmcsIGRpdmUgYW5kIGNvbnNlcnZhdGlvbiB2YWx1ZSBmb3IgTW9udHNlcnJhdC48L2VtPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjE4cHg7bWFyZ2luLWJvdHRvbToxNXB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdCAgXHQ8c3Bhbj5TZWxlY3QgYSBTZXQgb2YgVHJhZGVvZmYgU2NvcmVzIHRvIFZpZXc6PC9zcGFuPjwvYnI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHRcdDxzZWxlY3QgY2xhc3M9XFxcImNob3NlblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInRyYWRlb2Zmc1wiLGMscCwxKSxjLHAsMCw1NDksNjc0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgIDxvcHRpb24gY2xhc3M9XFxcIlwiKTtfLmIoXy52KF8uZChcIi4gPT0gXFxcIkZpc2hpbmcgYW5kIERpdmluZ1xcXCIgPyAnZGVmYXVsdC1jaG9zZW4tc2VsZWN0aW9uJyA6ICcnXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiAgdmFsdWU9XFxcIlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXy52KF8uZChcIi5cIixjLHAsMCkpKTtfLmIoXCI8L29wdGlvbj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlx0XHQ8L3NlbGVjdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2IGlkPVxcXCJmdmRfY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiZnZkX2NvbnRhaW5lclxcXCI+PGRpdiAgaWQ9XFxcImZpc2hpbmctdi1kaXZpbmdcXFwiIGNsYXNzPVxcXCJmaXNoaW5nLXYtZGl2aW5nXFxcIj48L2Rpdj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBpZD1cXFwiZnZjX2NvbnRhaW5lclxcXCIgY2xhc3M9XFxcImZ2Y19jb250YWluZXJcXFwiPjxkaXYgIGlkPVxcXCJmaXNoaW5nLXYtY29uc2VydmF0aW9uXFxcIiBjbGFzcz1cXFwiZmlzaGluZy12LWNvbnNlcnZhdGlvblxcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgaWQ9XFxcImR2Y19jb250YWluZXJcXFwiIGNsYXNzPVxcXCJkdmNfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwiZGl2aW5nLXYtY29uc2VydmF0aW9uXFxcIiBjbGFzcz1cXFwiZGl2aW5nLXYtY29uc2VydmF0aW9uXFxcIj48L2Rpdj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICBcdCAgXHQ8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHRcdDxpPk5vIHRyYWRlb2ZmIGFuYWx5c2lzIGF2YWlsYWJsZSBmb3IgaW5kaXZpZHVhbCB6b25lcy48L2k+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0PC9wPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSJdfQ==
;