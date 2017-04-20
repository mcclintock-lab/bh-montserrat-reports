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
    var connectivity, context, ddv, dfv, displaced_dive_value, displaced_fishing_value, err, isCollection, isConservationZone, meetsMinWidthGoal, minDistKM, minWidth, raw_val, size;
    size = this.recordSet('SizeAndConnectivity', 'Size').toArray()[0];
    size.PERC = Number((parseFloat(size.SIZE_SQKM) / 338.197) * 100.0).toFixed(1);
    connectivity = this.recordSet('SizeAndConnectivity', 'Connectivity').toArray();
    isCollection = this.model.isCollection();
    try {
      raw_val = this.recordSet('DiveAndFishingValue', 'ResultMsg');
      console.log("return msg: ", raw_val);
      dfv = this.recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0];
      ddv = this.recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0];
    } catch (_error) {
      err = _error;
      console.log("error: ", err);
    }
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
this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("hasConservationZone",c,p,1),c,p,0,26,8826,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Benthic Habitats <a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The following table describes the overlap of your plan with the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right. The MNI 2016 benthic habitat map was digitized by hand using a combination of in situ observations on scuba/free dive at survey sites (n = approx. 600) and drop camera deployments (n = 343) as part of the Waitt Institute Scientific Assessment. Preliminary context for mapping was gleaned from benthic maps depicted in Wild et. al 2007 and IRF 1993. These maps provided valuable insight into dominant benthic features and the interpretation of site observations. ");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,938,1164,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <th style=\"width:40px;\">Meets 10% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 20% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 30% Goal?<sup>*</sup></th>");_.b("\n");});c.pop();}_.b("            <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("            <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("            <th>Area (% of Total)</th>");_.b("\n" + i);_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,1383,2967,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,1431,2821,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_10_GOAL",c,p,1),c,p,0,1485,1558,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_10_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,1642,1709,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_20_GOAL",c,p,1),c,p,0,1944,2017,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_20_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,2101,2168,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_30_GOAL",c,p,1),c,p,0,2403,2476,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_30_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,2560,2627,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n");});c.pop();}_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,3026,3494,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <tfoot>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("\n" + i);_.b("            <td colspan=\"6\" style=\"padding-left:10px;text-align:left;\">");_.b("\n" + i);_.b("              <sup>*</sup>Indicates whether the selected Marine Reserves zones have reached th conservation goal of preserving 10/20/30% of each habitat. A green check indicates that the goal is met, red x means that the goal is not met, and a gray dash indicates that there is no goal for that habitat.");_.b("\n" + i);_.b("            </td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tfoot>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Presence of IUCN Listed Coral Species <a href=\"#\" data-toggle-node=\"58e671fc4af25d590ba4ccef\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Three IUCN listed corals have been observed within Montserrat waters. The following graphics show the number of the known observations that are found within the selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3930,3949,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection of zones");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(".");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,4033,4382,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_a\">");_.b("\n" + i);_.b("            <div><i>Orbicella annularis </i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_f\">");_.b("\n" + i);_.b("            <div><i>Orbicella faveolata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"acro\">");_.b("\n" + i);_.b("            <div><i>Acropora palmata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Name<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("              <th>Total</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("coral_count",c,p,1),c,p,0,4700,4844,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("  <h4>Fish Pots <a href=\"#\" data-toggle-node=\"58ed7cb54af25d590ba4fc3c\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,5094,5218,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("        <div class=\"viz\" id=\"fish_pots\">");_.b("\n" + i);_.b("          <div><i>Fish Pots</i></div>");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("            <th>Total</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("fishpot_count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("fishpot_total",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Nursery Areas</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum abundance measurements of nursery areas that were taken within your ");if(_.s(_.f("isCollection",c,p,1),c,p,0,5798,5808,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(", in relation to the distribution of abundance within Montserrat waters.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,5964,6076,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div class=\"in-report-header\">Nursery Areas</div>");_.b("\n" + i);_.b("      <div id=\"sandg_viz\" class=\"sandg_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("sandg",c,p,1),c,p,0,6372,6568,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Nursery Areas</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("sandg.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Fish Biomass</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum fish biomass value taken within your sketched zone, in relation to the distribution of biomass measured around the island. Biomass was calculated for Herbivores and All Species at regular points along Montserrat's coast.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,7009,7236,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div class=\"in-report-header\">Herbivore Biomass</div>");_.b("\n" + i);_.b("      <div id=\"herb_viz\" class=\"herb_viz\"></div>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">All Species Biomass</div>");_.b("\n" + i);_.b("      <div id=\"total_viz\" class=\"total_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("herb",c,p,1),c,p,0,7531,7721,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Herbivores</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}if(_.s(_.f("total",c,p,1),c,p,0,7751,7940,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Totals</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Fish Abundance</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum fish abundance value taken within your sketched zone.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,8214,8268,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div id=\"fish_viz\" class=\"fish_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fish",c,p,1),c,p,0,8563,8753,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Herbivores</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b("  </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasConservationZone",c,p,1),c,p,1,0,0,"")){_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>No Marine Reserves </h4>");_.b("\n" + i);_.b("      <p style=\"font-size:1.2em\">");_.b("\n" + i);_.b("        <em>The environment tab reports are only applicable to <b>Marine Reserves</b> zone types.</em>");_.b("\n" + i);_.b("        ");if(_.s(_.f("isCollection",c,p,1),c,p,0,9100,9153,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" This collection does not include any of these zones.");});c.pop();}_.b("\n" + i);_.b("      </p>");_.b("\n");};return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,76,86,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.d("size.SIZE_SQKM",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.d("size.PERC",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance from Port Little Bay</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The farthest point in the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,444,454,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.f("minDistKM",c,p,0)));_.b(" km</strong> (over water) from the Port Little Bay.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value<a href=\"#\" data-toggle-node=\"57e2c33beb275bba1ec6fd46\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,783,793,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Montserrat's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Dive Value<a href=\"#\" data-toggle-node=\"57e2c302eb275bba1ec6fd3d\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1228,1238,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Montserrat's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("isConservationZone",c,p,1),c,p,0,1524,2153,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <div style=\"padding-left:10px\">");_.b("\n" + i);if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,1658,1713,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"big-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("          <div class=\"big-red-x\"></div>");_.b("\n");};_.b("        <div style=\"display:inline;padding-left:5px;font-size:1.1em\">");_.b("\n" + i);_.b("          This zone <b>");if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,1953,1959,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" meets");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("does not meet");};_.b("</b> the conservation goal of having a minimum width of <b>at least 1km</b>.");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}};if(_.s(_.f("isCollection",c,p,1),c,p,0,2212,3750,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Marine Reserve Zones should have a minimum width of at least 1 kilometer to meet conservation goals.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td style=\"width:60px;text-align:center;\">Meets 1km Goal?</td>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("min_dim",c,p,1),c,p,0,2643,3028,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_THRESH",c,p,1),c,p,0,2713,2786,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_THRESH",c,p,1),c,p,1,0,0,"")){_.b("                  <div class=\"small-red-x\"></div>");_.b("\n");};_.b("              </td>");_.b("\n" + i);_.b("              <td style=\"text-align:left;\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("   </div>");_.b("\n" + i);_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Connectivity</h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("            <td>Distance to Nearest Zone (km)</td>");_.b("\n" + i);_.b("            <td>Nearest Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("connectivity",c,p,1),c,p,0,3381,3531,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("DIST_KM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NEAR_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <em>Note:</em> The connectivity analytic has been developed for demonstration purposes, and does not account for the least cost path around land.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["tradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,70,1081,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p style=\"margin-left:18px;\">");_.b("\n" + i);_.b("  		<em>Tradeoff analysis is currently in development, and should be used for demonstration purposes only. These analytics will allow users to plot multiple plan options against each other in terms of their impact on fishing, dive and conservation value for Montserrat.</em>");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("  	<div style=\"margin-left:18px;margin-bottom:15px\">");_.b("\n" + i);_.b("	  	<span>Select a Set of Tradeoff Scores to View:</span></br>");_.b("\n" + i);_.b("		<select class=\"chosen\">");_.b("\n" + i);if(_.s(_.f("tradeoffs",c,p,1),c,p,0,549,674,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <option class=\"");_.b(_.v(_.d(". == \"Fishing and Diving\" ? 'default-chosen-selection' : ''",c,p,0)));_.b("\"  value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("		</select>");_.b("\n" + i);_.b("	</div>");_.b("\n" + i);_.b("  	<div id=\"fvd_container\" class=\"fvd_container\"><div  id=\"fishing-v-diving\" class=\"fishing-v-diving\"></div></div>");_.b("\n" + i);_.b("    <div id=\"fvc_container\" class=\"fvc_container\"><div  id=\"fishing-v-conservation\" class=\"fishing-v-conservation\"></div></div>");_.b("\n" + i);_.b("    <div id=\"dvc_container\" class=\"dvc_container\"><div  id=\"diving-v-conservation\" class=\"diving-v-conservation\"></div></div>");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("  	  	<p>");_.b("\n" + i);_.b("  			<i>No tradeoff analysis available for individual zones.</i>");_.b("\n" + i);_.b("  		</p>");_.b("\n");};_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvc2NyaXB0cy9lbnZpcm9ubWVudC5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvdHJhZGVvZmZzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0Is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QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIm1vZHVsZS5leHBvcnRzID0gKGVsKSAtPlxuICAkZWwgPSAkIGVsXG4gIGFwcCA9IHdpbmRvdy5hcHBcbiAgdG9jID0gYXBwLmdldFRvYygpXG4gIHVubGVzcyB0b2NcbiAgICBjb25zb2xlLmxvZyAnTm8gdGFibGUgb2YgY29udGVudHMgZm91bmQnXG4gICAgcmV0dXJuXG4gIHRvZ2dsZXJzID0gJGVsLmZpbmQoJ2FbZGF0YS10b2dnbGUtbm9kZV0nKVxuICAjIFNldCBpbml0aWFsIHN0YXRlXG4gIGZvciB0b2dnbGVyIGluIHRvZ2dsZXJzLnRvQXJyYXkoKVxuICAgICR0b2dnbGVyID0gJCh0b2dnbGVyKVxuICAgIG5vZGVpZCA9ICR0b2dnbGVyLmRhdGEoJ3RvZ2dsZS1ub2RlJylcbiAgICB0cnlcbiAgICAgIHZpZXcgPSB0b2MuZ2V0Q2hpbGRWaWV3QnlJZCBub2RlaWRcbiAgICAgIG5vZGUgPSB2aWV3Lm1vZGVsXG4gICAgICAkdG9nZ2xlci5hdHRyICdkYXRhLXZpc2libGUnLCAhIW5vZGUuZ2V0KCd2aXNpYmxlJylcbiAgICAgICR0b2dnbGVyLmRhdGEgJ3RvY0l0ZW0nLCB2aWV3XG4gICAgY2F0Y2ggZVxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS1ub3QtZm91bmQnLCAndHJ1ZSdcblxuICB0b2dnbGVycy5vbiAnY2xpY2snLCAoZSkgLT5cbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICAkZWwgPSAkKGUudGFyZ2V0KVxuICAgIHZpZXcgPSAkZWwuZGF0YSgndG9jSXRlbScpXG4gICAgaWYgdmlld1xuICAgICAgdmlldy50b2dnbGVWaXNpYmlsaXR5KGUpXG4gICAgICAkZWwuYXR0ciAnZGF0YS12aXNpYmxlJywgISF2aWV3Lm1vZGVsLmdldCgndmlzaWJsZScpXG4gICAgZWxzZVxuICAgICAgYWxlcnQgXCJMYXllciBub3QgZm91bmQgaW4gdGhlIGN1cnJlbnQgVGFibGUgb2YgQ29udGVudHMuIFxcbkV4cGVjdGVkIG5vZGVpZCAjeyRlbC5kYXRhKCd0b2dnbGUtbm9kZScpfVwiXG4iLCJjbGFzcyBKb2JJdGVtIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBjbGFzc05hbWU6ICdyZXBvcnRSZXN1bHQnXG4gIGV2ZW50czoge31cbiAgYmluZGluZ3M6XG4gICAgXCJoNiBhXCI6XG4gICAgICBvYnNlcnZlOiBcInNlcnZpY2VOYW1lXCJcbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIGF0dHJpYnV0ZXM6IFt7XG4gICAgICAgIG5hbWU6ICdocmVmJ1xuICAgICAgICBvYnNlcnZlOiAnc2VydmljZVVybCdcbiAgICAgIH1dXG4gICAgXCIuc3RhcnRlZEF0XCI6XG4gICAgICBvYnNlcnZlOiBbXCJzdGFydGVkQXRcIiwgXCJzdGF0dXNcIl1cbiAgICAgIHZpc2libGU6ICgpIC0+XG4gICAgICAgIEBtb2RlbC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgIHVwZGF0ZVZpZXc6IHRydWVcbiAgICAgIG9uR2V0OiAoKSAtPlxuICAgICAgICBpZiBAbW9kZWwuZ2V0KCdzdGFydGVkQXQnKVxuICAgICAgICAgIHJldHVybiBcIlN0YXJ0ZWQgXCIgKyBtb21lbnQoQG1vZGVsLmdldCgnc3RhcnRlZEF0JykpLmZyb21Ob3coKSArIFwiLiBcIlxuICAgICAgICBlbHNlXG4gICAgICAgICAgXCJcIlxuICAgIFwiLnN0YXR1c1wiOiAgICAgIFxuICAgICAgb2JzZXJ2ZTogXCJzdGF0dXNcIlxuICAgICAgb25HZXQ6IChzKSAtPlxuICAgICAgICBzd2l0Y2ggc1xuICAgICAgICAgIHdoZW4gJ3BlbmRpbmcnXG4gICAgICAgICAgICBcIndhaXRpbmcgaW4gbGluZVwiXG4gICAgICAgICAgd2hlbiAncnVubmluZydcbiAgICAgICAgICAgIFwicnVubmluZyBhbmFseXRpY2FsIHNlcnZpY2VcIlxuICAgICAgICAgIHdoZW4gJ2NvbXBsZXRlJ1xuICAgICAgICAgICAgXCJjb21wbGV0ZWRcIlxuICAgICAgICAgIHdoZW4gJ2Vycm9yJ1xuICAgICAgICAgICAgXCJhbiBlcnJvciBvY2N1cnJlZFwiXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgc1xuICAgIFwiLnF1ZXVlTGVuZ3RoXCI6IFxuICAgICAgb2JzZXJ2ZTogXCJxdWV1ZUxlbmd0aFwiXG4gICAgICBvbkdldDogKHYpIC0+XG4gICAgICAgIHMgPSBcIldhaXRpbmcgYmVoaW5kICN7dn0gam9iXCJcbiAgICAgICAgaWYgdi5sZW5ndGggPiAxXG4gICAgICAgICAgcyArPSAncydcbiAgICAgICAgcmV0dXJuIHMgKyBcIi4gXCJcbiAgICAgIHZpc2libGU6ICh2KSAtPlxuICAgICAgICB2PyBhbmQgcGFyc2VJbnQodikgPiAwXG4gICAgXCIuZXJyb3JzXCI6XG4gICAgICBvYnNlcnZlOiAnZXJyb3InXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8ubGVuZ3RoID4gMlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBpZiB2P1xuICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHYsIG51bGwsICcgICcpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBudWxsXG5cbiAgY29uc3RydWN0b3I6IChAbW9kZWwpIC0+XG4gICAgc3VwZXIoKVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICBAJGVsLmh0bWwgXCJcIlwiXG4gICAgICA8aDY+PGEgaHJlZj1cIiNcIiB0YXJnZXQ9XCJfYmxhbmtcIj48L2E+PHNwYW4gY2xhc3M9XCJzdGF0dXNcIj48L3NwYW4+PC9oNj5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwic3RhcnRlZEF0XCI+PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cInF1ZXVlTGVuZ3RoXCI+PC9zcGFuPlxuICAgICAgICA8cHJlIGNsYXNzPVwiZXJyb3JzXCI+PC9wcmU+XG4gICAgICA8L2Rpdj5cbiAgICBcIlwiXCJcbiAgICBAc3RpY2tpdCgpXG5cbm1vZHVsZS5leHBvcnRzID0gSm9iSXRlbSIsImNsYXNzIFJlcG9ydFJlc3VsdHMgZXh0ZW5kcyBCYWNrYm9uZS5Db2xsZWN0aW9uXG5cbiAgZGVmYXVsdFBvbGxpbmdJbnRlcnZhbDogMzAwMFxuXG4gIGNvbnN0cnVjdG9yOiAoQHNrZXRjaCwgQGRlcHMpIC0+XG4gICAgQHVybCA9IHVybCA9IFwiL3JlcG9ydHMvI3tAc2tldGNoLmlkfS8je0BkZXBzLmpvaW4oJywnKX1cIlxuICAgIHN1cGVyKClcblxuICBwb2xsOiAoKSA9PlxuICAgIEBmZXRjaCB7XG4gICAgICBzdWNjZXNzOiAoKSA9PlxuICAgICAgICBAdHJpZ2dlciAnam9icydcbiAgICAgICAgZm9yIHJlc3VsdCBpbiBAbW9kZWxzXG4gICAgICAgICAgaWYgcmVzdWx0LmdldCgnc3RhdHVzJykgbm90IGluIFsnY29tcGxldGUnLCAnZXJyb3InXVxuICAgICAgICAgICAgdW5sZXNzIEBpbnRlcnZhbFxuICAgICAgICAgICAgICBAaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCBAcG9sbCwgQGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWxcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGNvbnNvbGUubG9nIEBtb2RlbHNbMF0uZ2V0KCdwYXlsb2FkU2l6ZUJ5dGVzJylcbiAgICAgICAgICBwYXlsb2FkU2l6ZSA9IE1hdGgucm91bmQoKChAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpIG9yIDApIC8gMTAyNCkgKiAxMDApIC8gMTAwXG4gICAgICAgICAgY29uc29sZS5sb2cgXCJGZWF0dXJlU2V0IHNlbnQgdG8gR1Agd2VpZ2hlZCBpbiBhdCAje3BheWxvYWRTaXplfWtiXCJcbiAgICAgICAgIyBhbGwgY29tcGxldGUgdGhlblxuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICBpZiBwcm9ibGVtID0gXy5maW5kKEBtb2RlbHMsIChyKSAtPiByLmdldCgnZXJyb3InKT8pXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywgXCJQcm9ibGVtIHdpdGggI3twcm9ibGVtLmdldCgnc2VydmljZU5hbWUnKX0gam9iXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIEB0cmlnZ2VyICdmaW5pc2hlZCdcbiAgICAgIGVycm9yOiAoZSwgcmVzLCBhLCBiKSA9PlxuICAgICAgICB1bmxlc3MgcmVzLnN0YXR1cyBpcyAwXG4gICAgICAgICAgaWYgcmVzLnJlc3BvbnNlVGV4dD8ubGVuZ3RoXG4gICAgICAgICAgICB0cnlcbiAgICAgICAgICAgICAganNvbiA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlVGV4dClcbiAgICAgICAgICAgIGNhdGNoXG4gICAgICAgICAgICAgICMgZG8gbm90aGluZ1xuICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKEBpbnRlcnZhbCkgaWYgQGludGVydmFsXG4gICAgICAgICAgQHRyaWdnZXIgJ2Vycm9yJywganNvbj8uZXJyb3I/Lm1lc3NhZ2Ugb3JcbiAgICAgICAgICAgICdQcm9ibGVtIGNvbnRhY3RpbmcgdGhlIFNlYVNrZXRjaCBzZXJ2ZXInXG4gICAgfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFJlc3VsdHNcbiIsImVuYWJsZUxheWVyVG9nZ2xlcnMgPSByZXF1aXJlICcuL2VuYWJsZUxheWVyVG9nZ2xlcnMuY29mZmVlJ1xucm91bmQgPSByZXF1aXJlKCcuL3V0aWxzLmNvZmZlZScpLnJvdW5kXG5SZXBvcnRSZXN1bHRzID0gcmVxdWlyZSAnLi9yZXBvcnRSZXN1bHRzLmNvZmZlZSdcbnQgPSByZXF1aXJlKCcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJylcbnRlbXBsYXRlcyA9XG4gIHJlcG9ydExvYWRpbmc6IHRbJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nJ11cbkpvYkl0ZW0gPSByZXF1aXJlICcuL2pvYkl0ZW0uY29mZmVlJ1xuQ29sbGVjdGlvblZpZXcgPSByZXF1aXJlKCd2aWV3cy9jb2xsZWN0aW9uVmlldycpXG5cbmNsYXNzIFJlY29yZFNldFxuXG4gIGNvbnN0cnVjdG9yOiAoQGRhdGEsIEB0YWIsIEBza2V0Y2hDbGFzc0lkKSAtPlxuXG4gIHRvQXJyYXk6ICgpIC0+XG4gICAgaWYgQHNrZXRjaENsYXNzSWRcbiAgICAgIGRhdGEgPSBfLmZpbmQgQGRhdGEudmFsdWUsICh2KSA9PlxuICAgICAgICB2LmZlYXR1cmVzP1swXT8uYXR0cmlidXRlcz9bJ1NDX0lEJ10gaXMgQHNrZXRjaENsYXNzSWRcbiAgICAgIHVubGVzcyBkYXRhXG4gICAgICAgIHRocm93IFwiQ291bGQgbm90IGZpbmQgZGF0YSBmb3Igc2tldGNoQ2xhc3MgI3tAc2tldGNoQ2xhc3NJZH1cIlxuICAgIGVsc2VcbiAgICAgIGlmIF8uaXNBcnJheSBAZGF0YS52YWx1ZVxuICAgICAgICBkYXRhID0gQGRhdGEudmFsdWVbMF1cbiAgICAgIGVsc2VcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlXG4gICAgXy5tYXAgZGF0YS5mZWF0dXJlcywgKGZlYXR1cmUpIC0+XG4gICAgICBmZWF0dXJlLmF0dHJpYnV0ZXNcblxuICByYXc6IChhdHRyKSAtPlxuICAgIGF0dHJzID0gXy5tYXAgQHRvQXJyYXkoKSwgKHJvdykgLT5cbiAgICAgIHJvd1thdHRyXVxuICAgIGF0dHJzID0gXy5maWx0ZXIgYXR0cnMsIChhdHRyKSAtPiBhdHRyICE9IHVuZGVmaW5lZFxuICAgIGlmIGF0dHJzLmxlbmd0aCBpcyAwXG4gICAgICBjb25zb2xlLmxvZyBAZGF0YVxuICAgICAgQHRhYi5yZXBvcnRFcnJvciBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn0gZnJvbSByZXN1bHRzXCJcbiAgICAgIHRocm93IFwiQ291bGQgbm90IGdldCBhdHRyaWJ1dGUgI3thdHRyfVwiXG4gICAgZWxzZSBpZiBhdHRycy5sZW5ndGggaXMgMVxuICAgICAgcmV0dXJuIGF0dHJzWzBdXG4gICAgZWxzZVxuICAgICAgcmV0dXJuIGF0dHJzXG5cbiAgaW50OiAoYXR0cikgLT5cbiAgICByYXcgPSBAcmF3KGF0dHIpXG4gICAgaWYgXy5pc0FycmF5KHJhdylcbiAgICAgIF8ubWFwIHJhdywgcGFyc2VJbnRcbiAgICBlbHNlXG4gICAgICBwYXJzZUludChyYXcpXG5cbiAgZmxvYXQ6IChhdHRyLCBkZWNpbWFsUGxhY2VzPTIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHJvdW5kKHZhbCwgZGVjaW1hbFBsYWNlcylcbiAgICBlbHNlXG4gICAgICByb3VuZChyYXcsIGRlY2ltYWxQbGFjZXMpXG5cbiAgYm9vbDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsICh2YWwpIC0+IHZhbC50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG4gICAgZWxzZVxuICAgICAgcmF3LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKSBpcyAndHJ1ZSdcblxuY2xhc3MgUmVwb3J0VGFiIGV4dGVuZHMgQmFja2JvbmUuVmlld1xuICBuYW1lOiAnSW5mb3JtYXRpb24nXG4gIGRlcGVuZGVuY2llczogW11cblxuICBpbml0aWFsaXplOiAoQG1vZGVsLCBAb3B0aW9ucykgLT5cbiAgICAjIFdpbGwgYmUgaW5pdGlhbGl6ZWQgYnkgU2VhU2tldGNoIHdpdGggdGhlIGZvbGxvd2luZyBhcmd1bWVudHM6XG4gICAgIyAgICogbW9kZWwgLSBUaGUgc2tldGNoIGJlaW5nIHJlcG9ydGVkIG9uXG4gICAgIyAgICogb3B0aW9uc1xuICAgICMgICAgIC0gLnBhcmVudCAtIHRoZSBwYXJlbnQgcmVwb3J0IHZpZXdcbiAgICAjICAgICAgICBjYWxsIEBvcHRpb25zLnBhcmVudC5kZXN0cm95KCkgdG8gY2xvc2UgdGhlIHdob2xlIHJlcG9ydCB3aW5kb3dcbiAgICBAYXBwID0gd2luZG93LmFwcFxuICAgIF8uZXh0ZW5kIEAsIEBvcHRpb25zXG4gICAgQHJlcG9ydFJlc3VsdHMgPSBuZXcgUmVwb3J0UmVzdWx0cyhAbW9kZWwsIEBkZXBlbmRlbmNpZXMpXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2Vycm9yJywgQHJlcG9ydEVycm9yXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ2pvYnMnLCBAcmVuZGVySm9iRGV0YWlsc1xuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlcG9ydEpvYnNcbiAgICBAbGlzdGVuVG8gQHJlcG9ydFJlc3VsdHMsICdmaW5pc2hlZCcsIF8uYmluZCBAcmVuZGVyLCBAXG4gICAgQGxpc3RlblRvT25jZSBAcmVwb3J0UmVzdWx0cywgJ3JlcXVlc3QnLCBAcmVwb3J0UmVxdWVzdGVkXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRocm93ICdyZW5kZXIgbWV0aG9kIG11c3QgYmUgb3ZlcmlkZGVuJ1xuXG4gIHNob3c6ICgpIC0+XG4gICAgQCRlbC5zaG93KClcbiAgICBAdmlzaWJsZSA9IHRydWVcbiAgICBpZiBAZGVwZW5kZW5jaWVzPy5sZW5ndGggYW5kICFAcmVwb3J0UmVzdWx0cy5tb2RlbHMubGVuZ3RoXG4gICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICBlbHNlIGlmICFAZGVwZW5kZW5jaWVzPy5sZW5ndGhcbiAgICAgIEByZW5kZXIoKVxuICAgICAgQCQoJ1tkYXRhLWF0dHJpYnV0ZS10eXBlPVVybEZpZWxkXSAudmFsdWUsIFtkYXRhLWF0dHJpYnV0ZS10eXBlPVVwbG9hZEZpZWxkXSAudmFsdWUnKS5lYWNoICgpIC0+XG4gICAgICAgIHRleHQgPSAkKEApLnRleHQoKVxuICAgICAgICBodG1sID0gW11cbiAgICAgICAgZm9yIHVybCBpbiB0ZXh0LnNwbGl0KCcsJylcbiAgICAgICAgICBpZiB1cmwubGVuZ3RoXG4gICAgICAgICAgICBuYW1lID0gXy5sYXN0KHVybC5zcGxpdCgnLycpKVxuICAgICAgICAgICAgaHRtbC5wdXNoIFwiXCJcIjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9XCIje3VybH1cIj4je25hbWV9PC9hPlwiXCJcIlxuICAgICAgICAkKEApLmh0bWwgaHRtbC5qb2luKCcsICcpXG5cblxuICBoaWRlOiAoKSAtPlxuICAgIEAkZWwuaGlkZSgpXG4gICAgQHZpc2libGUgPSBmYWxzZVxuXG4gIHJlbW92ZTogKCkgPT5cbiAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCBAZXRhSW50ZXJ2YWxcbiAgICBAc3RvcExpc3RlbmluZygpXG4gICAgc3VwZXIoKVxuXG4gIHJlcG9ydFJlcXVlc3RlZDogKCkgPT5cbiAgICBAJGVsLmh0bWwgdGVtcGxhdGVzLnJlcG9ydExvYWRpbmcucmVuZGVyKHt9KVxuXG4gIHJlcG9ydEVycm9yOiAobXNnLCBjYW5jZWxsZWRSZXF1ZXN0KSA9PlxuICAgIHVubGVzcyBjYW5jZWxsZWRSZXF1ZXN0XG4gICAgICBpZiBtc2cgaXMgJ0pPQl9FUlJPUidcbiAgICAgICAgQHNob3dFcnJvciAnRXJyb3Igd2l0aCBzcGVjaWZpYyBqb2InXG4gICAgICBlbHNlXG4gICAgICAgIEBzaG93RXJyb3IgbXNnXG5cbiAgc2hvd0Vycm9yOiAobXNnKSA9PlxuICAgIEAkKCcucHJvZ3Jlc3MnKS5yZW1vdmUoKVxuICAgIEAkKCdwLmVycm9yJykucmVtb3ZlKClcbiAgICBAJCgnaDQnKS50ZXh0KFwiQW4gRXJyb3IgT2NjdXJyZWRcIikuYWZ0ZXIgXCJcIlwiXG4gICAgICA8cCBjbGFzcz1cImVycm9yXCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4je21zZ308L3A+XG4gICAgXCJcIlwiXG5cbiAgcmVwb3J0Sm9iczogKCkgPT5cbiAgICB1bmxlc3MgQG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgIEAkKCdoNCcpLnRleHQgXCJBbmFseXppbmcgRGVzaWduc1wiXG5cbiAgc3RhcnRFdGFDb3VudGRvd246ICgpID0+XG4gICAgaWYgQG1heEV0YVxuICAgICAgXy5kZWxheSAoKSA9PlxuICAgICAgICBAcmVwb3J0UmVzdWx0cy5wb2xsKClcbiAgICAgICwgKEBtYXhFdGEgKyAxKSAqIDEwMDBcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykuY3NzICd0cmFuc2l0aW9uLXRpbWluZy1mdW5jdGlvbicsICdsaW5lYXInXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi1kdXJhdGlvbicsIFwiI3tAbWF4RXRhICsgMX1zXCJcbiAgICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzEwMCUnKVxuICAgICAgLCA1MDBcblxuICByZW5kZXJKb2JEZXRhaWxzOiAoKSA9PlxuICAgIG1heEV0YSA9IG51bGxcbiAgICBmb3Igam9iIGluIEByZXBvcnRSZXN1bHRzLm1vZGVsc1xuICAgICAgaWYgam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgICAgIGlmICFtYXhFdGEgb3Igam9iLmdldCgnZXRhU2Vjb25kcycpID4gbWF4RXRhXG4gICAgICAgICAgbWF4RXRhID0gam9iLmdldCgnZXRhU2Vjb25kcycpXG4gICAgaWYgbWF4RXRhXG4gICAgICBAbWF4RXRhID0gbWF4RXRhXG4gICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS53aWR0aCgnNSUnKVxuICAgICAgQHN0YXJ0RXRhQ291bnRkb3duKClcblxuICAgIEAkKCdbcmVsPWRldGFpbHNdJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJylcbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNsaWNrIChlKSA9PlxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmhpZGUoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuc2hvdygpXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGl0ZW0gPSBuZXcgSm9iSXRlbShqb2IpXG4gICAgICBpdGVtLnJlbmRlcigpXG4gICAgICBAJCgnLmRldGFpbHMnKS5hcHBlbmQgaXRlbS5lbFxuXG4gIGdldFJlc3VsdDogKGlkKSAtPlxuICAgIHJlc3VsdHMgPSBAZ2V0UmVzdWx0cygpXG4gICAgcmVzdWx0ID0gXy5maW5kIHJlc3VsdHMsIChyKSAtPiByLnBhcmFtTmFtZSBpcyBpZFxuICAgIHVubGVzcyByZXN1bHQ/XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJlc3VsdCB3aXRoIGlkICcgKyBpZClcbiAgICByZXN1bHQudmFsdWVcblxuICBnZXRGaXJzdFJlc3VsdDogKHBhcmFtLCBpZCkgLT5cbiAgICByZXN1bHQgPSBAZ2V0UmVzdWx0KHBhcmFtKVxuICAgIHRyeVxuICAgICAgcmV0dXJuIHJlc3VsdFswXS5mZWF0dXJlc1swXS5hdHRyaWJ1dGVzW2lkXVxuICAgIGNhdGNoIGVcbiAgICAgIHRocm93IFwiRXJyb3IgZmluZGluZyAje3BhcmFtfToje2lkfSBpbiBncCByZXN1bHRzXCJcblxuICBnZXRSZXN1bHRzOiAoKSAtPlxuICAgIHJlc3VsdHMgPSBAcmVwb3J0UmVzdWx0cy5tYXAoKHJlc3VsdCkgLT4gcmVzdWx0LmdldCgncmVzdWx0JykucmVzdWx0cylcbiAgICB1bmxlc3MgcmVzdWx0cz8ubGVuZ3RoXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGdwIHJlc3VsdHMnKVxuICAgIF8uZmlsdGVyIHJlc3VsdHMsIChyZXN1bHQpIC0+XG4gICAgICByZXN1bHQucGFyYW1OYW1lIG5vdCBpbiBbJ1Jlc3VsdENvZGUnLCAnUmVzdWx0TXNnJ11cblxuICByZWNvcmRTZXQ6IChkZXBlbmRlbmN5LCBwYXJhbU5hbWUsIHNrZXRjaENsYXNzSWQ9ZmFsc2UpIC0+XG4gICAgdW5sZXNzIGRlcGVuZGVuY3kgaW4gQGRlcGVuZGVuY2llc1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiVW5rbm93biBkZXBlbmRlbmN5ICN7ZGVwZW5kZW5jeX1cIlxuICAgIGRlcCA9IEByZXBvcnRSZXN1bHRzLmZpbmQgKHIpIC0+IHIuZ2V0KCdzZXJ2aWNlTmFtZScpIGlzIGRlcGVuZGVuY3lcbiAgICB1bmxlc3MgZGVwXG4gICAgICBjb25zb2xlLmxvZyBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHJlc3VsdHMgZm9yICN7ZGVwZW5kZW5jeX0uXCJcbiAgICBwYXJhbSA9IF8uZmluZCBkZXAuZ2V0KCdyZXN1bHQnKS5yZXN1bHRzLCAocGFyYW0pIC0+XG4gICAgICBwYXJhbS5wYXJhbU5hbWUgaXMgcGFyYW1OYW1lXG4gICAgdW5sZXNzIHBhcmFtXG4gICAgICBjb25zb2xlLmxvZyBkZXAuZ2V0KCdkYXRhJykucmVzdWx0c1xuICAgICAgdGhyb3cgbmV3IEVycm9yIFwiQ291bGQgbm90IGZpbmQgcGFyYW0gI3twYXJhbU5hbWV9IGluICN7ZGVwZW5kZW5jeX1cIlxuICAgIG5ldyBSZWNvcmRTZXQocGFyYW0sIEAsIHNrZXRjaENsYXNzSWQpXG5cbiAgZW5hYmxlVGFibGVQYWdpbmc6ICgpIC0+XG4gICAgQCQoJ1tkYXRhLXBhZ2luZ10nKS5lYWNoICgpIC0+XG4gICAgICAkdGFibGUgPSAkKEApXG4gICAgICBwYWdlU2l6ZSA9ICR0YWJsZS5kYXRhKCdwYWdpbmcnKVxuICAgICAgcm93cyA9ICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmxlbmd0aFxuICAgICAgcGFnZXMgPSBNYXRoLmNlaWwocm93cyAvIHBhZ2VTaXplKVxuICAgICAgaWYgcGFnZXMgPiAxXG4gICAgICAgICR0YWJsZS5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgPHRmb290PlxuICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICA8dGQgY29sc3Bhbj1cIiN7JHRhYmxlLmZpbmQoJ3RoZWFkIHRoJykubGVuZ3RofVwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJwYWdpbmF0aW9uXCI+XG4gICAgICAgICAgICAgICAgICA8dWw+XG4gICAgICAgICAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPlByZXY8L2E+PC9saT5cbiAgICAgICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDwvdGZvb3Q+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICB1bCA9ICR0YWJsZS5maW5kKCd0Zm9vdCB1bCcpXG4gICAgICAgIGZvciBpIGluIF8ucmFuZ2UoMSwgcGFnZXMgKyAxKVxuICAgICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPiN7aX08L2E+PC9saT5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDxsaT48YSBocmVmPVwiI1wiPk5leHQ8L2E+PC9saT5cbiAgICAgICAgXCJcIlwiXG4gICAgICAgICR0YWJsZS5maW5kKCdsaSBhJykuY2xpY2sgKGUpIC0+XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICAgICAgJGEgPSAkKHRoaXMpXG4gICAgICAgICAgdGV4dCA9ICRhLnRleHQoKVxuICAgICAgICAgIGlmIHRleHQgaXMgJ05leHQnXG4gICAgICAgICAgICBhID0gJGEucGFyZW50KCkucGFyZW50KCkuZmluZCgnLmFjdGl2ZScpLm5leHQoKS5maW5kKCdhJylcbiAgICAgICAgICAgIHVubGVzcyBhLnRleHQoKSBpcyAnTmV4dCdcbiAgICAgICAgICAgICAgYS5jbGljaygpXG4gICAgICAgICAgZWxzZSBpZiB0ZXh0IGlzICdQcmV2J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5wcmV2KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ1ByZXYnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5yZW1vdmVDbGFzcyAnYWN0aXZlJ1xuICAgICAgICAgICAgJGEucGFyZW50KCkuYWRkQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgIG4gPSBwYXJzZUludCh0ZXh0KVxuICAgICAgICAgICAgJHRhYmxlLmZpbmQoJ3Rib2R5IHRyJykuaGlkZSgpXG4gICAgICAgICAgICBvZmZzZXQgPSBwYWdlU2l6ZSAqIChuIC0gMSlcbiAgICAgICAgICAgICR0YWJsZS5maW5kKFwidGJvZHkgdHJcIikuc2xpY2Uob2Zmc2V0LCBuKnBhZ2VTaXplKS5zaG93KClcbiAgICAgICAgJCgkdGFibGUuZmluZCgnbGkgYScpWzFdKS5jbGljaygpXG5cbiAgICAgIGlmIG5vUm93c01lc3NhZ2UgPSAkdGFibGUuZGF0YSgnbm8tcm93cycpXG4gICAgICAgIGlmIHJvd3MgaXMgMFxuICAgICAgICAgIHBhcmVudCA9ICR0YWJsZS5wYXJlbnQoKVxuICAgICAgICAgICR0YWJsZS5yZW1vdmUoKVxuICAgICAgICAgIHBhcmVudC5yZW1vdmVDbGFzcyAndGFibGVDb250YWluZXInXG4gICAgICAgICAgcGFyZW50LmFwcGVuZCBcIjxwPiN7bm9Sb3dzTWVzc2FnZX08L3A+XCJcblxuICBlbmFibGVMYXllclRvZ2dsZXJzOiAoKSAtPlxuICAgIGVuYWJsZUxheWVyVG9nZ2xlcnMoQCRlbClcblxuICBnZXRDaGlsZHJlbjogKHNrZXRjaENsYXNzSWQpIC0+XG4gICAgXy5maWx0ZXIgQGNoaWxkcmVuLCAoY2hpbGQpIC0+IGNoaWxkLmdldFNrZXRjaENsYXNzKCkuaWQgaXMgc2tldGNoQ2xhc3NJZFxuXG5cbm1vZHVsZS5leHBvcnRzID0gUmVwb3J0VGFiXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG4gIFxuICByb3VuZDogKG51bWJlciwgZGVjaW1hbFBsYWNlcykgLT5cbiAgICB1bmxlc3MgXy5pc051bWJlciBudW1iZXJcbiAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKVxuICAgIG11bHRpcGxpZXIgPSBNYXRoLnBvdyAxMCwgZGVjaW1hbFBsYWNlc1xuICAgIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlSXRlbVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dHIgZGF0YS1hdHRyaWJ1dGUtaWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS1leHBvcnRpZD1cXFwiXCIpO18uYihfLnYoXy5mKFwiZXhwb3J0aWRcIixjLHAsMCkpKTtfLmIoXCJcXFwiIGRhdGEtYXR0cmlidXRlLXR5cGU9XFxcIlwiKTtfLmIoXy52KF8uZihcInR5cGVcIixjLHAsMCkpKTtfLmIoXCJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHRkIGNsYXNzPVxcXCJuYW1lXFxcIj5cIik7Xy5iKF8udihfLmYoXCJuYW1lXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwidmFsdWVcXFwiPlwiKTtfLmIoXy52KF8uZihcImZvcm1hdHRlZFZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L3RyPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2F0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjx0YWJsZSBjbGFzcz1cXFwiYXR0cmlidXRlc1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImF0dHJpYnV0ZXNcIixjLHAsMSksYyxwLDAsNDQsMTIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZighXy5zKF8uZihcImRvTm90RXhwb3J0XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIixjLHAsXCIgICAgXCIpKTt9O30pO2MucG9wKCk7fV8uYihcIjwvdGFibGU+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvZ2VuZXJpY0F0dHJpYnV0ZXNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZChcInNrZXRjaENsYXNzLmRlbGV0ZWRcIixjLHAsMSksYyxwLDAsMjQsMjcwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJhbGVydCBhbGVydC13YXJuXFxcIiBzdHlsZT1cXFwibWFyZ2luLWJvdHRvbToxMHB4O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBUaGlzIHNrZXRjaCB3YXMgY3JlYXRlZCB1c2luZyB0aGUgXFxcIlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCJcXFwiIHRlbXBsYXRlLCB3aGljaCBpc1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgbm8gbG9uZ2VyIGF2YWlsYWJsZS4gWW91IHdpbGwgbm90IGJlIGFibGUgdG8gY29weSB0aGlzIHNrZXRjaCBvciBtYWtlIG5ld1wiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgc2tldGNoZXMgb2YgdGhpcyB0eXBlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+XCIpO18uYihfLnYoXy5kKFwic2tldGNoQ2xhc3MubmFtZVwiLGMscCwwKSkpO18uYihcIiBBdHRyaWJ1dGVzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXy5ycChcImF0dHJpYnV0ZXMvYXR0cmlidXRlc1RhYmxlXCIsYyxwLFwiICAgIFwiKSk7Xy5iKFwiICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3JlcG9ydExvYWRpbmdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0TG9hZGluZ1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8IS0tIDxkaXYgY2xhc3M9XFxcInNwaW5uZXJcXFwiPjM8L2Rpdj4gLS0+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+UmVxdWVzdGluZyBSZXBvcnQgZnJvbSBTZXJ2ZXI8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmVcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJiYXJcXFwiIHN0eWxlPVxcXCJ3aWR0aDogMTAwJTtcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8YSBocmVmPVxcXCIjXFxcIiByZWw9XFxcImRldGFpbHNcXFwiPmRldGFpbHM8L2E+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImRldGFpbHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuXG5fcGFydGlhbHMgPSByZXF1aXJlICcuLi9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cblxuZDMgPSB3aW5kb3cuZDNcblxuY2xhc3MgRW52aXJvbm1lbnRUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ0Vudmlyb25tZW50J1xuICBjbGFzc05hbWU6ICdlbnZpcm9ubWVudCdcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5lbnZpcm9ubWVudFxuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnTW9udHNlcnJhdEhhYml0YXRUb29sYm94J1xuICAgICdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnXG4gICAgJ01vbnRzZXJyYXRDb3JhbFRvb2xib3gnXG4gICAgJ01vbnRzZXJyYXRTbmFwQW5kR3JvdXBUb29sYm94J1xuICBdXG5cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpICAgXG4gICAgZDNJc1ByZXNlbnQgPSB3aW5kb3cuZDMgPyB0cnVlICA6IGZhbHNlXG4gICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICBoYXNDb25zZXJ2YXRpb25ab25lID0gQGdldEhhc0NvbnNlcnZhdGlvblpvbmUgQG1vZGVsLmdldENoaWxkcmVuKClcbiAgICAgIGhhc1pvbmVXaXRoR29hbCA9IEBnZXRIYXNab25lV2l0aEdvYWwgQG1vZGVsLmdldENoaWxkcmVuKClcbiAgICBlbHNlXG4gICAgICBoYXNDb25zZXJ2YXRpb25ab25lID0gdHJ1ZVxuICAgICAgaGFzWm9uZVdpdGhHb2FsID0gQGdldEhhc1pvbmVXaXRoR29hbCBbQG1vZGVsXVxuXG4gICAgI2Rvbid0IGJvdGhlciBnZXR0aW5nIGFsbCBkYXkgaWYgbm8gY29uc2VydmF0aW9uIHpvbmVcbiAgICBpZiBoYXNDb25zZXJ2YXRpb25ab25lXG4gICAgICAjIGNyZWF0ZSByYW5kb20gZGF0YSBmb3IgdmlzdWFsaXphdGlvblxuICAgICAgaGFiaXRhdHMgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0SGFiaXRhdFRvb2xib3gnLCAnSGFiaXRhdHMnKS50b0FycmF5KClcbiAgICAgIGhhYml0YXRzID0gXy5zb3J0QnkgaGFiaXRhdHMsIChoKSAtPiAgcGFyc2VGbG9hdChoLlBFUkMpXG4gICAgICBoYWJpdGF0cyA9IGhhYml0YXRzLnJldmVyc2UoKVxuXG4gICAgICBAYWRkVGFyZ2V0IGhhYml0YXRzXG5cblxuICAgICAgc2FuZGcgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0U25hcEFuZEdyb3VwVG9vbGJveCcsICdTbmFwQW5kR3JvdXAnKS50b0FycmF5KClbMF1cbiAgICAgIGFsbF9zYW5kZ192YWxzID0gQGdldEFsbFZhbHVlcyBzYW5kZy5ISVNUT1xuXG4gICAgICBoZXJiX2JpbyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdIZXJiaXZvcmVCaW9tYXNzJykudG9BcnJheSgpWzBdXG4gICAgICBhbGxfaGVyYl92YWxzID0gQGdldEFsbFZhbHVlcyBoZXJiX2Jpby5ISVNUT1xuICAgICAgQHJvdW5kVmFscyBoZXJiX2Jpb1xuXG4gICAgICB0b3RhbF9iaW8gPSBAcmVjb3JkU2V0KCdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnLCAnVG90YWxCaW9tYXNzJykudG9BcnJheSgpWzBdXG4gICAgICBhbGxfdG90YWxfdmFsdWVzID0gQGdldEFsbFZhbHVlcyB0b3RhbF9iaW8uSElTVE9cbiAgICAgIEByb3VuZFZhbHMgdG90YWxfYmlvXG5cbiAgICAgIGZpc2hfYmlvID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEJpb21hc3NUb29sYm94JywgJ0Zpc2hBYnVuZGFuY2UnKS50b0FycmF5KClbMF1cbiAgICAgIGFsbF9maXNoX3ZhbHMgPSBAZ2V0QWxsVmFsdWVzIGZpc2hfYmlvLkhJU1RPXG4gICAgICBAcm91bmRWYWxzIGZpc2hfYmlvXG4gICAgICBcbiAgICAgIGNvcmFsX2NvdW50ID0gQHJlY29yZFNldCgnTW9udHNlcnJhdENvcmFsVG9vbGJveCcsICdDb3JhbCcpLnRvQXJyYXkoKVxuICAgICAgXG4gICAgICBmaXNocG90cyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdGaXNoUG90JykudG9BcnJheSgpXG4gICAgICBpZiBmaXNocG90cz8ubGVuZ3RoID4gMFxuXG4gICAgICAgIGZpc2hwb3RfY291bnQgPSBmaXNocG90c1swXS5DT1VOVFxuICAgICAgICBmaXNocG90X3RvdGFsID0gZmlzaHBvdHNbMF0uVE9UQUxcbiAgICAgIGVsc2VcbiAgICAgICAgZmlzaHBvdF9jb3VudCA9IDBcbiAgICAgICAgZmlzaHBvdF90b3RhbCA9IDE1N1xuICAgICAgICBcbiAgICAgIEByb3VuZERhdGEgaGFiaXRhdHNcblxuICAgIGVsc2VcbiAgICAgIGhhYml0YXRzID0gW11cbiAgICAgIHNhbmRnID0gW11cbiAgICAgIGhlcmIgPSBbXVxuICAgICAgZmlzaCA9IFtdXG4gICAgICB0b3RhbD1bXVxuXG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cblxuICAgICAgaGFiaXRhdHM6IGhhYml0YXRzXG4gICAgICBkM0lzUHJlc2VudDogZDNJc1ByZXNlbnRcbiAgICAgIGhlcmI6IGhlcmJfYmlvXG4gICAgICBmaXNoOiBmaXNoX2Jpb1xuICAgICAgdG90YWw6IHRvdGFsX2Jpb1xuICAgICAgY29yYWxfY291bnQ6IGNvcmFsX2NvdW50XG4gICAgICBzYW5kZzogc2FuZGdcbiAgICAgIGhhc0QzOiB3aW5kb3cuZDNcbiAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmU6IGhhc0NvbnNlcnZhdGlvblpvbmVcbiAgICAgIGhhc1pvbmVXaXRoR29hbDogaGFzWm9uZVdpdGhHb2FsXG4gICAgICBmaXNocG90X2NvdW50OiBmaXNocG90X2NvdW50XG4gICAgICBmaXNocG90X3RvdGFsOiBmaXNocG90X3RvdGFsXG5cbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIGlmIGhhc0NvbnNlcnZhdGlvblpvbmVcbiAgICAgIEByZW5kZXJIaXN0b1ZhbHVlcyhzYW5kZywgYWxsX3NhbmRnX3ZhbHMsIFwiLnNhbmRnX3ZpelwiLCBcIiM2NmNkYWFcIixcIkFidW5kYW5jZSBvZiBKdXZlbmlsZSBTbmFwcGVyIGFuZCBHcm91cGVyXCIsIFwiQ291bnRcIiApXG4gICAgICBAcmVuZGVySGlzdG9WYWx1ZXMoaGVyYl9iaW8sIGFsbF9oZXJiX3ZhbHMsIFwiLmhlcmJfdml6XCIsIFwiIzY2Y2RhYVwiLFwiSGVyYml2b3JlIEJpb21hc3MgKGcvbV4yKVwiLCBcIkJpb21hc3MgUGVyIFRyYW5zZWN0XCIpXG4gICAgICBAcmVuZGVySGlzdG9WYWx1ZXModG90YWxfYmlvLCBhbGxfdG90YWxfdmFsdWVzLCBcIi50b3RhbF92aXpcIiwgXCIjZmE4MDcyXCIsIFwiVG90YWwgQmlvbWFzcyAoZy9tXjIpXCIsIFwiQmlvbWFzcyBQZXIgVHJhbnNlY3RcIilcbiAgICAgIEByZW5kZXJIaXN0b1ZhbHVlcyhmaXNoX2JpbywgYWxsX2Zpc2hfdmFscywgXCIuZmlzaF92aXpcIiwgXCIjNjg5N2JiXCIsIFwiVG90YWwgRmlzaCBDb3VudFwiLCBcIk51bWJlciBvZiBGaXNoIFNwZWNpZXNcIilcblxuICAgICAgQGRyYXdDb3JhbEJhcnMoY29yYWxfY291bnQpXG4gICAgICBAZHJhd0Zpc2hQb3RCYXJzKGZpc2hwb3RfY291bnQsIGZpc2hwb3RfdG90YWwpXG5cbiAgZ2V0SGFzWm9uZVdpdGhHb2FsOiAoc2tldGNoZXMpID0+XG4gICAgaGFzWm9uZVdpdGhHb2FsID0gZmFsc2VcbiAgICBmb3Igc2tldGNoIGluIHNrZXRjaGVzXG4gICAgICBmb3IgYXR0ciBpbiBza2V0Y2guZ2V0QXR0cmlidXRlcygpXG4gICAgICAgIGlmIGF0dHIuZXhwb3J0aWQgPT0gXCJaT05FX1RZUEVcIlxuICAgICAgICAgIGhhc1pvbmVXaXRoR29hbCA9IChhdHRyLnZhbHVlID09IFwiU2FuY3R1YXJ5XCIgb3IgYXR0ci52YWx1ZSA9PSBcIk1hcmluZSBSZXNlcnZlIC0gUGFydGlhbCBUYWtlXCIpXG4gICAgICAgICAgXG4gICAgcmV0dXJuIGhhc1pvbmVXaXRoR29hbFxuXG4gIGdldEhhc0NvbnNlcnZhdGlvblpvbmU6IChza2V0Y2hlcykgPT5cbiAgICBoYXNDb25zZXJ2YXRpb25ab25lID0gZmFsc2VcbiAgICBmb3Igc2tldGNoIGluIHNrZXRjaGVzXG4gICAgICBmb3IgYXR0ciBpbiBza2V0Y2guZ2V0QXR0cmlidXRlcygpXG4gICAgICAgIGlmIGF0dHIuZXhwb3J0aWQgPT0gXCJaT05FX1RZUEVcIlxuICAgICAgICAgIGhhc0NvbnNlcnZhdGlvblpvbmUgPSAoYXR0ci52YWx1ZSA9PSBcIlNhbmN0dWFyeVwiIG9yIGF0dHIudmFsdWUgPT0gXCJNYXJpbmUgUmVzZXJ2ZSAtIFBhcnRpYWwgVGFrZVwiIG9yIGF0dHIudmFsdWUgPT0gXCJNb29yaW5nIEFuY2hvcmFnZSBab25lXCIgb3IgYXR0ci52YWx1ZSA9PSBcIlJlY3JlYXRpb24gWm9uZVwiKVxuICAgICAgICAgIFxuICAgIHJldHVybiBoYXNDb25zZXJ2YXRpb25ab25lXG5cbiAgZHJhd0Zpc2hQb3RCYXJzOiAoZmlzaHBvdF9jb3VudCwgZmlzaHBvdF90b3RhbCkgPT5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgICAgc3VmZml4ID0gXCJza2V0Y2hcIlxuXG4gICAgICBpZiBpc0NvbGxlY3Rpb25cbiAgICAgICAgc3VmZml4PVwiY29sbGVjdGlvblwiXG5cbiAgICAgIGNvdW50ID0gZmlzaHBvdF9jb3VudFxuICAgICAgdG90YWwgPSBmaXNocG90X3RvdGFsXG4gICAgICBvdXRzaWRlX3NrZXRjaF9zdGFydCA9IHRvdGFsKjAuNDhcblxuICAgICAgbGFiZWwgPSBjb3VudCtcIi9cIit0b3RhbCtcIiBvZiB0aGUgZmlzaCBwb3RzIHdpdGhpbiBNb250c2VycmF0J3Mgd2F0ZXJzIGFyZSBmb3VuZCB3aXRoaW4gdGhpcyBcIitzdWZmaXhcbiAgICAgIHJhbmdlID0gW1xuICAgICAgICB7XG4gICAgICAgICAgYmc6IFwiIzhlNWU1MFwiXG4gICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICBlbmQ6IGNvdW50XG4gICAgICAgICAgY2xhc3M6ICdpbi1za2V0Y2gnXG4gICAgICAgICAgdmFsdWU6IGNvdW50XG4gICAgICAgICAgbmFtZTogbGFiZWxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGJnOiAnI2RkZGRkZCdcbiAgICAgICAgICBzdGFydDogY291bnRcbiAgICAgICAgICBlbmQ6IHRvdGFsXG4gICAgICAgICAgY2xhc3M6ICdvdXRzaWRlLXNrZXRjaCdcbiAgICAgICAgICB2YWx1ZTogdG90YWxcbiAgICAgICAgICBsYWJlbF9zdGFydDogb3V0c2lkZV9za2V0Y2hfc3RhcnRcbiAgICAgICAgICBuYW1lOiAnJ1xuICAgICAgICB9XG4gICAgICBdXG5cbiAgICAgIEBkcmF3QmFycyhyYW5nZSwgMywgdG90YWwpICBcblxuICBkcmF3Q29yYWxCYXJzOiAoY29yYWxfY291bnRzKSA9PlxuICAgICMgQ2hlY2sgaWYgZDMgaXMgcHJlc2VudC4gSWYgbm90LCB3ZSdyZSBwcm9iYWJseSBkZWFsaW5nIHdpdGggSUVcblxuICAgICAgaWYgd2luZG93LmQzXG4gICAgICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuICAgICAgICBzdWZmaXggPSBcInNrZXRjaFwiXG4gICAgICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgICAgIHN1ZmZpeD1cImNvbGxlY3Rpb25cIlxuICAgICAgICBmb3IgY29yYWwgaW4gY29yYWxfY291bnRzXG4gICAgICAgICAgY29uc29sZS5sb2coXCJjb3JhbFwiLCBjb3JhbClcbiAgICAgICAgICBuYW1lID0gY29yYWwuTkFNRVxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoY29yYWwuQ09VTlQpXG4gICAgICAgICAgdG90YWwgPSBwYXJzZUludChjb3JhbC5UT1QpXG4gICAgICAgICAgb3V0c2lkZV9za2V0Y2hfc3RhcnQgPSB0b3RhbCowLjQ4XG5cbiAgICAgICAgICBsYWJlbCA9IGNvdW50K1wiL1wiK3RvdGFsK1wiIG9mIHRoZSBrbm93biBvYnNlcnZhdGlvbnMgYXJlIGZvdW5kIHdpdGhpbiB0aGlzIFwiK3N1ZmZpeFxuICAgICAgICAgIHJhbmdlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZzogXCIjOGU1ZTUwXCJcbiAgICAgICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICAgICAgZW5kOiBjb3VudFxuICAgICAgICAgICAgICBjbGFzczogJ2luLXNrZXRjaCdcbiAgICAgICAgICAgICAgdmFsdWU6IGNvdW50XG4gICAgICAgICAgICAgIG5hbWU6IGxhYmVsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZzogJyNkZGRkZGQnXG4gICAgICAgICAgICAgIHN0YXJ0OiBjb3VudFxuICAgICAgICAgICAgICBlbmQ6IHRvdGFsXG4gICAgICAgICAgICAgIGNsYXNzOiAnb3V0c2lkZS1za2V0Y2gnXG4gICAgICAgICAgICAgIHZhbHVlOiB0b3RhbFxuICAgICAgICAgICAgICBsYWJlbF9zdGFydDogb3V0c2lkZV9za2V0Y2hfc3RhcnRcbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG5cbiAgICAgICAgICBpZiBuYW1lID09IFwiT3JiaWNlbGxhIGFubnVsYXJpc1wiXG4gICAgICAgICAgICBpbmRleCA9IDBcbiAgICAgICAgICBlbHNlIGlmIG5hbWUgPT0gXCJPcmJpY2VsbGEgZmF2ZW9sYXRhXCJcbiAgICAgICAgICAgIGluZGV4ID0gMVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGV4ID0gMlxuXG4gICAgICAgICAgQGRyYXdCYXJzKHJhbmdlLCBpbmRleCwgdG90YWwpXG5cblxuICBkcmF3QmFyczogKHJhbmdlLCBpbmRleCwgbWF4X3ZhbHVlKSA9PlxuICAgIGNvbnNvbGUubG9nKFwibWF4IHZhbHVlIC0tLS0+Pj4+IFwiLCBtYXhfdmFsdWUpXG4gICAgZWwgPSBAJCgnLnZpeicpW2luZGV4XVxuICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihbMCwgbWF4X3ZhbHVlXSlcbiAgICAgIC5yYW5nZShbMCwgNDAwXSlcblxuXG4gICAgY2hhcnQgPSBkMy5zZWxlY3QoZWwpXG4gICAgY2hhcnQuc2VsZWN0QWxsKFwiZGl2LnJhbmdlXCIpXG4gICAgICAuZGF0YShyYW5nZSlcbiAgICAuZW50ZXIoKS5hcHBlbmQoXCJkaXZcIilcbiAgICAgIC5zdHlsZShcIndpZHRoXCIsIChkKSAtPiBNYXRoLnJvdW5kKHgoZC5lbmQgLSBkLnN0YXJ0KSwwKSArICdweCcpXG4gICAgICAuYXR0cihcImNsYXNzXCIsIChkKSAtPiBcInJhbmdlIFwiICsgZC5jbGFzcylcbiAgICAgIC5hcHBlbmQoXCJzcGFuXCIpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIiN7ZC5uYW1lfVwiKVxuICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIChkKSAtPiBpZiBkLmxhYmVsX3N0YXJ0IHRoZW4geChkLmxhYmVsX3N0YXJ0KSsncHgnIGVsc2UgJycpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQpIC0+IFwibGFiZWwtXCIrZC5jbGFzcylcblxuICByZW5kZXJIaXN0b1ZhbHVlczogKGJpb21hc3MsIGhpc3RvX3ZhbHMsIGdyYXBoLCBjb2xvciwgeF9heGlzX2xhYmVsLCBsZWdlbmRfbGFiZWwpID0+XG4gICAgaWYgd2luZG93LmQzXG4gICAgICBtZWFuID0gYmlvbWFzcy5TQ09SRVxuICAgICAgYm1pbiA9IGJpb21hc3MuTUlOXG4gICAgICBibWF4ID0gYmlvbWFzcy5NQVhcblxuICAgICAgbGVuID0gaGlzdG9fdmFscy5sZW5ndGhcbiAgICAgIG1heF9oaXN0b192YWwgPSBoaXN0b192YWxzW2xlbi0xXVxuICAgICAgcXVhbnRpbGVfcmFuZ2UgPSB7XCJRMFwiOlwidmVyeSBsb3dcIiwgXCJRMjBcIjogXCJsb3dcIixcIlE0MFwiOiBcIm1pZFwiLFwiUTYwXCI6IFwiaGlnaFwiLFwiUTgwXCI6IFwidmVyeSBoaWdoXCJ9XG4gICAgICBxX2NvbG9ycyA9IFtcIiM0N2FlNDNcIiwgXCIjNmMwXCIsIFwiI2VlMFwiLCBcIiNlYjRcIiwgXCIjZWNiYjg5XCIsIFwiI2VlYWJhMFwiXVxuXG5cbiAgICAgIG51bV9iaW5zID0gMTBcbiAgICAgIGJpbl9zaXplID0gMTBcbiAgICAgIFxuICAgICAgcXVhbnRpbGVzID0gW11cbiAgICAgIG1heF9jb3VudF92YWwgPSAwXG4gICAgICBudW1faW5fYmlucyA9IE1hdGguY2VpbChsZW4vbnVtX2JpbnMpXG4gICAgICBpbmNyID0gbWF4X2hpc3RvX3ZhbC9udW1fYmluc1xuXG4gICAgICBmb3IgaSBpbiBbMC4uLm51bV9iaW5zXVxuICAgICAgICBcbiAgICAgICAgcV9zdGFydCA9IGkqYmluX3NpemVcbiAgICAgICAgcV9lbmQgPSBxX3N0YXJ0K2Jpbl9zaXplXG4gICAgICAgIG1pbiA9IGkqaW5jclxuICAgICAgICBtYXggPSBtaW4raW5jclxuICAgICAgICBjb3VudD0wXG5cbiAgICAgICAgI1RPRE86IGxvb2sgZm9yIGEgbW9yZSBlZmZpY2llbnQgd2F5IHRvIGRvIHRoaXNcbiAgICAgICAgZm9yIGh2IGluIGhpc3RvX3ZhbHNcbiAgICAgICAgICBpZiBodiA+PSBtaW4gYW5kIGh2IDwgbWF4XG4gICAgICAgICAgICBjb3VudCs9MVxuXG5cbiAgICAgICAgbWF4X2NvdW50X3ZhbCA9IE1hdGgubWF4KGNvdW50LCBtYXhfY291bnRfdmFsKVxuICAgICAgICBcbiAgICAgICAgdmFsID0ge1xuICAgICAgICAgIHN0YXJ0OiBxX3N0YXJ0XG4gICAgICAgICAgZW5kOiBxX2VuZFxuICAgICAgICAgIGJnOiBxX2NvbG9yc1tNYXRoLmZsb29yKGkvMildXG4gICAgICAgICAgYmluX2NvdW50OiBjb3VudFxuICAgICAgICAgIGJpbl9taW46IG1pblxuICAgICAgICAgIGJpbl9tYXg6IG1heFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBxdWFudGlsZXMucHVzaCh2YWwpXG5cbiAgICBcbiAgICAgIEAkKGdyYXBoKS5odG1sKCcnKVxuICAgICAgZWwgPSBAJChncmFwaClbMF0gIFxuXG4gICAgICAjIEhpc3RvZ3JhbVxuICAgICAgbWFyZ2luID0gXG4gICAgICAgIHRvcDogNDBcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogNDBcbiAgICAgICAgbGVmdDogNDVcblxuICAgICAgd2lkdGggPSA0MDAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodFxuICAgICAgI25vdGU6IHVzaW5nIHRoaXMgdG8gdHJhbnNsYXRlIHRoZSB4IGF4aXMgd2FzIGNhdXNpbmcgYSBwcm9ibGVtLFxuICAgICAgI3NvIGkganVzdCBoYXJkY29kZWQgaXQgZm9yIG5vdy4uLlxuICAgICAgaGVpZ2h0ID0gMzUwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b21cbiAgICAgIFxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIG1heF9oaXN0b192YWxdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcblxuICAgICAgeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSlcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4X2NvdW50X3ZhbF0pXG5cbiAgICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeClcbiAgICAgICAgLm9yaWVudChcImJvdHRvbVwiKVxuXG4gICAgICB5QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHkpXG4gICAgICAgIC5vcmllbnQoXCJsZWZ0XCIpXG5cbiAgICAgIG1pbl9tYXhfbGluZV95ID0gbWF4X2NvdW50X3ZhbCAtIDIwXG4gICAgICBzdmcgPSBkMy5zZWxlY3QoQCQoZ3JhcGgpWzBdKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKCN7bWFyZ2luLmxlZnR9LCAje21hcmdpbi50b3B9KVwiKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMjcwKVwiKVxuICAgICAgICAuY2FsbCh4QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB3aWR0aCAvIDIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiM2VtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC50ZXh0KHhfYXhpc19sYWJlbClcblxuICAgICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICAuY2FsbCh5QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAtNDApXG4gICAgICAgIC5hdHRyKFwieFwiLCAtODApXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KGxlZ2VuZF9sYWJlbClcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLmJhclwiKVxuICAgICAgICAgIC5kYXRhKHF1YW50aWxlcylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoZC5iaW5fbWluKSlcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIChkKSAtPiB3aWR0aC9udW1fYmlucylcbiAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHkoZC5iaW5fY291bnQpKVxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIChkKSAtPiBoZWlnaHQgLSB5KGQuYmluX2NvdW50KSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCkgLT4gY29sb3JcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlTGluZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKG1lYW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVMaW5lXCIpXG4gICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+ICh4KChkKSkgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSA5KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+ICh4KGQpKyAncHgnKSlcbiAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4gaGVpZ2h0ICsgJ3B4JylcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKG1lYW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeCgoZCkpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gOSkgKyAncHgnKVxuICAgICAgICAudGV4dChcIuKWvFwiKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKG1lYW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSAyMiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMjIpICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiTWVhbjogXCIrZClcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlTGluZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtaW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWluU2NvcmVMaW5lXCIpXG4gICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+ICh4KChkKSkgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSA2KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+ICh4KGQpKyAncHgnKSlcbiAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4gaGVpZ2h0ICsgJ3B4JylcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5taW5TY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtaW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWluU2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeCgoZCkpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpKSArICdweCcpXG4gICAgICAgIC50ZXh0KFwi4pa8XCIpXG5cblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5taW5TY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChibWluKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1pblNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gMjEgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDEyKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIk1pbjogXCIrZClcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1heFNjb3JlTGluZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtYXgpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWF4U2NvcmVMaW5lXCIpXG4gICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+ICh4KChkKSkgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAxOCkgKyAncHgnKVxuICAgICAgICAuYXR0cihcIngyXCIsIChkKSAtPiAoeChkKSsgJ3B4JykpXG4gICAgICAgIC5hdHRyKFwieTJcIiwgKGQpIC0+IGhlaWdodCArICdweCcpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWF4U2NvcmVcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChibWF4KV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1heFNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoKGQpKSAtIDYgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDE4KSArICdweCcpXG4gICAgICAgIC50ZXh0KFwi4pa8XCIpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWF4U2NvcmVUZXh0XCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1heCldKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZVRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDMwICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAzMCkgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCJNYXg6IFwiK2QpXG5cbiAgICAgIFxuICAgICAgaWYgZ3JhcGggPT0gXCIuaGVyYl92aXpcIlxuICAgICAgICBAJChncmFwaCkuYXBwZW5kICc8ZGl2IGNsYXNzPVwibGVnZW5kc1wiPjxkaXYgY2xhc3M9XCJsZWdlbmRcIj48c3BhbiBjbGFzcz1cImhlcmItc3dhdGNoXCI+Jm5ic3A7PC9zcGFuPkJpb21hc3MgaW4gUmVnaW9uPC9kaXY+PGRpdiBjbGFzcz1cImxlZ2VuZC1za2V0Y2gtdmFsdWVzXCI+4pa8IFNrZXRjaCBWYWx1ZXM8L2Rpdj48L2Rpdj4nXG4gICAgICBpZiBncmFwaCA9PSBcIi5maXNoX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwiZmlzaC1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+RmlzaCBDb3VudCBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgIGlmIGdyYXBoID09IFwiLnRvdGFsX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwidG90YWwtc3dhdGNoXCI+Jm5ic3A7PC9zcGFuPkJpb21hc3MgaW4gUmVnaW9uPC9kaXY+PGRpdiBjbGFzcz1cImxlZ2VuZC1za2V0Y2gtdmFsdWVzXCI+4pa8IFNrZXRjaCBWYWx1ZXM8L2Rpdj48L2Rpdj4nXG4gICAgICAgXG4gICAgICBAJChncmFwaCkuYXBwZW5kICc8YnIgc3R5bGU9XCJjbGVhcjpib3RoO1wiPidcblxuICBnZXRBbGxWYWx1ZXM6IChhbGxfc3RyKSA9PlxuICAgIHRyeVxuICAgICAgYWxsX3ZhbHMgPSBhbGxfc3RyLnN1YnN0cmluZygxLCBhbGxfc3RyLmxlbmd0aCAtIDEpXG4gICAgICBhbGxfdmFscyA9IGFsbF92YWxzLnNwbGl0KFwiLCBcIilcbiAgICAgIHNvcnRlZF92YWxzID0gXy5zb3J0QnkgYWxsX3ZhbHMsIChkKSAtPiAgcGFyc2VGbG9hdChkKVxuICAgICAgcmV0dXJuIHNvcnRlZF92YWxzXG4gICAgY2F0Y2ggZVxuICAgICAgcmV0dXJuIFtdXG4gICAgXG4gIGFkZFRhcmdldDogKGRhdGEpID0+XG4gICAgZm9yIGQgaW4gZGF0YVxuICAgICAgaWYgZC5IQUJfVFlQRSA9PSBcIkFydGlmaWNpYWwgUmVlZlwiXG4gICAgICAgIGQuTUVFVFNfR09BTCA9IGZhbHNlXG4gICAgICAgIGQuTk9fR09BTCA9IHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgZC5NRUVUU18xMF9HT0FMID0gKHBhcnNlRmxvYXQoZC5QRVJDKSA+IDEwLjApXG4gICAgICAgIGQuTUVFVFNfMjBfR09BTCA9IChwYXJzZUZsb2F0KGQuUEVSQykgPiAyMC4wKVxuICAgICAgICBkLk1FRVRTXzMwX0dPQUwgPSAocGFyc2VGbG9hdChkLlBFUkMpID4gMzAuMClcblxuICByb3VuZFZhbHM6IChkKSA9PiAgICBcbiAgICAgIGQuTUVBTiA9IHBhcnNlRmxvYXQoZC5NRUFOKS50b0ZpeGVkKDEpXG4gICAgICBkLk1BWCA9IHBhcnNlRmxvYXQoZC5NQVgpLnRvRml4ZWQoMSlcbiAgICAgIGQuTUlOID0gcGFyc2VGbG9hdChkLk1JTikudG9GaXhlZCgxKVxuXG4gIHJvdW5kRGF0YTogKGRhdGEpID0+XG4gICAgZm9yIGQgaW4gZGF0YVxuICAgICAgaWYgZC5BUkVBX1NRS00gPCAwLjEgYW5kIGQuQVJFQV9TUUtNID4gMC4wMDAwMVxuICAgICAgICBkLkFSRUFfU1FLTSA9IFwiPCAwLjEgXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZC5BUkVBX1NRS00gPSBwYXJzZUZsb2F0KGQuQVJFQV9TUUtNKS50b0ZpeGVkKDEpXG5cbm1vZHVsZS5leHBvcnRzID0gRW52aXJvbm1lbnRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuZDMgPSB3aW5kb3cuZDNcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnU2l6ZUFuZENvbm5lY3Rpdml0eSdcbiAgICAnRGl2ZUFuZEZpc2hpbmdWYWx1ZSdcbiAgICAnRGlzdGFuY2UnXG4gICAgJ01pbkRpbWVuc2lvblRvb2xib3gnXG4gIF1cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgIyBjcmVhdGUgcmFuZG9tIGRhdGEgZm9yIHZpc3VhbGl6YXRpb25cbiAgICBzaXplID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdTaXplJykudG9BcnJheSgpWzBdXG4gICAgXG4gICAgc2l6ZS5QRVJDID0gTnVtYmVyKChwYXJzZUZsb2F0KHNpemUuU0laRV9TUUtNKS8zMzguMTk3KSoxMDAuMCkudG9GaXhlZCgxKVxuICAgIGNvbm5lY3Rpdml0eSA9IEByZWNvcmRTZXQoJ1NpemVBbmRDb25uZWN0aXZpdHknLCAnQ29ubmVjdGl2aXR5JykudG9BcnJheSgpXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG5cblxuICAgIHRyeVxuXG4gICAgICByYXdfdmFsID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdSZXN1bHRNc2cnKVxuICAgICAgY29uc29sZS5sb2coXCJyZXR1cm4gbXNnOiBcIiwgcmF3X3ZhbClcblxuICAgICAgZGZ2ID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdGaXNoaW5nVmFsdWUnKS50b0FycmF5KClbMF1cbiAgICAgIGRkdiA9IEByZWNvcmRTZXQoJ0RpdmVBbmRGaXNoaW5nVmFsdWUnLCAnRGl2ZVZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgY2F0Y2ggZXJyXG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yOiBcIixlcnIpXG5cbiAgICBpZiBkZnZcbiAgICAgIGlmIGRmdi5QRVJDRU5UIDwgMC4wMVxuICAgICAgICBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZSA9IFwiPCAwLjAxXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBwYXJzZUZsb2F0KGRmdi5QRVJDRU5UKS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBcInVua25vd25cIlxuXG4gICAgaWYgZGR2XG4gICAgICBpZiBkZHYuUEVSQ0VOVCA8IDAuMDFcbiAgICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWUgPSBcIjwgMC4wMVwiXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gcGFyc2VGbG9hdChkZHYuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gXCJ1bmtub3duXCJcblxuICAgIG1pbkRpc3RLTSA9IEByZWNvcmRTZXQoJ0Rpc3RhbmNlJywgJ0Rpc3RhbmNlJykudG9BcnJheSgpWzBdXG4gICAgaWYgbWluRGlzdEtNXG4gICAgICBtaW5EaXN0S00gPSBwYXJzZUZsb2F0KG1pbkRpc3RLTS5NYXhEaXN0KS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgbWluRGlzdEtNID0gXCJVbmtub3duXCJcblxuICAgIG1pbldpZHRoID0gQHJlY29yZFNldCgnTWluRGltZW5zaW9uVG9vbGJveCcsICdEaW1lbnNpb25zJykudG9BcnJheSgpXG4gICAgY29uc29sZS5sb2coXCJtaW53aWR0aDogXCIsIG1pbldpZHRoKVxuICAgIGlmIG1pbldpZHRoPy5sZW5ndGggPiAwXG5cbiAgICAgIGlzQ29uc2VydmF0aW9uWm9uZSA9IHRydWVcbiAgICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgICBAcHJvY2Vzc01pbkRpbWVuc2lvbiBtaW5XaWR0aFxuICAgICAgZWxzZVxuICAgICAgICBtZWV0c01pbldpZHRoR29hbCA9IChwYXJzZUZsb2F0KG1pbldpZHRoWzBdLldJRFRIKSA+IDEuMClcbiAgICBlbHNlXG4gICAgICBpc0NvbnNlcnZhdGlvblpvbmUgPSBmYWxzZVxuICAgICAgbWVldHNNaW5XaWR0aEdvYWwgPSBmYWxzZVxuXG5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgc2l6ZTogc2l6ZVxuICAgICAgY29ubmVjdGl2aXR5OiBjb25uZWN0aXZpdHlcbiAgICAgIFxuICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWU6IGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlXG4gICAgICBkaXNwbGFjZWRfZGl2ZV92YWx1ZTogZGlzcGxhY2VkX2RpdmVfdmFsdWVcbiAgICBcbiAgICAgIG1pbkRpc3RLTTogbWluRGlzdEtNXG4gICAgICBpc0NvbnNlcnZhdGlvblpvbmU6IGlzQ29uc2VydmF0aW9uWm9uZVxuICAgICAgbWVldHNNaW5XaWR0aEdvYWw6IG1lZXRzTWluV2lkdGhHb2FsXG4gICAgICBtaW5fZGltIDptaW5XaWR0aFxuXG4gICAgQCRlbC5odG1sIEB0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgdGVtcGxhdGVzKVxuICAgIEBlbmFibGVMYXllclRvZ2dsZXJzKClcblxuICBwcm9jZXNzTWluRGltZW5zaW9uOiAoZGF0YSkgPT5cblxuICAgIGZvciBkIGluIGRhdGFcbiAgICAgIGlmIHBhcnNlRmxvYXQoZC5XSURUSCkgPiAxLjBcbiAgICAgICAgZC5NRUVUU19USFJFU0ggPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGQuTUVFVFNfVEhSRVNIID0gZmFsc2VcblxubW9kdWxlLmV4cG9ydHMgPSBPdmVydmlld1RhYiIsIk92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlldy5jb2ZmZWUnXG5UcmFkZW9mZnNUYWIgPSByZXF1aXJlICcuL3RyYWRlb2Zmcy5jb2ZmZWUnXG5FbnZpcm9ubWVudFRhYiA9IHJlcXVpcmUgJy4vZW52aXJvbm1lbnQuY29mZmVlJ1xuXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtPdmVydmlld1RhYiwgRW52aXJvbm1lbnRUYWIsIFRyYWRlb2Zmc1RhYl1cbiAgIyBwYXRoIG11c3QgYmUgcmVsYXRpdmUgdG8gZGlzdC9cbiAgcmVwb3J0LnN0eWxlc2hlZXRzIFsnLi9yZXBvcnQuY3NzJ11cbiIsIlJlcG9ydFRhYiA9IHJlcXVpcmUgJ3JlcG9ydFRhYidcbnRlbXBsYXRlcyA9IHJlcXVpcmUgJy4uL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5kMyA9IHdpbmRvdy5kM1xuX3BhcnRpYWxzID0gcmVxdWlyZSAnYXBpL3RlbXBsYXRlcydcbnBhcnRpYWxzID0gW11cbmZvciBrZXksIHZhbCBvZiBfcGFydGlhbHNcbiAgcGFydGlhbHNba2V5LnJlcGxhY2UoJ25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS8nLCAnJyldID0gdmFsXG5cbmNsYXNzIFRyYWRlb2Zmc1RhYiBleHRlbmRzIFJlcG9ydFRhYlxuICBuYW1lOiAnVHJhZGVvZmZzJ1xuICBjbGFzc05hbWU6ICd0cmFkZW9mZnMnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMudHJhZGVvZmZzXG4gIGRlcGVuZGVuY2llczpbIFxuICAgICdNb250c2VycmF0VHJhZGVvZmZBbmFseXNpcydcbiAgXVxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0cmFkZW9mZl9kYXRhID0gQHJlY29yZFNldCgnTW9udHNlcnJhdFRyYWRlb2ZmQW5hbHlzaXMnLCAnU2NvcmVzJykudG9BcnJheSgpXG4gICAgQHJvdW5kRGF0YSB0cmFkZW9mZl9kYXRhXG5cbiAgICB0cmFkZW9mZnMgPSBbJ0Zpc2hpbmcgYW5kIERpdmluZycsICdGaXNoaW5nIGFuZCBDb25zZXJ2YXRpb24nLCAnRGl2aW5nIGFuZCBDb25zZXJ2YXRpb24nXVxuICAgIFxuICAgIGZpc2hpbmdfdmFscyA9IChpdGVtLkZpc2hpbmcgZm9yIGl0ZW0gaW4gdHJhZGVvZmZfZGF0YSlcbiAgICBkaXZpbmdfdmFscyA9IChpdGVtLkRpdmluZyBmb3IgaXRlbSBpbiB0cmFkZW9mZl9kYXRhKVxuICAgIGNvbnNlcnZhdGlvbl92YWxzID0gKGl0ZW0uQ29uc2VydmF0aW9uIGZvciBpdGVtIGluIHRyYWRlb2ZmX2RhdGEpXG5cbiAgICBmaXNoaW5nX21pbiA9IE1hdGgubWluIGZpc2hpbmdfdmFsc1xuICAgIGZpc2hpbmdfbWF4ID0gTWF0aC5tYXggZmlzaGluZ192YWxzXG5cbiAgICBkaXZpbmdfbWluID0gTWF0aC5taW4gZGl2aW5nX3ZhbHNcbiAgICBkaXZpbmdfbWF4ID0gTWF0aC5tYXggZGl2aW5nX3ZhbHNcblxuICAgIGNvbnNlcnZhdGlvbl9taW4gPSBNYXRoLm1pbiBjb25zZXJ2YXRpb25fdmFsc1xuICAgIGNvbnNlcnZhdGlvbl9tYXggPSBNYXRoLm1heCBjb25zZXJ2YXRpb25fdmFsc1xuXG4gICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpICAgXG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICB0cmFkZW9mZnM6IHRyYWRlb2Zmc1xuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIFxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHBhcnRpYWxzKVxuICAgIEAkKCcuY2hvc2VuJykuY2hvc2VuKHtkaXNhYmxlX3NlYXJjaF90aHJlc2hvbGQ6IDEwLCB3aWR0aDonMzgwcHgnfSlcbiAgICBAJCgnLmNob3NlbicpLmNoYW5nZSAoKSA9PlxuICAgICAgXy5kZWZlciBAcmVuZGVyVHJhZGVvZmZzXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIEBzZXR1cFNjYXR0ZXJQbG90KHRyYWRlb2ZmX2RhdGEsICcuZmlzaGluZy12LWRpdmluZycsIFwiVmFsdWUgb2YgRmlzaGluZ1wiLCBcbiAgICAgICAgXCJWYWx1ZSBvZiBEaXZpbmdcIiwgXCJGaXNoaW5nXCIsIFwiRGl2aW5nXCIsIGZpc2hpbmdfbWluLCBmaXNoaW5nX21heCwgZGl2aW5nX21pbiwgZGl2aW5nX21heClcblxuICAgICAgQHNldHVwU2NhdHRlclBsb3QodHJhZGVvZmZfZGF0YSwgJy5maXNoaW5nLXYtY29uc2VydmF0aW9uJywgXCJWYWx1ZSBvZiBGaXNoaW5nXCIsIFxuICAgICAgICBcIlZhbHVlIG9mIENvbnNlcnZhdGlvblwiLCBcIkZpc2hpbmdcIiwgXCJDb25zZXJ2YXRpb25cIiwgZmlzaGluZ19taW4sIGZpc2hpbmdfbWF4LCBjb25zZXJ2YXRpb25fbWluLCBjb25zZXJ2YXRpb25fbWF4KVxuXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCh0cmFkZW9mZl9kYXRhLCAnLmRpdmluZy12LWNvbnNlcnZhdGlvbicsIFwiVmFsdWUgb2YgRGl2aW5nXCIsIFxuICAgICAgICBcIlZhbHVlIG9mIENvbnNlcnZhdGlvblwiLCBcIkRpdmluZ1wiLCBcIkNvbnNlcnZhdGlvblwiLCBkaXZpbmdfbWluLCBkaXZpbmdfbWF4LCBjb25zZXJ2YXRpb25fbWluLCBjb25zZXJ2YXRpb25fbWF4KVxuXG4gIHNldHVwU2NhdHRlclBsb3Q6ICh0cmFkZW9mZl9kYXRhLCBjaGFydF9uYW1lLCB4bGFiLCB5bGFiLCBtb3VzZVhQcm9wLCBtb3VzZVlQcm9wLCBmaXNoaW5nTWluLCBmaXNoaW5nTWF4LCBkaXZpbmdNaW4sIGRpdmluZ01heCkgPT5cbiAgICAgIGggPSAzODBcbiAgICAgIHcgPSAzODBcbiAgICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgICBoYWxmaCA9IChoK21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbSlcbiAgICAgIHRvdGFsaCA9IGhhbGZoKjJcbiAgICAgIGhhbGZ3ID0gKHcrbWFyZ2luLmxlZnQrbWFyZ2luLnJpZ2h0KVxuICAgICAgdG90YWx3ID0gaGFsZncqMlxuXG4gICAgICAjbWFrZSBzdXJlIGl0cyBAc2NhdHRlcnBsb3QgdG8gcGFzcyBpbiB0aGUgcmlnaHQgY29udGV4dCAodGFiKSBmb3IgZDNcbiAgICAgIHRoZWNoYXJ0ID0gQHNjYXR0ZXJwbG90KGNoYXJ0X25hbWUsIG1vdXNlWFByb3AsIG1vdXNlWVByb3AsIGZpc2hpbmdNaW4sIGZpc2hpbmdNYXgsIGRpdmluZ01pbiwgZGl2aW5nTWF4KS54dmFyKDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC55dmFyKDEpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC54bGFiKHhsYWIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC55bGFiKHlsYWIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5oZWlnaHQoaClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLndpZHRoKHcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXJnaW4obWFyZ2luKVxuXG4gICAgICBjaCA9IGQzLnNlbGVjdChAJChjaGFydF9uYW1lKSlcbiAgICAgIGNoLmRhdHVtKHRyYWRlb2ZmX2RhdGEpXG4gICAgICAgIC5jYWxsKHRoZWNoYXJ0KVxuICAgICAgXG4gICAgICB0b29sdGlwID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAgIC5hdHRyKFwiaWRcIiwgXCJjaGFydC10b29sdGlwXCIpXG4gICAgICAgIC50ZXh0KFwiZGF0YVwiKVxuXG4gICAgIFxuICAgICAgdmVydGljYWxSdWxlID0gZDMuc2VsZWN0KFwiYm9keVwiKVxuICAgICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwidmVydGljYWxSdWxlXCIpXG4gICAgICAgICAgLnN0eWxlKFwicG9zaXRpb25cIiwgXCJhYnNvbHV0ZVwiKVxuICAgICAgICAgIC5zdHlsZShcInotaW5kZXhcIiwgXCIxOVwiKVxuICAgICAgICAgIC5zdHlsZShcIndpZHRoXCIsIFwiMXB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiaGVpZ2h0XCIsIFwiMjUwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJ0b3BcIiwgXCIxMHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiYm90dG9tXCIsIFwiMzBweFwiKVxuICAgICAgICAgIC5zdHlsZShcImxlZnRcIiwgXCIwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJiYWNrZ3JvdW5kXCIsIFwiYmxhY2tcIik7XG5cbiAgICAgIHRoZWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gXG5cbiAgICAgICAgICByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lK1wiPC9zdHJvbmc+PGxpPlwiK3hsYWIrXCI6IFwiK2RbbW91c2VYUHJvcF0rXCI8L2xpPjxsaT4gXCIreWxhYitcIjogXCIrZFttb3VzZVlQcm9wXStcIjwvbGk+PC91bD5cIilcbiAgICAgICAgXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG4gICAgICBcbiAgICAgIHRoZWNoYXJ0LnBvaW50c1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3V0XCIsIChkKSAtPiBcbiAgICAgICAgICByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3ZlclwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK3dpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZStcIjwvc3Ryb25nPjxsaT4gXCIreGxhYitcIjogXCIrZFttb3VzZVhQcm9wXStcIjwvbGk+PGxpPiBcIit5bGFiK1wiOiBcIitkW21vdXNlWVByb3BdK1wiPC9saT48L3VsPlwiKVxuICAgICAgdGhlY2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2Vtb3ZlXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInRvcFwiLCAoZXZlbnQucGFnZVktMTApK1wicHhcIikuc3R5bGUoXCJsZWZ0XCIsKGNhbGNfdHRpcChldmVudC5wYWdlWCwgZCwgdG9vbHRpcCkpK1wicHhcIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlb3V0XCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIilcblxuXG4gIHJlbmRlclRyYWRlb2ZmczogKCkgPT5cbiAgICBuYW1lID0gQCQoJy5jaG9zZW4nKS52YWwoKVxuICAgIGlmIG5hbWUgPT0gXCJGaXNoaW5nIGFuZCBEaXZpbmdcIlxuICAgICAgQCQoJy5mdmRfY29udGFpbmVyJykuc2hvdygpXG4gICAgICBAJCgnLmZ2Y19jb250YWluZXInKS5oaWRlKClcbiAgICAgIEAkKCcuZHZjX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgIGVsc2UgaWYgbmFtZSA9PSBcIkZpc2hpbmcgYW5kIENvbnNlcnZhdGlvblwiXG4gICAgICBAJCgnLmZ2ZF9jb250YWluZXInKS5oaWRlKClcbiAgICAgIEAkKCcuZnZjX2NvbnRhaW5lcicpLnNob3coKVxuICAgICAgQCQoJy5kdmNfY29udGFpbmVyJykuaGlkZSgpXG4gICAgZWxzZSBpZiBuYW1lID09IFwiRGl2aW5nIGFuZCBDb25zZXJ2YXRpb25cIlxuICAgICAgQCQoJy5mdmRfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmZ2Y19jb250YWluZXInKS5oaWRlKClcbiAgICAgIEAkKCcuZHZjX2NvbnRhaW5lcicpLnNob3coKVxuXG5cbiAgY2FsY190dGlwID0gKHhsb2MsIGRhdGEsIHRvb2x0aXApIC0+XG4gICAgdGRpdiA9IHRvb2x0aXBbMF1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICB0bGVmdCA9IHRkaXYubGVmdFxuICAgIHR3ID0gdGRpdi53aWR0aFxuICAgIHJldHVybiB4bG9jLSh0dysxMCkgaWYgKHhsb2MrdHcgPiB0bGVmdCt0dylcbiAgICByZXR1cm4geGxvYysxMFxuXG5cbiAgc2NhdHRlcnBsb3Q6IChjaGFydF9uYW1lLCB4dmFsLCB5dmFsLCBmaXNoaW5nTWluLCBmaXNoaW5nTWF4LCBkaXZpbmdNaW4sIGRpdmluZ01heCkgPT5cbiAgICB2aWV3ID0gQFxuICAgIHdpZHRoID0gMzgwXG4gICAgaGVpZ2h0ID0gNjAwXG4gICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICBheGlzcG9zID0ge3h0aXRsZToyNSwgeXRpdGxlOjMwLCB4bGFiZWw6NSwgeWxhYmVsOjF9XG4gICAgeGxpbSA9IG51bGxcbiAgICB5bGltID0gbnVsbFxuICAgIG54dGlja3MgPSA1XG4gICAgeHRpY2tzID0gbnVsbFxuICAgIG55dGlja3MgPSA1XG4gICAgeXRpY2tzID0gbnVsbFxuICAgIFxuICAgIHJlY3Rjb2xvciA9IFwid2hpdGVcIlxuICAgIHBvaW50c2l6ZSA9IDUgIyBkZWZhdWx0ID0gbm8gdmlzaWJsZSBwb2ludHMgYXQgbWFya2Vyc1xuICAgIHhsYWIgPSBcIlhcIlxuICAgIHlsYWIgPSBcIlkgc2NvcmVcIlxuICAgIHlzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgeHNjYWxlID0gZDMuc2NhbGUubGluZWFyKClcbiAgICBsZWdlbmRoZWlnaHQgPSAzMDBcbiAgICBwb2ludHNTZWxlY3QgPSBudWxsXG4gICAgbGFiZWxzU2VsZWN0ID0gbnVsbFxuICAgIGxlZ2VuZFNlbGVjdCA9IG51bGxcbiAgICB2ZXJ0aWNhbFJ1bGUgPSBudWxsXG4gICAgaG9yaXpvbnRhbFJ1bGUgPSBudWxsXG5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgICNjbGVhciBvdXQgdGhlIG9sZCB2YWx1ZXNcbiAgICAgIHZpZXcuJChjaGFydF9uYW1lKS5odG1sKCcnKVxuICAgICAgZWwgPSB2aWV3LiQoY2hhcnRfbmFtZSlbMF1cblxuICAgICMjIHRoZSBtYWluIGZ1bmN0aW9uXG4gICAgY2hhcnQgPSAoc2VsZWN0aW9uKSAtPlxuICAgICAgc2VsZWN0aW9uLmVhY2ggKGRhdGEpIC0+XG4gICAgICAgIHggPSBkYXRhLm1hcCAoZCkgLT4gcGFyc2VGbG9hdChkW3h2YWxdKVxuICAgICAgICB5ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZFt5dmFsXSlcblxuICAgICAgICBwYW5lbG9mZnNldCA9IDBcbiAgICAgICAgcGFuZWx3aWR0aCA9IHdpZHRoXG4gICAgICAgIHBhbmVsaGVpZ2h0ID0gaGVpZ2h0XG5cbiAgICAgICAgeGxpbSA9IFtkMy5taW4oeCktMC4yNSwgcGFyc2VGbG9hdChkMy5tYXgoeCkrMC4yNSldIGlmICEoeGxpbT8pXG4gICAgICAgIHlsaW0gPSBbZDMubWluKHkpLTAuMjUsIHBhcnNlRmxvYXQoZDMubWF4KHkpKzAuMjUpXSBpZiAhKHlsaW0/KVxuXG4gICAgICAgICMgSSdsbCByZXBsYWNlIG1pc3NpbmcgdmFsdWVzIHNvbWV0aGluZyBzbWFsbGVyIHRoYW4gd2hhdCdzIG9ic2VydmVkXG4gICAgICAgIG5hX3ZhbHVlID0gZDMubWluKHguY29uY2F0IHkpIC0gMTAwXG4gICAgICAgIGN1cnJlbGVtID0gZDMuc2VsZWN0KHZpZXcuJChjaGFydF9uYW1lKVswXSlcbiAgICAgICAgc3ZnID0gZDMuc2VsZWN0KHZpZXcuJChjaGFydF9uYW1lKVswXSkuYXBwZW5kKFwic3ZnXCIpLmRhdGEoW2RhdGFdKVxuICAgICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuXG4gICAgICAgICMgVXBkYXRlIHRoZSBvdXRlciBkaW1lbnNpb25zLlxuICAgICAgICBzdmcuYXR0cihcIndpZHRoXCIsIHdpZHRoK21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0K21hcmdpbi50b3ArbWFyZ2luLmJvdHRvbStkYXRhLmxlbmd0aCozNSlcbiAgICAgICAgZyA9IHN2Zy5zZWxlY3QoXCJnXCIpXG5cbiAgICAgICAgIyBib3hcbiAgICAgICAgZy5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAuYXR0cihcInhcIiwgcGFuZWxvZmZzZXQrbWFyZ2luLmxlZnQpXG4gICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcClcbiAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIHBhbmVsaGVpZ2h0KVxuICAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCBwYW5lbHdpZHRoKVxuICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIHJlY3Rjb2xvcilcbiAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwibm9uZVwiKVxuXG5cbiAgICAgICAgIyBzaW1wbGUgc2NhbGVzIChpZ25vcmUgTkEgYnVzaW5lc3MpXG4gICAgICAgIHhyYW5nZSA9IFttYXJnaW4ubGVmdCtwYW5lbG9mZnNldCttYXJnaW4uaW5uZXIsIG1hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0K3BhbmVsd2lkdGgtbWFyZ2luLmlubmVyXVxuICAgICAgICB5cmFuZ2UgPSBbbWFyZ2luLnRvcCtwYW5lbGhlaWdodC1tYXJnaW4uaW5uZXIsIG1hcmdpbi50b3ArbWFyZ2luLmlubmVyXVxuICAgICAgICB4c2NhbGUuZG9tYWluKHhsaW0pLnJhbmdlKHhyYW5nZSlcbiAgICAgICAgeXNjYWxlLmRvbWFpbih5bGltKS5yYW5nZSh5cmFuZ2UpXG4gICAgICAgIHhzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHhsaW0pLnJhbmdlKHhyYW5nZSlcbiAgICAgICAgeXMgPSBkMy5zY2FsZS5saW5lYXIoKS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuXG4gICAgICAgICMgaWYgeXRpY2tzIG5vdCBwcm92aWRlZCwgdXNlIG55dGlja3MgdG8gY2hvb3NlIHByZXR0eSBvbmVzXG4gICAgICAgIHl0aWNrcyA9IHlzLnRpY2tzKG55dGlja3MpIGlmICEoeXRpY2tzPylcbiAgICAgICAgeHRpY2tzID0geHMudGlja3Mobnh0aWNrcykgaWYgISh4dGlja3M/KVxuXG4gICAgICAgICMgeC1heGlzXG4gICAgICAgIHhheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInggYXhpc1wiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4geHNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInkxXCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCBtYXJnaW4udG9wK2hlaWdodClcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG4gICAgICAgICAgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeHRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54bGFiZWwpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IGZvcm1hdEF4aXMoeHRpY2tzKShkKSlcbiAgICAgICAgeGF4aXMuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4YXhpcy10aXRsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCt3aWR0aC8yKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSlcbiAgICAgICAgICAgICAudGV4dCh4bGFiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiBtYXJnaW4ubGVmdClcbiAgICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLGkpIC0+IG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkrNilcbiAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkLGkpIC0+IFwicHQje2l9XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJyXCIsIHBvaW50c2l6ZSlcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gaSAlIDE3XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNvbCA9IGdldENvbG9ycyh2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIChkLCBpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBNYXRoLmZsb29yKGkvMTcpICUgNVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRTdHJva2VDb2xvcih2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMVwiKVxuXG4gICAgICAgIHhheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImxlZ2VuZC10ZXh0XCIpXG5cbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICByZXR1cm4gbWFyZ2luLmxlZnQrMjApXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUrKChpKzEpKjMwKSlcbiAgICAgICAgICAgICAudGV4dCgoZCkgLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgIyB5LWF4aXNcbiAgICAgICAgeWF4aXMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIHlheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeXRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImxpbmVcIilcbiAgICAgICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4MlwiLCBtYXJnaW4ubGVmdCt3aWR0aClcbiAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIDEpXG4gICAgICAgICAgICAgLnN0eWxlKFwicG9pbnRlci1ldmVudHNcIiwgXCJub25lXCIpXG4gICAgICAgIHlheGlzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgLmRhdGEoeXRpY2tzKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55bGFiZWwpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IGZvcm1hdEF4aXMoeXRpY2tzKShkKSlcbiAgICAgICAgeWF4aXMuYXBwZW5kKFwidGV4dFwiKS5hdHRyKFwiY2xhc3NcIiwgXCJ0aXRsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wLTgrKGhlaWdodC8yKSlcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeWxhYilcbiAgICAgICAgICAgICAuYXR0cihcInRyYW5zZm9ybVwiLCBcInJvdGF0ZSgyNzAsI3ttYXJnaW4ubGVmdC1heGlzcG9zLnl0aXRsZX0sI3ttYXJnaW4udG9wK2hlaWdodC8yfSlcIilcblxuXG4gICAgICAgIGxhYmVscyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiaWRcIiwgXCJsYWJlbHNcIilcbiAgICAgICAgbGFiZWxzU2VsZWN0ID1cbiAgICAgICAgICBsYWJlbHMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAudGV4dCgoZCktPiByZXR1cm4gd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgeHBvcyA9IHhzY2FsZSh4W2ldKVxuICAgICAgICAgICAgICAgICAgc3RyaW5nX2VuZCA9IHhwb3MrdGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKVxuICAgICAgICAgICAgICAgICAgb3ZlcmxhcF94c3RhcnQgPSB4cG9zLSh0aGlzLmdldENvbXB1dGVkVGV4dExlbmd0aCgpKzUpXG4gICAgICAgICAgICAgICAgICBpZiBvdmVybGFwX3hzdGFydCA8IDUwXG4gICAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0gNTBcbiAgICAgICAgICAgICAgICAgIHJldHVybiBvdmVybGFwX3hzdGFydCBpZiBzdHJpbmdfZW5kID4gd2lkdGhcbiAgICAgICAgICAgICAgICAgIHJldHVybiB4cG9zKzVcbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHlwb3MgPSB5c2NhbGUoeVtpXSlcbiAgICAgICAgICAgICAgICAgIHJldHVybiB5cG9zKzEwIGlmICh5cG9zIDwgNTApXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcy01XG4gICAgICAgICAgICAgICAgICApXG5cblxuICAgICAgICBwb2ludHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwicG9pbnRzXCIpXG4gICAgICAgIHBvaW50c1NlbGVjdCA9XG4gICAgICAgICAgcG9pbnRzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJjaXJjbGVcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcImN4XCIsIChkLGkpIC0+IHhzY2FsZSh4W2ldKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImN5XCIsIChkLGkpIC0+IHlzY2FsZSh5W2ldKSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkLGkpIC0+IFwicHQje2l9XCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJyXCIsIHBvaW50c2l6ZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gaVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnMoW3ZhbF0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIChkLCBpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwgPSBNYXRoLmZsb29yKGkvMTcpICUgNVxuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRTdHJva2VDb2xvcih2YWwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjb2xcbiAgICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwiMVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwib3BhY2l0eVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDEgaWYgKHhbaV0/IG9yIHhOQS5oYW5kbGUpIGFuZCAoeVtpXT8gb3IgeU5BLmhhbmRsZSlcbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAwKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0K3BhbmVsb2Zmc2V0KVxuICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlLXdpZHRoXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgICAgIFxuXG4gICAgIyMgY29uZmlndXJhdGlvbiBwYXJhbWV0ZXJzXG4gICAgY2hhcnQud2lkdGggPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gd2lkdGggaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHdpZHRoID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5oZWlnaHQgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gaGVpZ2h0IGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBoZWlnaHQgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm1hcmdpbiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBtYXJnaW4gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG1hcmdpbiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuYXhpc3BvcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBheGlzcG9zIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBheGlzcG9zID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGltID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsaW0gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsaW0gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm54dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbnh0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbnh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHh0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeHRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55bGltID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHlsaW0gaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHlsaW0gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lm55dGlja3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbnl0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgbnl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl0aWNrcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeXRpY2tzID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5yZWN0Y29sb3IgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcmVjdGNvbG9yIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICByZWN0Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50Y29sb3IgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRjb2xvciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzaXplID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c2l6ZSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRzaXplID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludHN0cm9rZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHN0cm9rZSBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcG9pbnRzdHJva2UgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnhsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geGxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeGxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxhYiA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGFiIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGFiID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHh2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl2YXIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geXZhciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeXZhciA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueXNjYWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB5c2NhbGVcblxuICAgIGNoYXJ0LnhzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geHNjYWxlXG5cbiAgICBjaGFydC5wb2ludHNTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIHBvaW50c1NlbGVjdFxuXG4gICAgY2hhcnQubGFiZWxzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBsYWJlbHNTZWxlY3RcblxuICAgIGNoYXJ0LmxlZ2VuZFNlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGVnZW5kU2VsZWN0XG5cbiAgICBjaGFydC52ZXJ0aWNhbFJ1bGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHZlcnRpY2FsUnVsZVxuXG4gICAgY2hhcnQuaG9yaXpvbnRhbFJ1bGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIGhvcml6b250YWxSdWxlXG5cbiAgICAjIHJldHVybiB0aGUgY2hhcnQgZnVuY3Rpb25cbiAgICBjaGFydFxuXG4gIHJvdW5kRGF0YTogKGRhdGEpID0+IFxuICAgIGZvciBkIGluIGRhdGFcbiAgICAgIGQuRmlzaGluZyA9IHBhcnNlRmxvYXQoZC5GaXNoaW5nKS50b0ZpeGVkKDIpXG4gICAgICBkLkRpdmluZyA9IHBhcnNlRmxvYXQoZC5EaXZpbmcpLnRvRml4ZWQoMilcblxuICBnZXRDb2xvcnMgPSAoaSkgLT5cbiAgICBjb2xvcnMgPSBbXCJMaWdodEdyZWVuXCIsIFwiTGlnaHRQaW5rXCIsIFwiTGlnaHRTa3lCbHVlXCIsIFwiTW9jY2FzaW5cIiwgXCJCbHVlVmlvbGV0XCIsIFwiR2FpbnNib3JvXCIsIFwiRGFya0dyZWVuXCIsIFwiRGFya1R1cnF1b2lzZVwiLCBcIm1hcm9vblwiLCBcIm5hdnlcIiwgXCJMZW1vbkNoaWZmb25cIiwgXCJvcmFuZ2VcIiwgIFwicmVkXCIsIFwic2lsdmVyXCIsIFwidGVhbFwiLCBcIndoaXRlXCIsIFwiYmxhY2tcIl1cbiAgICByZXR1cm4gY29sb3JzW2ldXG5cbiAgZ2V0U3Ryb2tlQ29sb3IgPSAoaSkgLT5cbiAgICBzY29sb3JzID0gW1wiYmxhY2tcIiwgXCJ3aGl0ZVwiLCBcImdyYXlcIiwgXCJicm93blwiLCBcIk5hdnlcIl1cbiAgICByZXR1cm4gc2NvbG9yc1tpXVxuXG4gICMgZnVuY3Rpb24gdG8gZGV0ZXJtaW5lIHJvdW5kaW5nIG9mIGF4aXMgbGFiZWxzXG4gIGZvcm1hdEF4aXMgPSAoZCkgLT5cbiAgICBkID0gZFsxXSAtIGRbMF1cbiAgICBuZGlnID0gTWF0aC5mbG9vciggTWF0aC5sb2coZCAlIDEwKSAvIE1hdGgubG9nKDEwKSApXG4gICAgbmRpZyA9IDAgaWYgbmRpZyA+IDBcbiAgICBuZGlnID0gTWF0aC5hYnMobmRpZylcbiAgICBkMy5mb3JtYXQoXCIuI3tuZGlnfWZcIilcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFkZW9mZnNUYWIiLCJ0aGlzW1wiVGVtcGxhdGVzXCJdID0gdGhpc1tcIlRlbXBsYXRlc1wiXSB8fCB7fTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJlbnZpcm9ubWVudFwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc0NvbnNlcnZhdGlvblpvbmVcIixjLHAsMSksYyxwLDAsMjYsODgyNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5CZW50aGljIEhhYml0YXRzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4MDc5ZGQ1YTFlYzM2ZjU1OTVmYjJiMFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIGZvbGxvd2luZyB0YWJsZSBkZXNjcmliZXMgdGhlIG92ZXJsYXAgb2YgeW91ciBwbGFuIHdpdGggdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LiBUaGUgTU5JIDIwMTYgYmVudGhpYyBoYWJpdGF0IG1hcCB3YXMgZGlnaXRpemVkIGJ5IGhhbmQgdXNpbmcgYSBjb21iaW5hdGlvbiBvZiBpbiBzaXR1IG9ic2VydmF0aW9ucyBvbiBzY3ViYS9mcmVlIGRpdmUgYXQgc3VydmV5IHNpdGVzIChuID0gYXBwcm94LiA2MDApIGFuZCBkcm9wIGNhbWVyYSBkZXBsb3ltZW50cyAobiA9IDM0MykgYXMgcGFydCBvZiB0aGUgV2FpdHQgSW5zdGl0dXRlIFNjaWVudGlmaWMgQXNzZXNzbWVudC4gUHJlbGltaW5hcnkgY29udGV4dCBmb3IgbWFwcGluZyB3YXMgZ2xlYW5lZCBmcm9tIGJlbnRoaWMgbWFwcyBkZXBpY3RlZCBpbiBXaWxkIGV0LiBhbCAyMDA3IGFuZCBJUkYgMTk5My4gVGhlc2UgbWFwcyBwcm92aWRlZCB2YWx1YWJsZSBpbnNpZ2h0IGludG8gZG9taW5hbnQgYmVudGhpYyBmZWF0dXJlcyBhbmQgdGhlIGludGVycHJldGF0aW9uIG9mIHNpdGUgb2JzZXJ2YXRpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzWm9uZVdpdGhHb2FsXCIsYyxwLDEpLGMscCwwLDkzOCwxMTY0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk1lZXRzIDEwJSBHb2FsPzxzdXA+Kjwvc3VwPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjQwcHg7XFxcIj5NZWV0cyAyMCUgR29hbD88c3VwPio8L3N1cD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDo0MHB4O1xcXCI+TWVldHMgMzAlIEdvYWw/PHN1cD4qPC9zdXA+PC90aD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjI1cHg7XFxcIj5IYWJpdGF0PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXJlYSAoc3EuIGttLik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BcmVhICglIG9mIFRvdGFsKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDEzODMsMjk2NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzWm9uZVdpdGhHb2FsXCIsYyxwLDEpLGMscCwwLDE0MzEsMjgyMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIk1FRVRTXzEwX0dPQUxcIixjLHAsMSksYyxwLDAsMTQ4NSwxNTU4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzbWFsbC1ncmVlbi1jaGVja1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk1FRVRTXzEwX0dPQUxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMCwxNjQyLDE3MDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibm8tZ29hbFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX0dPQUxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLXJlZC14XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307fTtfLmIoXCIgICAgICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIk1FRVRTXzIwX0dPQUxcIixjLHAsMSksYyxwLDAsMTk0NCwyMDE3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzbWFsbC1ncmVlbi1jaGVja1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk1FRVRTXzIwX0dPQUxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMCwyMTAxLDIxNjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibm8tZ29hbFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX0dPQUxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLXJlZC14XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307fTtfLmIoXCIgICAgICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIk1FRVRTXzMwX0dPQUxcIixjLHAsMSksYyxwLDAsMjQwMywyNDc2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzbWFsbC1ncmVlbi1jaGVja1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk1FRVRTXzMwX0dPQUxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMCwyNTYwLDI2MjcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwibm8tZ29hbFxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk5PX0dPQUxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLXJlZC14XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307fTtfLmIoXCIgICAgICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBUkVBX1NRS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJQRVJDXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzWm9uZVdpdGhHb2FsXCIsYyxwLDEpLGMscCwwLDMwMjYsMzQ5NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8dGZvb3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZCBjb2xzcGFuPVxcXCI2XFxcIiBzdHlsZT1cXFwicGFkZGluZy1sZWZ0OjEwcHg7dGV4dC1hbGlnbjpsZWZ0O1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8c3VwPio8L3N1cD5JbmRpY2F0ZXMgd2hldGhlciB0aGUgc2VsZWN0ZWQgTWFyaW5lIFJlc2VydmVzIHpvbmVzIGhhdmUgcmVhY2hlZCB0aCBjb25zZXJ2YXRpb24gZ29hbCBvZiBwcmVzZXJ2aW5nIDEwLzIwLzMwJSBvZiBlYWNoIGhhYml0YXQuIEEgZ3JlZW4gY2hlY2sgaW5kaWNhdGVzIHRoYXQgdGhlIGdvYWwgaXMgbWV0LCByZWQgeCBtZWFucyB0aGF0IHRoZSBnb2FsIGlzIG5vdCBtZXQsIGFuZCBhIGdyYXkgZGFzaCBpbmRpY2F0ZXMgdGhhdCB0aGVyZSBpcyBubyBnb2FsIGZvciB0aGF0IGhhYml0YXQuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGZvb3Q+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5QcmVzZW5jZSBvZiBJVUNOIExpc3RlZCBDb3JhbCBTcGVjaWVzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4ZTY3MWZjNGFmMjVkNTkwYmE0Y2NlZlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhyZWUgSVVDTiBsaXN0ZWQgY29yYWxzIGhhdmUgYmVlbiBvYnNlcnZlZCB3aXRoaW4gTW9udHNlcnJhdCB3YXRlcnMuIFRoZSBmb2xsb3dpbmcgZ3JhcGhpY3Mgc2hvdyB0aGUgbnVtYmVyIG9mIHRoZSBrbm93biBvYnNlcnZhdGlvbnMgdGhhdCBhcmUgZm91bmQgd2l0aGluIHRoZSBzZWxlY3RlZCBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwzOTMwLDM5NDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb24gb2Ygem9uZXNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ6b25lXCIpO307Xy5iKFwiLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDAsNDAzMyw0MzgyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJvcmJfYVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPGRpdj48aT5PcmJpY2VsbGEgYW5udWxhcmlzIDwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgaWQ9XFxcIm9yYl9mXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPk9yYmljZWxsYSBmYXZlb2xhdGE8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJhY3JvXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPkFjcm9wb3JhIHBhbG1hdGE8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc0QzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk5hbWU8c3VwPio8L3N1cD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyMjVweDtcXFwiPkNvdW50PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjb3JhbF9jb3VudFwiLGMscCwxKSxjLHAsMCw0NzAwLDQ4NDQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVE9UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaCBQb3RzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4ZWQ3Y2I1NGFmMjVkNTkwYmE0ZmMzY1xcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNEM1wiLGMscCwxKSxjLHAsMCw1MDk0LDUyMTgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxkaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJmaXNoX3BvdHNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2PjxpPkZpc2ggUG90czwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJoYXNEM1wiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyMjVweDtcXFwiPkNvdW50PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+VG90YWw8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJmaXNocG90X2NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiZmlzaHBvdF90b3RhbFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiKTt9O18uYihcIiA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGg0Pk51cnNlcnkgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGVzZSBjaGFydHMgc2hvdyB0aGUgbWluaW11bSwgbWVhbiBhbmQgbWF4aW11bSBhYnVuZGFuY2UgbWVhc3VyZW1lbnRzIG9mIG51cnNlcnkgYXJlYXMgdGhhdCB3ZXJlIHRha2VuIHdpdGhpbiB5b3VyIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDU3OTgsNTgwOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInpvbmVcIik7fTtfLmIoXCIsIGluIHJlbGF0aW9uIHRvIHRoZSBkaXN0cmlidXRpb24gb2YgYWJ1bmRhbmNlIHdpdGhpbiBNb250c2VycmF0IHdhdGVycy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwwLDU5NjQsNjA3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+TnVyc2VyeSBBcmVhczwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgaWQ9XFxcInNhbmRnX3ZpelxcXCIgY2xhc3M9XFxcInNhbmRnX3ZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjI1MHB4O1xcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWVhbjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1pbmltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NYXhpbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmRnXCIsYyxwLDEpLGMscCwwLDYzNzIsNjU2OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPk51cnNlcnkgQXJlYXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInNhbmRnLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJzYW5kZy5NSU5cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInNhbmRnLk1BWFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+RmlzaCBCaW9tYXNzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhlc2UgY2hhcnRzIHNob3cgdGhlIG1pbmltdW0sIG1lYW4gYW5kIG1heGltdW0gZmlzaCBiaW9tYXNzIHZhbHVlIHRha2VuIHdpdGhpbiB5b3VyIHNrZXRjaGVkIHpvbmUsIGluIHJlbGF0aW9uIHRvIHRoZSBkaXN0cmlidXRpb24gb2YgYmlvbWFzcyBtZWFzdXJlZCBhcm91bmQgdGhlIGlzbGFuZC4gQmlvbWFzcyB3YXMgY2FsY3VsYXRlZCBmb3IgSGVyYml2b3JlcyBhbmQgQWxsIFNwZWNpZXMgYXQgcmVndWxhciBwb2ludHMgYWxvbmcgTW9udHNlcnJhdCdzIGNvYXN0LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDAsNzAwOSw3MjM2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5IZXJiaXZvcmUgQmlvbWFzczwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgaWQ9XFxcImhlcmJfdml6XFxcIiBjbGFzcz1cXFwiaGVyYl92aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPkFsbCBTcGVjaWVzIEJpb21hc3M8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJ0b3RhbF92aXpcXFwiIGNsYXNzPVxcXCJ0b3RhbF92aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyNTBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NaW5pbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWF4aW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoZXJiXCIsYyxwLDEpLGMscCwwLDc1MzEsNzcyMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPkhlcmJpdm9yZXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImhlcmIuU0NPUkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImhlcmIuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLk1BWFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJ0b3RhbFwiLGMscCwxKSxjLHAsMCw3NzUxLDc5NDAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5Ub3RhbHM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInRvdGFsLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJ0b3RhbC5NSU5cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInRvdGFsLk1BWFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5GaXNoIEFidW5kYW5jZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoZXNlIGNoYXJ0cyBzaG93IHRoZSBtaW5pbXVtLCBtZWFuIGFuZCBtYXhpbXVtIGZpc2ggYWJ1bmRhbmNlIHZhbHVlIHRha2VuIHdpdGhpbiB5b3VyIHNrZXRjaGVkIHpvbmUuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMCw4MjE0LDgyNjgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxkaXYgaWQ9XFxcImZpc2hfdml6XFxcIiBjbGFzcz1cXFwiZmlzaF92aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyNTBweDtcXFwiPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NaW5pbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWF4aW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJmaXNoXCIsYyxwLDEpLGMscCwwLDg1NjMsODc1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPkhlcmJpdm9yZXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImZpc2guU0NPUkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImZpc2guTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJmaXNoLk1BWFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiKTt9O18uYihcIiAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc0NvbnNlcnZhdGlvblpvbmVcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5ObyBNYXJpbmUgUmVzZXJ2ZXMgPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cCBzdHlsZT1cXFwiZm9udC1zaXplOjEuMmVtXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDxlbT5UaGUgZW52aXJvbm1lbnQgdGFiIHJlcG9ydHMgYXJlIG9ubHkgYXBwbGljYWJsZSB0byA8Yj5NYXJpbmUgUmVzZXJ2ZXM8L2I+IHpvbmUgdHlwZXMuPC9lbT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDkxMDAsOTE1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiIFRoaXMgY29sbGVjdGlvbiBkb2VzIG5vdCBpbmNsdWRlIGFueSBvZiB0aGVzZSB6b25lcy5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9O3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDc2LDg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZChcInNpemUuU0laRV9TUUtNXCIsYyxwLDApKSk7Xy5iKFwiIHNxLiBrbTwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmQoXCJzaXplLlBFUkNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXN0YW5jZSBmcm9tIFBvcnQgTGl0dGxlIEJheTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIGZhcnRoZXN0IHBvaW50IGluIHRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw0NDQsNDU0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm1pbkRpc3RLTVwiLGMscCwwKSkpO18uYihcIiBrbTwvc3Ryb25nPiAob3ZlciB3YXRlcikgZnJvbSB0aGUgUG9ydCBMaXR0bGUgQmF5LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkZpc2hpbmcgVmFsdWU8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1N2UyYzMzYmViMjc1YmJhMWVjNmZkNDZcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgaGVhdG1hcCBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw3ODMsNzkzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoXCIpO307Xy5iKFwiIG92ZXJsYXBzIHdpdGggYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZmlzaGluZyB2YWx1ZSB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGl2ZSBWYWx1ZTxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU3ZTJjMzAyZWIyNzViYmExZWM2ZmQzZFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoZWF0bWFwIGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEyMjgsMTIzOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNrZXRjaFwiKTt9O18uYihcIiBvdmVybGFwcyB3aXRoIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJkaXNwbGFjZWRfZGl2ZV92YWx1ZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIHRvdGFsIGRpdmUgdmFsdWUgd2l0aGluIE1vbnRzZXJyYXQncyB3YXRlcnMsIGJhc2VkIG9uIHRoZSB1c2VyIHJlcG9ydGVkIHZhbHVlIG9mIGRpdmUgc2l0ZXMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtpZihfLnMoXy5mKFwiaXNDb25zZXJ2YXRpb25ab25lXCIsYyxwLDEpLGMscCwwLDE1MjQsMjE1MyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5NaW5pbXVtIFNpemUgR29hbDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBzdHlsZT1cXFwicGFkZGluZy1sZWZ0OjEwcHhcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtZWV0c01pbldpZHRoR29hbFwiLGMscCwxKSxjLHAsMCwxNjU4LDE3MTMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJiaWctZ3JlZW4tY2hlY2tcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJtZWV0c01pbldpZHRoR29hbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJiaWctcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgICAgIDxkaXYgc3R5bGU9XFxcImRpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7Zm9udC1zaXplOjEuMWVtXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgVGhpcyB6b25lIDxiPlwiKTtpZihfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDAsMTk1MywxOTU5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgbWVldHNcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJtZWV0c01pbldpZHRoR29hbFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcImRvZXMgbm90IG1lZXRcIik7fTtfLmIoXCI8L2I+IHRoZSBjb25zZXJ2YXRpb24gZ29hbCBvZiBoYXZpbmcgYSBtaW5pbXVtIHdpZHRoIG9mIDxiPmF0IGxlYXN0IDFrbTwvYj4uXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX07aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwyMjEyLDM3NTAsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGg0Pk1pbmltdW0gU2l6ZSBHb2FsPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIE1hcmluZSBSZXNlcnZlIFpvbmVzIHNob3VsZCBoYXZlIGEgbWluaW11bSB3aWR0aCBvZiBhdCBsZWFzdCAxIGtpbG9tZXRlciB0byBtZWV0IGNvbnNlcnZhdGlvbiBnb2Fscy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkIHN0eWxlPVxcXCJ3aWR0aDo2MHB4O3RleHQtYWxpZ246Y2VudGVyO1xcXCI+TWVldHMgMWttIEdvYWw/PC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+Wm9uZSBOYW1lPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIm1pbl9kaW1cIixjLHAsMSksYyxwLDAsMjY0MywzMDI4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcIk1FRVRTX1RIUkVTSFwiLGMscCwxKSxjLHAsMCwyNzEzLDI3ODYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfVEhSRVNIXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgICAgICAgICAgIDwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQgc3R5bGU9XFxcInRleHQtYWxpZ246bGVmdDtcXFwiPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGg0PkNvbm5lY3Rpdml0eTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlpvbmUgTmFtZTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPkRpc3RhbmNlIHRvIE5lYXJlc3QgWm9uZSAoa20pPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+TmVhcmVzdCBab25lIE5hbWU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29ubmVjdGl2aXR5XCIsYyxwLDEpLGMscCwwLDMzODEsMzUzMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRJU1RfS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5FQVJfTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZW0+Tm90ZTo8L2VtPiBUaGUgY29ubmVjdGl2aXR5IGFuYWx5dGljIGhhcyBiZWVuIGRldmVsb3BlZCBmb3IgZGVtb25zdHJhdGlvbiBwdXJwb3NlcywgYW5kIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBsZWFzdCBjb3N0IHBhdGggYXJvdW5kIGxhbmQuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInRyYWRlb2Zmc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRyYWRlb2ZmczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw3MCwxMDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjE4cHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8ZW0+VHJhZGVvZmYgYW5hbHlzaXMgaXMgY3VycmVudGx5IGluIGRldmVsb3BtZW50LCBhbmQgc2hvdWxkIGJlIHVzZWQgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXMgb25seS4gVGhlc2UgYW5hbHl0aWNzIHdpbGwgYWxsb3cgdXNlcnMgdG8gcGxvdCBtdWx0aXBsZSBwbGFuIG9wdGlvbnMgYWdhaW5zdCBlYWNoIG90aGVyIGluIHRlcm1zIG9mIHRoZWlyIGltcGFjdCBvbiBmaXNoaW5nLCBkaXZlIGFuZCBjb25zZXJ2YXRpb24gdmFsdWUgZm9yIE1vbnRzZXJyYXQuPC9lbT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDoxOHB4O21hcmdpbi1ib3R0b206MTVweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIFx0PHNwYW4+U2VsZWN0IGEgU2V0IG9mIFRyYWRlb2ZmIFNjb3JlcyB0byBWaWV3Ojwvc3Bhbj48L2JyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHQ8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ0cmFkZW9mZnNcIixjLHAsMSksYyxwLDAsNTQ5LDY3NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8b3B0aW9uIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuID09IFxcXCJGaXNoaW5nIGFuZCBEaXZpbmdcXFwiID8gJ2RlZmF1bHQtY2hvc2VuLXNlbGVjdGlvbicgOiAnJ1wiLGMscCwwKSkpO18uYihcIlxcXCIgIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdFx0PC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBpZD1cXFwiZnZkX2NvbnRhaW5lclxcXCIgY2xhc3M9XFxcImZ2ZF9jb250YWluZXJcXFwiPjxkaXYgIGlkPVxcXCJmaXNoaW5nLXYtZGl2aW5nXFxcIiBjbGFzcz1cXFwiZmlzaGluZy12LWRpdmluZ1xcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgaWQ9XFxcImZ2Y19jb250YWluZXJcXFwiIGNsYXNzPVxcXCJmdmNfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwiZmlzaGluZy12LWNvbnNlcnZhdGlvblxcXCIgY2xhc3M9XFxcImZpc2hpbmctdi1jb25zZXJ2YXRpb25cXFwiPjwvZGl2PjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGlkPVxcXCJkdmNfY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiZHZjX2NvbnRhaW5lclxcXCI+PGRpdiAgaWQ9XFxcImRpdmluZy12LWNvbnNlcnZhdGlvblxcXCIgY2xhc3M9XFxcImRpdmluZy12LWNvbnNlcnZhdGlvblxcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgXHQgIFx0PHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0XHQ8aT5ObyB0cmFkZW9mZiBhbmFseXNpcyBhdmFpbGFibGUgZm9yIGluZGl2aWR1YWwgem9uZXMuPC9pPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
