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


},{}],4:[function(require,module,exports){
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


},{}],"a21iR2":[function(require,module,exports){
var CollectionView, JobItem, RecordSet, ReportResults, ReportTab, enableLayerTogglers, round, t, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

enableLayerTogglers = require('./enableLayerTogglers.coffee');

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
      console.log(this.data);
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
    window.clearInterval(this.etaInterval);
    this.stopListening();
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

  ReportTab.prototype.getChildren = function(sketchClassId) {
    return _.filter(this.children, function(child) {
      return child.getSketchClass().id === sketchClassId;
    });
  };

  return ReportTab;

})(Backbone.View);

module.exports = ReportTab;


},{"../templates/templates.js":"CNqB+b","./enableLayerTogglers.coffee":2,"./jobItem.coffee":3,"./reportResults.coffee":4,"./utils.coffee":"+VosKh","views/collectionView":1}],"reportTab":[function(require,module,exports){
module.exports=require('a21iR2');
},{}],"api/utils":[function(require,module,exports){
module.exports=require('+VosKh');
},{}],"+VosKh":[function(require,module,exports){
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


},{}],"CNqB+b":[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributeItem"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<tr data-attribute-id=\"");_.b(_.v(_.f("id",c,p,0)));_.b("\" data-attribute-exportid=\"");_.b(_.v(_.f("exportid",c,p,0)));_.b("\" data-attribute-type=\"");_.b(_.v(_.f("type",c,p,0)));_.b("\">");_.b("\n" + i);_.b("  <td class=\"name\">");_.b(_.v(_.f("name",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("  <td class=\"value\">");_.b(_.v(_.f("formattedValue",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("</tr>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/attributes/attributesTable"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<table class=\"attributes\">");_.b("\n" + i);if(_.s(_.f("attributes",c,p,1),c,p,0,44,123,"{{ }}")){_.rs(c,p,function(c,p,_){if(!_.s(_.f("doNotExport",c,p,1),c,p,1,0,0,"")){_.b(_.rp("attributes/attributeItem",c,p,"    "));};});c.pop();}_.b("</table>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/genericAttributes"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.d("sketchClass.deleted",c,p,1),c,p,0,24,270,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"alert alert-warn\" style=\"margin-bottom:10px;\">");_.b("\n" + i);_.b("  This sketch was created using the \"");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b("\" template, which is");_.b("\n" + i);_.b("  no longer available. You will not be able to copy this sketch or make new");_.b("\n" + i);_.b("  sketches of this type.");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>");_.b(_.v(_.d("sketchClass.name",c,p,0)));_.b(" Attributes</h4>");_.b("\n" + i);_.b(_.rp("attributes/attributesTable",c,p,"    "));_.b("  </table>");_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});
this["Templates"]["node_modules/seasketch-reporting-api/reportLoading"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("<div class=\"reportLoading\">");_.b("\n" + i);_.b("  <!-- <div class=\"spinner\">3</div> -->");_.b("\n" + i);_.b("  <h4>Requesting Report from Server</h4>");_.b("\n" + i);_.b("  <div class=\"progress progress-striped active\">");_.b("\n" + i);_.b("    <div class=\"bar\" style=\"width: 100%;\"></div>");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("  <a href=\"#\" rel=\"details\">details</a>");_.b("\n" + i);_.b("    <div class=\"details\">");_.b("\n" + i);_.b("  </div>");_.b("\n" + i);_.b("\n" + i);_.b("</div>");_.b("\n");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}],"api/templates":[function(require,module,exports){
module.exports=require('CNqB+b');
},{}],11:[function(require,module,exports){
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
    this.drawFishPotBars = __bind(this.drawFishPotBars, this);
    this.getHasConservationZone = __bind(this.getHasConservationZone, this);
    this.getHasZoneWithGoal = __bind(this.getHasZoneWithGoal, this);
    _ref = EnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EnvironmentTab.prototype.name = 'Environment';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.template = templates.environment;

  EnvironmentTab.prototype.dependencies = ['MontserratHabitatToolbox', 'MontserratBiomassToolbox', 'MontserratCoralToolbox', 'MontserratSnapAndGroupToolbox'];

  EnvironmentTab.prototype.render = function() {
    var all_fish_vals, all_herb_vals, all_sandg_vals, all_total_values, context, coral_count, d3IsPresent, fish, fish_bio, fishpot_count, fishpot_total, fishpots, habitats, hasConservationZone, hasZoneWithGoal, herb, herb_bio, isCollection, sandg, total, total_bio, _ref1;
    isCollection = this.model.isCollection();
    d3IsPresent = (_ref1 = window.d3) != null ? _ref1 : {
      "true": false
    };
    if (isCollection) {
      hasConservationZone = this.getHasConservationZone(this.model.getChildren());
      hasZoneWithGoal = this.getHasZoneWithGoal(this.model.getChildren());
    } else {
      hasConservationZone = true;
      hasZoneWithGoal = this.getHasZoneWithGoal([this.model]);
    }
    if (hasConservationZone) {
      habitats = this.recordSet('MontserratHabitatToolbox', 'Habitats').toArray();
      habitats = _.sortBy(habitats, function(h) {
        return parseFloat(h.PERC);
      });
      habitats = habitats.reverse();
      this.addTarget(habitats);
      sandg = this.recordSet('MontserratSnapAndGroupToolbox', 'SnapAndGroup').toArray()[0];
      all_sandg_vals = this.getAllValues(sandg.HISTO);
      herb_bio = this.recordSet('MontserratBiomassToolbox', 'HerbivoreBiomass').toArray()[0];
      all_herb_vals = this.getAllValues(herb_bio.HISTO);
      this.roundVals(herb_bio);
      total_bio = this.recordSet('MontserratBiomassToolbox', 'TotalBiomass').toArray()[0];
      all_total_values = this.getAllValues(total_bio.HISTO);
      this.roundVals(total_bio);
      fish_bio = this.recordSet('MontserratBiomassToolbox', 'FishAbundance').toArray()[0];
      all_fish_vals = this.getAllValues(fish_bio.HISTO);
      this.roundVals(fish_bio);
      coral_count = this.recordSet('MontserratCoralToolbox', 'Coral').toArray();
      fishpots = this.recordSet('MontserratBiomassToolbox', 'FishPot').toArray();
      if ((fishpots != null ? fishpots.length : void 0) > 0) {
        fishpot_count = fishpots[0].COUNT;
        fishpot_total = fishpots[0].TOTAL;
      } else {
        fishpot_count = 0;
        fishpot_total = 157;
      }
      this.roundData(habitats);
    } else {
      habitats = [];
      sandg = [];
      herb = [];
      fish = [];
      total = [];
    }
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      habitats: habitats,
      d3IsPresent: d3IsPresent,
      herb: herb_bio,
      fish: fish_bio,
      total: total_bio,
      coral_count: coral_count,
      sandg: sandg,
      hasD3: window.d3,
      hasConservationZone: hasConservationZone,
      hasZoneWithGoal: hasZoneWithGoal,
      fishpot_count: fishpot_count,
      fishpot_total: fishpot_total
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    if (hasConservationZone) {
      this.renderHistoValues(sandg, all_sandg_vals, ".sandg_viz", "#66cdaa", "Abundance of Juvenile Snapper and Grouper", "Count");
      this.renderHistoValues(herb_bio, all_herb_vals, ".herb_viz", "#66cdaa", "Herbivore Biomass (g/m^2)", "Biomass Per Transect");
      this.renderHistoValues(total_bio, all_total_values, ".total_viz", "#fa8072", "Total Biomass (g/m^2)", "Biomass Per Transect");
      this.renderHistoValues(fish_bio, all_fish_vals, ".fish_viz", "#6897bb", "Total Fish Count", "Number of Fish Species");
      this.drawCoralBars(coral_count);
      return this.drawFishPotBars(fishpot_count, fishpot_total);
    }
  };

  EnvironmentTab.prototype.getHasZoneWithGoal = function(sketches) {
    var attr, hasZoneWithGoal, sketch, _i, _j, _len, _len1, _ref1;
    hasZoneWithGoal = false;
    for (_i = 0, _len = sketches.length; _i < _len; _i++) {
      sketch = sketches[_i];
      _ref1 = sketch.getAttributes();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        if (attr.exportid === "ZONE_TYPE") {
          hasZoneWithGoal = attr.value === "Sanctuary" || attr.value === "Marine Reserve - Partial Take";
        }
      }
    }
    return hasZoneWithGoal;
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

  EnvironmentTab.prototype.drawFishPotBars = function(fishpot_count, fishpot_total) {
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
      return this.drawBars(range, 3, total);
    }
  };

  EnvironmentTab.prototype.drawCoralBars = function(coral_counts) {
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
        console.log("coral", coral);
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
          index = 0;
        } else if (name === "Orbicella faveolata") {
          index = 1;
        } else {
          index = 2;
        }
        _results.push(this.drawBars(range, index, total));
      }
      return _results;
    }
  };

  EnvironmentTab.prototype.drawBars = function(range, index, max_value) {
    var chart, el, x;
    console.log("max value ---->>>> ", max_value);
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
        _results.push(d.MEETS_GOAL = parseFloat(d.PERC) > 30.0);
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":15,"reportTab":"a21iR2"}],12:[function(require,module,exports){
var OverviewTab, ReportTab, d3, templates, _ref,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    this.processMinDimension = __bind(this.processMinDimension, this);
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['SizeAndConnectivity', 'DiveAndFishingValue', 'Distance', 'MinDimensionToolbox'];

  OverviewTab.prototype.render = function() {
    var connectivity, context, ddv, dfv, displaced_dive_value, displaced_fishing_value, isCollection, isConservationZone, meetsMinWidthGoal, minDistKM, minWidth, size;
    size = this.recordSet('SizeAndConnectivity', 'Size').toArray()[0];
    size.PERC = Number((parseFloat(size.SIZE_SQKM) / 338.197) * 100.0).toFixed(1);
    connectivity = this.recordSet('SizeAndConnectivity', 'Connectivity').toArray();
    isCollection = this.model.isCollection();
    dfv = this.recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0];
    ddv = this.recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0];
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
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      size: size,
      connectivity: connectivity,
      displaced_fishing_value: displaced_fishing_value,
      displaced_dive_value: displaced_dive_value,
      minDistKM: minDistKM,
      isConservationZone: isConservationZone,
      meetsMinWidthGoal: meetsMinWidthGoal,
      min_dim: minWidth
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers();
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


},{"../templates/templates.js":15,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var EnvironmentTab, OverviewTab, TradeoffsTab;

OverviewTab = require('./overview.coffee');

TradeoffsTab = require('./tradeoffs.coffee');

EnvironmentTab = require('./environment.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab, TradeoffsTab]);
  return report.stylesheets(['./report.css']);
});


},{"./environment.coffee":11,"./overview.coffee":12,"./tradeoffs.coffee":14}],14:[function(require,module,exports){
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


},{"../templates/templates.js":15,"api/templates":"CNqB+b","reportTab":"a21iR2"}],15:[function(require,module,exports){
this["Templates"] = this["Templates"] || {};
this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasConservationZone",c,p,1),c,p,0,26,7748,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Benthic Habitats <a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The following table describes the overlap of your plan with the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right. The MNI 2016 benthic habitat map was digitized by hand using a combination of in situ observations on scuba/free dive at survey sites (n = approx. 600) and drop camera deployments (n = 343) as part of the Waitt Institute Scientific Assessment. Preliminary context for mapping was gleaned from benthic maps depicted in Wild et. al 2007 and IRF 1993. These maps provided valuable insight into dominant benthic features and the interpretation of site observations. ");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,938,1022,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <th style=\"width:40px;\">Meets 30% Goal?<sup>*</sup></th>");_.b("\n");});c.pop();}_.b("            <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("            <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("            <th>Area (% of Total)</th>");_.b("\n" + i);_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,1241,1895,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,1289,1749,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_GOAL",c,p,1),c,p,0,1340,1413,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,1491,1558,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n");});c.pop();}_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,1954,2416,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tfoot>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("\n" + i);_.b("            <td colspan=\"4\" style=\"padding-left:10px;text-align:left;\">");_.b("\n" + i);_.b("              <sup>*</sup>Indicates whether the selected Marine Reserves zones have reached th conservation goal of preserving 30% of each habitat. A green check indicates that the goal is met, red x means that the goal is not met, and a gray dash indicates that there is no goal for that habitat.");_.b("\n" + i);_.b("            </td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tfoot>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Presence of IUCN Listed Coral Species <a href=\"#\" data-toggle-node=\"58e671fc4af25d590ba4ccef\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Three IUCN listed corals have been observed within Montserrat waters. The following graphics show the number of the known observations that are found within the selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,2852,2871,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection of zones");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(".");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,2955,3304,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_a\">");_.b("\n" + i);_.b("            <div><i>Orbicella annularis </i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_f\">");_.b("\n" + i);_.b("            <div><i>Orbicella faveolata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"acro\">");_.b("\n" + i);_.b("            <div><i>Acropora palmata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Name<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("              <th>Total</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("coral_count",c,p,1),c,p,0,3622,3766,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Fish Pots <a href=\"#\" data-toggle-node=\"58ed7cb54af25d590ba4fc3c\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,4016,4140,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("        <div class=\"viz\" id=\"fish_pots\">");_.b("\n" + i);_.b("          <div><i>Fish Pots</i></div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("fishpot_count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("fishpot_total",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Nursery Areas</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum abundance measurements of nursery areas that were taken within your ");if(_.s(_.f("isCollection",c,p,1),c,p,0,4720,4730,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(", in relation to the distribution of abundance within Montserrat waters.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,4886,4998,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div class=\"in-report-header\">Nursery Areas</div>");_.b("\n" + i);_.b("      <div id=\"sandg_viz\" class=\"sandg_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("sandg",c,p,1),c,p,0,5294,5490,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Nursery Areas</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Fish Biomass</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum fish biomass value taken within your sketched zone, in relation to the distribution of biomass measured around the island. Biomass was calculated for Herbivores and All Species at regular points along Montserrat's coast.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,5931,6158,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div class=\"in-report-header\">Herbivore Biomass</div>");_.b("\n" + i);_.b("      <div id=\"herb_viz\" class=\"herb_viz\"></div>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">All Species Biomass</div>");_.b("\n" + i);_.b("      <div id=\"total_viz\" class=\"total_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("herb",c,p,1),c,p,0,6453,6643,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Herbivores</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}if(_.s(_.f("total",c,p,1),c,p,0,6673,6862,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Totals</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Fish Abundance</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum fish abundance value taken within your sketched zone.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,7136,7190,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div id=\"fish_viz\" class=\"fish_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fish",c,p,1),c,p,0,7485,7675,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Herbivores</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasConservationZone",c,p,1),c,p,1,0,0,"")){_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>No Marine Reserves </h4>");_.b("\n" + i);_.b("      <p style=\"font-size:1.2em\">");_.b("\n" + i);_.b("        <em>The environment tab reports are only applicable to <b>Marine Reserves</b> zone types.</em>");_.b("\n" + i);_.b("        ");if(_.s(_.f("isCollection",c,p,1),c,p,0,8022,8075,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" This collection does not include any of these zones.");});c.pop();}_.b("\n" + i);_.b("      </p>");_.b("\n");};return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,76,86,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.d("size.SIZE_SQKM",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.d("size.PERC",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance from Port Little Bay</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The farthest point in the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,444,454,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.f("minDistKM",c,p,0)));_.b(" km</strong> (over water) from the Port Little Bay.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value<a href=\"#\" data-toggle-node=\"57e2c33beb275bba1ec6fd46\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,783,793,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Montserrat's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Dive Value<a href=\"#\" data-toggle-node=\"57e2c302eb275bba1ec6fd3d\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1228,1238,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Montserrat's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("isConservationZone",c,p,1),c,p,0,1524,2153,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <div style=\"padding-left:10px\">");_.b("\n" + i);if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,1658,1713,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"big-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("          <div class=\"big-red-x\"></div>");_.b("\n");};_.b("        <div style=\"display:inline;padding-left:5px;font-size:1.1em\">");_.b("\n" + i);_.b("          This zone <b>");if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,1953,1959,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" meets");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("does not meet");};_.b("</b> the conservation goal of having a minimum width of <b>at least 1km</b>.");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}};if(_.s(_.f("isCollection",c,p,1),c,p,0,2212,3628,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Marine Reserve Zones should have a minimum width of at least 1 kilometer to meet conservation goals.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td style=\"width:60px;text-align:center;\">Meets 1km Goal?</td>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("min_dim",c,p,1),c,p,0,2643,2906,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");if(_.s(_.f("MEETS_THRESH",c,p,1),c,p,0,2696,2733,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"small-green-check\"></div>");});c.pop();}if(!_.s(_.f("MEETS_THRESH",c,p,1),c,p,1,0,0,"")){_.b("<div class=\"small-red-x\"></div>");};_.b("</td>");_.b("\n" + i);_.b("              <td style=\"text-align:left;\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("   </div>");_.b("\n" + i);_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Connectivity</h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("            <td>Distance to Nearest Zone (km)</td>");_.b("\n" + i);_.b("            <td>Nearest Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("connectivity",c,p,1),c,p,0,3259,3409,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("DIST_KM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NEAR_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <em>Note:</em> The connectivity analytic has been developed for demonstration purposes, and does not account for the least cost path around land.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["tradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,70,1081,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p style=\"margin-left:18px;\">");_.b("\n" + i);_.b("  		<em>Tradeoff analysis is currently in development, and should be used for demonstration purposes only. These analytics will allow users to plot multiple plan options against each other in terms of their impact on fishing, dive and conservation value for Montserrat.</em>");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("  	<div style=\"margin-left:18px;margin-bottom:15px\">");_.b("\n" + i);_.b("	  	<span>Select a Set of Tradeoff Scores to View:</span></br>");_.b("\n" + i);_.b("		<select class=\"chosen\">");_.b("\n" + i);if(_.s(_.f("tradeoffs",c,p,1),c,p,0,549,674,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <option class=\"");_.b(_.v(_.d(". == \"Fishing and Diving\" ? 'default-chosen-selection' : ''",c,p,0)));_.b("\"  value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("		</select>");_.b("\n" + i);_.b("	</div>");_.b("\n" + i);_.b("  	<div id=\"fvd_container\" class=\"fvd_container\"><div  id=\"fishing-v-diving\" class=\"fishing-v-diving\"></div></div>");_.b("\n" + i);_.b("    <div id=\"fvc_container\" class=\"fvc_container\"><div  id=\"fishing-v-conservation\" class=\"fishing-v-conservation\"></div></div>");_.b("\n" + i);_.b("    <div id=\"dvc_container\" class=\"dvc_container\"><div  id=\"diving-v-conservation\" class=\"diving-v-conservation\"></div></div>");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("  	  	<p>");_.b("\n" + i);_.b("  			<i>No tradeoff analysis available for individual zones.</i>");_.b("\n" + i);_.b("  		</p>");_.b("\n");};_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvc2NyaXB0cy9lbnZpcm9ubWVudC5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvdHJhZGVvZmZzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0IsQ0FFOEIsQ0FBRSxDQUFoQyxFQUFBLEVBQVEsQ0FBd0IsS0FBaEM7Q0FGQSxDQUd5QixFQUF6QixFQUFBLEVBQVEsQ0FBUjtNQUpGO0NBTUUsS0FESTtDQUNKLENBQWdDLEVBQWhDLEVBQUEsRUFBUSxRQUFSO01BVEo7Q0FBQSxFQVJBO0NBbUJTLENBQVQsQ0FBcUIsSUFBckIsQ0FBUSxDQUFSO0NBQ0UsR0FBQSxVQUFBO0NBQUEsRUFDQSxDQUFBLEVBQU07Q0FETixFQUVPLENBQVAsS0FBTztDQUNQLEdBQUE7Q0FDRSxHQUFJLEVBQUosVUFBQTtBQUMwQixDQUF0QixDQUFxQixDQUF0QixDQUFILENBQXFDLElBQVYsSUFBM0IsQ0FBQTtNQUZGO0NBSVMsRUFBcUUsQ0FBQSxDQUE1RSxRQUFBLHlEQUFPO01BUlU7Q0FBckIsRUFBcUI7Q0FwQk47Ozs7QUNBakIsSUFBQSxHQUFBO0dBQUE7a1NBQUE7O0FBQU0sQ0FBTjtDQUNFOztDQUFBLEVBQVcsTUFBWCxLQUFBOztDQUFBLENBQUEsQ0FDUSxHQUFSOztDQURBLEVBR0UsS0FERjtDQUNFLENBQ0UsRUFERixFQUFBO0NBQ0UsQ0FBUyxJQUFULENBQUEsTUFBQTtDQUFBLENBQ1ksRUFEWixFQUNBLElBQUE7Q0FEQSxDQUVZLElBQVosSUFBQTtTQUFhO0NBQUEsQ0FDTCxFQUFOLEVBRFcsSUFDWDtDQURXLENBRUYsS0FBVCxHQUFBLEVBRlc7VUFBRDtRQUZaO01BREY7Q0FBQSxDQVFFLEVBREYsUUFBQTtDQUNFLENBQVMsSUFBVCxDQUFBLENBQVMsR0FBQTtDQUFULENBQ1MsQ0FBQSxHQUFULENBQUEsRUFBUztDQUNQLEdBQUEsUUFBQTtDQUFDLEVBQUQsQ0FBQyxDQUFLLEdBQU4sRUFBQTtDQUZGLE1BQ1M7Q0FEVCxDQUdZLEVBSFosRUFHQSxJQUFBO0NBSEEsQ0FJTyxDQUFBLEVBQVAsQ0FBQSxHQUFPO0NBQ0wsRUFBRyxDQUFBLENBQU0sR0FBVCxHQUFHO0NBQ0QsRUFBb0IsQ0FBUSxDQUFLLENBQWIsQ0FBQSxHQUFiLENBQW9CLE1BQXBCO01BRFQsSUFBQTtDQUFBLGdCQUdFO1VBSkc7Q0FKUCxNQUlPO01BWlQ7Q0FBQSxDQWtCRSxFQURGLEtBQUE7Q0FDRSxDQUFTLElBQVQsQ0FBQSxDQUFBO0NBQUEsQ0FDTyxDQUFBLEVBQVAsQ0FBQSxHQUFRO0NBQ04sZUFBTztDQUFQLFFBQUEsTUFDTztDQURQLGtCQUVJO0NBRkosUUFBQSxNQUdPO0NBSFAsa0JBSUk7Q0FKSixTQUFBLEtBS087Q0FMUCxrQkFNSTtDQU5KLE1BQUEsUUFPTztDQVBQLGtCQVFJO0NBUko7Q0FBQSxrQkFVSTtDQVZKLFFBREs7Q0FEUCxNQUNPO01BbkJUO0NBQUEsQ0FnQ0UsRUFERixVQUFBO0NBQ0UsQ0FBUyxJQUFULENBQUEsTUFBQTtDQUFBLENBQ08sQ0FBQSxFQUFQLENBQUEsR0FBUTtDQUNOLFdBQUE7Q0FBQSxFQUFLLEdBQUwsRUFBQSxTQUFLO0NBQ0wsRUFBYyxDQUFYLEVBQUEsRUFBSDtDQUNFLEVBQUEsQ0FBSyxNQUFMO1VBRkY7Q0FHQSxFQUFXLENBQVgsV0FBTztDQUxULE1BQ087Q0FEUCxDQU1TLENBQUEsR0FBVCxDQUFBLEVBQVU7Q0FDUSxFQUFLLENBQWQsSUFBQSxHQUFQLElBQUE7Q0FQRixNQU1TO01BdENYO0NBQUEsQ0F5Q0UsRUFERixLQUFBO0NBQ0UsQ0FBUyxJQUFULENBQUE7Q0FBQSxDQUNZLEVBRFosRUFDQSxJQUFBO0NBREEsQ0FFUyxDQUFBLEdBQVQsQ0FBQSxFQUFVO0NBQ1AsRUFBRDtDQUhGLE1BRVM7Q0FGVCxDQUlPLENBQUEsRUFBUCxDQUFBLEdBQVE7Q0FDTixHQUFHLElBQUgsQ0FBQTtDQUNPLENBQWEsRUFBZCxLQUFKLFFBQUE7TUFERixJQUFBO0NBQUEsZ0JBR0U7VUFKRztDQUpQLE1BSU87TUE3Q1Q7Q0FIRixHQUFBOztDQXNEYSxDQUFBLENBQUEsRUFBQSxZQUFFO0NBQ2IsRUFEYSxDQUFELENBQ1o7Q0FBQSxHQUFBLG1DQUFBO0NBdkRGLEVBc0RhOztDQXREYixFQXlEUSxHQUFSLEdBQVE7Q0FDTixFQUFJLENBQUosb01BQUE7Q0FRQyxHQUFBLEdBQUQsSUFBQTtDQWxFRixFQXlEUTs7Q0F6RFI7O0NBRG9CLE9BQVE7O0FBcUU5QixDQXJFQSxFQXFFaUIsR0FBWCxDQUFOOzs7O0FDckVBLElBQUEsU0FBQTtHQUFBOztrU0FBQTs7QUFBTSxDQUFOO0NBRUU7O0NBQUEsRUFBd0IsQ0FBeEIsa0JBQUE7O0NBRWEsQ0FBQSxDQUFBLENBQUEsRUFBQSxpQkFBRTtDQUNiLEVBQUEsS0FBQTtDQUFBLEVBRGEsQ0FBRCxFQUNaO0NBQUEsRUFEc0IsQ0FBRDtDQUNyQixrQ0FBQTtDQUFBLENBQWMsQ0FBZCxDQUFBLEVBQStCLEtBQWpCO0NBQWQsR0FDQSx5Q0FBQTtDQUpGLEVBRWE7O0NBRmIsRUFNTSxDQUFOLEtBQU07Q0FDSixPQUFBLElBQUE7Q0FBQyxHQUFBLENBQUQsTUFBQTtDQUFPLENBQ0ksQ0FBQSxHQUFULENBQUEsRUFBUztDQUNQLFdBQUEsdUNBQUE7Q0FBQSxJQUFDLENBQUQsQ0FBQSxDQUFBO0NBQ0E7Q0FBQSxZQUFBLDhCQUFBOzZCQUFBO0NBQ0UsRUFBRyxDQUFBLENBQTZCLENBQXZCLENBQVQsQ0FBRyxFQUFIO0FBQ1MsQ0FBUCxHQUFBLENBQVEsR0FBUixJQUFBO0NBQ0UsQ0FBK0IsQ0FBbkIsQ0FBQSxDQUFYLEdBQUQsR0FBWSxHQUFaLFFBQVk7Y0FEZDtDQUVBLGlCQUFBO1lBSEY7Q0FBQSxFQUlBLEVBQWEsQ0FBTyxDQUFiLEdBQVAsUUFBWTtDQUpaLEVBS2MsQ0FBSSxDQUFKLENBQXFCLElBQW5DLENBQUEsT0FBMkI7Q0FMM0IsRUFNQSxDQUFBLEdBQU8sR0FBUCxDQUFhLDJCQUFBO0NBUGYsUUFEQTtDQVVBLEdBQW1DLENBQUMsR0FBcEM7Q0FBQSxJQUFzQixDQUFoQixFQUFOLEVBQUEsR0FBQTtVQVZBO0NBV0EsQ0FBNkIsQ0FBaEIsQ0FBVixDQUFrQixDQUFSLENBQVYsQ0FBSCxDQUE4QjtDQUFELGdCQUFPO0NBQXZCLFFBQWdCO0NBQzFCLENBQWtCLENBQWMsRUFBaEMsQ0FBRCxDQUFBLE1BQWlDLEVBQWQsRUFBbkI7TUFERixJQUFBO0NBR0csSUFBQSxFQUFELEdBQUEsT0FBQTtVQWZLO0NBREosTUFDSTtDQURKLENBaUJFLENBQUEsRUFBUCxDQUFBLEdBQVE7Q0FDTixXQUFBLEtBQUE7Q0FBQSxFQUFVLENBQUgsQ0FBYyxDQUFkLEVBQVA7Q0FDRSxHQUFtQixFQUFuQixJQUFBO0NBQ0U7Q0FDRSxFQUFPLENBQVAsQ0FBTyxPQUFBLEVBQVA7TUFERixRQUFBO0NBQUE7Y0FERjtZQUFBO0NBS0EsR0FBbUMsQ0FBQyxHQUFwQyxFQUFBO0NBQUEsSUFBc0IsQ0FBaEIsRUFBTixJQUFBLENBQUE7WUFMQTtDQU1DLEdBQ0MsQ0FERCxFQUFELFVBQUEsd0JBQUE7VUFSRztDQWpCRixNQWlCRTtDQWxCTCxLQUNKO0NBUEYsRUFNTTs7Q0FOTjs7Q0FGMEIsT0FBUTs7QUFzQ3BDLENBdENBLEVBc0NpQixHQUFYLENBQU4sTUF0Q0E7Ozs7QUNBQSxJQUFBLHdHQUFBO0dBQUE7Ozt3SkFBQTs7QUFBQSxDQUFBLEVBQXNCLElBQUEsWUFBdEIsV0FBc0I7O0FBQ3RCLENBREEsRUFDUSxFQUFSLEVBQVEsU0FBQTs7QUFDUixDQUZBLEVBRWdCLElBQUEsTUFBaEIsV0FBZ0I7O0FBQ2hCLENBSEEsRUFHSSxJQUFBLG9CQUFBOztBQUNKLENBSkEsRUFLRSxNQURGO0NBQ0UsQ0FBQSxXQUFBLHVDQUFpQjtDQUxuQixDQUFBOztBQU1BLENBTkEsRUFNVSxJQUFWLFdBQVU7O0FBQ1YsQ0FQQSxFQU9pQixJQUFBLE9BQWpCLFFBQWlCOztBQUVYLENBVE47Q0FXZSxDQUFBLENBQUEsQ0FBQSxTQUFBLE1BQUU7Q0FBNkIsRUFBN0IsQ0FBRDtDQUE4QixFQUF0QixDQUFEO0NBQXVCLEVBQWhCLENBQUQsU0FBaUI7Q0FBNUMsRUFBYTs7Q0FBYixFQUVTLElBQVQsRUFBUztDQUNQLEdBQUEsSUFBQTtPQUFBLEtBQUE7Q0FBQSxHQUFBLFNBQUE7Q0FDRSxDQUEyQixDQUFwQixDQUFQLENBQU8sQ0FBUCxHQUE0QjtDQUMxQixXQUFBLE1BQUE7Q0FBNEIsSUFBQSxFQUFBO0NBRHZCLE1BQW9CO0FBRXBCLENBQVAsR0FBQSxFQUFBO0NBQ0UsRUFBNEMsQ0FBQyxTQUE3QyxDQUFPLHdCQUFBO1FBSlg7TUFBQTtDQU1FLEdBQUcsQ0FBQSxDQUFILENBQUc7Q0FDRCxFQUFPLENBQVAsQ0FBbUIsR0FBbkI7TUFERixFQUFBO0NBR0UsRUFBTyxDQUFQLENBQUEsR0FBQTtRQVRKO01BQUE7Q0FVQyxDQUFvQixDQUFyQixDQUFVLEdBQVcsQ0FBckIsQ0FBc0IsRUFBdEI7Q0FDVSxNQUFELE1BQVA7Q0FERixJQUFxQjtDQWJ2QixFQUVTOztDQUZULEVBZ0JBLENBQUssS0FBQztDQUNKLElBQUEsR0FBQTtDQUFBLENBQTBCLENBQWxCLENBQVIsQ0FBQSxFQUFjLEVBQWE7Q0FDckIsRUFBQSxDQUFBLFNBQUo7Q0FETSxJQUFrQjtDQUExQixDQUV3QixDQUFoQixDQUFSLENBQUEsQ0FBUSxHQUFpQjtDQUFELEdBQVUsQ0FBUSxRQUFSO0NBQTFCLElBQWdCO0NBQ3hCLEdBQUEsQ0FBUSxDQUFMO0NBQ0QsRUFBQSxDQUFhLEVBQWIsQ0FBTztDQUFQLEVBQ0ksQ0FBSCxFQUFELEtBQUEsSUFBQSxXQUFrQjtDQUNsQixFQUFnQyxDQUFoQyxRQUFPLGNBQUE7Q0FDSyxHQUFOLENBQUssQ0FKYjtDQUtFLElBQWEsUUFBTjtNQUxUO0NBT0UsSUFBQSxRQUFPO01BWE47Q0FoQkwsRUFnQks7O0NBaEJMLEVBNkJBLENBQUssS0FBQztDQUNKLEVBQUEsS0FBQTtDQUFBLEVBQUEsQ0FBQTtDQUNBLEVBQUcsQ0FBSCxHQUFHO0NBQ0EsQ0FBVSxDQUFYLEtBQUEsS0FBQTtNQURGO0NBR1csRUFBVCxLQUFBLEtBQUE7TUFMQztDQTdCTCxFQTZCSzs7Q0E3QkwsQ0FvQ2MsQ0FBUCxDQUFBLENBQVAsSUFBUSxJQUFEO0NBQ0wsRUFBQSxLQUFBOztHQUQwQixHQUFkO01BQ1o7Q0FBQSxFQUFBLENBQUE7Q0FDQSxFQUFHLENBQUgsR0FBRztDQUNBLENBQVUsQ0FBWCxNQUFZLElBQVo7Q0FBMEIsQ0FBSyxDQUFYLEVBQUEsUUFBQSxFQUFBO0NBQXBCLE1BQVc7TUFEYjtDQUdRLENBQUssQ0FBWCxFQUFBLFFBQUE7TUFMRztDQXBDUCxFQW9DTzs7Q0FwQ1AsRUEyQ00sQ0FBTixLQUFPO0NBQ0wsRUFBQSxLQUFBO0NBQUEsRUFBQSxDQUFBO0NBQ0EsRUFBRyxDQUFILEdBQUc7Q0FDQSxDQUFVLENBQVgsTUFBWSxJQUFaO0NBQXdCLEVBQUQsRUFBNkIsR0FBaEMsR0FBQSxJQUFBO0NBQXBCLE1BQVc7TUFEYjtDQUdNLEVBQUQsRUFBNkIsR0FBaEMsR0FBQSxFQUFBO01BTEU7Q0EzQ04sRUEyQ007O0NBM0NOOztDQVhGOztBQTZETSxDQTdETjtDQThERTs7Ozs7Ozs7Ozs7O0NBQUE7O0NBQUEsRUFBTSxDQUFOLFNBQUE7O0NBQUEsQ0FBQSxDQUNjLFNBQWQ7O0NBREEsQ0FHc0IsQ0FBVixFQUFBLEVBQUEsRUFBRSxDQUFkO0NBTUUsRUFOWSxDQUFELENBTVg7Q0FBQSxFQU5vQixDQUFELEdBTW5CO0NBQUEsRUFBQSxDQUFBLEVBQWE7Q0FBYixDQUNZLEVBQVosRUFBQSxDQUFBO0NBREEsQ0FFMkMsQ0FBdEIsQ0FBckIsQ0FBcUIsT0FBQSxDQUFyQjtDQUZBLENBRzhCLEVBQTlCLEdBQUEsSUFBQSxDQUFBLENBQUE7Q0FIQSxDQUk4QixFQUE5QixFQUFBLE1BQUEsQ0FBQSxHQUFBO0NBSkEsQ0FLOEIsRUFBOUIsRUFBQSxJQUFBLEVBQUEsQ0FBQTtDQUxBLENBTTBCLEVBQTFCLEVBQXNDLEVBQXRDLEVBQUEsR0FBQTtDQUNDLENBQTZCLEVBQTdCLEtBQUQsRUFBQSxDQUFBLENBQUEsRUFBQTtDQWhCRixFQUdZOztDQUhaLEVBa0JRLEdBQVIsR0FBUTtDQUNOLFNBQU0sdUJBQU47Q0FuQkYsRUFrQlE7O0NBbEJSLEVBcUJNLENBQU4sS0FBTTtDQUNKLE9BQUEsSUFBQTtDQUFBLEVBQUksQ0FBSjtDQUFBLEVBQ1csQ0FBWCxHQUFBO0FBQzhCLENBQTlCLEdBQUEsQ0FBZ0IsQ0FBbUMsT0FBUDtDQUN6QyxHQUFBLFNBQUQ7Q0FDTSxHQUFBLENBQWMsQ0FGdEI7Q0FHRSxHQUFDLEVBQUQ7Q0FDQyxFQUEwRixDQUExRixLQUEwRixJQUEzRixvRUFBQTtDQUNFLFdBQUEsMEJBQUE7Q0FBQSxFQUFPLENBQVAsSUFBQTtDQUFBLENBQUEsQ0FDTyxDQUFQLElBQUE7Q0FDQTtDQUFBLFlBQUEsK0JBQUE7MkJBQUE7Q0FDRSxFQUFNLENBQUgsRUFBSCxJQUFBO0NBQ0UsRUFBTyxDQUFQLENBQWMsT0FBZDtDQUFBLEVBQ3VDLENBQW5DLENBQVMsQ0FBYixNQUFBLGtCQUFhO1lBSGpCO0NBQUEsUUFGQTtDQU1BLEdBQUEsV0FBQTtDQVBGLE1BQTJGO01BUHpGO0NBckJOLEVBcUJNOztDQXJCTixFQXNDTSxDQUFOLEtBQU07Q0FDSixFQUFJLENBQUo7Q0FDQyxFQUFVLENBQVYsR0FBRCxJQUFBO0NBeENGLEVBc0NNOztDQXRDTixFQTBDUSxHQUFSLEdBQVE7Q0FDTixHQUFBLEVBQU0sS0FBTixFQUFBO0NBQUEsR0FDQSxTQUFBO0NBRk0sVUFHTix5QkFBQTtDQTdDRixFQTBDUTs7Q0ExQ1IsRUErQ2lCLE1BQUEsTUFBakI7Q0FDRyxDQUFTLENBQU4sQ0FBSCxFQUFTLEdBQVMsRUFBbkIsRUFBaUM7Q0FoRG5DLEVBK0NpQjs7Q0EvQ2pCLENBa0RtQixDQUFOLE1BQUMsRUFBZCxLQUFhO0FBQ0osQ0FBUCxHQUFBLFlBQUE7Q0FDRSxFQUFHLENBQUEsQ0FBTyxDQUFWLEtBQUE7Q0FDRyxHQUFBLEtBQUQsTUFBQSxVQUFBO01BREYsRUFBQTtDQUdHLEVBQUQsQ0FBQyxLQUFELE1BQUE7UUFKSjtNQURXO0NBbERiLEVBa0RhOztDQWxEYixFQXlEVyxNQUFYO0NBQ0UsR0FBQSxFQUFBLEtBQUE7Q0FBQSxHQUNBLEVBQUEsR0FBQTtDQUNDLEVBQ3VDLENBRHZDLENBQUQsQ0FBQSxLQUFBLFFBQUEsK0JBQTRDO0NBNUQ5QyxFQXlEVzs7Q0F6RFgsRUFnRVksTUFBQSxDQUFaO0FBQ1MsQ0FBUCxHQUFBLEVBQUE7Q0FDRSxHQUFDLENBQUQsQ0FBQSxVQUFBO01BREY7Q0FFQyxHQUFBLE9BQUQsUUFBQTtDQW5FRixFQWdFWTs7Q0FoRVosRUFxRW1CLE1BQUEsUUFBbkI7Q0FDRSxPQUFBLElBQUE7Q0FBQSxHQUFBLEVBQUE7Q0FDRSxFQUFRLEVBQVIsQ0FBQSxHQUFRO0NBQ0wsR0FBRCxDQUFDLFFBQWEsRUFBZDtDQURGLENBRUUsQ0FBVyxDQUFULEVBQUQsQ0FGSztDQUdQLEVBQU8sRUFBUixJQUFRLElBQVI7Q0FDRSxDQUF1RCxDQUF2RCxFQUFDLEdBQUQsUUFBQSxZQUFBO0NBQUEsQ0FDZ0QsQ0FBaEQsRUFBQyxDQUFpRCxFQUFsRCxRQUFBLEtBQUE7Q0FDQyxJQUFBLENBQUQsU0FBQSxDQUFBO0NBSEYsQ0FJRSxDQUpGLElBQVE7TUFMTztDQXJFbkIsRUFxRW1COztDQXJFbkIsRUFnRmtCLE1BQUEsT0FBbEI7Q0FDRSxPQUFBLHNEQUFBO09BQUEsS0FBQTtDQUFBLEVBQVMsQ0FBVCxFQUFBO0NBQ0E7Q0FBQSxRQUFBLG1DQUFBO3VCQUFBO0NBQ0UsRUFBTSxDQUFILEVBQUgsTUFBRztBQUNHLENBQUosRUFBaUIsQ0FBZCxFQUFBLEVBQUgsSUFBYztDQUNaLEVBQVMsR0FBVCxJQUFBLEVBQVM7VUFGYjtRQURGO0NBQUEsSUFEQTtDQUtBLEdBQUEsRUFBQTtDQUNFLEVBQVUsQ0FBVCxFQUFEO0NBQUEsR0FDQyxDQUFELENBQUEsVUFBQTtDQURBLEdBRUMsRUFBRCxXQUFBO01BUkY7Q0FBQSxDQVVtQyxDQUFuQyxDQUFBLEdBQUEsRUFBQSxNQUFBO0NBVkEsRUFXMEIsQ0FBMUIsQ0FBQSxJQUEyQixNQUEzQjtDQUNFLEtBQUEsUUFBQTtDQUFBLEdBQ0EsQ0FBQyxDQUFELFNBQUE7Q0FDQyxHQUFELENBQUMsS0FBRCxHQUFBO0NBSEYsSUFBMEI7Q0FJMUI7Q0FBQTtVQUFBLG9DQUFBO3VCQUFBO0NBQ0UsRUFBVyxDQUFYLEVBQUEsQ0FBVztDQUFYLEdBQ0ksRUFBSjtDQURBLENBRUEsRUFBQyxFQUFELElBQUE7Q0FIRjtxQkFoQmdCO0NBaEZsQixFQWdGa0I7O0NBaEZsQixDQXFHVyxDQUFBLE1BQVg7Q0FDRSxPQUFBLE9BQUE7Q0FBQSxFQUFVLENBQVYsR0FBQSxHQUFVO0NBQVYsQ0FDeUIsQ0FBaEIsQ0FBVCxFQUFBLENBQVMsRUFBaUI7Q0FBTyxJQUFjLElBQWYsSUFBQTtDQUF2QixJQUFnQjtDQUN6QixHQUFBLFVBQUE7Q0FDRSxDQUFVLENBQTZCLENBQTdCLENBQUEsT0FBQSxRQUFNO01BSGxCO0NBSU8sS0FBRCxLQUFOO0NBMUdGLEVBcUdXOztDQXJHWCxDQTRHd0IsQ0FBUixFQUFBLElBQUMsS0FBakI7Q0FDRSxPQUFBLENBQUE7Q0FBQSxFQUFTLENBQVQsQ0FBUyxDQUFULEdBQVM7Q0FDVDtDQUNFLENBQXdDLElBQTFCLEVBQVksRUFBYyxHQUFqQztNQURUO0NBR0UsS0FESTtDQUNKLENBQU8sQ0FBZSxFQUFmLE9BQUEsSUFBQTtNQUxLO0NBNUdoQixFQTRHZ0I7O0NBNUdoQixFQW1IWSxNQUFBLENBQVo7Q0FDRSxNQUFBLENBQUE7Q0FBQSxFQUFVLENBQVYsRUFBNkIsQ0FBN0IsRUFBOEIsSUFBTjtDQUF3QixFQUFQLEdBQU0sRUFBTixLQUFBO0NBQS9CLElBQW1CO0NBQzdCLEVBQU8sQ0FBUCxHQUFjO0NBQ1osR0FBVSxDQUFBLE9BQUEsR0FBQTtNQUZaO0NBR0MsQ0FBaUIsQ0FBQSxHQUFsQixDQUFBLEVBQW1CLEVBQW5CO0NBQ0UsSUFBQSxLQUFBO0NBQU8sRUFBUCxDQUFBLENBQXlCLENBQW5CLE1BQU47Q0FERixJQUFrQjtDQXZIcEIsRUFtSFk7O0NBbkhaLENBMEh3QixDQUFiLE1BQVgsQ0FBVyxHQUFBO0NBQ1QsT0FBQSxFQUFBOztHQUQrQyxHQUFkO01BQ2pDO0NBQUEsQ0FBTyxFQUFQLENBQUEsS0FBTyxFQUFBLEdBQWM7Q0FDbkIsRUFBcUMsQ0FBM0IsQ0FBQSxLQUFBLEVBQUEsU0FBTztNQURuQjtDQUFBLEVBRUEsQ0FBQSxLQUEyQixJQUFQO0NBQWMsRUFBRCxFQUF3QixRQUF4QjtDQUEzQixJQUFvQjtBQUNuQixDQUFQLEVBQUEsQ0FBQTtDQUNFLEVBQUEsQ0FBYSxFQUFiLENBQU8sTUFBbUI7Q0FDMUIsRUFBNkMsQ0FBbkMsQ0FBQSxLQUFPLEVBQVAsaUJBQU87TUFMbkI7Q0FBQSxDQU0wQyxDQUFsQyxDQUFSLENBQUEsRUFBUSxDQUFPLENBQTRCO0NBQ25DLElBQUQsSUFBTCxJQUFBO0NBRE0sSUFBa0M7QUFFbkMsQ0FBUCxHQUFBLENBQUE7Q0FDRSxFQUFBLEdBQUEsQ0FBTztDQUNQLEVBQXVDLENBQTdCLENBQUEsQ0FBTyxHQUFBLENBQVAsRUFBQSxXQUFPO01BVm5CO0NBV2MsQ0FBTyxFQUFqQixDQUFBLElBQUEsRUFBQSxFQUFBO0NBdElOLEVBMEhXOztDQTFIWCxFQXdJbUIsTUFBQSxRQUFuQjtDQUNHLEVBQXdCLENBQXhCLEtBQXdCLEVBQXpCLElBQUE7Q0FDRSxTQUFBLGtFQUFBO0NBQUEsRUFBUyxDQUFBLEVBQVQ7Q0FBQSxFQUNXLENBQUEsRUFBWCxFQUFBO0NBREEsRUFFTyxDQUFQLEVBQUEsSUFBTztDQUZQLEVBR1EsQ0FBSSxDQUFaLENBQUEsRUFBUTtDQUNSLEVBQVcsQ0FBUixDQUFBLENBQUg7Q0FDRSxFQUVNLENBQUEsRUFGQSxFQUFOLEVBRU0sMkJBRlcsc0hBQWpCO0NBQUEsQ0FhQSxDQUFLLENBQUEsRUFBTSxFQUFYLEVBQUs7Q0FDTDtDQUFBLFlBQUEsK0JBQUE7eUJBQUE7Q0FDRSxDQUFFLENBQ0ksR0FETixJQUFBLENBQUEsU0FBYTtDQURmLFFBZEE7Q0FBQSxDQWtCRSxJQUFGLEVBQUEseUJBQUE7Q0FsQkEsRUFxQjBCLENBQTFCLENBQUEsQ0FBTSxFQUFOLENBQTJCO0NBQ3pCLGFBQUEsUUFBQTtDQUFBLFNBQUEsSUFBQTtDQUFBLENBQ0EsQ0FBSyxDQUFBLE1BQUw7Q0FEQSxDQUVTLENBQUYsQ0FBUCxNQUFBO0NBQ0EsR0FBRyxDQUFRLENBQVgsSUFBQTtDQUNFLENBQU0sQ0FBRixDQUFBLEVBQUEsR0FBQSxHQUFKO0NBQ0EsR0FBTyxDQUFZLENBQW5CLE1BQUE7Q0FDRyxJQUFELGdCQUFBO2NBSEo7SUFJUSxDQUFRLENBSmhCLE1BQUE7Q0FLRSxDQUFNLENBQUYsQ0FBQSxFQUFBLEdBQUEsR0FBSjtDQUNBLEdBQU8sQ0FBWSxDQUFuQixNQUFBO0NBQ0csSUFBRCxnQkFBQTtjQVBKO01BQUEsTUFBQTtDQVNFLENBQUUsRUFBRixFQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUE7Q0FBQSxDQUNFLElBQUYsRUFBQSxJQUFBO0NBREEsRUFFSSxDQUFBLElBQUEsSUFBSjtDQUZBLEdBR0EsRUFBTSxJQUFOLEVBQUE7Q0FIQSxFQUlTLEdBQVQsRUFBUyxJQUFUO0NBQ08sQ0FBK0IsQ0FBRSxDQUF4QyxDQUFBLENBQU0sRUFBTixFQUFBLFNBQUE7WUFsQnNCO0NBQTFCLFFBQTBCO0NBckIxQixHQXdDRSxDQUFGLENBQVEsRUFBUjtRQTdDRjtDQStDQSxFQUFtQixDQUFoQixFQUFILEdBQW1CLElBQWhCO0NBQ0QsR0FBRyxDQUFRLEdBQVg7Q0FDRSxFQUFTLEdBQVQsSUFBQTtDQUFBLEtBQ00sSUFBTjtDQURBLEtBRU0sSUFBTixDQUFBLEtBQUE7Q0FDTyxFQUFZLEVBQUosQ0FBVCxPQUFTLElBQWY7VUFMSjtRQWhEdUI7Q0FBekIsSUFBeUI7Q0F6STNCLEVBd0ltQjs7Q0F4SW5CLEVBZ01xQixNQUFBLFVBQXJCO0NBQ3NCLEVBQXBCLENBQXFCLE9BQXJCLFFBQUE7Q0FqTUYsRUFnTXFCOztDQWhNckIsRUFtTWEsTUFBQyxFQUFkLEVBQWE7Q0FDVixDQUFtQixDQUFBLENBQVYsQ0FBVSxDQUFwQixFQUFBLENBQXFCLEVBQXJCO0NBQXFDLENBQU4sR0FBSyxRQUFMLENBQUE7Q0FBL0IsSUFBb0I7Q0FwTXRCLEVBbU1hOztDQW5NYjs7Q0FEc0IsT0FBUTs7QUF3TWhDLENBclFBLEVBcVFpQixHQUFYLENBQU4sRUFyUUE7Ozs7Ozs7O0FDQUEsQ0FBTyxFQUVMLEdBRkksQ0FBTjtDQUVFLENBQUEsQ0FBTyxFQUFQLENBQU8sR0FBQyxJQUFEO0NBQ0wsT0FBQSxFQUFBO0FBQU8sQ0FBUCxHQUFBLEVBQU8sRUFBQTtDQUNMLEVBQVMsR0FBVCxJQUFTO01BRFg7Q0FBQSxDQUVhLENBQUEsQ0FBYixNQUFBLEdBQWE7Q0FDUixFQUFlLENBQWhCLENBQUosQ0FBVyxJQUFYLENBQUE7Q0FKRixFQUFPO0NBRlQsQ0FBQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ1JBLElBQUEseUVBQUE7R0FBQTs7a1NBQUE7O0FBQUEsQ0FBQSxFQUFZLElBQUEsRUFBWixFQUFZOztBQUNaLENBREEsRUFDWSxJQUFBLEVBQVosa0JBQVk7O0FBRVosQ0FIQSxFQUdZLElBQUEsRUFBWix1REFBWTs7QUFDWixDQUpBLENBQUEsQ0FJVyxLQUFYOztBQUNBLENBQUEsSUFBQSxXQUFBO3dCQUFBO0NBQ0UsQ0FBQSxDQUFZLElBQUgsQ0FBQSwrQkFBQTtDQURYOztBQUlBLENBVEEsQ0FTQSxDQUFLLEdBQU07O0FBRUwsQ0FYTjtDQVlFOzs7Ozs7Ozs7Ozs7Ozs7Q0FBQTs7Q0FBQSxFQUFNLENBQU4sU0FBQTs7Q0FBQSxFQUNXLE1BQVgsSUFEQTs7Q0FBQSxFQUVVLEtBQVYsQ0FBbUIsRUFGbkI7O0NBQUEsQ0FLRSxDQUZXLFNBQWIsWUFBYSxFQUFBLEtBQUE7O0NBSGIsRUFVUSxHQUFSLEdBQVE7Q0FFTixPQUFBLCtQQUFBO0NBQUEsRUFBZSxDQUFmLENBQXFCLE9BQXJCO0NBQUEsRUFDMEIsQ0FBMUIsT0FBQTtDQUEwQixDQUFRLEdBQVIsQ0FBQTtDQUQxQixLQUFBO0NBRUEsR0FBQSxRQUFBO0NBQ0UsRUFBc0IsQ0FBQyxDQUE2QixDQUFwRCxLQUE4QyxRQUE5QyxHQUFzQjtDQUF0QixFQUNrQixDQUFDLENBQXlCLENBQTVDLEtBQXNDLElBQXRDLEdBQWtCO01BRnBCO0NBSUUsRUFBc0IsQ0FBdEIsRUFBQSxhQUFBO0NBQUEsRUFDa0IsQ0FBQyxDQUFtQixDQUF0QyxTQUFBLEdBQWtCO01BUHBCO0NBVUEsR0FBQSxlQUFBO0NBRUUsQ0FBa0QsQ0FBdkMsQ0FBQyxFQUFaLENBQVcsQ0FBWCxDQUFXLENBQUEsZ0JBQUE7Q0FBWCxDQUM4QixDQUFuQixHQUFYLEVBQUEsQ0FBK0I7Q0FBa0IsR0FBWCxNQUFBLEtBQUE7Q0FBM0IsTUFBbUI7Q0FEOUIsRUFFVyxHQUFYLENBQVcsQ0FBWDtDQUZBLEdBSUMsRUFBRCxFQUFBLENBQUE7Q0FKQSxDQU9vRCxDQUE1QyxDQUFDLENBQVQsQ0FBQSxDQUFRLEVBQUEsS0FBQSxpQkFBQTtDQVBSLEVBUWlCLENBQUMsQ0FBa0IsQ0FBcEMsTUFBaUIsRUFBakI7Q0FSQSxDQVVrRCxDQUF2QyxDQUFDLEVBQVosQ0FBVyxDQUFYLENBQVcsU0FBQSxRQUFBO0NBVlgsRUFXZ0IsQ0FBQyxDQUFELENBQWhCLEVBQXNDLElBQXRCLENBQWhCO0NBWEEsR0FZQyxFQUFELEVBQUEsQ0FBQTtDQVpBLENBY21ELENBQXZDLENBQUMsRUFBYixDQUFZLEVBQVosS0FBWSxZQUFBO0NBZFosRUFlbUIsQ0FBQyxDQUFELENBQW5CLEdBQTBDLEdBQXZCLElBQW5CO0NBZkEsR0FnQkMsRUFBRCxHQUFBO0NBaEJBLENBa0JrRCxDQUF2QyxDQUFDLEVBQVosQ0FBVyxDQUFYLENBQVcsTUFBQSxXQUFBO0NBbEJYLEVBbUJnQixDQUFDLENBQUQsQ0FBaEIsRUFBc0MsSUFBdEIsQ0FBaEI7Q0FuQkEsR0FvQkMsRUFBRCxFQUFBLENBQUE7Q0FwQkEsQ0FzQm1ELENBQXJDLENBQUMsRUFBZixDQUFjLEVBQUEsRUFBZCxhQUFjO0NBdEJkLENBd0JrRCxDQUF2QyxDQUFDLEVBQVosQ0FBVyxDQUFYLENBQVcsaUJBQUE7Q0FDWCxFQUFHLEdBQUgsRUFBVztDQUVULEVBQWdCLEVBQWhCLEdBQUEsS0FBQTtDQUFBLEVBQ2dCLEVBRGhCLEdBQ0EsS0FBQTtNQUhGLEVBQUE7Q0FLRSxFQUFnQixLQUFoQixLQUFBO0NBQUEsRUFDZ0IsS0FBaEIsS0FBQTtRQS9CRjtDQUFBLEdBaUNDLEVBQUQsRUFBQSxDQUFBO01BbkNGO0NBc0NFLENBQUEsQ0FBVyxHQUFYLEVBQUE7Q0FBQSxDQUFBLENBQ1EsRUFBUixDQUFBO0NBREEsQ0FBQSxDQUVPLENBQVAsRUFBQTtDQUZBLENBQUEsQ0FHTyxDQUFQLEVBQUE7Q0FIQSxDQUFBLENBSU0sRUFBTixDQUFBO01BcERGO0NBQUEsRUF3REUsQ0FERixHQUFBO0NBQ0UsQ0FBUSxFQUFDLENBQUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR08sRUFBQyxDQUFSLENBQUEsQ0FBZTtDQUhmLENBSWMsSUFBZCxNQUFBO0NBSkEsQ0FNVSxJQUFWLEVBQUE7Q0FOQSxDQU9hLElBQWIsS0FBQTtDQVBBLENBUU0sRUFBTixFQUFBLEVBUkE7Q0FBQSxDQVNNLEVBQU4sRUFBQSxFQVRBO0NBQUEsQ0FVTyxHQUFQLENBQUEsR0FWQTtDQUFBLENBV2EsSUFBYixLQUFBO0NBWEEsQ0FZTyxHQUFQLENBQUE7Q0FaQSxDQWFPLEdBQVAsQ0FBQTtDQWJBLENBY3FCLElBQXJCLGFBQUE7Q0FkQSxDQWVpQixJQUFqQixTQUFBO0NBZkEsQ0FnQmUsSUFBZixPQUFBO0NBaEJBLENBaUJlLElBQWYsT0FBQTtDQXpFRixLQUFBO0NBQUEsQ0EyRW9DLENBQWhDLENBQUosRUFBVSxDQUFBLENBQVMsQ0FBVDtDQTNFVixHQTRFQSxlQUFBO0NBQ0EsR0FBQSxlQUFBO0NBQ0UsQ0FBMEIsRUFBekIsQ0FBRCxDQUFBLENBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSwwQkFBQTtDQUFBLENBQzZCLEVBQTVCLEVBQUQsRUFBQSxDQUFBLEVBQUEsRUFBQSxJQUFBLEtBQUEsS0FBQTtDQURBLENBRThCLEVBQTdCLEVBQUQsR0FBQSxHQUFBLElBQUEsQ0FBQSxLQUFBLENBQUE7Q0FGQSxDQUc2QixFQUE1QixFQUFELEVBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLE1BQUE7Q0FIQSxHQUtDLEVBQUQsS0FBQSxFQUFBO0NBQ0MsQ0FBK0IsRUFBL0IsU0FBRCxFQUFBO01BdEZJO0NBVlIsRUFVUTs7Q0FWUixFQWtHb0IsS0FBQSxDQUFDLFNBQXJCO0NBQ0UsT0FBQSxpREFBQTtDQUFBLEVBQWtCLENBQWxCLENBQUEsVUFBQTtBQUNBLENBQUEsUUFBQSxzQ0FBQTs2QkFBQTtDQUNFO0NBQUEsVUFBQSxtQ0FBQTswQkFBQTtDQUNFLEdBQUcsQ0FBaUIsR0FBcEIsR0FBQTtDQUNFLEVBQW1CLENBQUksQ0FBSixLQUFuQixDQUFtQixJQUFuQixnQkFBQTtVQUZKO0NBQUEsTUFERjtDQUFBLElBREE7Q0FNQSxVQUFPLElBQVA7Q0F6R0YsRUFrR29COztDQWxHcEIsRUEyR3dCLEtBQUEsQ0FBQyxhQUF6QjtDQUNFLE9BQUEscURBQUE7Q0FBQSxFQUFzQixDQUF0QixDQUFBLGNBQUE7QUFDQSxDQUFBLFFBQUEsc0NBQUE7NkJBQUE7Q0FDRTtDQUFBLFVBQUEsbUNBQUE7MEJBQUE7Q0FDRSxHQUFHLENBQWlCLEdBQXBCLEdBQUE7Q0FDRSxFQUF1QixDQUFJLENBQUosS0FBdkIsQ0FBdUIsTUFBdkIsRUFBQSxLQUF1QixPQUFBO1VBRjNCO0NBQUEsTUFERjtDQUFBLElBREE7Q0FNQSxVQUFPLFFBQVA7Q0FsSEYsRUEyR3dCOztDQTNHeEIsQ0FvSGlDLENBQWhCLE1BQUMsSUFBRCxFQUFqQjtDQUNFLE9BQUEsOERBQUE7Q0FBQSxDQUFBLEVBQUEsRUFBUztDQUNQLEVBQWUsQ0FBQyxDQUFLLENBQXJCLE1BQUE7Q0FBQSxFQUNTLEdBQVQsRUFEQTtDQUdBLEdBQUcsRUFBSCxNQUFBO0NBQ0UsRUFBTyxHQUFQLEVBQUEsSUFBQTtRQUpGO0NBQUEsRUFNUSxFQUFSLENBQUEsT0FOQTtDQUFBLEVBT1EsRUFBUixDQUFBLE9BUEE7Q0FBQSxFQVF1QixDQVJ2QixDQVF1QixDQUF2QixjQUFBO0NBUkEsRUFVUSxFQUFSLENBQUEsK0RBQVE7Q0FWUixFQVdRLEVBQVIsQ0FBQTtTQUNFO0NBQUEsQ0FDRSxPQURGLENBQ0U7Q0FERixDQUVTLEdBQVAsS0FBQTtDQUZGLENBR08sQ0FBTCxFQUhGLEtBR0U7Q0FIRixDQUlTLEtBQVAsR0FBQSxDQUpGO0NBQUEsQ0FLUyxHQUFQLEtBQUE7Q0FMRixDQU1RLEVBQU4sQ0FORixLQU1FO0VBRUYsUUFUTTtDQVNOLENBQ0UsT0FERixDQUNFO0NBREYsQ0FFUyxHQUFQLEtBQUE7Q0FGRixDQUdPLENBQUwsRUFIRixLQUdFO0NBSEYsQ0FJUyxLQUFQLEdBQUEsTUFKRjtDQUFBLENBS1MsR0FBUCxLQUFBO0NBTEYsQ0FNZSxRQUFiLENBQUEsU0FORjtDQUFBLENBT1EsRUFBTixNQUFBO1VBaEJJO0NBWFIsT0FBQTtDQStCQyxDQUFnQixFQUFoQixDQUFELEdBQUEsS0FBQTtNQWpDYTtDQXBIakIsRUFvSGlCOztDQXBIakIsRUF1SmUsTUFBQyxHQUFELENBQWY7Q0FHSSxPQUFBLHNHQUFBO0NBQUEsQ0FBQSxFQUFBLEVBQVM7Q0FDUCxFQUFlLENBQUMsQ0FBSyxDQUFyQixNQUFBO0NBQUEsRUFDUyxHQUFULEVBREE7Q0FFQSxHQUFHLEVBQUgsTUFBQTtDQUNFLEVBQU8sR0FBUCxFQUFBLElBQUE7UUFIRjtBQUlBLENBQUE7WUFBQSx1Q0FBQTtrQ0FBQTtDQUNFLENBQXFCLENBQXJCLEVBQUEsRUFBTyxDQUFQO0NBQUEsRUFDTyxDQUFQLENBQVksR0FBWjtDQURBLEVBRVEsRUFBUixHQUFBO0NBRkEsRUFHUSxFQUFSLEdBQUE7Q0FIQSxFQUl1QixDQUp2QixDQUl1QixHQUF2QixZQUFBO0NBSkEsRUFNUSxFQUFSLENBTkEsRUFNQSwyQ0FBUTtDQU5SLEVBT1EsRUFBUixHQUFBO1dBQ0U7Q0FBQSxDQUNFLE9BREYsR0FDRTtDQURGLENBRVMsR0FBUCxPQUFBO0NBRkYsQ0FHTyxDQUFMLEVBSEYsT0FHRTtDQUhGLENBSVMsS0FBUCxJQUpGLENBSUU7Q0FKRixDQUtTLEdBQVAsT0FBQTtDQUxGLENBTVEsRUFBTixDQU5GLE9BTUU7RUFFRixVQVRNO0NBU04sQ0FDRSxPQURGLEdBQ0U7Q0FERixDQUVTLEdBQVAsT0FBQTtDQUZGLENBR08sQ0FBTCxFQUhGLE9BR0U7Q0FIRixDQUlTLEtBQVAsS0FBQSxJQUpGO0NBQUEsQ0FLUyxHQUFQLE9BQUE7Q0FMRixDQU1lLFNBQWIsQ0FBQSxRQU5GO0NBQUEsQ0FPUSxFQUFOLFFBQUE7WUFoQkk7Q0FQUixTQUFBO0NBMkJBLEdBQUcsQ0FBUSxHQUFYLGFBQUE7Q0FDRSxFQUFRLEVBQVIsS0FBQTtJQUNNLENBQVEsQ0FGaEIsSUFBQSxXQUFBO0NBR0UsRUFBUSxFQUFSLEtBQUE7TUFIRixJQUFBO0NBS0UsRUFBUSxFQUFSLEtBQUE7VUFoQ0Y7Q0FBQSxDQWtDaUIsRUFBaEIsQ0FBRCxHQUFBO0NBbkNGO3VCQUxGO01BSFc7Q0F2SmYsRUF1SmU7O0NBdkpmLENBcU1rQixDQUFSLEVBQUEsR0FBVixDQUFXO0NBQ1QsT0FBQSxJQUFBO0NBQUEsQ0FBbUMsQ0FBbkMsQ0FBQSxHQUFPLEVBQVAsWUFBQTtDQUFBLENBQ0EsQ0FBSyxDQUFMLENBQWdCLENBQVg7Q0FETCxDQUVNLENBQUYsQ0FBSixDQUFZLENBQVIsR0FDTTtDQUhWLENBT1UsQ0FBRixDQUFSLENBQUEsQ0FBUTtDQUNGLENBR1ksQ0FBQSxDQUhsQixDQUFLLENBQUwsQ0FBQSxFQUFBLEVBQUE7Q0FHOEIsQ0FBeUIsQ0FBakIsQ0FBVCxDQUFKLFFBQUE7Q0FIekIsQ0FJaUIsQ0FBQSxDQUpqQixDQUdrQixFQUhsQixFQUlrQjtDQUFrQixFQUFELElBQUMsQ0FBWixLQUFBO0NBSnhCLEVBTVUsQ0FOVixDQUlpQixDQUpqQixHQU1XO0NBQVMsQ0FBSCxDQUFFLFVBQUY7Q0FOakIsQ0FPbUIsQ0FBQSxFQURULENBTlYsR0FPb0I7Q0FBTSxHQUFHLEVBQUgsS0FBQTtDQUFzQixFQUFpQixRQUFqQixJQUFBO01BQXRCLEVBQUE7Q0FBQSxjQUFpRDtRQUF4RDtDQVBuQixDQVFtQixDQUFBLENBUm5CLENBT21CLEVBUG5CLEVBUW9CO0NBQWdCLEVBQUQsSUFBQyxDQUFWLEtBQUE7Q0FSMUIsSUFRbUI7Q0F0TnJCLEVBcU1VOztDQXJNVixDQXdONkIsQ0FBVixFQUFBLEVBQUEsRUFBQyxDQUFELEVBQUEsS0FBbkI7Q0FDRSxPQUFBLGlQQUFBO0NBQUEsQ0FBQSxFQUFBLEVBQVM7Q0FDUCxFQUFPLENBQVAsQ0FBQSxDQUFBLENBQWM7Q0FBZCxFQUNPLENBQVAsRUFBQSxDQUFjO0NBRGQsRUFFTyxDQUFQLEVBQUEsQ0FBYztDQUZkLEVBSUEsR0FBQSxJQUFnQjtDQUpoQixFQUtnQixHQUFoQixJQUEyQixHQUEzQjtDQUxBLEVBTWlCLEdBQWpCLFFBQUE7Q0FBaUIsQ0FBTSxFQUFMLElBQUEsRUFBRDtDQUFBLENBQXlCLEdBQVAsR0FBQTtDQUFsQixDQUFzQyxHQUFQLEdBQUE7Q0FBL0IsQ0FBbUQsR0FBUCxDQUE1QyxFQUE0QztDQUE1QyxDQUFpRSxHQUFQLEdBQUEsR0FBMUQ7Q0FOakIsT0FBQTtDQUFBLENBT3VCLENBQVosR0FBWCxFQUFBLENBQVc7Q0FQWCxDQUFBLENBVVcsR0FBWCxFQUFBO0NBVkEsQ0FBQSxDQVdXLEdBQVgsRUFBQTtDQVhBLENBQUEsQ0FhWSxHQUFaLEdBQUE7Q0FiQSxFQWNnQixHQUFoQixPQUFBO0NBZEEsRUFlYyxDQUFJLEVBQWxCLEVBQWMsR0FBZDtDQWZBLEVBZ0JPLENBQVAsRUFBQSxFQWhCQSxLQWdCTztBQUVQLENBQUEsRUFBQSxRQUFTLCtFQUFUO0NBRUUsRUFBVSxJQUFWLENBQUE7Q0FBQSxFQUNRLEVBQVIsRUFBUSxDQUFSO0NBREEsRUFFQSxDQUZBLElBRUE7Q0FGQSxFQUdBLENBSEEsSUFHQTtDQUhBLEVBSU0sRUFBTixHQUFBO0FBR0EsQ0FBQSxZQUFBLG9DQUFBOytCQUFBO0NBQ0UsQ0FBRyxDQUFBLENBQUEsTUFBSDtDQUNFLEdBQU8sQ0FBUCxPQUFBO1lBRko7Q0FBQSxRQVBBO0NBQUEsQ0FZZ0MsQ0FBaEIsQ0FBSSxDQUFKLEdBQWhCLEtBQUE7Q0FaQSxFQWNBLEtBQUE7Q0FBTSxDQUNHLEdBQVAsRUFESSxHQUNKO0NBREksQ0FFQyxDQUFMLEVBRkksS0FFSjtDQUZJLENBR0osQ0FBMEIsQ0FBVCxDQUFKLEdBQUEsRUFBYjtDQUhJLENBSU8sR0FKUCxJQUlKLENBQUE7Q0FKSSxDQUtLLENBTEwsSUFLSixHQUFBO0NBTEksQ0FNSyxDQU5MLElBTUosR0FBQTtDQXBCRixTQUFBO0NBQUEsRUF1QkEsQ0FBQSxJQUFBLENBQVM7Q0F6QlgsTUFsQkE7Q0FBQSxDQThDQSxFQUFDLENBQUQsQ0FBQTtDQTlDQSxDQStDQSxDQUFLLENBQUMsQ0FBRCxDQUFMO0NBL0NBLEVBbURFLEdBREY7Q0FDRSxDQUFLLENBQUwsS0FBQTtDQUFBLENBQ08sR0FBUCxHQUFBO0NBREEsQ0FFUSxJQUFSLEVBQUE7Q0FGQSxDQUdNLEVBQU4sSUFBQTtDQXRERixPQUFBO0NBQUEsRUF3RFEsQ0FBQSxDQUFSLENBQUE7Q0F4REEsRUEyRFMsR0FBVDtDQTNEQSxDQTZETSxDQUFGLEVBQVEsQ0FBWixPQUNVO0NBOURWLENBaUVNLENBQUYsRUFBUSxDQUFaLE9BRVU7Q0FuRVYsQ0FxRVUsQ0FBRixDQUFBLENBQVIsQ0FBQSxFQUFRO0NBckVSLENBeUVVLENBQUYsQ0FBQSxDQUFSLENBQUE7Q0F6RUEsQ0FBQSxDQTZFaUIsR0FBakIsT0FBaUIsQ0FBakI7Q0E3RUEsQ0E4RVEsQ0FBUixDQUFpQixDQUFELENBQWhCLENBQU0sQ0FBQSxHQUFBLENBSWdCO0NBbEZ0QixDQXFGaUIsQ0FEZCxDQUFILENBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsS0FBQTtBQWVjLENBbkdkLENBZ0dpQixDQURkLENBQUgsQ0FBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtDQS9GQSxDQThHbUIsQ0FIaEIsQ0FBSCxDQUFBLENBQUEsQ0FBQSxFQUFBO0NBSXlCLE1BQUEsUUFBQTtDQUp6QixDQUttQixDQUFBLENBTG5CLEdBSWUsRUFDSztDQUFELEVBQWEsRUFBTixVQUFBO0NBTDFCLENBTWUsQ0FOZixDQUFBLEdBS21CLEVBQ0g7Q0FBTSxRQUFBLE1BQUE7Q0FOdEIsQ0FPb0IsQ0FBQSxDQVBwQixHQU1lLENBTmYsQ0FPcUI7Q0FBZSxFQUFBLEdBQVQsR0FBUyxNQUFUO0NBUDNCLENBUW1CLENBQUEsRUFSbkIsQ0FBQSxDQU9vQixFQUNBO0NBQUQsY0FBTztDQVIxQixNQVFtQjtDQW5IbkIsQ0F5SGlCLENBSGQsQ0FBSCxDQUNXLENBRFgsQ0FBQSxFQUFBLEVBQUEsQ0FBQTtDQUlzQixFQUFVLFlBQVg7Q0FKckIsQ0FLYyxDQUFBLENBTGQsR0FJYyxFQUNDO0NBQU8sRUFBbUIsVUFBbkIsRUFBRDtDQUxyQixDQU1jLENBQUEsQ0FOZCxHQUtjLEVBQ0M7Q0FBTyxFQUFNLFlBQU47Q0FOdEIsQ0FPYyxDQUFBLENBUGQsR0FNYyxFQUNDO0NBQUQsRUFBZ0IsR0FBVCxTQUFBO0NBUHJCLE1BT2M7Q0E3SGQsQ0FrSWlCLENBSGQsQ0FBSCxDQUNXLENBRFgsQ0FBQSxDQUFBLENBQUE7Q0FJcUIsRUFBUyxZQUFWO0NBSnBCLENBS2EsQ0FMYixDQUFBLEdBSWEsRUFDQztDQUFPLEVBQW1CLFVBQW5CLEVBQUQ7Q0FMcEIsRUFBQSxDQUFBLEdBS2E7Q0FwSWIsQ0EwSWlCLENBSGQsQ0FBSCxDQUNXLENBRFgsQ0FBQSxFQUFBLEVBQUEsQ0FBQTtDQUlxQixDQUFELENBQVEsWUFBUjtDQUpwQixDQUthLENBTGIsQ0FBQSxHQUlhLEVBQ0M7Q0FBTyxDQUFELENBQW9CLFVBQW5CLEVBQUQ7Q0FMcEIsRUFNUSxDQU5SLEdBS2EsRUFDSjtDQUFELEVBQWdCLEtBQVQsT0FBQTtDQU5mLE1BTVE7Q0E3SVIsQ0FtSmlCLENBSGQsQ0FBSCxDQUNXLENBRFgsQ0FBQSxFQUFBLEtBQUEsQ0FBQTtDQUlzQixFQUFVLFlBQVg7Q0FKckIsQ0FLYyxDQUFBLENBTGQsR0FJYyxFQUNDO0NBQU8sRUFBbUIsVUFBbkIsRUFBRDtDQUxyQixDQU1jLENBQUEsQ0FOZCxHQUtjLEVBQ0M7Q0FBTyxFQUFNLFlBQU47Q0FOdEIsQ0FPYyxDQUFBLENBUGQsR0FNYyxFQUNDO0NBQUQsRUFBZ0IsR0FBVCxTQUFBO0NBUHJCLE1BT2M7Q0F2SmQsQ0E0SmlCLENBSGQsQ0FBSCxDQUNXLENBRFgsQ0FBQSxFQUFBLENBQUEsQ0FBQTtDQUlxQixFQUFTLFlBQVY7Q0FKcEIsQ0FLYSxDQUxiLENBQUEsR0FJYSxFQUNDO0NBQU8sRUFBb0IsVUFBcEIsRUFBRDtDQUxwQixFQUFBLENBQUEsR0FLYTtDQTlKYixDQXFLaUIsQ0FIZCxDQUFILENBQ1csQ0FEWCxDQUFBLEVBQUEsS0FBQSxDQUFBO0NBSXFCLENBQUQsQ0FBUSxZQUFSO0NBSnBCLENBS2EsQ0FMYixDQUFBLEdBSWEsRUFDQztDQUFPLENBQUQsQ0FBb0IsVUFBbkIsRUFBRDtDQUxwQixFQU1RLENBTlIsR0FLYSxFQUNKO0NBQUQsRUFBZSxJQUFSLFFBQUE7Q0FOZixNQU1RO0NBeEtSLENBOEtpQixDQUhkLENBQUgsQ0FDVyxDQURYLENBQUEsRUFBQSxLQUFBLENBQUE7Q0FJc0IsRUFBVSxZQUFYO0NBSnJCLENBS2MsQ0FBQSxDQUxkLEdBSWMsRUFDQztDQUFPLENBQUQsQ0FBb0IsVUFBbkIsRUFBRDtDQUxyQixDQU1jLENBQUEsQ0FOZCxHQUtjLEVBQ0M7Q0FBTyxFQUFNLFlBQU47Q0FOdEIsQ0FPYyxDQUFBLENBUGQsR0FNYyxFQUNDO0NBQUQsRUFBZ0IsR0FBVCxTQUFBO0NBUHJCLE1BT2M7Q0FsTGQsQ0F1TGlCLENBSGQsQ0FBSCxDQUNXLENBRFgsQ0FBQSxFQUFBLENBQUEsQ0FBQTtDQUlxQixFQUFTLFlBQVY7Q0FKcEIsQ0FLYSxDQUxiLENBQUEsR0FJYSxFQUNDO0NBQU8sQ0FBRCxDQUFvQixVQUFuQixFQUFEO0NBTHBCLEVBQUEsQ0FBQSxHQUthO0NBekxiLENBK0xpQixDQUhkLENBQUgsQ0FDVyxDQURYLENBQUEsRUFBQSxLQUFBLENBQUE7Q0FJcUIsQ0FBRCxDQUFRLFlBQVI7Q0FKcEIsQ0FLYSxDQUxiLENBQUEsR0FJYSxFQUNDO0NBQU8sQ0FBRCxDQUFvQixVQUFuQixFQUFEO0NBTHBCLEVBTVEsQ0FOUixHQUthLEVBQ0o7Q0FBRCxFQUFlLElBQVIsUUFBQTtDQU5mLE1BTVE7Q0FHUixHQUFHLENBQUEsQ0FBSCxLQUFBO0NBQ0UsR0FBQyxDQUFELENBQUEsRUFBQSw4SkFBQTtRQXRNRjtDQXVNQSxHQUFHLENBQUEsQ0FBSCxLQUFBO0NBQ0UsR0FBQyxDQUFELENBQUEsRUFBQSxpS0FBQTtRQXhNRjtDQXlNQSxHQUFHLENBQUEsQ0FBSCxNQUFBO0NBQ0UsR0FBQyxDQUFELENBQUEsRUFBQSwrSkFBQTtRQTFNRjtDQTRNQyxHQUFBLENBQUQsQ0FBQSxPQUFBLGFBQUE7TUE5TWU7Q0F4Tm5CLEVBd05tQjs7Q0F4Tm5CLEVBd2FjLElBQUEsRUFBQyxHQUFmO0NBQ0UsT0FBQSxnQkFBQTtDQUFBO0NBQ0UsQ0FBZ0MsQ0FBckIsR0FBWCxDQUFrQixDQUFsQixDQUFXO0NBQVgsRUFDVyxDQUFBLENBQUEsQ0FBWCxFQUFBO0NBREEsQ0FFaUMsQ0FBbkIsR0FBZCxFQUFjLENBQW9CLEVBQWxDO0NBQW9ELFNBQVgsS0FBQTtDQUEzQixNQUFtQjtDQUNqQyxVQUFBLEVBQU87TUFKVDtDQU1FLEtBREk7Q0FDSixDQUFBLFdBQU87TUFQRztDQXhhZCxFQXdhYzs7Q0F4YWQsRUFpYlcsQ0FBQSxLQUFYO0NBQ0UsT0FBQSxhQUFBO0FBQUEsQ0FBQTtVQUFBLGlDQUFBO29CQUFBO0NBQ0UsR0FBRyxDQUFjLENBQWpCLEVBQUcsU0FBSDtDQUNFLEVBQWUsRUFBZixHQUFBLEVBQUE7Q0FBQSxFQUNZLElBQVo7TUFGRixFQUFBO0NBSUUsRUFBZ0IsQ0FBQSxNQUFoQjtRQUxKO0NBQUE7cUJBRFM7Q0FqYlgsRUFpYlc7O0NBamJYLEVBeWJXLE1BQVg7Q0FDSSxFQUFTLENBQVQsR0FBUyxHQUFBO0NBQVQsRUFDQSxDQUFBLEdBQVEsR0FBQTtDQUNQLEVBQUQsSUFBUSxHQUFBLENBQVI7Q0E1YkosRUF5Ylc7O0NBemJYLEVBOGJXLENBQUEsS0FBWDtDQUNFLE9BQUEsYUFBQTtBQUFBLENBQUE7VUFBQSxpQ0FBQTtvQkFBQTtDQUNFLEVBQWlCLENBQWQsRUFBSCxDQUFBLEVBQUc7Q0FDRCxFQUFjLE1BQWQ7TUFERixFQUFBO0NBR0UsRUFBYyxJQUFBLEVBQWQsQ0FBYztRQUpsQjtDQUFBO3FCQURTO0NBOWJYLEVBOGJXOztDQTliWDs7Q0FEMkI7O0FBc2M3QixDQWpkQSxFQWlkaUIsR0FBWCxDQUFOLE9BamRBOzs7O0FDQUEsSUFBQSx1Q0FBQTtHQUFBOztrU0FBQTs7QUFBQSxDQUFBLEVBQVksSUFBQSxFQUFaLEVBQVk7O0FBQ1osQ0FEQSxFQUNZLElBQUEsRUFBWixrQkFBWTs7QUFDWixDQUZBLENBRUEsQ0FBSyxHQUFNOztBQUVMLENBSk47Q0FLRTs7Ozs7O0NBQUE7O0NBQUEsRUFBTSxDQUFOLE1BQUE7O0NBQUEsRUFDVyxNQUFYLENBREE7O0NBQUEsRUFFVSxLQUFWLENBQW1COztDQUZuQixDQUtFLENBRlcsT0FBQSxFQUFiLFNBQWE7O0NBSGIsRUFTUSxHQUFSLEdBQVE7Q0FHTixPQUFBLHNKQUFBO0NBQUEsQ0FBeUMsQ0FBbEMsQ0FBUCxFQUFPLENBQUEsRUFBQSxZQUFBO0NBQVAsRUFFWSxDQUFaLENBQVksQ0FBQSxDQUFPLEVBQUMsQ0FBQTtDQUZwQixDQUdpRCxDQUFsQyxDQUFmLEdBQWUsRUFBQSxHQUFmLEVBQWUsT0FBQTtDQUhmLEVBSWUsQ0FBZixDQUFxQixPQUFyQjtDQUpBLENBTXdDLENBQXhDLENBQUEsR0FBTSxFQUFBLEtBQUEsT0FBQTtDQU5OLENBT3dDLENBQXhDLENBQUEsR0FBTSxFQUFBLEVBQUEsVUFBQTtDQUdOLEVBQUEsQ0FBQTtDQUNFLEVBQU0sQ0FBSCxFQUFILENBQUc7Q0FDRCxFQUEwQixLQUExQixlQUFBO01BREYsRUFBQTtDQUdFLEVBQTBCLElBQUEsQ0FBMUIsRUFBMEIsYUFBMUI7UUFKSjtNQUFBO0NBTUUsRUFBMEIsR0FBMUIsR0FBQSxjQUFBO01BaEJGO0NBa0JBLEVBQUEsQ0FBQTtDQUNFLEVBQU0sQ0FBSCxFQUFILENBQUc7Q0FDRCxFQUF1QixLQUF2QixZQUFBO01BREYsRUFBQTtDQUdFLEVBQXVCLElBQUEsQ0FBdkIsRUFBdUIsVUFBdkI7UUFKSjtNQUFBO0NBTUUsRUFBdUIsR0FBdkIsR0FBQSxXQUFBO01BeEJGO0NBQUEsQ0EwQm1DLENBQXZCLENBQVosR0FBWSxFQUFaLENBQVk7Q0FDWixHQUFBLEtBQUE7Q0FDRSxFQUFZLEdBQVosQ0FBWSxFQUFaLENBQVk7TUFEZDtDQUdFLEVBQVksR0FBWixHQUFBO01BOUJGO0NBQUEsQ0FnQzZDLENBQWxDLENBQVgsR0FBVyxDQUFYLENBQVcsR0FBQSxTQUFBO0NBaENYLENBaUMwQixDQUExQixDQUFBLEdBQU8sQ0FBUCxJQUFBO0NBQ0EsRUFBRyxDQUFILElBQVc7Q0FFVCxFQUFxQixDQUFyQixFQUFBLFlBQUE7Q0FDQSxHQUFHLEVBQUgsTUFBQTtDQUNFLEdBQUMsSUFBRCxXQUFBO01BREYsRUFBQTtDQUdFLEVBQXFCLEVBQUEsR0FBckIsRUFBcUIsT0FBckI7UUFOSjtNQUFBO0NBUUUsRUFBcUIsRUFBckIsQ0FBQSxZQUFBO0NBQUEsRUFDb0IsRUFEcEIsQ0FDQSxXQUFBO01BM0NGO0NBQUEsRUFnREUsQ0FERixHQUFBO0NBQ0UsQ0FBUSxFQUFDLENBQUssQ0FBZCxLQUFRO0NBQVIsQ0FDYSxFQUFDLEVBQWQsS0FBQTtDQURBLENBRVksRUFBQyxDQUFLLENBQWxCLElBQUEsR0FBWTtDQUZaLENBR08sRUFBQyxDQUFSLENBQUEsQ0FBZTtDQUhmLENBSWMsSUFBZCxNQUFBO0NBSkEsQ0FLTSxFQUFOLEVBQUE7Q0FMQSxDQU1jLElBQWQsTUFBQTtDQU5BLENBUXlCLElBQXpCLGlCQUFBO0NBUkEsQ0FTc0IsSUFBdEIsY0FBQTtDQVRBLENBV1csSUFBWCxHQUFBO0NBWEEsQ0FZb0IsSUFBcEIsWUFBQTtDQVpBLENBYW1CLElBQW5CLFdBQUE7Q0FiQSxDQWNTLElBQVQsQ0FBQSxDQWRBO0NBaERGLEtBQUE7Q0FBQSxDQWdFb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUyxDQUFUO0NBQ1QsR0FBQSxPQUFELFFBQUE7Q0E3RUYsRUFTUTs7Q0FUUixFQStFcUIsQ0FBQSxLQUFDLFVBQXRCO0NBRUUsT0FBQSxhQUFBO0FBQUEsQ0FBQTtVQUFBLGlDQUFBO29CQUFBO0NBQ0UsRUFBeUIsQ0FBdEIsQ0FBQSxDQUFILElBQUc7Q0FDRCxFQUFpQixTQUFqQjtNQURGLEVBQUE7Q0FHRSxFQUFpQixTQUFqQjtRQUpKO0NBQUE7cUJBRm1CO0NBL0VyQixFQStFcUI7O0NBL0VyQjs7Q0FEd0I7O0FBd0YxQixDQTVGQSxFQTRGaUIsR0FBWCxDQUFOLElBNUZBOzs7O0FDQUEsSUFBQSxxQ0FBQTs7QUFBQSxDQUFBLEVBQWMsSUFBQSxJQUFkLFFBQWM7O0FBQ2QsQ0FEQSxFQUNlLElBQUEsS0FBZixRQUFlOztBQUNmLENBRkEsRUFFaUIsSUFBQSxPQUFqQixRQUFpQjs7QUFFakIsQ0FKQSxFQUlVLEdBQUosR0FBcUIsS0FBM0I7Q0FDRSxDQUFBLEVBQUEsRUFBTSxLQUFNLENBQUEsRUFBQTtDQUVMLEtBQUQsR0FBTixFQUFBLEdBQW1CO0NBSEs7Ozs7QUNKMUIsSUFBQSx1RUFBQTtHQUFBOztrU0FBQTs7QUFBQSxDQUFBLEVBQVksSUFBQSxFQUFaLEVBQVk7O0FBQ1osQ0FEQSxFQUNZLElBQUEsRUFBWixrQkFBWTs7QUFDWixDQUZBLENBRUEsQ0FBSyxHQUFNOztBQUNYLENBSEEsRUFHWSxJQUFBLEVBQVosTUFBWTs7QUFDWixDQUpBLENBQUEsQ0FJVyxLQUFYOztBQUNBLENBQUEsSUFBQSxXQUFBO3dCQUFBO0NBQ0UsQ0FBQSxDQUFZLElBQUgsQ0FBQSwrQkFBQTtDQURYOztBQUdNLENBUk47Q0FTRSxLQUFBLDBDQUFBOztDQUFBOzs7Ozs7Ozs7Q0FBQTs7Q0FBQSxFQUFNLENBQU4sT0FBQTs7Q0FBQSxFQUNXLE1BQVgsRUFEQTs7Q0FBQSxFQUVVLEtBQVYsQ0FBbUI7O0NBRm5CLEVBR2EsU0FBYixnQkFBYTs7Q0FIYixFQU9RLEdBQVIsR0FBUTtDQUNOLE9BQUEsaUxBQUE7T0FBQSxLQUFBO0NBQUEsQ0FBeUQsQ0FBekMsQ0FBaEIsR0FBZ0IsQ0FBQSxDQUFBLElBQWhCLGVBQWdCO0NBQWhCLEdBQ0EsS0FBQSxJQUFBO0NBREEsQ0FHbUMsQ0FBdkIsQ0FBWixLQUFBLFdBQVksS0FBQSxDQUFBO0NBSFosR0FLQSxRQUFBOztBQUFnQixDQUFBO1lBQUEsd0NBQUE7a0NBQUE7Q0FBQSxHQUFJO0NBQUo7O0NBTGhCO0NBQUEsR0FNQSxPQUFBOztBQUFlLENBQUE7WUFBQSx3Q0FBQTtrQ0FBQTtDQUFBLEdBQUk7Q0FBSjs7Q0FOZjtDQUFBLEdBT0EsYUFBQTs7QUFBcUIsQ0FBQTtZQUFBLHdDQUFBO2tDQUFBO0NBQUEsR0FBSTtDQUFKOztDQVByQjtDQUFBLEVBU2MsQ0FBZCxPQUFBLENBQWM7Q0FUZCxFQVVjLENBQWQsT0FBQSxDQUFjO0NBVmQsRUFZYSxDQUFiLE1BQUEsQ0FBYTtDQVpiLEVBYWEsQ0FBYixNQUFBLENBQWE7Q0FiYixFQWVtQixDQUFuQixZQUFBLENBQW1CO0NBZm5CLEVBZ0JtQixDQUFuQixZQUFBLENBQW1CO0NBaEJuQixFQWtCZSxDQUFmLENBQXFCLE9BQXJCO0NBbEJBLEVBb0JFLENBREYsR0FBQTtDQUNFLENBQVEsRUFBQyxDQUFLLENBQWQsS0FBUTtDQUFSLENBQ2EsRUFBQyxFQUFkLEtBQUE7Q0FEQSxDQUVZLEVBQUMsQ0FBSyxDQUFsQixJQUFBLEdBQVk7Q0FGWixDQUdPLEVBQUMsQ0FBUixDQUFBLENBQWU7Q0FIZixDQUlXLElBQVgsR0FBQTtDQUpBLENBS2MsSUFBZCxNQUFBO0NBekJGLEtBQUE7Q0FBQSxDQTJCb0MsQ0FBaEMsQ0FBSixFQUFVLENBQUEsQ0FBUztDQTNCbkIsR0E0QkEsRUFBQSxHQUFBO0NBQXFCLENBQTJCLElBQTFCLGtCQUFBO0NBQUQsQ0FBcUMsR0FBTixDQUFBLENBQS9CO0NBNUJyQixLQTRCQTtDQTVCQSxFQTZCcUIsQ0FBckIsRUFBQSxHQUFBO0NBQ0csSUFBRCxRQUFBLEVBQUE7Q0FERixJQUFxQjtDQUdyQixDQUFBLEVBQUEsRUFBUztDQUNQLENBQWlDLEVBQWhDLEVBQUQsRUFBQSxDQUFBLENBQUEsQ0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUE7Q0FBQSxDQUdpQyxFQUFoQyxFQUFELEdBQUEsRUFBQSxFQUFBLENBQUEsRUFBQSxFQUFBLEtBQUEsRUFBQTtDQUdDLENBQWdDLEVBQWhDLElBQUQsRUFBQSxHQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQTtNQXhDSTtDQVBSLEVBT1E7O0NBUFIsQ0FrRGtDLENBQWhCLENBQUEsS0FBQyxDQUFELEdBQUEsR0FBbEI7Q0FDSSxPQUFBLHVFQUFBO0NBQUEsRUFBSSxDQUFKO0NBQUEsRUFDSSxDQUFKO0NBREEsRUFFUyxDQUFULEVBQUE7Q0FBUyxDQUFNLEVBQUwsRUFBQTtDQUFELENBQWMsQ0FBSixHQUFBO0NBQVYsQ0FBdUIsR0FBTixDQUFBO0NBQWpCLENBQW1DLElBQVI7Q0FBM0IsQ0FBNkMsR0FBTixDQUFBO0NBRmhELEtBQUE7Q0FBQSxFQUdTLENBQVQsQ0FBQSxDQUFpQjtDQUhqQixFQUlTLENBQVQsQ0FBUyxDQUFUO0NBSkEsRUFLUyxDQUFULENBQUEsQ0FBaUI7Q0FMakIsRUFNUyxDQUFULENBQVMsQ0FBVDtDQU5BLENBU29DLENBQXpCLENBQVgsQ0FBVyxDQUFBLEVBQVgsQ0FBVyxDQUFBLENBQUE7Q0FUWCxDQWlCQSxDQUFLLENBQUwsRUFBSyxJQUFVO0NBakJmLENBa0JFLEVBQUYsQ0FBQSxHQUFBLEtBQUE7Q0FsQkEsQ0FxQlksQ0FBRixDQUFWLENBQVUsQ0FBQSxDQUFWLFFBQVU7Q0FyQlYsQ0E0QmlCLENBQUYsQ0FBZixDQUFlLENBQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQSxFQUFmLEVBQWU7Q0E1QmYsQ0F3Q0EsQ0FDbUIsQ0FEbkIsSUFBUSxDQUNZLEVBRHBCLENBQUE7Q0FHSSxDQUFtQyxDQUF5QyxDQUFyRSxDQUFBLENBQTJFLENBQXBFLENBQWlGLENBQXhGLENBQW1ILEVBQW5ILENBQUEsRUFBNEMsU0FBQTtDQUh2RCxJQUNtQjtDQXpDbkIsQ0E2Q0EsQ0FFbUIsQ0FGbkIsSUFBUSxDQUVZLEVBRnBCLENBQUE7Q0FHSSxDQUE0QixDQUFhLENBQWxDLENBQUEsQ0FBQSxDQUFPLEVBQW1ELElBQTFEO0NBSFgsSUFFbUI7Q0EvQ25CLENBa0RBLENBQ2tCLENBRGxCLElBQVEsQ0FDVyxDQURuQixFQUFBO0NBRUksQ0FBbUMsR0FBNUIsRUFBTyxDQUFQLElBQUEsQ0FBQTtDQUZYLElBQ2tCO0NBbkRsQixDQXFEQSxDQUNtQixDQURuQixJQUFRLENBQ1ksRUFEcEIsQ0FBQTtDQUMwQixDQUFtQyxDQUF5QyxDQUFyRSxDQUFBLENBQTJFLENBQXBFLENBQWlGLENBQXhGLENBQW1ILEVBQW5ILENBQUEsR0FBNEMsUUFBQTtDQUQ3RSxJQUNtQjtDQXREbkIsQ0F1REEsQ0FDbUIsQ0FEbkIsSUFBUSxDQUNZLEVBRHBCLENBQUE7Q0FDMEIsQ0FBNEIsQ0FBYSxDQUFsQyxDQUFBLENBQUEsQ0FBTyxFQUFtRCxJQUExRDtDQURqQyxJQUNtQjtDQUNWLENBQVQsQ0FDa0IsS0FEVixDQUNXLENBRG5CLENBQUEsQ0FBQTtDQUN5QixDQUFtQyxHQUE1QixFQUFPLENBQVAsSUFBQSxDQUFBO0NBRGhDLElBQ2tCO0NBN0d0QixFQWtEa0I7O0NBbERsQixFQWdIaUIsTUFBQSxNQUFqQjtDQUNFLEdBQUEsSUFBQTtDQUFBLEVBQU8sQ0FBUCxLQUFPO0NBQ1AsR0FBQSxDQUFXLGVBQVg7Q0FDRSxHQUFDLEVBQUQsVUFBQTtDQUFBLEdBQ0MsRUFBRCxVQUFBO0NBQ0MsR0FBQSxTQUFELEdBQUE7SUFDTSxDQUFRLENBSmhCLG9CQUFBO0NBS0UsR0FBQyxFQUFELFVBQUE7Q0FBQSxHQUNDLEVBQUQsVUFBQTtDQUNDLEdBQUEsU0FBRCxHQUFBO0lBQ00sQ0FBUSxDQVJoQixtQkFBQTtDQVNFLEdBQUMsRUFBRCxVQUFBO0NBQUEsR0FDQyxFQUFELFVBQUE7Q0FDQyxHQUFBLFNBQUQsR0FBQTtNQWJhO0NBaEhqQixFQWdIaUI7O0NBaEhqQixDQWdJQSxDQUFZLENBQUEsR0FBQSxFQUFaO0NBQ0UsT0FBQSxPQUFBO0NBQUEsRUFBTyxDQUFQLEdBQWUsY0FBUjtDQUFQLEVBQ1EsQ0FBUixDQUFBO0NBREEsQ0FFQSxDQUFLLENBQUwsQ0FGQTtDQUdBLENBQXdCLENBQUssQ0FBN0IsQ0FBa0M7Q0FBbEMsQ0FBYSxDQUFELENBQUwsU0FBQTtNQUhQO0NBSUEsQ0FBQSxDQUFZLENBQUwsT0FBQTtDQXJJVCxFQWdJWTs7Q0FoSVosQ0F3STBCLENBQWIsQ0FBQSxLQUFDLENBQUQsQ0FBYjtDQUNFLE9BQUEsNk5BQUE7Q0FBQSxFQUFPLENBQVA7Q0FBQSxFQUNRLENBQVIsQ0FBQTtDQURBLEVBRVMsQ0FBVCxFQUFBO0NBRkEsRUFHUyxDQUFULEVBQUE7Q0FBUyxDQUFNLEVBQUwsRUFBQTtDQUFELENBQWMsQ0FBSixHQUFBO0NBQVYsQ0FBdUIsR0FBTixDQUFBO0NBQWpCLENBQW1DLElBQVI7Q0FBM0IsQ0FBNkMsR0FBTixDQUFBO0NBSGhELEtBQUE7Q0FBQSxFQUlVLENBQVYsR0FBQTtDQUFVLENBQVEsSUFBUDtDQUFELENBQW1CLElBQVA7Q0FBWixDQUE4QixJQUFQO0NBQXZCLENBQXdDLElBQVA7Q0FKM0MsS0FBQTtDQUFBLEVBS08sQ0FBUDtDQUxBLEVBTU8sQ0FBUDtDQU5BLEVBT1UsQ0FBVixHQUFBO0NBUEEsRUFRUyxDQUFULEVBQUE7Q0FSQSxFQVNVLENBQVYsR0FBQTtDQVRBLEVBVVMsQ0FBVCxFQUFBO0NBVkEsRUFZWSxDQUFaLEdBWkEsRUFZQTtDQVpBLEVBYVksQ0FBWixLQUFBO0NBYkEsRUFjTyxDQUFQO0NBZEEsRUFlTyxDQUFQLEtBZkE7Q0FBQSxDQWdCVyxDQUFGLENBQVQsQ0FBaUIsQ0FBakI7Q0FoQkEsQ0FpQlcsQ0FBRixDQUFULENBQWlCLENBQWpCO0NBakJBLEVBa0JlLENBQWYsUUFBQTtDQWxCQSxFQW1CZSxDQUFmLFFBQUE7Q0FuQkEsRUFvQmUsQ0FBZixRQUFBO0NBcEJBLEVBcUJlLENBQWYsUUFBQTtDQXJCQSxFQXNCZSxDQUFmLFFBQUE7Q0F0QkEsRUF1QmlCLENBQWpCLFVBQUE7Q0FFQSxDQUFBLEVBQUEsRUFBUztDQUVQLENBQUEsRUFBSSxFQUFKLElBQUE7Q0FBQSxDQUNBLENBQUssQ0FBSSxFQUFULElBQUs7TUE1QlA7Q0FBQSxFQStCUSxDQUFSLENBQUEsSUFBUztDQUNHLEVBQUssQ0FBZixLQUFTLElBQVQ7Q0FDRSxXQUFBLGdIQUFBO0NBQUEsRUFBSSxDQUFJLElBQVIsQ0FBYztDQUFpQixHQUFFLE1BQWIsT0FBQTtDQUFoQixRQUFTO0NBQWIsRUFDSSxDQUFJLElBQVIsQ0FBYztDQUFpQixHQUFFLE1BQWIsT0FBQTtDQUFoQixRQUFTO0NBRGIsRUFHYyxLQUFkLEdBQUE7Q0FIQSxFQUlhLEVBSmIsR0FJQSxFQUFBO0NBSkEsRUFLYyxHQUxkLEVBS0EsR0FBQTtBQUV3RCxDQUF4RCxHQUF1RCxJQUF2RCxJQUF3RDtDQUF4RCxDQUFVLENBQUgsQ0FBUCxNQUFBO1VBUEE7QUFRd0QsQ0FBeEQsR0FBdUQsSUFBdkQsSUFBd0Q7Q0FBeEQsQ0FBVSxDQUFILENBQVAsTUFBQTtVQVJBO0NBQUEsQ0FXYSxDQUFGLEdBQU8sRUFBbEI7Q0FYQSxDQVlhLENBQUYsQ0FBYyxFQUFkLEVBQVgsRUFBcUI7Q0FackIsQ0FhUSxDQUFSLENBQW9CLENBQWQsQ0FBQSxFQUFOLEVBQWdCO0NBYmhCLEVBY0csR0FBSCxFQUFBO0NBZEEsQ0FpQmtCLENBQWYsQ0FBSCxDQUFrQixDQUFZLENBQTlCLENBQUE7Q0FqQkEsRUFtQkksR0FBQSxFQUFKO0NBbkJBLENBdUJZLENBRFosQ0FBQSxFQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsQ0FDWTtDQXZCWixDQWdDZ0QsQ0FBdkMsQ0FBQyxDQUFELENBQVQsRUFBQSxFQUFnRCxDQUF0QztDQWhDVixDQWlDK0MsQ0FBdEMsRUFBQSxDQUFULEVBQUEsR0FBVTtDQWpDVixHQWtDQSxDQUFBLENBQU0sRUFBTjtDQWxDQSxHQW1DQSxDQUFBLENBQU0sRUFBTjtDQW5DQSxDQW9DQSxDQUFLLENBQUEsQ0FBUSxDQUFSLEVBQUw7Q0FwQ0EsQ0FxQ0EsQ0FBSyxDQUFBLENBQVEsQ0FBUixFQUFMO0FBRytCLENBQS9CLEdBQThCLElBQTlCLE1BQStCO0NBQS9CLENBQVcsQ0FBRixFQUFBLENBQVQsQ0FBUyxHQUFUO1VBeENBO0FBeUMrQixDQUEvQixHQUE4QixJQUE5QixNQUErQjtDQUEvQixDQUFXLENBQUYsRUFBQSxDQUFULENBQVMsR0FBVDtVQXpDQTtDQUFBLENBNENvQyxDQUE1QixDQUFBLENBQVIsQ0FBUSxDQUFBLENBQVI7Q0E1Q0EsQ0FpRGlCLENBQUEsQ0FKakIsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUFBO0NBSStCLEtBQVAsV0FBQTtDQUp4QixDQUtpQixDQUFBLENBTGpCLEtBSWlCO0NBQ2MsS0FBUCxXQUFBO0NBTHhCLENBTWlCLENBTmpCLENBQUEsQ0FBQSxDQU11QixDQU52QixDQUFBLENBS2lCLEtBTGpCLEVBQUE7Q0E3Q0EsQ0E2RGdCLENBSmhCLENBQUEsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUFBO0NBSThCLEtBQVAsV0FBQTtDQUp2QixDQUtnQixDQUxoQixDQUFBLEVBS3NCLENBQW1CLEVBRHpCO0NBRWEsS0FBWCxJQUFBLE9BQUE7Q0FObEIsUUFNVztDQS9EWCxDQWdFbUMsQ0FBbkMsQ0FBQSxDQUFLLENBQUwsQ0FBQSxDQUFBLEtBQUE7Q0FoRUEsQ0F3RWlCLENBQUEsQ0FKakIsQ0FBSyxDQUFMLENBQUEsQ0FBQSxDQUFBO0NBSWlDLEtBQUQsV0FBTjtDQUoxQixDQUtpQixDQUFBLENBTGpCLEtBSWlCO0NBQ2dCLENBQTBCLENBQWpDLEdBQU0sQ0FBbUIsVUFBekI7Q0FMMUIsQ0FNb0IsQ0FBQSxDQU5wQixHQUFBLEVBS2lCO0NBQ0csRUFBYSxDQUFILGFBQUE7Q0FOOUIsQ0FPZ0IsQ0FQaEIsQ0FBQSxFQUFBLEdBTW9CO0NBR0YsRUFBQSxXQUFBO0NBQUEsQ0FBQSxDQUFBLE9BQUE7Q0FBQSxFQUNBLE1BQU0sQ0FBTjtDQUNBLEVBQUEsY0FBTztDQVh6QixDQWFxQixDQUFBLENBYnJCLElBQUEsQ0FRbUI7Q0FNRCxFQUFBLFdBQUE7Q0FBQSxDQUFNLENBQU4sQ0FBVSxDQUFKLEtBQU47Q0FBQSxFQUNBLE9BQUEsSUFBTTtDQUNOLEVBQUEsY0FBTztDQWhCekIsQ0FrQjJCLENBbEIzQixDQUFBLEtBYXFCLEtBYnJCO0NBcEVBLENBNEZvQixDQUpwQixDQUFBLENBQUssQ0FBTCxDQUFBLENBQUEsQ0FBQSxJQUFBO0NBT1EsQ0FBQSxDQUFtQixDQUFaLEVBQU0sV0FBTjtDQVBmLENBUWdCLENBUmhCLENBQUEsS0FNZ0I7Q0FHRCxDQUEwQixDQUFqQyxHQUFNLENBQW1CLFVBQXpCO0NBVFIsRUFVVyxDQVZYLEtBUWdCO0NBRUUsRUFBaUIsQ0FBakIsRUFBYSxFQUFhLEVBQTJCLE9BQTlDO0NBVnpCLFFBVVc7Q0FsR1gsQ0FvR29DLENBQTVCLENBQUEsQ0FBUixDQUFRLENBQUEsQ0FBUjtDQXBHQSxDQXlHaUIsQ0FBQSxDQUpqQixDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJK0IsS0FBUCxXQUFBO0NBSnhCLENBS2lCLENBQUEsQ0FMakIsS0FJaUI7Q0FDYyxLQUFQLFdBQUE7Q0FMeEIsQ0FNaUIsQ0FDWSxDQVA3QixDQUFBLENBTXVCLENBTnZCLENBQUEsQ0FLaUIsS0FMakIsRUFBQTtDQXJHQSxDQXFIZ0IsQ0FKaEIsQ0FBQSxDQUFLLENBQUwsQ0FBQSxDQUFBLENBQUE7Q0FJOEIsS0FBUCxXQUFBO0NBSnZCLENBS2dCLENBTGhCLENBQUEsRUFLc0IsQ0FBYSxFQURuQjtDQUVhLEtBQVgsSUFBQSxPQUFBO0NBTmxCLFFBTVc7Q0F2SFgsQ0F3SG1DLENBQW5DLENBQUEsQ0FBSyxDQUFMLENBQUEsQ0FBQSxHQUFBLEVBSXlCO0NBNUh6QixDQStIa0MsQ0FBekIsQ0FBQSxFQUFULEVBQUE7Q0EvSEEsRUFpSUUsQ0FBQSxDQUFBLENBQU0sQ0FBTixDQURGLENBQ0UsR0FERjtDQUtvQixFQUFpQixDQUFqQixFQUFhLEVBQWEsRUFBMkIsT0FBOUM7Q0FKekIsQ0FLaUIsQ0FMakIsQ0FBQSxLQUlZO0NBRUosYUFBQSxrQkFBQTtDQUFBLEVBQU8sQ0FBUCxFQUFPLElBQVA7Q0FBQSxFQUNhLENBQUEsTUFBYixXQUFrQjtDQURsQixFQUVpQixDQUFBLE1BQWpCLElBQUEsT0FBdUI7Q0FDdkIsQ0FBQSxDQUFvQixDQUFqQixNQUFILElBQUc7Q0FDRCxDQUFBLENBQWlCLFNBQWpCLEVBQUE7WUFKRjtDQUtBLEVBQXNDLENBQWIsQ0FBekIsS0FBQTtDQUFBLGFBQUEsS0FBTztZQUxQO0NBTUEsRUFBWSxDQUFMLGFBQUE7Q0FaZixDQWNpQixDQWRqQixDQUFBLEtBS2lCO0NBVVQsR0FBQSxVQUFBO0NBQUEsRUFBTyxDQUFQLEVBQU8sSUFBUDtDQUNBLENBQUEsQ0FBMEIsQ0FBUCxNQUFuQjtDQUFBLENBQUEsQ0FBWSxDQUFMLGVBQUE7WUFEUDtDQUVBLEVBQVksQ0FBTCxhQUFBO0NBakJmLFFBY2lCO0NBL0luQixDQXNKa0MsQ0FBekIsQ0FBQSxFQUFULEVBQUE7Q0F0SkEsQ0E0Sm9CLENBSmxCLENBQUEsQ0FBQSxDQUFNLENBQU4sQ0FERixDQUNFLEdBREY7Q0FLb0MsS0FBUCxXQUFBO0NBSjNCLENBS2tCLENBQUEsQ0FMbEIsS0FJa0I7Q0FDZ0IsS0FBUCxXQUFBO0NBTDNCLENBTXFCLENBQUEsQ0FOckIsR0FBQSxFQUtrQjtDQUNHLEVBQWEsQ0FBSCxhQUFBO0NBTi9CLENBT2lCLENBUGpCLENBQUEsRUFBQSxHQU1xQjtDQUdMLEVBQUEsV0FBQTtDQUFBLEVBQUEsT0FBQTtDQUFBLEVBQ0EsTUFBTSxDQUFOO0NBQ0EsRUFBQSxjQUFPO0NBWHZCLENBYXNCLENBQUEsQ0FidEIsSUFBQSxDQVFvQjtDQU1KLEVBQUEsV0FBQTtDQUFBLENBQU0sQ0FBTixDQUFVLENBQUosS0FBTjtDQUFBLEVBQ0EsT0FBQSxJQUFNO0NBQ04sRUFBQSxjQUFPO0NBaEJ2QixDQWtCNEIsQ0FsQjVCLENBQUEsS0Fhc0IsS0FidEI7Q0FvQlcsRUFBeUIsQ0FBYixFQUFBLElBQVosSUFBYTtDQUFiLGtCQUFPO1lBQVA7Q0FDQSxnQkFBTztDQXJCbEIsUUFtQnVCO0NBS3hCLENBQ2lCLENBRGxCLENBQUEsRUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQTtDQWpMRixNQUFlO0NBaENqQixJQStCUTtDQS9CUixFQTROYyxDQUFkLENBQUssSUFBVTtBQUNJLENBQWpCLEdBQWdCLEVBQWhCLEdBQTBCO0NBQTFCLElBQUEsVUFBTztRQUFQO0NBQUEsRUFDUSxFQUFSLENBQUE7Q0FGWSxZQUdaO0NBL05GLElBNE5jO0NBNU5kLEVBaU9lLENBQWYsQ0FBSyxDQUFMLEdBQWdCO0FBQ0ksQ0FBbEIsR0FBaUIsRUFBakIsR0FBMkI7Q0FBM0IsS0FBQSxTQUFPO1FBQVA7Q0FBQSxFQUNTLEVBRFQsQ0FDQTtDQUZhLFlBR2I7Q0FwT0YsSUFpT2U7Q0FqT2YsRUFzT2UsQ0FBZixDQUFLLENBQUwsR0FBZ0I7QUFDSSxDQUFsQixHQUFpQixFQUFqQixHQUEyQjtDQUEzQixLQUFBLFNBQU87UUFBUDtDQUFBLEVBQ1MsRUFEVCxDQUNBO0NBRmEsWUFHYjtDQXpPRixJQXNPZTtDQXRPZixFQTJPZ0IsQ0FBaEIsQ0FBSyxFQUFMLEVBQWlCO0FBQ0ksQ0FBbkIsR0FBa0IsRUFBbEIsR0FBNEI7Q0FBNUIsTUFBQSxRQUFPO1FBQVA7Q0FBQSxFQUNVLEVBRFYsQ0FDQSxDQUFBO0NBRmMsWUFHZDtDQTlPRixJQTJPZ0I7Q0EzT2hCLEVBZ1BhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0FuUEYsSUFnUGE7Q0FoUGIsRUFxUGdCLENBQWhCLENBQUssRUFBTCxFQUFpQjtBQUNJLENBQW5CLEdBQWtCLEVBQWxCLEdBQTRCO0NBQTVCLE1BQUEsUUFBTztRQUFQO0NBQUEsRUFDVSxFQURWLENBQ0EsQ0FBQTtDQUZjLFlBR2Q7Q0F4UEYsSUFxUGdCO0NBclBoQixFQTBQZSxDQUFmLENBQUssQ0FBTCxHQUFnQjtBQUNJLENBQWxCLEdBQWlCLEVBQWpCLEdBQTJCO0NBQTNCLEtBQUEsU0FBTztRQUFQO0NBQUEsRUFDUyxFQURULENBQ0E7Q0FGYSxZQUdiO0NBN1BGLElBMFBlO0NBMVBmLEVBK1BhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0FsUUYsSUErUGE7Q0EvUGIsRUFvUWdCLENBQWhCLENBQUssRUFBTCxFQUFpQjtBQUNJLENBQW5CLEdBQWtCLEVBQWxCLEdBQTRCO0NBQTVCLE1BQUEsUUFBTztRQUFQO0NBQUEsRUFDVSxFQURWLENBQ0EsQ0FBQTtDQUZjLFlBR2Q7Q0F2UUYsSUFvUWdCO0NBcFFoQixFQXlRZSxDQUFmLENBQUssQ0FBTCxHQUFnQjtBQUNJLENBQWxCLEdBQWlCLEVBQWpCLEdBQTJCO0NBQTNCLEtBQUEsU0FBTztRQUFQO0NBQUEsRUFDUyxFQURULENBQ0E7Q0FGYSxZQUdiO0NBNVFGLElBeVFlO0NBelFmLEVBOFFrQixDQUFsQixDQUFLLElBQUw7QUFDdUIsQ0FBckIsR0FBb0IsRUFBcEIsR0FBOEI7Q0FBOUIsUUFBQSxNQUFPO1FBQVA7Q0FBQSxFQUNZLEVBRFosQ0FDQSxHQUFBO0NBRmdCLFlBR2hCO0NBalJGLElBOFFrQjtDQTlRbEIsRUFtUm1CLENBQW5CLENBQUssSUFBZSxDQUFwQjtDQUNFLFNBQUE7QUFBc0IsQ0FBdEIsR0FBcUIsRUFBckIsR0FBK0I7Q0FBL0IsU0FBQSxLQUFPO1FBQVA7Q0FBQSxFQUNhLEVBRGIsQ0FDQSxJQUFBO0NBRmlCLFlBR2pCO0NBdFJGLElBbVJtQjtDQW5SbkIsRUF3UmtCLENBQWxCLENBQUssSUFBTDtBQUN1QixDQUFyQixHQUFvQixFQUFwQixHQUE4QjtDQUE5QixRQUFBLE1BQU87UUFBUDtDQUFBLEVBQ1ksRUFEWixDQUNBLEdBQUE7Q0FGZ0IsWUFHaEI7Q0EzUkYsSUF3UmtCO0NBeFJsQixFQTZSb0IsQ0FBcEIsQ0FBSyxJQUFnQixFQUFyQjtDQUNFLFNBQUEsQ0FBQTtBQUF1QixDQUF2QixHQUFzQixFQUF0QixHQUFnQztDQUFoQyxVQUFBLElBQU87UUFBUDtDQUFBLEVBQ2MsRUFEZCxDQUNBLEtBQUE7Q0FGa0IsWUFHbEI7Q0FoU0YsSUE2Um9CO0NBN1JwQixFQWtTYSxDQUFiLENBQUssSUFBUztBQUNJLENBQWhCLEdBQWUsRUFBZixHQUF5QjtDQUF6QixHQUFBLFdBQU87UUFBUDtDQUFBLEVBQ08sQ0FBUCxDQURBLENBQ0E7Q0FGVyxZQUdYO0NBclNGLElBa1NhO0NBbFNiLEVBdVNhLENBQWIsQ0FBSyxJQUFTO0FBQ0ksQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0ExU0YsSUF1U2E7Q0F2U2IsRUE0U2EsQ0FBYixDQUFLLElBQVM7Q0FDWixHQUFBLE1BQUE7QUFBZ0IsQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0EvU0YsSUE0U2E7Q0E1U2IsRUFpVGEsQ0FBYixDQUFLLElBQVM7Q0FDWixHQUFBLE1BQUE7QUFBZ0IsQ0FBaEIsR0FBZSxFQUFmLEdBQXlCO0NBQXpCLEdBQUEsV0FBTztRQUFQO0NBQUEsRUFDTyxDQUFQLENBREEsQ0FDQTtDQUZXLFlBR1g7Q0FwVEYsSUFpVGE7Q0FqVGIsRUFzVGUsQ0FBZixDQUFLLENBQUwsR0FBZTtDQUNiLEtBQUEsT0FBTztDQXZUVCxJQXNUZTtDQXRUZixFQXlUZSxDQUFmLENBQUssQ0FBTCxHQUFlO0NBQ2IsS0FBQSxPQUFPO0NBMVRULElBeVRlO0NBelRmLEVBNFRxQixDQUFyQixDQUFLLElBQWdCLEdBQXJCO0NBQ0UsV0FBQSxDQUFPO0NBN1RULElBNFRxQjtDQTVUckIsRUErVHFCLENBQXJCLENBQUssSUFBZ0IsR0FBckI7Q0FDRSxXQUFBLENBQU87Q0FoVVQsSUErVHFCO0NBL1RyQixFQWtVcUIsQ0FBckIsQ0FBSyxJQUFnQixHQUFyQjtDQUNFLFdBQUEsQ0FBTztDQW5VVCxJQWtVcUI7Q0FsVXJCLEVBcVVxQixDQUFyQixDQUFLLElBQWdCLEdBQXJCO0NBQ0UsV0FBQSxDQUFPO0NBdFVULElBcVVxQjtDQXJVckIsRUF3VXVCLENBQXZCLENBQUssSUFBa0IsS0FBdkI7Q0FDRSxZQUFPLENBQVA7Q0F6VUYsSUF3VXVCO0NBelVaLFVBNlVYO0NBcmRGLEVBd0lhOztDQXhJYixFQXVkVyxDQUFBLEtBQVg7Q0FDRSxPQUFBLGFBQUE7QUFBQSxDQUFBO1VBQUEsaUNBQUE7b0JBQUE7Q0FDRSxFQUFZLEdBQVosQ0FBQSxHQUFZO0NBQVosRUFDVyxHQUFYLENBQVcsR0FBQTtDQUZiO3FCQURTO0NBdmRYLEVBdWRXOztDQXZkWCxDQTRkQSxDQUFZLE1BQVo7Q0FDRSxLQUFBLEVBQUE7Q0FBQSxDQUF3QixDQUFmLENBQVQsQ0FBUyxDQUFULENBQVMsQ0FBQSxFQUFBLENBQUEsQ0FBQSxFQUFBLENBQUE7Q0FDVCxLQUFjLEtBQVA7Q0E5ZFQsRUE0ZFk7O0NBNWRaLENBZ2VBLENBQWlCLE1BQUMsS0FBbEI7Q0FDRSxNQUFBLENBQUE7Q0FBQSxDQUFvQixDQUFWLENBQVYsRUFBVSxDQUFWO0NBQ0EsTUFBZSxJQUFSO0NBbGVULEVBZ2VpQjs7Q0FoZWpCLENBcWVBLENBQWEsTUFBQyxDQUFkO0NBQ0UsR0FBQSxJQUFBO0NBQUEsRUFBSSxDQUFKO0NBQUEsQ0FDbUIsQ0FBWixDQUFQLENBQU87Q0FDUCxFQUFtQixDQUFuQjtDQUFBLEVBQU8sQ0FBUCxFQUFBO01BRkE7Q0FBQSxFQUdPLENBQVA7Q0FDRyxDQUFELENBQVMsQ0FBQSxFQUFYLEtBQUE7Q0ExZUYsRUFxZWE7O0NBcmViOztDQUR5Qjs7QUE2ZTNCLENBcmZBLEVBcWZpQixHQUFYLENBQU4sS0FyZkE7Ozs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSAoZWwpIC0+XG4gICRlbCA9ICQgZWxcbiAgYXBwID0gd2luZG93LmFwcFxuICB0b2MgPSBhcHAuZ2V0VG9jKClcbiAgdW5sZXNzIHRvY1xuICAgIGNvbnNvbGUubG9nICdObyB0YWJsZSBvZiBjb250ZW50cyBmb3VuZCdcbiAgICByZXR1cm5cbiAgdG9nZ2xlcnMgPSAkZWwuZmluZCgnYVtkYXRhLXRvZ2dsZS1ub2RlXScpXG4gICMgU2V0IGluaXRpYWwgc3RhdGVcbiAgZm9yIHRvZ2dsZXIgaW4gdG9nZ2xlcnMudG9BcnJheSgpXG4gICAgJHRvZ2dsZXIgPSAkKHRvZ2dsZXIpXG4gICAgbm9kZWlkID0gJHRvZ2dsZXIuZGF0YSgndG9nZ2xlLW5vZGUnKVxuICAgIHRyeVxuICAgICAgdmlldyA9IHRvYy5nZXRDaGlsZFZpZXdCeUlkIG5vZGVpZFxuICAgICAgbm9kZSA9IHZpZXcubW9kZWxcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhbm9kZS5nZXQoJ3Zpc2libGUnKVxuICAgICAgJHRvZ2dsZXIuZGF0YSAndG9jSXRlbScsIHZpZXdcbiAgICBjYXRjaCBlXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLW5vdC1mb3VuZCcsICd0cnVlJ1xuXG4gIHRvZ2dsZXJzLm9uICdjbGljaycsIChlKSAtPlxuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICRlbCA9ICQoZS50YXJnZXQpXG4gICAgdmlldyA9ICRlbC5kYXRhKCd0b2NJdGVtJylcbiAgICBpZiB2aWV3XG4gICAgICB2aWV3LnRvZ2dsZVZpc2liaWxpdHkoZSlcbiAgICAgICRlbC5hdHRyICdkYXRhLXZpc2libGUnLCAhIXZpZXcubW9kZWwuZ2V0KCd2aXNpYmxlJylcbiAgICBlbHNlXG4gICAgICBhbGVydCBcIkxheWVyIG5vdCBmb3VuZCBpbiB0aGUgY3VycmVudCBUYWJsZSBvZiBDb250ZW50cy4gXFxuRXhwZWN0ZWQgbm9kZWlkICN7JGVsLmRhdGEoJ3RvZ2dsZS1ub2RlJyl9XCJcbiIsImNsYXNzIEpvYkl0ZW0gZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIGNsYXNzTmFtZTogJ3JlcG9ydFJlc3VsdCdcbiAgZXZlbnRzOiB7fVxuICBiaW5kaW5nczpcbiAgICBcImg2IGFcIjpcbiAgICAgIG9ic2VydmU6IFwic2VydmljZU5hbWVcIlxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgYXR0cmlidXRlczogW3tcbiAgICAgICAgbmFtZTogJ2hyZWYnXG4gICAgICAgIG9ic2VydmU6ICdzZXJ2aWNlVXJsJ1xuICAgICAgfV1cbiAgICBcIi5zdGFydGVkQXRcIjpcbiAgICAgIG9ic2VydmU6IFtcInN0YXJ0ZWRBdFwiLCBcInN0YXR1c1wiXVxuICAgICAgdmlzaWJsZTogKCkgLT5cbiAgICAgICAgQG1vZGVsLmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgb25HZXQ6ICgpIC0+XG4gICAgICAgIGlmIEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpXG4gICAgICAgICAgcmV0dXJuIFwiU3RhcnRlZCBcIiArIG1vbWVudChAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKSkuZnJvbU5vdygpICsgXCIuIFwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBcIlwiXG4gICAgXCIuc3RhdHVzXCI6ICAgICAgXG4gICAgICBvYnNlcnZlOiBcInN0YXR1c1wiXG4gICAgICBvbkdldDogKHMpIC0+XG4gICAgICAgIHN3aXRjaCBzXG4gICAgICAgICAgd2hlbiAncGVuZGluZydcbiAgICAgICAgICAgIFwid2FpdGluZyBpbiBsaW5lXCJcbiAgICAgICAgICB3aGVuICdydW5uaW5nJ1xuICAgICAgICAgICAgXCJydW5uaW5nIGFuYWx5dGljYWwgc2VydmljZVwiXG4gICAgICAgICAgd2hlbiAnY29tcGxldGUnXG4gICAgICAgICAgICBcImNvbXBsZXRlZFwiXG4gICAgICAgICAgd2hlbiAnZXJyb3InXG4gICAgICAgICAgICBcImFuIGVycm9yIG9jY3VycmVkXCJcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICBzXG4gICAgXCIucXVldWVMZW5ndGhcIjogXG4gICAgICBvYnNlcnZlOiBcInF1ZXVlTGVuZ3RoXCJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgcyA9IFwiV2FpdGluZyBiZWhpbmQgI3t2fSBqb2JcIlxuICAgICAgICBpZiB2Lmxlbmd0aCA+IDFcbiAgICAgICAgICBzICs9ICdzJ1xuICAgICAgICByZXR1cm4gcyArIFwiLiBcIlxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/IGFuZCBwYXJzZUludCh2KSA+IDBcbiAgICBcIi5lcnJvcnNcIjpcbiAgICAgIG9ic2VydmU6ICdlcnJvcidcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2Py5sZW5ndGggPiAyXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIGlmIHY/XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkodiwgbnVsbCwgJyAgJylcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG51bGxcblxuICBjb25zdHJ1Y3RvcjogKEBtb2RlbCkgLT5cbiAgICBzdXBlcigpXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIEAkZWwuaHRtbCBcIlwiXCJcbiAgICAgIDxoNj48YSBocmVmPVwiI1wiIHRhcmdldD1cIl9ibGFua1wiPjwvYT48c3BhbiBjbGFzcz1cInN0YXR1c1wiPjwvc3Bhbj48L2g2PlxuICAgICAgPGRpdj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJzdGFydGVkQXRcIj48L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwicXVldWVMZW5ndGhcIj48L3NwYW4+XG4gICAgICAgIDxwcmUgY2xhc3M9XCJlcnJvcnNcIj48L3ByZT5cbiAgICAgIDwvZGl2PlxuICAgIFwiXCJcIlxuICAgIEBzdGlja2l0KClcblxubW9kdWxlLmV4cG9ydHMgPSBKb2JJdGVtIiwiY2xhc3MgUmVwb3J0UmVzdWx0cyBleHRlbmRzIEJhY2tib25lLkNvbGxlY3Rpb25cblxuICBkZWZhdWx0UG9sbGluZ0ludGVydmFsOiAzMDAwXG5cbiAgY29uc3RydWN0b3I6IChAc2tldGNoLCBAZGVwcykgLT5cbiAgICBAdXJsID0gdXJsID0gXCIvcmVwb3J0cy8je0Bza2V0Y2guaWR9LyN7QGRlcHMuam9pbignLCcpfVwiXG4gICAgc3VwZXIoKVxuXG4gIHBvbGw6ICgpID0+XG4gICAgQGZldGNoIHtcbiAgICAgIHN1Y2Nlc3M6ICgpID0+XG4gICAgICAgIEB0cmlnZ2VyICdqb2JzJ1xuICAgICAgICBmb3IgcmVzdWx0IGluIEBtb2RlbHNcbiAgICAgICAgICBpZiByZXN1bHQuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICAgICAgICB1bmxlc3MgQGludGVydmFsXG4gICAgICAgICAgICAgIEBpbnRlcnZhbCA9IHNldEludGVydmFsIEBwb2xsLCBAZGVmYXVsdFBvbGxpbmdJbnRlcnZhbFxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgY29uc29sZS5sb2cgQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKVxuICAgICAgICAgIHBheWxvYWRTaXplID0gTWF0aC5yb3VuZCgoKEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJykgb3IgMCkgLyAxMDI0KSAqIDEwMCkgLyAxMDBcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIkZlYXR1cmVTZXQgc2VudCB0byBHUCB3ZWlnaGVkIGluIGF0ICN7cGF5bG9hZFNpemV9a2JcIlxuICAgICAgICAjIGFsbCBjb21wbGV0ZSB0aGVuXG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgIGlmIHByb2JsZW0gPSBfLmZpbmQoQG1vZGVscywgKHIpIC0+IHIuZ2V0KCdlcnJvcicpPylcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBcIlByb2JsZW0gd2l0aCAje3Byb2JsZW0uZ2V0KCdzZXJ2aWNlTmFtZScpfSBqb2JcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgQHRyaWdnZXIgJ2ZpbmlzaGVkJ1xuICAgICAgZXJyb3I6IChlLCByZXMsIGEsIGIpID0+XG4gICAgICAgIHVubGVzcyByZXMuc3RhdHVzIGlzIDBcbiAgICAgICAgICBpZiByZXMucmVzcG9uc2VUZXh0Py5sZW5ndGhcbiAgICAgICAgICAgIHRyeVxuICAgICAgICAgICAgICBqc29uID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgY2F0Y2hcbiAgICAgICAgICAgICAgIyBkbyBub3RoaW5nXG4gICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgICBAdHJpZ2dlciAnZXJyb3InLCBqc29uPy5lcnJvcj8ubWVzc2FnZSBvclxuICAgICAgICAgICAgJ1Byb2JsZW0gY29udGFjdGluZyB0aGUgU2VhU2tldGNoIHNlcnZlcidcbiAgICB9XG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0UmVzdWx0c1xuIiwiZW5hYmxlTGF5ZXJUb2dnbGVycyA9IHJlcXVpcmUgJy4vZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUnXG5yb3VuZCA9IHJlcXVpcmUoJy4vdXRpbHMuY29mZmVlJykucm91bmRcblJlcG9ydFJlc3VsdHMgPSByZXF1aXJlICcuL3JlcG9ydFJlc3VsdHMuY29mZmVlJ1xudCA9IHJlcXVpcmUoJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnKVxudGVtcGxhdGVzID1cbiAgcmVwb3J0TG9hZGluZzogdFsnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmcnXVxuSm9iSXRlbSA9IHJlcXVpcmUgJy4vam9iSXRlbS5jb2ZmZWUnXG5Db2xsZWN0aW9uVmlldyA9IHJlcXVpcmUoJ3ZpZXdzL2NvbGxlY3Rpb25WaWV3JylcblxuY2xhc3MgUmVjb3JkU2V0XG5cbiAgY29uc3RydWN0b3I6IChAZGF0YSwgQHRhYiwgQHNrZXRjaENsYXNzSWQpIC0+XG5cbiAgdG9BcnJheTogKCkgLT5cbiAgICBpZiBAc2tldGNoQ2xhc3NJZFxuICAgICAgZGF0YSA9IF8uZmluZCBAZGF0YS52YWx1ZSwgKHYpID0+XG4gICAgICAgIHYuZmVhdHVyZXM/WzBdPy5hdHRyaWJ1dGVzP1snU0NfSUQnXSBpcyBAc2tldGNoQ2xhc3NJZFxuICAgICAgdW5sZXNzIGRhdGFcbiAgICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZmluZCBkYXRhIGZvciBza2V0Y2hDbGFzcyAje0Bza2V0Y2hDbGFzc0lkfVwiXG4gICAgZWxzZVxuICAgICAgaWYgXy5pc0FycmF5IEBkYXRhLnZhbHVlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVswXVxuICAgICAgZWxzZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVcbiAgICBfLm1hcCBkYXRhLmZlYXR1cmVzLCAoZmVhdHVyZSkgLT5cbiAgICAgIGZlYXR1cmUuYXR0cmlidXRlc1xuXG4gIHJhdzogKGF0dHIpIC0+XG4gICAgYXR0cnMgPSBfLm1hcCBAdG9BcnJheSgpLCAocm93KSAtPlxuICAgICAgcm93W2F0dHJdXG4gICAgYXR0cnMgPSBfLmZpbHRlciBhdHRycywgKGF0dHIpIC0+IGF0dHIgIT0gdW5kZWZpbmVkXG4gICAgaWYgYXR0cnMubGVuZ3RoIGlzIDBcbiAgICAgIGNvbnNvbGUubG9nIEBkYXRhXG4gICAgICBAdGFiLnJlcG9ydEVycm9yIFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfSBmcm9tIHJlc3VsdHNcIlxuICAgICAgdGhyb3cgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9XCJcbiAgICBlbHNlIGlmIGF0dHJzLmxlbmd0aCBpcyAxXG4gICAgICByZXR1cm4gYXR0cnNbMF1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gYXR0cnNcblxuICBpbnQ6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCBwYXJzZUludFxuICAgIGVsc2VcbiAgICAgIHBhcnNlSW50KHJhdylcblxuICBmbG9hdDogKGF0dHIsIGRlY2ltYWxQbGFjZXM9MikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gcm91bmQodmFsLCBkZWNpbWFsUGxhY2VzKVxuICAgIGVsc2VcbiAgICAgIHJvdW5kKHJhdywgZGVjaW1hbFBsYWNlcylcblxuICBib29sOiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgKHZhbCkgLT4gdmFsLnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcbiAgICBlbHNlXG4gICAgICByYXcudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuXG5jbGFzcyBSZXBvcnRUYWIgZXh0ZW5kcyBCYWNrYm9uZS5WaWV3XG4gIG5hbWU6ICdJbmZvcm1hdGlvbidcbiAgZGVwZW5kZW5jaWVzOiBbXVxuXG4gIGluaXRpYWxpemU6IChAbW9kZWwsIEBvcHRpb25zKSAtPlxuICAgICMgV2lsbCBiZSBpbml0aWFsaXplZCBieSBTZWFTa2V0Y2ggd2l0aCB0aGUgZm9sbG93aW5nIGFyZ3VtZW50czpcbiAgICAjICAgKiBtb2RlbCAtIFRoZSBza2V0Y2ggYmVpbmcgcmVwb3J0ZWQgb25cbiAgICAjICAgKiBvcHRpb25zXG4gICAgIyAgICAgLSAucGFyZW50IC0gdGhlIHBhcmVudCByZXBvcnQgdmlld1xuICAgICMgICAgICAgIGNhbGwgQG9wdGlvbnMucGFyZW50LmRlc3Ryb3koKSB0byBjbG9zZSB0aGUgd2hvbGUgcmVwb3J0IHdpbmRvd1xuICAgIEBhcHAgPSB3aW5kb3cuYXBwXG4gICAgXy5leHRlbmQgQCwgQG9wdGlvbnNcbiAgICBAcmVwb3J0UmVzdWx0cyA9IG5ldyBSZXBvcnRSZXN1bHRzKEBtb2RlbCwgQGRlcGVuZGVuY2llcylcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnZXJyb3InLCBAcmVwb3J0RXJyb3JcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZW5kZXJKb2JEZXRhaWxzXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVwb3J0Sm9ic1xuICAgIEBsaXN0ZW5UbyBAcmVwb3J0UmVzdWx0cywgJ2ZpbmlzaGVkJywgXy5iaW5kIEByZW5kZXIsIEBcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAncmVxdWVzdCcsIEByZXBvcnRSZXF1ZXN0ZWRcblxuICByZW5kZXI6ICgpIC0+XG4gICAgdGhyb3cgJ3JlbmRlciBtZXRob2QgbXVzdCBiZSBvdmVyaWRkZW4nXG5cbiAgc2hvdzogKCkgLT5cbiAgICBAJGVsLnNob3coKVxuICAgIEB2aXNpYmxlID0gdHJ1ZVxuICAgIGlmIEBkZXBlbmRlbmNpZXM/Lmxlbmd0aCBhbmQgIUByZXBvcnRSZXN1bHRzLm1vZGVscy5sZW5ndGhcbiAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgIGVsc2UgaWYgIUBkZXBlbmRlbmNpZXM/Lmxlbmd0aFxuICAgICAgQHJlbmRlcigpXG4gICAgICBAJCgnW2RhdGEtYXR0cmlidXRlLXR5cGU9VXJsRmllbGRdIC52YWx1ZSwgW2RhdGEtYXR0cmlidXRlLXR5cGU9VXBsb2FkRmllbGRdIC52YWx1ZScpLmVhY2ggKCkgLT5cbiAgICAgICAgdGV4dCA9ICQoQCkudGV4dCgpXG4gICAgICAgIGh0bWwgPSBbXVxuICAgICAgICBmb3IgdXJsIGluIHRleHQuc3BsaXQoJywnKVxuICAgICAgICAgIGlmIHVybC5sZW5ndGhcbiAgICAgICAgICAgIG5hbWUgPSBfLmxhc3QodXJsLnNwbGl0KCcvJykpXG4gICAgICAgICAgICBodG1sLnB1c2ggXCJcIlwiPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIiN7dXJsfVwiPiN7bmFtZX08L2E+XCJcIlwiXG4gICAgICAgICQoQCkuaHRtbCBodG1sLmpvaW4oJywgJylcblxuXG4gIGhpZGU6ICgpIC0+XG4gICAgQCRlbC5oaWRlKClcbiAgICBAdmlzaWJsZSA9IGZhbHNlXG5cbiAgcmVtb3ZlOiAoKSA9PlxuICAgIHdpbmRvdy5jbGVhckludGVydmFsIEBldGFJbnRlcnZhbFxuICAgIEBzdG9wTGlzdGVuaW5nKClcbiAgICBzdXBlcigpXG5cbiAgcmVwb3J0UmVxdWVzdGVkOiAoKSA9PlxuICAgIEAkZWwuaHRtbCB0ZW1wbGF0ZXMucmVwb3J0TG9hZGluZy5yZW5kZXIoe30pXG5cbiAgcmVwb3J0RXJyb3I6IChtc2csIGNhbmNlbGxlZFJlcXVlc3QpID0+XG4gICAgdW5sZXNzIGNhbmNlbGxlZFJlcXVlc3RcbiAgICAgIGlmIG1zZyBpcyAnSk9CX0VSUk9SJ1xuICAgICAgICBAc2hvd0Vycm9yICdFcnJvciB3aXRoIHNwZWNpZmljIGpvYidcbiAgICAgIGVsc2VcbiAgICAgICAgQHNob3dFcnJvciBtc2dcblxuICBzaG93RXJyb3I6IChtc2cpID0+XG4gICAgQCQoJy5wcm9ncmVzcycpLnJlbW92ZSgpXG4gICAgQCQoJ3AuZXJyb3InKS5yZW1vdmUoKVxuICAgIEAkKCdoNCcpLnRleHQoXCJBbiBFcnJvciBPY2N1cnJlZFwiKS5hZnRlciBcIlwiXCJcbiAgICAgIDxwIGNsYXNzPVwiZXJyb3JcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPiN7bXNnfTwvcD5cbiAgICBcIlwiXCJcblxuICByZXBvcnRKb2JzOiAoKSA9PlxuICAgIHVubGVzcyBAbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgQCQoJ2g0JykudGV4dCBcIkFuYWx5emluZyBEZXNpZ25zXCJcblxuICBzdGFydEV0YUNvdW50ZG93bjogKCkgPT5cbiAgICBpZiBAbWF4RXRhXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEByZXBvcnRSZXN1bHRzLnBvbGwoKVxuICAgICAgLCAoQG1heEV0YSArIDEpICogMTAwMFxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uJywgJ2xpbmVhcidcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLWR1cmF0aW9uJywgXCIje0BtYXhFdGEgKyAxfXNcIlxuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnMTAwJScpXG4gICAgICAsIDUwMFxuXG4gIHJlbmRlckpvYkRldGFpbHM6ICgpID0+XG4gICAgbWF4RXRhID0gbnVsbFxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpZiBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICAgICAgaWYgIW1heEV0YSBvciBqb2IuZ2V0KCdldGFTZWNvbmRzJykgPiBtYXhFdGFcbiAgICAgICAgICBtYXhFdGEgPSBqb2IuZ2V0KCdldGFTZWNvbmRzJylcbiAgICBpZiBtYXhFdGFcbiAgICAgIEBtYXhFdGEgPSBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCc1JScpXG4gICAgICBAc3RhcnRFdGFDb3VudGRvd24oKVxuXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKVxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY2xpY2sgKGUpID0+XG4gICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgIEAkKCdbcmVsPWRldGFpbHNdJykuaGlkZSgpXG4gICAgICBAJCgnLmRldGFpbHMnKS5zaG93KClcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaXRlbSA9IG5ldyBKb2JJdGVtKGpvYilcbiAgICAgIGl0ZW0ucmVuZGVyKClcbiAgICAgIEAkKCcuZGV0YWlscycpLmFwcGVuZCBpdGVtLmVsXG5cbiAgZ2V0UmVzdWx0OiAoaWQpIC0+XG4gICAgcmVzdWx0cyA9IEBnZXRSZXN1bHRzKClcbiAgICByZXN1bHQgPSBfLmZpbmQgcmVzdWx0cywgKHIpIC0+IHIucGFyYW1OYW1lIGlzIGlkXG4gICAgdW5sZXNzIHJlc3VsdD9cbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcmVzdWx0IHdpdGggaWQgJyArIGlkKVxuICAgIHJlc3VsdC52YWx1ZVxuXG4gIGdldEZpcnN0UmVzdWx0OiAocGFyYW0sIGlkKSAtPlxuICAgIHJlc3VsdCA9IEBnZXRSZXN1bHQocGFyYW0pXG4gICAgdHJ5XG4gICAgICByZXR1cm4gcmVzdWx0WzBdLmZlYXR1cmVzWzBdLmF0dHJpYnV0ZXNbaWRdXG4gICAgY2F0Y2ggZVxuICAgICAgdGhyb3cgXCJFcnJvciBmaW5kaW5nICN7cGFyYW19OiN7aWR9IGluIGdwIHJlc3VsdHNcIlxuXG4gIGdldFJlc3VsdHM6ICgpIC0+XG4gICAgcmVzdWx0cyA9IEByZXBvcnRSZXN1bHRzLm1hcCgocmVzdWx0KSAtPiByZXN1bHQuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzKVxuICAgIHVubGVzcyByZXN1bHRzPy5sZW5ndGhcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZ3AgcmVzdWx0cycpXG4gICAgXy5maWx0ZXIgcmVzdWx0cywgKHJlc3VsdCkgLT5cbiAgICAgIHJlc3VsdC5wYXJhbU5hbWUgbm90IGluIFsnUmVzdWx0Q29kZScsICdSZXN1bHRNc2cnXVxuXG4gIHJlY29yZFNldDogKGRlcGVuZGVuY3ksIHBhcmFtTmFtZSwgc2tldGNoQ2xhc3NJZD1mYWxzZSkgLT5cbiAgICB1bmxlc3MgZGVwZW5kZW5jeSBpbiBAZGVwZW5kZW5jaWVzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJVbmtub3duIGRlcGVuZGVuY3kgI3tkZXBlbmRlbmN5fVwiXG4gICAgZGVwID0gQHJlcG9ydFJlc3VsdHMuZmluZCAocikgLT4gci5nZXQoJ3NlcnZpY2VOYW1lJykgaXMgZGVwZW5kZW5jeVxuICAgIHVubGVzcyBkZXBcbiAgICAgIGNvbnNvbGUubG9nIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcmVzdWx0cyBmb3IgI3tkZXBlbmRlbmN5fS5cIlxuICAgIHBhcmFtID0gXy5maW5kIGRlcC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMsIChwYXJhbSkgLT5cbiAgICAgIHBhcmFtLnBhcmFtTmFtZSBpcyBwYXJhbU5hbWVcbiAgICB1bmxlc3MgcGFyYW1cbiAgICAgIGNvbnNvbGUubG9nIGRlcC5nZXQoJ2RhdGEnKS5yZXN1bHRzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCBwYXJhbSAje3BhcmFtTmFtZX0gaW4gI3tkZXBlbmRlbmN5fVwiXG4gICAgbmV3IFJlY29yZFNldChwYXJhbSwgQCwgc2tldGNoQ2xhc3NJZClcblxuICBlbmFibGVUYWJsZVBhZ2luZzogKCkgLT5cbiAgICBAJCgnW2RhdGEtcGFnaW5nXScpLmVhY2ggKCkgLT5cbiAgICAgICR0YWJsZSA9ICQoQClcbiAgICAgIHBhZ2VTaXplID0gJHRhYmxlLmRhdGEoJ3BhZ2luZycpXG4gICAgICByb3dzID0gJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykubGVuZ3RoXG4gICAgICBwYWdlcyA9IE1hdGguY2VpbChyb3dzIC8gcGFnZVNpemUpXG4gICAgICBpZiBwYWdlcyA+IDFcbiAgICAgICAgJHRhYmxlLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8dGZvb3Q+XG4gICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVwiI3skdGFibGUuZmluZCgndGhlYWQgdGgnKS5sZW5ndGh9XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInBhZ2luYXRpb25cIj5cbiAgICAgICAgICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+UHJldjwvYT48L2xpPlxuICAgICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgPC90Zm9vdD5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsID0gJHRhYmxlLmZpbmQoJ3Rmb290IHVsJylcbiAgICAgICAgZm9yIGkgaW4gXy5yYW5nZSgxLCBwYWdlcyArIDEpXG4gICAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+I3tpfTwvYT48L2xpPlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPGxpPjxhIGhyZWY9XCIjXCI+TmV4dDwvYT48L2xpPlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgJHRhYmxlLmZpbmQoJ2xpIGEnKS5jbGljayAoZSkgLT5cbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAgICAgICAkYSA9ICQodGhpcylcbiAgICAgICAgICB0ZXh0ID0gJGEudGV4dCgpXG4gICAgICAgICAgaWYgdGV4dCBpcyAnTmV4dCdcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykubmV4dCgpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdOZXh0J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlIGlmIHRleHQgaXMgJ1ByZXYnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnByZXYoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnUHJldidcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLnJlbW92ZUNsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5hZGRDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgbiA9IHBhcnNlSW50KHRleHQpXG4gICAgICAgICAgICAkdGFibGUuZmluZCgndGJvZHkgdHInKS5oaWRlKClcbiAgICAgICAgICAgIG9mZnNldCA9IHBhZ2VTaXplICogKG4gLSAxKVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoXCJ0Ym9keSB0clwiKS5zbGljZShvZmZzZXQsIG4qcGFnZVNpemUpLnNob3coKVxuICAgICAgICAkKCR0YWJsZS5maW5kKCdsaSBhJylbMV0pLmNsaWNrKClcblxuICAgICAgaWYgbm9Sb3dzTWVzc2FnZSA9ICR0YWJsZS5kYXRhKCduby1yb3dzJylcbiAgICAgICAgaWYgcm93cyBpcyAwXG4gICAgICAgICAgcGFyZW50ID0gJHRhYmxlLnBhcmVudCgpXG4gICAgICAgICAgJHRhYmxlLnJlbW92ZSgpXG4gICAgICAgICAgcGFyZW50LnJlbW92ZUNsYXNzICd0YWJsZUNvbnRhaW5lcidcbiAgICAgICAgICBwYXJlbnQuYXBwZW5kIFwiPHA+I3tub1Jvd3NNZXNzYWdlfTwvcD5cIlxuXG4gIGVuYWJsZUxheWVyVG9nZ2xlcnM6ICgpIC0+XG4gICAgZW5hYmxlTGF5ZXJUb2dnbGVycyhAJGVsKVxuXG4gIGdldENoaWxkcmVuOiAoc2tldGNoQ2xhc3NJZCkgLT5cbiAgICBfLmZpbHRlciBAY2hpbGRyZW4sIChjaGlsZCkgLT4gY2hpbGQuZ2V0U2tldGNoQ2xhc3MoKS5pZCBpcyBza2V0Y2hDbGFzc0lkXG5cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRUYWJcbiIsIm1vZHVsZS5leHBvcnRzID1cbiAgXG4gIHJvdW5kOiAobnVtYmVyLCBkZWNpbWFsUGxhY2VzKSAtPlxuICAgIHVubGVzcyBfLmlzTnVtYmVyIG51bWJlclxuICAgICAgbnVtYmVyID0gcGFyc2VGbG9hdChudW1iZXIpXG4gICAgbXVsdGlwbGllciA9IE1hdGgucG93IDEwLCBkZWNpbWFsUGxhY2VzXG4gICAgTWF0aC5yb3VuZChudW1iZXIgKiBtdWx0aXBsaWVyKSAvIG11bHRpcGxpZXIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0ciBkYXRhLWF0dHJpYnV0ZS1pZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiaWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLWV4cG9ydGlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJleHBvcnRpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtdHlwZT1cXFwiXCIpO18uYihfLnYoXy5mKFwidHlwZVwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcIm5hbWVcXFwiPlwiKTtfLmIoXy52KF8uZihcIm5hbWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJ2YWx1ZVxcXCI+XCIpO18uYihfLnYoXy5mKFwiZm9ybWF0dGVkVmFsdWVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvdHI+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRhYmxlIGNsYXNzPVxcXCJhdHRyaWJ1dGVzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiYXR0cmlidXRlc1wiLGMscCwxKSxjLHAsMCw0NCwxMjMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe2lmKCFfLnMoXy5mKFwiZG9Ob3RFeHBvcnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiLGMscCxcIiAgICBcIikpO307fSk7Yy5wb3AoKTt9Xy5iKFwiPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9nZW5lcmljQXR0cmlidXRlc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtpZihfLnMoXy5kKFwic2tldGNoQ2xhc3MuZGVsZXRlZFwiLGMscCwxKSxjLHAsMCwyNCwyNzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxkaXYgY2xhc3M9XFxcImFsZXJ0IGFsZXJ0LXdhcm5cXFwiIHN0eWxlPVxcXCJtYXJnaW4tYm90dG9tOjEwcHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFRoaXMgc2tldGNoIHdhcyBjcmVhdGVkIHVzaW5nIHRoZSBcXFwiXCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIlxcXCIgdGVtcGxhdGUsIHdoaWNoIGlzXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBubyBsb25nZXIgYXZhaWxhYmxlLiBZb3Ugd2lsbCBub3QgYmUgYWJsZSB0byBjb3B5IHRoaXMgc2tldGNoIG9yIG1ha2UgbmV3XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBza2V0Y2hlcyBvZiB0aGlzIHR5cGUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5cIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiIEF0dHJpYnV0ZXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVzVGFibGVcIixjLHAsXCIgICAgXCIpKTtfLmIoXCIgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZ1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRMb2FkaW5nXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwhLS0gPGRpdiBjbGFzcz1cXFwic3Bpbm5lclxcXCI+MzwvZGl2PiAtLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5SZXF1ZXN0aW5nIFJlcG9ydCBmcm9tIFNlcnZlcjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8ZGl2IGNsYXNzPVxcXCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImJhclxcXCIgc3R5bGU9XFxcIndpZHRoOiAxMDAlO1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxhIGhyZWY9XFxcIiNcXFwiIHJlbD1cXFwiZGV0YWlsc1xcXCI+ZGV0YWlsczwvYT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiZGV0YWlsc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSB0aGlzW1wiVGVtcGxhdGVzXCJdO1xufSIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5cbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuXG5kMyA9IHdpbmRvdy5kM1xuXG5jbGFzcyBFbnZpcm9ubWVudFRhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnRW52aXJvbm1lbnQnXG4gIGNsYXNzTmFtZTogJ2Vudmlyb25tZW50J1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLmVudmlyb25tZW50XG4gIGRlcGVuZGVuY2llczpbIFxuICAgICdNb250c2VycmF0SGFiaXRhdFRvb2xib3gnXG4gICAgJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCdcbiAgICAnTW9udHNlcnJhdENvcmFsVG9vbGJveCdcbiAgICAnTW9udHNlcnJhdFNuYXBBbmRHcm91cFRvb2xib3gnXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKCkgICBcbiAgICBkM0lzUHJlc2VudCA9IHdpbmRvdy5kMyA/IHRydWUgIDogZmFsc2VcbiAgICBpZiBpc0NvbGxlY3Rpb25cbiAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmUgPSBAZ2V0SGFzQ29uc2VydmF0aW9uWm9uZSBAbW9kZWwuZ2V0Q2hpbGRyZW4oKVxuICAgICAgaGFzWm9uZVdpdGhHb2FsID0gQGdldEhhc1pvbmVXaXRoR29hbCBAbW9kZWwuZ2V0Q2hpbGRyZW4oKVxuICAgIGVsc2VcbiAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmUgPSB0cnVlXG4gICAgICBoYXNab25lV2l0aEdvYWwgPSBAZ2V0SGFzWm9uZVdpdGhHb2FsIFtAbW9kZWxdXG5cbiAgICAjZG9uJ3QgYm90aGVyIGdldHRpbmcgYWxsIGRheSBpZiBubyBjb25zZXJ2YXRpb24gem9uZVxuICAgIGlmIGhhc0NvbnNlcnZhdGlvblpvbmVcbiAgICAgICMgY3JlYXRlIHJhbmRvbSBkYXRhIGZvciB2aXN1YWxpemF0aW9uXG4gICAgICBoYWJpdGF0cyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCcsICdIYWJpdGF0cycpLnRvQXJyYXkoKVxuICAgICAgaGFiaXRhdHMgPSBfLnNvcnRCeSBoYWJpdGF0cywgKGgpIC0+ICBwYXJzZUZsb2F0KGguUEVSQylcbiAgICAgIGhhYml0YXRzID0gaGFiaXRhdHMucmV2ZXJzZSgpXG5cbiAgICAgIEBhZGRUYXJnZXQgaGFiaXRhdHNcblxuXG4gICAgICBzYW5kZyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRTbmFwQW5kR3JvdXBUb29sYm94JywgJ1NuYXBBbmRHcm91cCcpLnRvQXJyYXkoKVswXVxuICAgICAgYWxsX3NhbmRnX3ZhbHMgPSBAZ2V0QWxsVmFsdWVzIHNhbmRnLkhJU1RPXG5cbiAgICAgIGhlcmJfYmlvID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEJpb21hc3NUb29sYm94JywgJ0hlcmJpdm9yZUJpb21hc3MnKS50b0FycmF5KClbMF1cbiAgICAgIGFsbF9oZXJiX3ZhbHMgPSBAZ2V0QWxsVmFsdWVzIGhlcmJfYmlvLkhJU1RPXG4gICAgICBAcm91bmRWYWxzIGhlcmJfYmlvXG5cbiAgICAgIHRvdGFsX2JpbyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdUb3RhbEJpb21hc3MnKS50b0FycmF5KClbMF1cbiAgICAgIGFsbF90b3RhbF92YWx1ZXMgPSBAZ2V0QWxsVmFsdWVzIHRvdGFsX2Jpby5ISVNUT1xuICAgICAgQHJvdW5kVmFscyB0b3RhbF9iaW9cblxuICAgICAgZmlzaF9iaW8gPSBAcmVjb3JkU2V0KCdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnLCAnRmlzaEFidW5kYW5jZScpLnRvQXJyYXkoKVswXVxuICAgICAgYWxsX2Zpc2hfdmFscyA9IEBnZXRBbGxWYWx1ZXMgZmlzaF9iaW8uSElTVE9cbiAgICAgIEByb3VuZFZhbHMgZmlzaF9iaW9cbiAgICAgIFxuICAgICAgY29yYWxfY291bnQgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0Q29yYWxUb29sYm94JywgJ0NvcmFsJykudG9BcnJheSgpXG4gICAgICBcbiAgICAgIGZpc2hwb3RzID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEJpb21hc3NUb29sYm94JywgJ0Zpc2hQb3QnKS50b0FycmF5KClcbiAgICAgIGlmIGZpc2hwb3RzPy5sZW5ndGggPiAwXG5cbiAgICAgICAgZmlzaHBvdF9jb3VudCA9IGZpc2hwb3RzWzBdLkNPVU5UXG4gICAgICAgIGZpc2hwb3RfdG90YWwgPSBmaXNocG90c1swXS5UT1RBTFxuICAgICAgZWxzZVxuICAgICAgICBmaXNocG90X2NvdW50ID0gMFxuICAgICAgICBmaXNocG90X3RvdGFsID0gMTU3XG4gICAgICAgIFxuICAgICAgQHJvdW5kRGF0YSBoYWJpdGF0c1xuXG4gICAgZWxzZVxuICAgICAgaGFiaXRhdHMgPSBbXVxuICAgICAgc2FuZGcgPSBbXVxuICAgICAgaGVyYiA9IFtdXG4gICAgICBmaXNoID0gW11cbiAgICAgIHRvdGFsPVtdXG5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuXG4gICAgICBoYWJpdGF0czogaGFiaXRhdHNcbiAgICAgIGQzSXNQcmVzZW50OiBkM0lzUHJlc2VudFxuICAgICAgaGVyYjogaGVyYl9iaW9cbiAgICAgIGZpc2g6IGZpc2hfYmlvXG4gICAgICB0b3RhbDogdG90YWxfYmlvXG4gICAgICBjb3JhbF9jb3VudDogY29yYWxfY291bnRcbiAgICAgIHNhbmRnOiBzYW5kZ1xuICAgICAgaGFzRDM6IHdpbmRvdy5kM1xuICAgICAgaGFzQ29uc2VydmF0aW9uWm9uZTogaGFzQ29uc2VydmF0aW9uWm9uZVxuICAgICAgaGFzWm9uZVdpdGhHb2FsOiBoYXNab25lV2l0aEdvYWxcbiAgICAgIGZpc2hwb3RfY291bnQ6IGZpc2hwb3RfY291bnRcbiAgICAgIGZpc2hwb3RfdG90YWw6IGZpc2hwb3RfdG90YWxcblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG4gICAgaWYgaGFzQ29uc2VydmF0aW9uWm9uZVxuICAgICAgQHJlbmRlckhpc3RvVmFsdWVzKHNhbmRnLCBhbGxfc2FuZGdfdmFscywgXCIuc2FuZGdfdml6XCIsIFwiIzY2Y2RhYVwiLFwiQWJ1bmRhbmNlIG9mIEp1dmVuaWxlIFNuYXBwZXIgYW5kIEdyb3VwZXJcIiwgXCJDb3VudFwiIClcbiAgICAgIEByZW5kZXJIaXN0b1ZhbHVlcyhoZXJiX2JpbywgYWxsX2hlcmJfdmFscywgXCIuaGVyYl92aXpcIiwgXCIjNjZjZGFhXCIsXCJIZXJiaXZvcmUgQmlvbWFzcyAoZy9tXjIpXCIsIFwiQmlvbWFzcyBQZXIgVHJhbnNlY3RcIilcbiAgICAgIEByZW5kZXJIaXN0b1ZhbHVlcyh0b3RhbF9iaW8sIGFsbF90b3RhbF92YWx1ZXMsIFwiLnRvdGFsX3ZpelwiLCBcIiNmYTgwNzJcIiwgXCJUb3RhbCBCaW9tYXNzIChnL21eMilcIiwgXCJCaW9tYXNzIFBlciBUcmFuc2VjdFwiKVxuICAgICAgQHJlbmRlckhpc3RvVmFsdWVzKGZpc2hfYmlvLCBhbGxfZmlzaF92YWxzLCBcIi5maXNoX3ZpelwiLCBcIiM2ODk3YmJcIiwgXCJUb3RhbCBGaXNoIENvdW50XCIsIFwiTnVtYmVyIG9mIEZpc2ggU3BlY2llc1wiKVxuXG4gICAgICBAZHJhd0NvcmFsQmFycyhjb3JhbF9jb3VudClcbiAgICAgIEBkcmF3RmlzaFBvdEJhcnMoZmlzaHBvdF9jb3VudCwgZmlzaHBvdF90b3RhbClcblxuICBnZXRIYXNab25lV2l0aEdvYWw6IChza2V0Y2hlcykgPT5cbiAgICBoYXNab25lV2l0aEdvYWwgPSBmYWxzZVxuICAgIGZvciBza2V0Y2ggaW4gc2tldGNoZXNcbiAgICAgIGZvciBhdHRyIGluIHNrZXRjaC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgICAgaWYgYXR0ci5leHBvcnRpZCA9PSBcIlpPTkVfVFlQRVwiXG4gICAgICAgICAgaGFzWm9uZVdpdGhHb2FsID0gKGF0dHIudmFsdWUgPT0gXCJTYW5jdHVhcnlcIiBvciBhdHRyLnZhbHVlID09IFwiTWFyaW5lIFJlc2VydmUgLSBQYXJ0aWFsIFRha2VcIilcbiAgICAgICAgICBcbiAgICByZXR1cm4gaGFzWm9uZVdpdGhHb2FsXG5cbiAgZ2V0SGFzQ29uc2VydmF0aW9uWm9uZTogKHNrZXRjaGVzKSA9PlxuICAgIGhhc0NvbnNlcnZhdGlvblpvbmUgPSBmYWxzZVxuICAgIGZvciBza2V0Y2ggaW4gc2tldGNoZXNcbiAgICAgIGZvciBhdHRyIGluIHNrZXRjaC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgICAgaWYgYXR0ci5leHBvcnRpZCA9PSBcIlpPTkVfVFlQRVwiXG4gICAgICAgICAgaGFzQ29uc2VydmF0aW9uWm9uZSA9IChhdHRyLnZhbHVlID09IFwiU2FuY3R1YXJ5XCIgb3IgYXR0ci52YWx1ZSA9PSBcIk1hcmluZSBSZXNlcnZlIC0gUGFydGlhbCBUYWtlXCIgb3IgYXR0ci52YWx1ZSA9PSBcIk1vb3JpbmcgQW5jaG9yYWdlIFpvbmVcIiBvciBhdHRyLnZhbHVlID09IFwiUmVjcmVhdGlvbiBab25lXCIpXG4gICAgICAgICAgXG4gICAgcmV0dXJuIGhhc0NvbnNlcnZhdGlvblpvbmVcblxuICBkcmF3RmlzaFBvdEJhcnM6IChmaXNocG90X2NvdW50LCBmaXNocG90X3RvdGFsKSA9PlxuICAgIGlmIHdpbmRvdy5kM1xuICAgICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgICBzdWZmaXggPSBcInNrZXRjaFwiXG5cbiAgICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgICBzdWZmaXg9XCJjb2xsZWN0aW9uXCJcblxuICAgICAgY291bnQgPSBmaXNocG90X2NvdW50XG4gICAgICB0b3RhbCA9IGZpc2hwb3RfdG90YWxcbiAgICAgIG91dHNpZGVfc2tldGNoX3N0YXJ0ID0gdG90YWwqMC40OFxuXG4gICAgICBsYWJlbCA9IGNvdW50K1wiL1wiK3RvdGFsK1wiIG9mIHRoZSBmaXNoIHBvdHMgd2l0aGluIE1vbnRzZXJyYXQncyB3YXRlcnMgYXJlIGZvdW5kIHdpdGhpbiB0aGlzIFwiK3N1ZmZpeFxuICAgICAgcmFuZ2UgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBiZzogXCIjOGU1ZTUwXCJcbiAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgIGVuZDogY291bnRcbiAgICAgICAgICBjbGFzczogJ2luLXNrZXRjaCdcbiAgICAgICAgICB2YWx1ZTogY291bnRcbiAgICAgICAgICBuYW1lOiBsYWJlbFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgYmc6ICcjZGRkZGRkJ1xuICAgICAgICAgIHN0YXJ0OiBjb3VudFxuICAgICAgICAgIGVuZDogdG90YWxcbiAgICAgICAgICBjbGFzczogJ291dHNpZGUtc2tldGNoJ1xuICAgICAgICAgIHZhbHVlOiB0b3RhbFxuICAgICAgICAgIGxhYmVsX3N0YXJ0OiBvdXRzaWRlX3NrZXRjaF9zdGFydFxuICAgICAgICAgIG5hbWU6ICcnXG4gICAgICAgIH1cbiAgICAgIF1cblxuICAgICAgQGRyYXdCYXJzKHJhbmdlLCAzLCB0b3RhbCkgIFxuXG4gIGRyYXdDb3JhbEJhcnM6IChjb3JhbF9jb3VudHMpID0+XG4gICAgIyBDaGVjayBpZiBkMyBpcyBwcmVzZW50LiBJZiBub3QsIHdlJ3JlIHByb2JhYmx5IGRlYWxpbmcgd2l0aCBJRVxuXG4gICAgICBpZiB3aW5kb3cuZDNcbiAgICAgICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgICAgIHN1ZmZpeCA9IFwic2tldGNoXCJcbiAgICAgICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICAgICAgc3VmZml4PVwiY29sbGVjdGlvblwiXG4gICAgICAgIGZvciBjb3JhbCBpbiBjb3JhbF9jb3VudHNcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImNvcmFsXCIsIGNvcmFsKVxuICAgICAgICAgIG5hbWUgPSBjb3JhbC5OQU1FXG4gICAgICAgICAgY291bnQgPSBwYXJzZUludChjb3JhbC5DT1VOVClcbiAgICAgICAgICB0b3RhbCA9IHBhcnNlSW50KGNvcmFsLlRPVClcbiAgICAgICAgICBvdXRzaWRlX3NrZXRjaF9zdGFydCA9IHRvdGFsKjAuNDhcblxuICAgICAgICAgIGxhYmVsID0gY291bnQrXCIvXCIrdG90YWwrXCIgb2YgdGhlIGtub3duIG9ic2VydmF0aW9ucyBhcmUgZm91bmQgd2l0aGluIHRoaXMgXCIrc3VmZml4XG4gICAgICAgICAgcmFuZ2UgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJnOiBcIiM4ZTVlNTBcIlxuICAgICAgICAgICAgICBzdGFydDogMFxuICAgICAgICAgICAgICBlbmQ6IGNvdW50XG4gICAgICAgICAgICAgIGNsYXNzOiAnaW4tc2tldGNoJ1xuICAgICAgICAgICAgICB2YWx1ZTogY291bnRcbiAgICAgICAgICAgICAgbmFtZTogbGFiZWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGJnOiAnI2RkZGRkZCdcbiAgICAgICAgICAgICAgc3RhcnQ6IGNvdW50XG4gICAgICAgICAgICAgIGVuZDogdG90YWxcbiAgICAgICAgICAgICAgY2xhc3M6ICdvdXRzaWRlLXNrZXRjaCdcbiAgICAgICAgICAgICAgdmFsdWU6IHRvdGFsXG4gICAgICAgICAgICAgIGxhYmVsX3N0YXJ0OiBvdXRzaWRlX3NrZXRjaF9zdGFydFxuICAgICAgICAgICAgICBuYW1lOiAnJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cblxuICAgICAgICAgIGlmIG5hbWUgPT0gXCJPcmJpY2VsbGEgYW5udWxhcmlzXCJcbiAgICAgICAgICAgIGluZGV4ID0gMFxuICAgICAgICAgIGVsc2UgaWYgbmFtZSA9PSBcIk9yYmljZWxsYSBmYXZlb2xhdGFcIlxuICAgICAgICAgICAgaW5kZXggPSAxXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgaW5kZXggPSAyXG5cbiAgICAgICAgICBAZHJhd0JhcnMocmFuZ2UsIGluZGV4LCB0b3RhbClcblxuXG4gIGRyYXdCYXJzOiAocmFuZ2UsIGluZGV4LCBtYXhfdmFsdWUpID0+XG4gICAgY29uc29sZS5sb2coXCJtYXggdmFsdWUgLS0tLT4+Pj4gXCIsIG1heF92YWx1ZSlcbiAgICBlbCA9IEAkKCcudml6JylbaW5kZXhdXG4gICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAuZG9tYWluKFswLCBtYXhfdmFsdWVdKVxuICAgICAgLnJhbmdlKFswLCA0MDBdKVxuXG5cbiAgICBjaGFydCA9IGQzLnNlbGVjdChlbClcbiAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgIC5kYXRhKHJhbmdlKVxuICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGQpIC0+IE1hdGgucm91bmQoeChkLmVuZCAtIGQuc3RhcnQpLDApICsgJ3B4JylcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQpIC0+IFwicmFuZ2UgXCIgKyBkLmNsYXNzKVxuICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiI3tkLm5hbWV9XCIpXG4gICAgICAgIC5zdHlsZShcImxlZnRcIiwgKGQpIC0+IGlmIGQubGFiZWxfc3RhcnQgdGhlbiB4KGQubGFiZWxfc3RhcnQpKydweCcgZWxzZSAnJylcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJsYWJlbC1cIitkLmNsYXNzKVxuXG4gIHJlbmRlckhpc3RvVmFsdWVzOiAoYmlvbWFzcywgaGlzdG9fdmFscywgZ3JhcGgsIGNvbG9yLCB4X2F4aXNfbGFiZWwsIGxlZ2VuZF9sYWJlbCkgPT5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIG1lYW4gPSBiaW9tYXNzLlNDT1JFXG4gICAgICBibWluID0gYmlvbWFzcy5NSU5cbiAgICAgIGJtYXggPSBiaW9tYXNzLk1BWFxuXG4gICAgICBsZW4gPSBoaXN0b192YWxzLmxlbmd0aFxuICAgICAgbWF4X2hpc3RvX3ZhbCA9IGhpc3RvX3ZhbHNbbGVuLTFdXG4gICAgICBxdWFudGlsZV9yYW5nZSA9IHtcIlEwXCI6XCJ2ZXJ5IGxvd1wiLCBcIlEyMFwiOiBcImxvd1wiLFwiUTQwXCI6IFwibWlkXCIsXCJRNjBcIjogXCJoaWdoXCIsXCJRODBcIjogXCJ2ZXJ5IGhpZ2hcIn1cbiAgICAgIHFfY29sb3JzID0gW1wiIzQ3YWU0M1wiLCBcIiM2YzBcIiwgXCIjZWUwXCIsIFwiI2ViNFwiLCBcIiNlY2JiODlcIiwgXCIjZWVhYmEwXCJdXG5cblxuICAgICAgbnVtX2JpbnMgPSAxMFxuICAgICAgYmluX3NpemUgPSAxMFxuICAgICAgXG4gICAgICBxdWFudGlsZXMgPSBbXVxuICAgICAgbWF4X2NvdW50X3ZhbCA9IDBcbiAgICAgIG51bV9pbl9iaW5zID0gTWF0aC5jZWlsKGxlbi9udW1fYmlucylcbiAgICAgIGluY3IgPSBtYXhfaGlzdG9fdmFsL251bV9iaW5zXG5cbiAgICAgIGZvciBpIGluIFswLi4ubnVtX2JpbnNdXG4gICAgICAgIFxuICAgICAgICBxX3N0YXJ0ID0gaSpiaW5fc2l6ZVxuICAgICAgICBxX2VuZCA9IHFfc3RhcnQrYmluX3NpemVcbiAgICAgICAgbWluID0gaSppbmNyXG4gICAgICAgIG1heCA9IG1pbitpbmNyXG4gICAgICAgIGNvdW50PTBcblxuICAgICAgICAjVE9ETzogbG9vayBmb3IgYSBtb3JlIGVmZmljaWVudCB3YXkgdG8gZG8gdGhpc1xuICAgICAgICBmb3IgaHYgaW4gaGlzdG9fdmFsc1xuICAgICAgICAgIGlmIGh2ID49IG1pbiBhbmQgaHYgPCBtYXhcbiAgICAgICAgICAgIGNvdW50Kz0xXG5cblxuICAgICAgICBtYXhfY291bnRfdmFsID0gTWF0aC5tYXgoY291bnQsIG1heF9jb3VudF92YWwpXG4gICAgICAgIFxuICAgICAgICB2YWwgPSB7XG4gICAgICAgICAgc3RhcnQ6IHFfc3RhcnRcbiAgICAgICAgICBlbmQ6IHFfZW5kXG4gICAgICAgICAgYmc6IHFfY29sb3JzW01hdGguZmxvb3IoaS8yKV1cbiAgICAgICAgICBiaW5fY291bnQ6IGNvdW50XG4gICAgICAgICAgYmluX21pbjogbWluXG4gICAgICAgICAgYmluX21heDogbWF4XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHF1YW50aWxlcy5wdXNoKHZhbClcblxuICAgIFxuICAgICAgQCQoZ3JhcGgpLmh0bWwoJycpXG4gICAgICBlbCA9IEAkKGdyYXBoKVswXSAgXG5cbiAgICAgICMgSGlzdG9ncmFtXG4gICAgICBtYXJnaW4gPSBcbiAgICAgICAgdG9wOiA0MFxuICAgICAgICByaWdodDogMjBcbiAgICAgICAgYm90dG9tOiA0MFxuICAgICAgICBsZWZ0OiA0NVxuXG4gICAgICB3aWR0aCA9IDQwMCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0XG4gICAgICAjbm90ZTogdXNpbmcgdGhpcyB0byB0cmFuc2xhdGUgdGhlIHggYXhpcyB3YXMgY2F1c2luZyBhIHByb2JsZW0sXG4gICAgICAjc28gaSBqdXN0IGhhcmRjb2RlZCBpdCBmb3Igbm93Li4uXG4gICAgICBoZWlnaHQgPSAzNTAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbVxuICAgICAgXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4X2hpc3RvX3ZhbF0pXG4gICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuXG4gICAgICB5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhfY291bnRfdmFsXSlcblxuICAgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh4KVxuICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG5cbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgbWluX21heF9saW5lX3kgPSBtYXhfY291bnRfdmFsIC0gMjBcbiAgICAgIHN2ZyA9IGQzLnNlbGVjdChAJChncmFwaClbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwyNzApXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIzZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLnRleHQoeF9heGlzX2xhYmVsKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIC5jYWxsKHlBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC00MClcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQobGVnZW5kX2xhYmVsKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuYmFyXCIpXG4gICAgICAgICAgLmRhdGEocXVhbnRpbGVzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhclwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgLT4geChkLmJpbl9taW4pKVxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgKGQpIC0+IHdpZHRoL251bV9iaW5zKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkLmJpbl9jb3VudCkpXG4gICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgKGQpIC0+IGhlaWdodCAtIHkoZC5iaW5fY291bnQpKVxuICAgICAgICAgIC5zdHlsZSAnZmlsbCcsIChkKSAtPiBjb2xvclxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDkpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSA5KSArICdweCcpXG4gICAgICAgIC50ZXh0KFwi4pa8XCIpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVUZXh0XCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDIyICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAyMikgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCJNZWFuOiBcIitkKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWluU2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1pbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDYpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1pbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtaW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWluU2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSAyMSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMTIpICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiTWluOiBcIitkKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWF4U2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1heCldKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDE4KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+ICh4KGQpKyAncHgnKSlcbiAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4gaGVpZ2h0ICsgJ3B4JylcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtYXgpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWF4U2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeCgoZCkpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMTgpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChibWF4KV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1heFNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gMzAgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIk1heDogXCIrZClcblxuICAgICAgXG4gICAgICBpZiBncmFwaCA9PSBcIi5oZXJiX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwiaGVyYi1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+QmlvbWFzcyBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgIGlmIGdyYXBoID09IFwiLmZpc2hfdml6XCJcbiAgICAgICAgQCQoZ3JhcGgpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gY2xhc3M9XCJmaXNoLXN3YXRjaFwiPiZuYnNwOzwvc3Bhbj5GaXNoIENvdW50IGluIFJlZ2lvbjwvZGl2PjxkaXYgY2xhc3M9XCJsZWdlbmQtc2tldGNoLXZhbHVlc1wiPuKWvCBTa2V0Y2ggVmFsdWVzPC9kaXY+PC9kaXY+J1xuICAgICAgaWYgZ3JhcGggPT0gXCIudG90YWxfdml6XCJcbiAgICAgICAgQCQoZ3JhcGgpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gY2xhc3M9XCJ0b3RhbC1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+QmlvbWFzcyBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgICBcbiAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xuXG4gIGdldEFsbFZhbHVlczogKGFsbF9zdHIpID0+XG4gICAgdHJ5XG4gICAgICBhbGxfdmFscyA9IGFsbF9zdHIuc3Vic3RyaW5nKDEsIGFsbF9zdHIubGVuZ3RoIC0gMSlcbiAgICAgIGFsbF92YWxzID0gYWxsX3ZhbHMuc3BsaXQoXCIsIFwiKVxuICAgICAgc29ydGVkX3ZhbHMgPSBfLnNvcnRCeSBhbGxfdmFscywgKGQpIC0+ICBwYXJzZUZsb2F0KGQpXG4gICAgICByZXR1cm4gc29ydGVkX3ZhbHNcbiAgICBjYXRjaCBlXG4gICAgICByZXR1cm4gW11cbiAgICBcbiAgYWRkVGFyZ2V0OiAoZGF0YSkgPT5cbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBpZiBkLkhBQl9UWVBFID09IFwiQXJ0aWZpY2lhbCBSZWVmXCJcbiAgICAgICAgZC5NRUVUU19HT0FMID0gZmFsc2VcbiAgICAgICAgZC5OT19HT0FMID0gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBkLk1FRVRTX0dPQUwgPSAocGFyc2VGbG9hdChkLlBFUkMpID4gMzAuMClcblxuICByb3VuZFZhbHM6IChkKSA9PiAgICBcbiAgICAgIGQuTUVBTiA9IHBhcnNlRmxvYXQoZC5NRUFOKS50b0ZpeGVkKDEpXG4gICAgICBkLk1BWCA9IHBhcnNlRmxvYXQoZC5NQVgpLnRvRml4ZWQoMSlcbiAgICAgIGQuTUlOID0gcGFyc2VGbG9hdChkLk1JTikudG9GaXhlZCgxKVxuXG4gIHJvdW5kRGF0YTogKGRhdGEpID0+XG4gICAgZm9yIGQgaW4gZGF0YVxuICAgICAgaWYgZC5BUkVBX1NRS00gPCAwLjEgYW5kIGQuQVJFQV9TUUtNID4gMC4wMDAwMVxuICAgICAgICBkLkFSRUFfU1FLTSA9IFwiPCAwLjEgXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZC5BUkVBX1NRS00gPSBwYXJzZUZsb2F0KGQuQVJFQV9TUUtNKS50b0ZpeGVkKDEpXG5cbm1vZHVsZS5leHBvcnRzID0gRW52aXJvbm1lbnRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuZDMgPSB3aW5kb3cuZDNcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnU2l6ZUFuZENvbm5lY3Rpdml0eSdcbiAgICAnRGl2ZUFuZEZpc2hpbmdWYWx1ZSdcbiAgICAnRGlzdGFuY2UnXG4gICAgJ01pbkRpbWVuc2lvblRvb2xib3gnXG4gIF1cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgIyBjcmVhdGUgcmFuZG9tIGRhdGEgZm9yIHZpc3VhbGl6YXRpb25cbiAgICBzaXplID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdTaXplJykudG9BcnJheSgpWzBdXG4gICAgXG4gICAgc2l6ZS5QRVJDID0gTnVtYmVyKChwYXJzZUZsb2F0KHNpemUuU0laRV9TUUtNKS8zMzguMTk3KSoxMDAuMCkudG9GaXhlZCgxKVxuICAgIGNvbm5lY3Rpdml0eSA9IEByZWNvcmRTZXQoJ1NpemVBbmRDb25uZWN0aXZpdHknLCAnQ29ubmVjdGl2aXR5JykudG9BcnJheSgpXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG5cbiAgICBkZnYgPSBAcmVjb3JkU2V0KCdEaXZlQW5kRmlzaGluZ1ZhbHVlJywgJ0Zpc2hpbmdWYWx1ZScpLnRvQXJyYXkoKVswXVxuICAgIGRkdiA9IEByZWNvcmRTZXQoJ0RpdmVBbmRGaXNoaW5nVmFsdWUnLCAnRGl2ZVZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgXG5cbiAgICBpZiBkZnZcbiAgICAgIGlmIGRmdi5QRVJDRU5UIDwgMC4wMVxuICAgICAgICBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZSA9IFwiPCAwLjAxXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBwYXJzZUZsb2F0KGRmdi5QRVJDRU5UKS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBcInVua25vd25cIlxuXG4gICAgaWYgZGR2XG4gICAgICBpZiBkZHYuUEVSQ0VOVCA8IDAuMDFcbiAgICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWUgPSBcIjwgMC4wMVwiXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gcGFyc2VGbG9hdChkZHYuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gXCJ1bmtub3duXCJcblxuICAgIG1pbkRpc3RLTSA9IEByZWNvcmRTZXQoJ0Rpc3RhbmNlJywgJ0Rpc3RhbmNlJykudG9BcnJheSgpWzBdXG4gICAgaWYgbWluRGlzdEtNXG4gICAgICBtaW5EaXN0S00gPSBwYXJzZUZsb2F0KG1pbkRpc3RLTS5NYXhEaXN0KS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgbWluRGlzdEtNID0gXCJVbmtub3duXCJcblxuICAgIG1pbldpZHRoID0gQHJlY29yZFNldCgnTWluRGltZW5zaW9uVG9vbGJveCcsICdEaW1lbnNpb25zJykudG9BcnJheSgpXG4gICAgY29uc29sZS5sb2coXCJtaW53aWR0aDogXCIsIG1pbldpZHRoKVxuICAgIGlmIG1pbldpZHRoPy5sZW5ndGggPiAwXG5cbiAgICAgIGlzQ29uc2VydmF0aW9uWm9uZSA9IHRydWVcbiAgICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgICBAcHJvY2Vzc01pbkRpbWVuc2lvbiBtaW5XaWR0aFxuICAgICAgZWxzZVxuICAgICAgICBtZWV0c01pbldpZHRoR29hbCA9IChwYXJzZUZsb2F0KG1pbldpZHRoWzBdLldJRFRIKSA+IDEuMClcbiAgICBlbHNlXG4gICAgICBpc0NvbnNlcnZhdGlvblpvbmUgPSBmYWxzZVxuICAgICAgbWVldHNNaW5XaWR0aEdvYWwgPSBmYWxzZVxuXG5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgc2l6ZTogc2l6ZVxuICAgICAgY29ubmVjdGl2aXR5OiBjb25uZWN0aXZpdHlcbiAgICAgIFxuICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWU6IGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlXG4gICAgICBkaXNwbGFjZWRfZGl2ZV92YWx1ZTogZGlzcGxhY2VkX2RpdmVfdmFsdWVcbiAgICBcbiAgICAgIG1pbkRpc3RLTTogbWluRGlzdEtNXG4gICAgICBpc0NvbnNlcnZhdGlvblpvbmU6IGlzQ29uc2VydmF0aW9uWm9uZVxuICAgICAgbWVldHNNaW5XaWR0aEdvYWw6IG1lZXRzTWluV2lkdGhHb2FsXG4gICAgICBtaW5fZGltIDptaW5XaWR0aFxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxuICBwcm9jZXNzTWluRGltZW5zaW9uOiAoZGF0YSkgPT5cblxuICAgIGZvciBkIGluIGRhdGFcbiAgICAgIGlmIHBhcnNlRmxvYXQoZC5XSURUSCkgPiAxLjBcbiAgICAgICAgZC5NRUVUU19USFJFU0ggPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGQuTUVFVFNfVEhSRVNIID0gZmFsc2VcblxubW9kdWxlLmV4cG9ydHMgPSBPdmVydmlld1RhYiIsIk92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlldy5jb2ZmZWUnXG5UcmFkZW9mZnNUYWIgPSByZXF1aXJlICcuL3RyYWRlb2Zmcy5jb2ZmZWUnXG5FbnZpcm9ubWVudFRhYiA9IHJlcXVpcmUgJy4vZW52aXJvbm1lbnQuY29mZmVlJ1xuXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtPdmVydmlld1RhYiwgRW52aXJvbm1lbnRUYWIsIFRyYWRlb2Zmc1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5kMyA9IHdpbmRvdy5kM1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnYXBpL3RlbXBsYXRlcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIFRyYWRlb2Zmc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnVHJhZGVvZmZzJ1xuICBjbGFzc05hbWU6ICd0cmFkZW9mZnMnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMudHJhZGVvZmZzXG4gIGRlcGVuZGVuY2llczpbIFxuICAgICdNb250c2VycmF0VHJhZGVvZmZBbmFseXNpcydcbiAgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0cmFkZW9mZl9kYXRhID0gQHJlY29yZFNldCgnTW9udHNlcnJhdFRyYWRlb2ZmQW5hbHlzaXMnLCAnU2NvcmVzJykudG9BcnJheSgpXG4gICAgQHJvdW5kRGF0YSB0cmFkZW9mZl9kYXRhXG5cbiAgICB0cmFkZW9mZnMgPSBbJ0Zpc2hpbmcgYW5kIERpdmluZycsICdGaXNoaW5nIGFuZCBDb25zZXJ2YXRpb24nLCAnRGl2aW5nIGFuZCBDb25zZXJ2YXRpb24nXVxuICAgIFxuICAgIGZpc2hpbmdfdmFscyA9IChpdGVtLkZpc2hpbmcgZm9yIGl0ZW0gaW4gdHJhZGVvZmZfZGF0YSlcbiAgICBkaXZpbmdfdmFscyA9IChpdGVtLkRpdmluZyBmb3IgaXRlbSBpbiB0cmFkZW9mZl9kYXRhKVxuICAgIGNvbnNlcnZhdGlvbl92YWxzID0gKGl0ZW0uQ29uc2VydmF0aW9uIGZvciBpdGVtIGluIHRyYWRlb2ZmX2RhdGEpXG5cbiAgICBmaXNoaW5nX21pbiA9IE1hdGgubWluIGZpc2hpbmdfdmFsc1xuICAgIGZpc2hpbmdfbWF4ID0gTWF0aC5tYXggZmlzaGluZ192YWxzXG5cbiAgICBkaXZpbmdfbWluID0gTWF0aC5taW4gZGl2aW5nX3ZhbHNcbiAgICBkaXZpbmdfbWF4ID0gTWF0aC5tYXggZGl2aW5nX3ZhbHNcblxuICAgIGNvbnNlcnZhdGlvbl9taW4gPSBNYXRoLm1pbiBjb25zZXJ2YXRpb25fdmFsc1xuICAgIGNvbnNlcnZhdGlvbl9tYXggPSBNYXRoLm1heCBjb25zZXJ2YXRpb25fdmFsc1xuXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpICAgXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICB0cmFkZW9mZnM6IHRyYWRlb2Zmc1xuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonMzgwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyVHJhZGVvZmZzXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIEBzZXR1cFNjYXR0ZXJQbG90KHRyYWRlb2ZmX2RhdGEsICcuZmlzaGluZy12LWRpdmluZycsIFwiVmFsdWUgb2YgRmlzaGluZ1wiLCBcbiAgICAgICAgXCJWYWx1ZSBvZiBEaXZpbmdcIiwgXCJGaXNoaW5nXCIsIFwiRGl2aW5nXCIsIGZpc2hpbmdfbWluLCBmaXNoaW5nX21heCwgZGl2aW5nX21pbiwgZGl2aW5nX21heClcblxuICAgICAgQHNldHVwU2NhdHRlclBsb3QodHJhZGVvZmZfZGF0YSwgJy5maXNoaW5nLXYtY29uc2VydmF0aW9uJywgXCJWYWx1ZSBvZiBGaXNoaW5nXCIsIFxuICAgICAgICBcIlZhbHVlIG9mIENvbnNlcnZhdGlvblwiLCBcIkZpc2hpbmdcIiwgXCJDb25zZXJ2YXRpb25cIiwgZmlzaGluZ19taW4sIGZpc2hpbmdfbWF4LCBjb25zZXJ2YXRpb25fbWluLCBjb25zZXJ2YXRpb25fbWF4KVxuXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCh0cmFkZW9mZl9kYXRhLCAnLmRpdmluZy12LWNvbnNlcnZhdGlvbicsIFwiVmFsdWUgb2YgRGl2aW5nXCIsIFxuICAgICAgICBcIlZhbHVlIG9mIENvbnNlcnZhdGlvblwiLCBcIkRpdmluZ1wiLCBcIkNvbnNlcnZhdGlvblwiLCBkaXZpbmdfbWluLCBkaXZpbmdfbWF4LCBjb25zZXJ2YXRpb25fbWluLCBjb25zZXJ2YXRpb25fbWF4KVxuXG4gIHNldHVwU2NhdHRlclBsb3Q6ICh0cmFkZW9mZl9kYXRhLCBjaGFydF9uYW1lLCB4bGFiLCB5bGFiLCBtb3VzZVhQcm9wLCBtb3VzZVlQcm9wLCBmaXNoaW5nTWluLCBmaXNoaW5nTWF4LCBkaXZpbmdNaW4sIGRpdmluZ01heCkgPT5cbiAgICAgIGggPSAzODBcbiAgICAgIHcgPSAzODBcbiAgICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgICBoYWxmaCA9IChoK21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbSlcbiAgICAgIHRvdGFsaCA9IGhhbGZoKjJcbiAgICAgIGhhbGZ3ID0gKHcrbWFyZ2luLmxlZnQrbWFyZ2luLnJpZ2h0KVxuICAgICAgdG90YWx3ID0gaGFsZncqMlxuXG4gICAgICAjbWFrZSBzdXJlIGl0cyBAc2NhdHRlcnBsb3QgdG8gcGFzcyBpbiB0aGUgcmlnaHQgY29udGV4dCAodGFiKSBmb3IgZDNcbiAgICAgIHRoZWNoYXJ0ID0gQHNjYXR0ZXJwbG90KGNoYXJ0X25hbWUsIG1vdXNlWFByb3AsIG1vdXNlWVByb3AsIGZpc2hpbmdNaW4sIGZpc2hpbmdNYXgsIGRpdmluZ01pbiwgZGl2aW5nTWF4KS54dmFyKDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC55dmFyKDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC54bGFiKHhsYWIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC55bGFiKHlsYWIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoaClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpZHRoKHcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXJnaW4obWFyZ2luKVxuXG4gICAgICBjaCA9IGQzLnNlbGVjdChAJChjaGFydF9uYW1lKSlcbiAgICAgIGNoLmRhdHVtKHRyYWRlb2ZmX2RhdGEpXG4gICAgICAgIC5jYWxsKHRoZWNoYXJ0KVxuICAgICAgXG4gICAgICB0b29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAgIC50ZXh0KFwiZGF0YVwiKVxuXG4gICAgIFxuICAgICAgdmVydGljYWxSdWxlID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidmVydGljYWxSdWxlXCIpXG4gICAgICAgICAgLnN0eWxlKFwicG9zaXRpb25cIiwgXCJhYnNvbHV0ZVwiKVxuICAgICAgICAgIC5zdHlsZShcInotaW5kZXhcIiwgXCIxOVwiKVxuICAgICAgICAgIC5zdHlsZShcIndpZHRoXCIsIFwiMXB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiaGVpZ2h0XCIsIFwiMjUwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgXCIxMHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiYm90dG9tXCIsIFwiMzBweFwiKVxuICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgXCIwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJiYWNrZ3JvdW5kXCIsIFwiYmxhY2tcIik7XG5cbiAgICAgIHRoZWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gXG5cbiAgICAgICAgICByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lK1wiPC9zdHJvbmc+PGxpPlwiK3hsYWIrXCI6IFwiK2RbbW91c2VYUHJvcF0rXCI8L2xpPjxsaT4gXCIreWxhYitcIjogXCIrZFttb3VzZVlQcm9wXStcIjwvbGk+PC91bD5cIilcbiAgICAgICAgXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG4gICAgICBcbiAgICAgIHRoZWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3V0XCIsIChkKSAtPiBcbiAgICAgICAgICByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK3dpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZStcIjwvc3Ryb25nPjxsaT4gXCIreGxhYitcIjogXCIrZFttb3VzZVhQcm9wXStcIjwvbGk+PGxpPiBcIit5bGFiK1wiOiBcIitkW21vdXNlWVByb3BdK1wiPC9saT48L3VsPlwiKVxuICAgICAgdGhlY2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2Vtb3ZlXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInRvcFwiLCAoZXZlbnQucGFnZVktMTApK1wicHhcIikuc3R5bGUoXCJsZWZ0XCIsKGNhbGNfdHRpcChldmVudC5wYWdlWCwgZCwgdG9vbHRpcCkpK1wicHhcIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3V0XCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIilcblxuXG4gIHJlbmRlclRyYWRlb2ZmczogKCkgPT5cbiAgICBuYW1lID0gQCQoJy5jaG9zZW4nKS52YWwoKVxuICAgIGlmIG5hbWUgPT0gXCJGaXNoaW5nIGFuZCBEaXZpbmdcIlxuICAgICAgQCQoJy5mdmRfY29udGFpbmVyJykuc2hvdygpXG4gICAgICBAJCgnLmZ2Y19jb250YWluZXInKS5oaWRlKClcbiAgICAgIEAkKCcuZHZjX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgIGVsc2UgaWYgbmFtZSA9PSBcIkZpc2hpbmcgYW5kIENvbnNlcnZhdGlvblwiXG4gICAgICBAJCgnLmZ2ZF9jb250YWluZXInKS5oaWRlKClcbiAgICAgIEAkKCcuZnZjX2NvbnRhaW5lcicpLnNob3coKVxuICAgICAgQCQoJy5kdmNfY29udGFpbmVyJykuaGlkZSgpXG4gICAgZWxzZSBpZiBuYW1lID09IFwiRGl2aW5nIGFuZCBDb25zZXJ2YXRpb25cIlxuICAgICAgQCQoJy5mdmRfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmZ2Y19jb250YWluZXInKS5oaWRlKClcbiAgICAgIEAkKCcuZHZjX2NvbnRhaW5lcicpLnNob3coKVxuXG5cbiAgY2FsY190dGlwID0gKHhsb2MsIGRhdGEsIHRvb2x0aXApIC0+XG4gICAgdGRpdiA9IHRvb2x0aXBbMF1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB0bGVmdCA9IHRkaXYubGVmdFxuICAgIHR3ID0gdGRpdi53aWR0aFxuICAgIHJldHVybiB4bG9jLSh0dysxMCkgaWYgKHhsb2MrdHcgPiB0bGVmdCt0dylcbiAgICByZXR1cm4geGxvYysxMFxuXG5cbiAgc2NhdHRlcnBsb3Q6IChjaGFydF9uYW1lLCB4dmFsLCB5dmFsLCBmaXNoaW5nTWluLCBmaXNoaW5nTWF4LCBkaXZpbmdNaW4sIGRpdmluZ01heCkgPT5cbiAgICB2aWV3ID0gQFxuICAgIHdpZHRoID0gMzgwXG4gICAgaGVpZ2h0ID0gNjAwXG4gICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICBheGlzcG9zID0ge3h0aXRsZToyNSwgeXRpdGxlOjMwLCB4bGFiZWw6NSwgeWxhYmVsOjF9XG4gICAgeGxpbSA9IG51bGxcbiAgICB5bGltID0gbnVsbFxuICAgIG54dGlja3MgPSA1XG4gICAgeHRpY2tzID0gbnVsbFxuICAgIG55dGlja3MgPSA1XG4gICAgeXRpY2tzID0gbnVsbFxuICAgIFxuICAgIHJlY3Rjb2xvciA9IFwid2hpdGVcIlxuICAgIHBvaW50c2l6ZSA9IDUgIyBkZWZhdWx0ID0gbm8gdmlzaWJsZSBwb2ludHMgYXQgbWFya2Vyc1xuICAgIHhsYWIgPSBcIlhcIlxuICAgIHlsYWIgPSBcIlkgc2NvcmVcIlxuICAgIHlzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgeHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBsZWdlbmRoZWlnaHQgPSAzMDBcbiAgICBwb2ludHNTZWxlY3QgPSBudWxsXG4gICAgbGFiZWxzU2VsZWN0ID0gbnVsbFxuICAgIGxlZ2VuZFNlbGVjdCA9IG51bGxcbiAgICB2ZXJ0aWNhbFJ1bGUgPSBudWxsXG4gICAgaG9yaXpvbnRhbFJ1bGUgPSBudWxsXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgICNjbGVhciBvdXQgdGhlIG9sZCB2YWx1ZXNcbiAgICAgIHZpZXcuJChjaGFydF9uYW1lKS5odG1sKCcnKVxuICAgICAgZWwgPSB2aWV3LiQoY2hhcnRfbmFtZSlbMF1cblxuICAgICMjIHRoZSBtYWluIGZ1bmN0aW9uXG4gICAgY2hhcnQgPSAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLmVhY2ggKGRhdGEpIC0+XG4gICAgICAgIHggPSBkYXRhLm1hcCAoZCkgLT4gcGFyc2VGbG9hdChkW3h2YWxdKVxuICAgICAgICB5ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZFt5dmFsXSlcblxuICAgICAgICBwYW5lbG9mZnNldCA9IDBcbiAgICAgICAgcGFuZWx3aWR0aCA9IHdpZHRoXG4gICAgICAgIHBhbmVsaGVpZ2h0ID0gaGVpZ2h0XG5cbiAgICAgICAgeGxpbSA9IFtkMy5taW4oeCktMC4yNSwgcGFyc2VGbG9hdChkMy5tYXgoeCkrMC4yNSldIGlmICEoeGxpbT8pXG4gICAgICAgIHlsaW0gPSBbZDMubWluKHkpLTAuMjUsIHBhcnNlRmxvYXQoZDMubWF4KHkpKzAuMjUpXSBpZiAhKHlsaW0/KVxuXG4gICAgICAgICMgSSdsbCByZXBsYWNlIG1pc3NpbmcgdmFsdWVzIHNvbWV0aGluZyBzbWFsbGVyIHRoYW4gd2hhdCdzIG9ic2VydmVkXG4gICAgICAgIG5hX3ZhbHVlID0gZDMubWluKHguY29uY2F0IHkpIC0gMTAwXG4gICAgICAgIGN1cnJlbGVtID0gZDMuc2VsZWN0KHZpZXcuJChjaGFydF9uYW1lKVswXSlcbiAgICAgICAgc3ZnID0gZDMuc2VsZWN0KHZpZXcuJChjaGFydF9uYW1lKVswXSkuYXBwZW5kKFwic3ZnXCIpLmRhdGEoW2RhdGFdKVxuICAgICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuXG4gICAgICAgICMgVXBkYXRlIHRoZSBvdXRlciBkaW1lbnNpb25zLlxuICAgICAgICBzdmcuYXR0cihcIndpZHRoXCIsIHdpZHRoK21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0K21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbStkYXRhLmxlbmd0aCozNSlcbiAgICAgICAgZyA9IHN2Zy5zZWxlY3QoXCJnXCIpXG5cbiAgICAgICAgIyBib3hcbiAgICAgICAgZy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAuYXR0cihcInhcIiwgcGFuZWxvZmZzZXQrbWFyZ2luLmxlZnQpXG4gICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHBhbmVsaGVpZ2h0KVxuICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBwYW5lbHdpZHRoKVxuICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIHJlY3Rjb2xvcilcbiAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwibm9uZVwiKVxuXG5cbiAgICAgICAgIyBzaW1wbGUgc2NhbGVzIChpZ25vcmUgTkEgYnVzaW5lc3MpXG4gICAgICAgIHhyYW5nZSA9IFttYXJnaW4ubGVmdCtwYW5lbG9mZnNldCttYXJnaW4uaW5uZXIsIG1hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0K3BhbmVsd2lkdGgtbWFyZ2luLmlubmVyXVxuICAgICAgICB5cmFuZ2UgPSBbbWFyZ2luLnRvcCtwYW5lbGhlaWdodC1tYXJnaW4uaW5uZXIsIG1hcmdpbi50b3ArbWFyZ2luLmlubmVyXVxuICAgICAgICB4c2NhbGUuZG9tYWluKHhsaW0pLnJhbmdlKHhyYW5nZSlcbiAgICAgICAgeXNjYWxlLmRvbWFpbih5bGltKS5yYW5nZSh5cmFuZ2UpXG4gICAgICAgIHhzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHhsaW0pLnJhbmdlKHhyYW5nZSlcbiAgICAgICAgeXMgPSBkMy5zY2FsZS5saW5lYXIoKS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuXG4gICAgICAgICMgaWYgeXRpY2tzIG5vdCBwcm92aWRlZCwgdXNlIG55dGlja3MgdG8gY2hvb3NlIHByZXR0eSBvbmVzXG4gICAgICAgIHl0aWNrcyA9IHlzLnRpY2tzKG55dGlja3MpIGlmICEoeXRpY2tzPylcbiAgICAgICAgeHRpY2tzID0geHMudGlja3Mobnh0aWNrcykgaWYgISh4dGlja3M/KVxuXG4gICAgICAgICMgeC1heGlzXG4gICAgICAgIHhheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInkxXCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBtYXJnaW4udG9wK2hlaWdodClcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG4gICAgICAgICAgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeHRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54bGFiZWwpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IGZvcm1hdEF4aXMoeHRpY2tzKShkKSlcbiAgICAgICAgeGF4aXMuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpcy10aXRsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCt3aWR0aC8yKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSlcbiAgICAgICAgICAgICAudGV4dCh4bGFiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiBtYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLGkpIC0+IG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkrNilcbiAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkLGkpIC0+IFwicHQje2l9XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJyXCIsIHBvaW50c2l6ZSlcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gaSAlIDE3XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldENvbG9ycyh2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIChkLCBpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBNYXRoLmZsb29yKGkvMTcpICUgNVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRTdHJva2VDb2xvcih2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMVwiKVxuXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZC10ZXh0XCIpXG5cbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4gbWFyZ2luLmxlZnQrMjApXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUrKChpKzEpKjMwKSlcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgIyB5LWF4aXNcbiAgICAgICAgeWF4aXMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIHlheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeXRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBtYXJnaW4ubGVmdCt3aWR0aClcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG4gICAgICAgICAgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpXG4gICAgICAgIHlheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeXRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55bGFiZWwpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IGZvcm1hdEF4aXMoeXRpY2tzKShkKSlcbiAgICAgICAgeWF4aXMuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aXRsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wLTgrKGhlaWdodC8yKSlcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeWxhYilcbiAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgyNzAsI3ttYXJnaW4ubGVmdC1heGlzcG9zLnl0aXRsZX0sI3ttYXJnaW4udG9wK2hlaWdodC8yfSlcIilcblxuXG4gICAgICAgIGxhYmVscyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiaWRcIiwgXCJsYWJlbHNcIilcbiAgICAgICAgbGFiZWxzU2VsZWN0ID1cbiAgICAgICAgICBsYWJlbHMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAudGV4dCgoZCktPiByZXR1cm4gd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgeHBvcyA9IHhzY2FsZSh4W2ldKVxuICAgICAgICAgICAgICAgICAgc3RyaW5nX2VuZCA9IHhwb3MrdGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKVxuICAgICAgICAgICAgICAgICAgb3ZlcmxhcF94c3RhcnQgPSB4cG9zLSh0aGlzLmdldENvbXB1dGVkVGV4dExlbmd0aCgpKzUpXG4gICAgICAgICAgICAgICAgICBpZiBvdmVybGFwX3hzdGFydCA8IDUwXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0gNTBcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvdmVybGFwX3hzdGFydCBpZiBzdHJpbmdfZW5kID4gd2lkdGhcbiAgICAgICAgICAgICAgICAgIHJldHVybiB4cG9zKzVcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHlwb3MgPSB5c2NhbGUoeVtpXSlcbiAgICAgICAgICAgICAgICAgIHJldHVybiB5cG9zKzEwIGlmICh5cG9zIDwgNTApXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcy01XG4gICAgICAgICAgICAgICAgICApXG5cblxuICAgICAgICBwb2ludHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwicG9pbnRzXCIpXG4gICAgICAgIHBvaW50c1NlbGVjdCA9XG4gICAgICAgICAgcG9pbnRzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImN4XCIsIChkLGkpIC0+IHhzY2FsZSh4W2ldKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLGkpIC0+IHlzY2FsZSh5W2ldKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkLGkpIC0+IFwicHQje2l9XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJyXCIsIHBvaW50c2l6ZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gaVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnMoW3ZhbF0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIChkLCBpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBNYXRoLmZsb29yKGkvMTcpICUgNVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRTdHJva2VDb2xvcih2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwib3BhY2l0eVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEgaWYgKHhbaV0/IG9yIHhOQS5oYW5kbGUpIGFuZCAoeVtpXT8gb3IgeU5BLmhhbmRsZSlcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0KVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgIFxuXG4gICAgIyMgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzXG4gICAgY2hhcnQud2lkdGggPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gd2lkdGggaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHdpZHRoID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5oZWlnaHQgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gaGVpZ2h0IGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBoZWlnaHQgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm1hcmdpbiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBtYXJnaW4gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG1hcmdpbiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuYXhpc3BvcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBheGlzcG9zIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBheGlzcG9zID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGltID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsaW0gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsaW0gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm54dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbnh0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbnh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHh0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeHRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55bGltID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHlsaW0gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHlsaW0gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm55dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbnl0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbnl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeXRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5yZWN0Y29sb3IgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcmVjdGNvbG9yIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICByZWN0Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50Y29sb3IgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRjb2xvciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzaXplID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c2l6ZSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRzaXplID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludHN0cm9rZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHN0cm9rZSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRzdHJva2UgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnhsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geGxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeGxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxhYiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGFiIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGFiID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHh2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl2YXIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geXZhciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeXZhciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXNjYWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB5c2NhbGVcblxuICAgIGNoYXJ0LnhzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geHNjYWxlXG5cbiAgICBjaGFydC5wb2ludHNTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c1NlbGVjdFxuXG4gICAgY2hhcnQubGFiZWxzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBsYWJlbHNTZWxlY3RcblxuICAgIGNoYXJ0LmxlZ2VuZFNlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGVnZW5kU2VsZWN0XG5cbiAgICBjaGFydC52ZXJ0aWNhbFJ1bGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHZlcnRpY2FsUnVsZVxuXG4gICAgY2hhcnQuaG9yaXpvbnRhbFJ1bGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIGhvcml6b250YWxSdWxlXG5cbiAgICAjIHJldHVybiB0aGUgY2hhcnQgZnVuY3Rpb25cbiAgICBjaGFydFxuXG4gIHJvdW5kRGF0YTogKGRhdGEpID0+IFxuICAgIGZvciBkIGluIGRhdGFcbiAgICAgIGQuRmlzaGluZyA9IHBhcnNlRmxvYXQoZC5GaXNoaW5nKS50b0ZpeGVkKDIpXG4gICAgICBkLkRpdmluZyA9IHBhcnNlRmxvYXQoZC5EaXZpbmcpLnRvRml4ZWQoMilcblxuICBnZXRDb2xvcnMgPSAoaSkgLT5cbiAgICBjb2xvcnMgPSBbXCJMaWdodEdyZWVuXCIsIFwiTGlnaHRQaW5rXCIsIFwiTGlnaHRTa3lCbHVlXCIsIFwiTW9jY2FzaW5cIiwgXCJCbHVlVmlvbGV0XCIsIFwiR2FpbnNib3JvXCIsIFwiRGFya0dyZWVuXCIsIFwiRGFya1R1cnF1b2lzZVwiLCBcIm1hcm9vblwiLCBcIm5hdnlcIiwgXCJMZW1vbkNoaWZmb25cIiwgXCJvcmFuZ2VcIiwgIFwicmVkXCIsIFwic2lsdmVyXCIsIFwidGVhbFwiLCBcIndoaXRlXCIsIFwiYmxhY2tcIl1cbiAgICByZXR1cm4gY29sb3JzW2ldXG5cbiAgZ2V0U3Ryb2tlQ29sb3IgPSAoaSkgLT5cbiAgICBzY29sb3JzID0gW1wiYmxhY2tcIiwgXCJ3aGl0ZVwiLCBcImdyYXlcIiwgXCJicm93blwiLCBcIk5hdnlcIl1cbiAgICByZXR1cm4gc2NvbG9yc1tpXVxuXG4gICMgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHJvdW5kaW5nIG9mIGF4aXMgbGFiZWxzXG4gIGZvcm1hdEF4aXMgPSAoZCkgLT5cbiAgICBkID0gZFsxXSAtIGRbMF1cbiAgICBuZGlnID0gTWF0aC5mbG9vciggTWF0aC5sb2coZCAlIDEwKSAvIE1hdGgubG9nKDEwKSApXG4gICAgbmRpZyA9IDAgaWYgbmRpZyA+IDBcbiAgICBuZGlnID0gTWF0aC5hYnMobmRpZylcbiAgICBkMy5mb3JtYXQoXCIuI3tuZGlnfWZcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFkZW9mZnNUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlbnZpcm9ubWVudFwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc0NvbnNlcnZhdGlvblpvbmVcIixjLHAsMSksYyxwLDAsMjYsNzc0OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5CZW50aGljIEhhYml0YXRzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4MDc5ZGQ1YTFlYzM2ZjU1OTVmYjJiMFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGZvbGxvd2luZyB0YWJsZSBkZXNjcmliZXMgdGhlIG92ZXJsYXAgb2YgeW91ciBwbGFuIHdpdGggdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LiBUaGUgTU5JIDIwMTYgYmVudGhpYyBoYWJpdGF0IG1hcCB3YXMgZGlnaXRpemVkIGJ5IGhhbmQgdXNpbmcgYSBjb21iaW5hdGlvbiBvZiBpbiBzaXR1IG9ic2VydmF0aW9ucyBvbiBzY3ViYS9mcmVlIGRpdmUgYXQgc3VydmV5IHNpdGVzIChuID0gYXBwcm94LiA2MDApIGFuZCBkcm9wIGNhbWVyYSBkZXBsb3ltZW50cyAobiA9IDM0MykgYXMgcGFydCBvZiB0aGUgV2FpdHQgSW5zdGl0dXRlIFNjaWVudGlmaWMgQXNzZXNzbWVudC4gUHJlbGltaW5hcnkgY29udGV4dCBmb3IgbWFwcGluZyB3YXMgZ2xlYW5lZCBmcm9tIGJlbnRoaWMgbWFwcyBkZXBpY3RlZCBpbiBXaWxkIGV0LiBhbCAyMDA3IGFuZCBJUkYgMTk5My4gVGhlc2UgbWFwcyBwcm92aWRlZCB2YWx1YWJsZSBpbnNpZ2h0IGludG8gZG9taW5hbnQgYmVudGhpYyBmZWF0dXJlcyBhbmQgdGhlIGludGVycHJldGF0aW9uIG9mIHNpdGUgb2JzZXJ2YXRpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzWm9uZVdpdGhHb2FsXCIsYyxwLDEpLGMscCwwLDkzOCwxMDIyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk1lZXRzIDMwJSBHb2FsPzxzdXA+Kjwvc3VwPjwvdGg+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjIyNXB4O1xcXCI+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFyZWEgKHNxLiBrbS4pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXJlYSAoJSBvZiBUb3RhbCk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYWJpdGF0c1wiLGMscCwxKSxjLHAsMCwxMjQxLDE4OTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1pvbmVXaXRoR29hbFwiLGMscCwxKSxjLHAsMCwxMjg5LDE3NDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJNRUVUU19HT0FMXCIsYyxwLDEpLGMscCwwLDEzNDAsMTQxMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtZ3JlZW4tY2hlY2tcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJNRUVUU19HT0FMXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7aWYoXy5zKF8uZihcIk5PX0dPQUxcIixjLHAsMSksYyxwLDAsMTQ5MSwxNTU4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcIm5vLWdvYWxcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzbWFsbC1yZWQteFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9O307Xy5iKFwiICAgICAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQVJFQV9TUUtNXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1pvbmVXaXRoR29hbFwiLGMscCwxKSxjLHAsMCwxOTU0LDI0MTYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQgY29sc3Bhbj1cXFwiNFxcXCIgc3R5bGU9XFxcInBhZGRpbmctbGVmdDoxMHB4O3RleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHN1cD4qPC9zdXA+SW5kaWNhdGVzIHdoZXRoZXIgdGhlIHNlbGVjdGVkIE1hcmluZSBSZXNlcnZlcyB6b25lcyBoYXZlIHJlYWNoZWQgdGggY29uc2VydmF0aW9uIGdvYWwgb2YgcHJlc2VydmluZyAzMCUgb2YgZWFjaCBoYWJpdGF0LiBBIGdyZWVuIGNoZWNrIGluZGljYXRlcyB0aGF0IHRoZSBnb2FsIGlzIG1ldCwgcmVkIHggbWVhbnMgdGhhdCB0aGUgZ29hbCBpcyBub3QgbWV0LCBhbmQgYSBncmF5IGRhc2ggaW5kaWNhdGVzIHRoYXQgdGhlcmUgaXMgbm8gZ29hbCBmb3IgdGhhdCBoYWJpdGF0LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3Rmb290PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+UHJlc2VuY2Ugb2YgSVVDTiBMaXN0ZWQgQ29yYWwgU3BlY2llcyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1OGU2NzFmYzRhZjI1ZDU5MGJhNGNjZWZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRocmVlIElVQ04gbGlzdGVkIGNvcmFscyBoYXZlIGJlZW4gb2JzZXJ2ZWQgd2l0aGluIE1vbnRzZXJyYXQgd2F0ZXJzLiBUaGUgZm9sbG93aW5nIGdyYXBoaWNzIHNob3cgdGhlIG51bWJlciBvZiB0aGUga25vd24gb2JzZXJ2YXRpb25zIHRoYXQgYXJlIGZvdW5kIHdpdGhpbiB0aGUgc2VsZWN0ZWQgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMjg1MiwyODcxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uIG9mIHpvbmVzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIi5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc0QzXCIsYyxwLDEpLGMscCwwLDI5NTUsMzMwNCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGRpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidml6XFxcIiBpZD1cXFwib3JiX2FcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDxkaXY+PGk+T3JiaWNlbGxhIGFubnVsYXJpcyA8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJvcmJfZlxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPGRpdj48aT5PcmJpY2VsbGEgZmF2ZW9sYXRhPC9pPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwidml6XFxcIiBpZD1cXFwiYWNyb1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPGRpdj48aT5BY3JvcG9yYSBwYWxtYXRhPC9pPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJoYXNEM1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjQwcHg7XFxcIj5OYW1lPHN1cD4qPC9zdXA+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjI1cHg7XFxcIj5Db3VudDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGg+VG90YWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29yYWxfY291bnRcIixjLHAsMSksYyxwLDAsMzYyMiwzNzY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiQ09VTlRcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlRPVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2ggUG90cyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1OGVkN2NiNTRhZjI1ZDU5MGJhNGZjM2NcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDAsNDAxNiw0MTQwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBjbGFzcz1cXFwidml6XFxcIiBpZD1cXFwiZmlzaF9wb3RzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPGRpdj48aT5GaXNoIFBvdHM8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjI1cHg7XFxcIj5Db3VudDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPlRvdGFsPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiZmlzaHBvdF9jb3VudFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImZpc2hwb3RfdG90YWxcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5OdXJzZXJ5IEFyZWFzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhlc2UgY2hhcnRzIHNob3cgdGhlIG1pbmltdW0sIG1lYW4gYW5kIG1heGltdW0gYWJ1bmRhbmNlIG1lYXN1cmVtZW50cyBvZiBudXJzZXJ5IGFyZWFzIHRoYXQgd2VyZSB0YWtlbiB3aXRoaW4geW91ciBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw0NzIwLDQ3MzAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ6b25lXCIpO307Xy5iKFwiLCBpbiByZWxhdGlvbiB0byB0aGUgZGlzdHJpYnV0aW9uIG9mIGFidW5kYW5jZSB3aXRoaW4gTW9udHNlcnJhdCB3YXRlcnMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMCw0ODg2LDQ5OTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPk51cnNlcnkgQXJlYXM8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJzYW5kZ192aXpcXFwiIGNsYXNzPVxcXCJzYW5kZ192aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyNTBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NaW5pbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWF4aW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJzYW5kZ1wiLGMscCwxKSxjLHAsMCw1Mjk0LDU0OTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5OdXJzZXJ5IEFyZWFzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJzYW5kZy5TQ09SRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwic2FuZGcuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJzYW5kZy5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0PkZpc2ggQmlvbWFzczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoZXNlIGNoYXJ0cyBzaG93IHRoZSBtaW5pbXVtLCBtZWFuIGFuZCBtYXhpbXVtIGZpc2ggYmlvbWFzcyB2YWx1ZSB0YWtlbiB3aXRoaW4geW91ciBza2V0Y2hlZCB6b25lLCBpbiByZWxhdGlvbiB0byB0aGUgZGlzdHJpYnV0aW9uIG9mIGJpb21hc3MgbWVhc3VyZWQgYXJvdW5kIHRoZSBpc2xhbmQuIEJpb21hc3Mgd2FzIGNhbGN1bGF0ZWQgZm9yIEhlcmJpdm9yZXMgYW5kIEFsbCBTcGVjaWVzIGF0IHJlZ3VsYXIgcG9pbnRzIGFsb25nIE1vbnRzZXJyYXQncyBjb2FzdC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwwLDU5MzEsNjE1OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+SGVyYml2b3JlIEJpb21hc3M8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJoZXJiX3ZpelxcXCIgY2xhc3M9XFxcImhlcmJfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5BbGwgU3BlY2llcyBCaW9tYXNzPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBpZD1cXFwidG90YWxfdml6XFxcIiBjbGFzcz1cXFwidG90YWxfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjUwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NZWFuPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWluaW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1heGltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGVyYlwiLGMscCwxKSxjLHAsMCw2NDUzLDY2NDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5IZXJiaXZvcmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLk1JTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiaGVyYi5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwidG90YWxcIixjLHAsMSksYyxwLDAsNjY3Myw2ODYyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+VG90YWxzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJ0b3RhbC5TQ09SRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwidG90YWwuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJ0b3RhbC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+RmlzaCBBYnVuZGFuY2U8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGVzZSBjaGFydHMgc2hvdyB0aGUgbWluaW11bSwgbWVhbiBhbmQgbWF4aW11bSBmaXNoIGFidW5kYW5jZSB2YWx1ZSB0YWtlbiB3aXRoaW4geW91ciBza2V0Y2hlZCB6b25lLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDAsNzEzNiw3MTkwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJmaXNoX3ZpelxcXCIgY2xhc3M9XFxcImZpc2hfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjUwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NZWFuPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWluaW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1heGltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaFwiLGMscCwxKSxjLHAsMCw3NDg1LDc2NzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5IZXJiaXZvcmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJmaXNoLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJmaXNoLk1JTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiZmlzaC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJoYXNDb25zZXJ2YXRpb25ab25lXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+Tm8gTWFyaW5lIFJlc2VydmVzIDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHAgc3R5bGU9XFxcImZvbnQtc2l6ZToxLjJlbVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZW0+VGhlIGVudmlyb25tZW50IHRhYiByZXBvcnRzIGFyZSBvbmx5IGFwcGxpY2FibGUgdG8gPGI+TWFyaW5lIFJlc2VydmVzPC9iPiB6b25lIHR5cGVzLjwvZW0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw4MDIyLDgwNzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiBUaGlzIGNvbGxlY3Rpb24gZG9lcyBub3QgaW5jbHVkZSBhbnkgb2YgdGhlc2Ugem9uZXMuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJvdmVydmlld1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlNpemU8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw3Niw4NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInpvbmVcIik7fTtfLmIoXCIgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmQoXCJzaXplLlNJWkVfU1FLTVwiLGMscCwwKSkpO18uYihcIiBzcS4ga208L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5kKFwic2l6ZS5QRVJDXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiBNb250c2VycmF0J3Mgd2F0ZXJzIHdpdGhpbiAzIG5hdXRpY2FsIG1pbGVzIG9mIHRoZSBjb2FzdGxpbmUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgZnJvbSBQb3J0IExpdHRsZSBCYXk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBmYXJ0aGVzdCBwb2ludCBpbiB0aGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNDQ0LDQ1NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInpvbmVcIik7fTtfLmIoXCIgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtaW5EaXN0S01cIixjLHAsMCkpKTtfLmIoXCIga208L3N0cm9uZz4gKG92ZXIgd2F0ZXIpIGZyb20gdGhlIFBvcnQgTGl0dGxlIEJheS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5GaXNoaW5nIFZhbHVlPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTdlMmMzM2JlYjI3NWJiYTFlYzZmZDQ2XFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhlYXRtYXAgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNzgzLDc5MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaFwiKTt9O18uYihcIiBvdmVybGFwcyB3aXRoIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJkaXNwbGFjZWRfZmlzaGluZ192YWx1ZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIHRvdGFsIGZpc2hpbmcgdmFsdWUgd2l0aGluIE1vbnRzZXJyYXQncyB3YXRlcnMsIGJhc2VkIG9uIHRoZSB1c2VyIHJlcG9ydGVkIHZhbHVlIG9mIGZpc2hpbmcgZ3JvdW5kcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpdmUgVmFsdWU8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1N2UyYzMwMmViMjc1YmJhMWVjNmZkM2RcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGVhdG1hcCBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwxMjI4LDEyMzgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2hcIik7fTtfLmIoXCIgb3ZlcmxhcHMgd2l0aCBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZGlzcGxhY2VkX2RpdmVfdmFsdWVcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSB0b3RhbCBkaXZlIHZhbHVlIHdpdGhpbiBNb250c2VycmF0J3Mgd2F0ZXJzLCBiYXNlZCBvbiB0aGUgdXNlciByZXBvcnRlZCB2YWx1ZSBvZiBkaXZlIHNpdGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7aWYoXy5zKF8uZihcImlzQ29uc2VydmF0aW9uWm9uZVwiLGMscCwxKSxjLHAsMCwxNTI0LDIxNTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8aDQ+TWluaW11bSBTaXplIEdvYWw8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgc3R5bGU9XFxcInBhZGRpbmctbGVmdDoxMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDAsMTY1OCwxNzEzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiYmlnLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiYmlnLXJlZC14XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgICAgICA8ZGl2IHN0eWxlPVxcXCJkaXNwbGF5OmlubGluZTtwYWRkaW5nLWxlZnQ6NXB4O2ZvbnQtc2l6ZToxLjFlbVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIFRoaXMgem9uZSA8Yj5cIik7aWYoXy5zKF8uZihcIm1lZXRzTWluV2lkdGhHb2FsXCIsYyxwLDEpLGMscCwwLDE5NTMsMTk1OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiIG1lZXRzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb2VzIG5vdCBtZWV0XCIpO307Xy5iKFwiPC9iPiB0aGUgY29uc2VydmF0aW9uIGdvYWwgb2YgaGF2aW5nIGEgbWluaW11bSB3aWR0aCBvZiA8Yj5hdCBsZWFzdCAxa208L2I+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319O2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMjIxMiwzNjI4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5NaW5pbXVtIFNpemUgR29hbDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBNYXJpbmUgUmVzZXJ2ZSBab25lcyBzaG91bGQgaGF2ZSBhIG1pbmltdW0gd2lkdGggb2YgYXQgbGVhc3QgMSBraWxvbWV0ZXIgdG8gbWVldCBjb25zZXJ2YXRpb24gZ29hbHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZCBzdHlsZT1cXFwid2lkdGg6NjBweDt0ZXh0LWFsaWduOmNlbnRlcjtcXFwiPk1lZXRzIDFrbSBHb2FsPzwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlpvbmUgTmFtZTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtaW5fZGltXCIsYyxwLDEpLGMscCwwLDI2NDMsMjkwNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtpZihfLnMoXy5mKFwiTUVFVFNfVEhSRVNIXCIsYyxwLDEpLGMscCwwLDI2OTYsMjczMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwic21hbGwtZ3JlZW4tY2hlY2tcXFwiPjwvZGl2PlwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk1FRVRTX1RIUkVTSFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIjxkaXYgY2xhc3M9XFxcInNtYWxsLXJlZC14XFxcIj48L2Rpdj5cIik7fTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5Db25uZWN0aXZpdHk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5ab25lIE5hbWU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5EaXN0YW5jZSB0byBOZWFyZXN0IFpvbmUgKGttKTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPk5lYXJlc3QgWm9uZSBOYW1lPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvbm5lY3Rpdml0eVwiLGMscCwxKSxjLHAsMCwzMjU5LDM0MDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJESVNUX0tNXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJORUFSX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGVtPk5vdGU6PC9lbT4gVGhlIGNvbm5lY3Rpdml0eSBhbmFseXRpYyBoYXMgYmVlbiBkZXZlbG9wZWQgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXMsIGFuZCBkb2VzIG5vdCBhY2NvdW50IGZvciB0aGUgbGVhc3QgY29zdCBwYXRoIGFyb3VuZCBsYW5kLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ0cmFkZW9mZnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFkZW9mZnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNzAsMTA4MSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICBcdDxwIHN0eWxlPVxcXCJtYXJnaW4tbGVmdDoxOHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0PGVtPlRyYWRlb2ZmIGFuYWx5c2lzIGlzIGN1cnJlbnRseSBpbiBkZXZlbG9wbWVudCwgYW5kIHNob3VsZCBiZSB1c2VkIGZvciBkZW1vbnN0cmF0aW9uIHB1cnBvc2VzIG9ubHkuIFRoZXNlIGFuYWx5dGljcyB3aWxsIGFsbG93IHVzZXJzIHRvIHBsb3QgbXVsdGlwbGUgcGxhbiBvcHRpb25zIGFnYWluc3QgZWFjaCBvdGhlciBpbiB0ZXJtcyBvZiB0aGVpciBpbXBhY3Qgb24gZmlzaGluZywgZGl2ZSBhbmQgY29uc2VydmF0aW9uIHZhbHVlIGZvciBNb250c2VycmF0LjwvZW0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBzdHlsZT1cXFwibWFyZ2luLWxlZnQ6MThweDttYXJnaW4tYm90dG9tOjE1cHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0ICBcdDxzcGFuPlNlbGVjdCBhIFNldCBvZiBUcmFkZW9mZiBTY29yZXMgdG8gVmlldzo8L3NwYW4+PC9icj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0PHNlbGVjdCBjbGFzcz1cXFwiY2hvc2VuXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwidHJhZGVvZmZzXCIsYyxwLDEpLGMscCwwLDU0OSw2NzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPG9wdGlvbiBjbGFzcz1cXFwiXCIpO18uYihfLnYoXy5kKFwiLiA9PSBcXFwiRmlzaGluZyBhbmQgRGl2aW5nXFxcIiA/ICdkZWZhdWx0LWNob3Nlbi1zZWxlY3Rpb24nIDogJydcIixjLHAsMCkpKTtfLmIoXCJcXFwiICB2YWx1ZT1cXFwiXCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIlxcXCI+XCIpO18uYihfLnYoXy5kKFwiLlwiLGMscCwwKSkpO18uYihcIjwvb3B0aW9uPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXHRcdDwvc2VsZWN0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdDxkaXYgaWQ9XFxcImZ2ZF9jb250YWluZXJcXFwiIGNsYXNzPVxcXCJmdmRfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwiZmlzaGluZy12LWRpdmluZ1xcXCIgY2xhc3M9XFxcImZpc2hpbmctdi1kaXZpbmdcXFwiPjwvZGl2PjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGlkPVxcXCJmdmNfY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiZnZjX2NvbnRhaW5lclxcXCI+PGRpdiAgaWQ9XFxcImZpc2hpbmctdi1jb25zZXJ2YXRpb25cXFwiIGNsYXNzPVxcXCJmaXNoaW5nLXYtY29uc2VydmF0aW9uXFxcIj48L2Rpdj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBpZD1cXFwiZHZjX2NvbnRhaW5lclxcXCIgY2xhc3M9XFxcImR2Y19jb250YWluZXJcXFwiPjxkaXYgIGlkPVxcXCJkaXZpbmctdi1jb25zZXJ2YXRpb25cXFwiIGNsYXNzPVxcXCJkaXZpbmctdi1jb25zZXJ2YXRpb25cXFwiPjwvZGl2PjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgIFx0ICBcdDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdFx0PGk+Tm8gdHJhZGVvZmYgYW5hbHlzaXMgYXZhaWxhYmxlIGZvciBpbmRpdmlkdWFsIHpvbmVzLjwvaT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8L3A+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59Il19
