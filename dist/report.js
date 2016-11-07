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
    this.getAllValues = __bind(this.getAllValues, this);
    this.renderHistoValues = __bind(this.renderHistoValues, this);
    _ref = EnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EnvironmentTab.prototype.name = 'Environment';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.template = templates.environment;

  EnvironmentTab.prototype.dependencies = ['MontserratHabitatToolbox', 'MontserratBiomassToolbox'];

  EnvironmentTab.prototype.render = function() {
    var all_fish_vals, all_herb_vals, all_total_values, context, d3IsPresent, fish_bio, habitats, herb_bio, isCollection, total_bio, _ref1;
    habitats = this.recordSet('MontserratHabitatToolbox', 'Habitats').toArray();
    habitats = _.sortBy(habitats, function(h) {
      return parseFloat(h.PERC);
    });
    habitats = habitats.reverse();
    herb_bio = this.recordSet('MontserratBiomassToolbox', 'HerbivoreBiomass').toArray()[0];
    all_herb_vals = this.getAllValues(herb_bio.HISTO);
    this.roundVals(herb_bio);
    total_bio = this.recordSet('MontserratBiomassToolbox', 'TotalBiomass').toArray()[0];
    all_total_values = this.getAllValues(total_bio.HISTO);
    this.roundVals(total_bio);
    fish_bio = this.recordSet('MontserratBiomassToolbox', 'FishAbundance').toArray()[0];
    all_fish_vals = this.getAllValues(fish_bio.HISTO);
    this.roundVals(fish_bio);
    isCollection = this.model.isCollection();
    d3IsPresent = (_ref1 = window.d3) != null ? _ref1 : {
      "true": false
    };
    this.roundData(habitats);
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
      total: total_bio
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    this.renderHistoValues(herb_bio, all_herb_vals, ".herb_viz", "#66cdaa", "Herbivore Biomass (g/m^2)", "Biomass Per Transect");
    this.renderHistoValues(total_bio, all_total_values, ".total_viz", "#fa8072", "Total Biomass (g/m^2)", "Biomass Per Transect");
    return this.renderHistoValues(fish_bio, all_fish_vals, ".fish_viz", "#6897bb", "Total Fish Count", "Number of Fish Species");
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
      svg.append("g").attr("class", "x axis").attr("transform", "translate(0," + height + ")").call(xAxis).append("text").attr("x", width / 2).attr("y", 0).attr("dy", "3em").style("text-anchor", "middle").text(x_axis_label);
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
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

ReportTab = require('reportTab');

templates = require('../templates/templates.js');

d3 = window.d3;

OverviewTab = (function(_super) {
  __extends(OverviewTab, _super);

  function OverviewTab() {
    _ref = OverviewTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  OverviewTab.prototype.name = 'Overview';

  OverviewTab.prototype.className = 'overview';

  OverviewTab.prototype.template = templates.overview;

  OverviewTab.prototype.dependencies = ['SizeAndConnectivity', 'DiveAndFishingValue', 'Distance'];

  OverviewTab.prototype.render = function() {
    var connectivity, context, ddv, dfv, displaced_dive_value, displaced_fishing_value, isCollection, minDistKM, size;
    size = this.recordSet('SizeAndConnectivity', 'Size').toArray()[0];
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
      minDistKM: minDistKM
    };
    this.$el.html(this.template.render(context, templates));
    return this.enableLayerTogglers();
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
    var context, diving_max, diving_min, diving_vals, fishing_max, fishing_min, fishing_vals, isCollection, item, tradeoff_data, tradeoffs,
      _this = this;
    tradeoff_data = this.recordSet('MontserratTradeoffAnalysis', 'Scores').toArray();
    this.roundData(tradeoff_data);
    tradeoffs = ['Fishing and Diving'];
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
    fishing_min = Math.min(fishing_vals);
    fishing_max = Math.max(fishing_vals);
    diving_min = Math.min(diving_vals);
    diving_max = Math.max(diving_vals);
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
      return this.setupScatterPlot(tradeoff_data, '.fishing-v-diving', "Value of Fishing", "Value of Diving", "Fishing", "Diving", fishing_min, fishing_max, diving_min, diving_max);
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
      return this.$('.fvd_container').show();
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
this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Benthic Habitats <a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The below table describes the overlap of your plan with the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right. The MNI 2016 benthic habitat map was digitized by hand using a combination of in situ observations on scuba/free dive at survey sites (n = approx. 600) and drop camera deployments (n = 343) as part of the Waitt Institute Scientific Assessment. Preliminary context for mapping was gleaned from benthic maps depicted in Wild et. al 2007 and IRF 1993. These maps provided valuable insight into dominant benthic features and the interpretation of site observations. ");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("            <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("            <th>Area (% of Total)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,1074,1215,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Biomass</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum biomass value taken within your sketched zone, in relation to the distribution of biomass measured around the island. Biomass was calculated for Herbivores and All Species at regular points along Montserrat's coast.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,1627,1854,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div class=\"in-report-header\">Herbivore Biomass</div>");_.b("\n" + i);_.b("      <div id=\"herb_viz\" class=\"herb_viz\"></div>");_.b("\n" + i);_.b("      <div class=\"in-report-header\">All Species Biomass</div>");_.b("\n" + i);_.b("      <div id=\"total_viz\" class=\"total_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("herb",c,p,1),c,p,0,2149,2339,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Herbivores</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("herb.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}if(_.s(_.f("total",c,p,1),c,p,0,2369,2558,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Totals</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("total.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b(" </div>");_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("    <h4>Fish Abundance</h4>");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);_.b("      These charts show the minimum, mean and maximum fish abundance value taken within your sketched zone.");_.b("\n" + i);_.b("    <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,2832,2886,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div id=\"fish_viz\" class=\"fish_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("            <th>Mean</th>");_.b("\n" + i);_.b("            <th>Minimum</th>");_.b("\n" + i);_.b("            <th>Maximum</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("fish",c,p,1),c,p,0,3181,3371,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>Herbivores</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.d("fish.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("        </tbody>");_.b("\n" + i);_.b("      </table>");_.b("\n");};_.b("  </div>");_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,76,86,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.d("size.SIZE_SQKM",c,p,0)));_.b(" sq. km</strong>");_.b("\n" + i);_.b("    ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance from Port Little Bay</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The farthest point in the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,330,340,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.f("minDistKM",c,p,0)));_.b(" km</strong> (over water) from the Port Little Bay.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value<a href=\"#\" data-toggle-node=\"57e2c33beb275bba1ec6fd44\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,671,681,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Curacao's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Dive Value<a href=\"#\" data-toggle-node=\"57e2c302eb275bba1ec6fd3b\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,1113,1123,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlaps with approximately <strong>");_.b(_.v(_.f("displaced_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Curacao's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,1381,2066,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Connectivity</h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("            <td>Distance to Nearest Zone (km)</td>");_.b("\n" + i);_.b("            <td>Nearest Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("connectivity",c,p,1),c,p,0,1697,1847,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("DIST_KM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NEAR_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <em>Note:</em> The connectivity analytic has been developed for demonstration purposes, and does not account for the least cost path around land.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["tradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,70,767,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p style=\"margin-left:18px;\">");_.b("\n" + i);_.b("  		<em>Tradeoff analysis is currently in development, and should be used for demonstration purposes only. These analytics will allow users to plot multiple plan options against each other in terms of their impact on fishing, dive and conservation value for Montserrat.</em>");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("  	<div style=\"margin-left:18px;margin-bottom:15px\">");_.b("\n" + i);_.b("	  	<span>Select a Set of Tradeoff Scores to View:</span></br>");_.b("\n" + i);_.b("		<select class=\"chosen\">");_.b("\n" + i);_.b("			<option class=\"default-chosen-selection\" label=\"Fishing and Diving\">Fishing and Diving</option>");_.b("\n" + i);_.b("\n" + i);_.b("		</select>");_.b("\n" + i);_.b("	</div>");_.b("\n" + i);_.b("  	<div id=\"pvt_container\" class=\"pvt_container\"><div  id=\"fishing-v-diving\" class=\"fishing-v-diving\"></div></div>");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("  	  	<p>");_.b("\n" + i);_.b("  			<i>No tradeoff analysis available for individual zones.</i>");_.b("\n" + i);_.b("  		</p>");_.b("\n");};_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvc2NyaXB0cy9lbnZpcm9ubWVudC5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvdHJhZGVvZmZzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0Is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LENBQWQ7Q0FDRSxHQUFBLElBQUE7Q0FBQSxFQUFJLENBQUo7Q0FBQSxDQUNtQixDQUFaLENBQVAsQ0FBTztDQUNQLEVBQW1CLENBQW5CO0NBQUEsRUFBTyxDQUFQLEVBQUE7TUFGQTtDQUFBLEVBR08sQ0FBUDtDQUNHLENBQUQsQ0FBUyxDQUFBLEVBQVgsS0FBQTtDQXJkRixFQWdkYTs7Q0FoZGI7O0NBRHlCOztBQXdkM0IsQ0FoZUEsRUFnZWlCLEdBQVgsQ0FBTixLQWhlQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBjb25zb2xlLmxvZyBAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpXG4gICAgICAgICAgcGF5bG9hZFNpemUgPSBNYXRoLnJvdW5kKCgoQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKSBvciAwKSAvIDEwMjQpICogMTAwKSAvIDEwMFxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiRmVhdHVyZVNldCBzZW50IHRvIEdQIHdlaWdoZWQgaW4gYXQgI3twYXlsb2FkU2l6ZX1rYlwiXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT5cbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcblxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChAbWF4RXRhICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7QG1heEV0YSArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YVNlY29uZHMnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPlxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KClcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDEyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJkb05vdEV4cG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5cbmQzID0gd2luZG93LmQzXG5cbmNsYXNzIEVudmlyb25tZW50VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbnZpcm9ubWVudCdcbiAgY2xhc3NOYW1lOiAnZW52aXJvbm1lbnQnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZW52aXJvbm1lbnRcbiAgZGVwZW5kZW5jaWVzOlsgXG4gICAgJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCdcbiAgICAnTW9udHNlcnJhdEJpb21hc3NUb29sYm94J1xuICBdXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgICMgY3JlYXRlIHJhbmRvbSBkYXRhIGZvciB2aXN1YWxpemF0aW9uXG4gICAgaGFiaXRhdHMgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0SGFiaXRhdFRvb2xib3gnLCAnSGFiaXRhdHMnKS50b0FycmF5KClcbiAgICBoYWJpdGF0cyA9IF8uc29ydEJ5IGhhYml0YXRzLCAoaCkgLT4gIHBhcnNlRmxvYXQoaC5QRVJDKVxuICAgIGhhYml0YXRzID0gaGFiaXRhdHMucmV2ZXJzZSgpXG5cbiAgICBoZXJiX2JpbyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdIZXJiaXZvcmVCaW9tYXNzJykudG9BcnJheSgpWzBdXG4gICAgYWxsX2hlcmJfdmFscyA9IEBnZXRBbGxWYWx1ZXMgaGVyYl9iaW8uSElTVE9cbiAgICBAcm91bmRWYWxzIGhlcmJfYmlvXG5cbiAgICB0b3RhbF9iaW8gPSBAcmVjb3JkU2V0KCdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnLCAnVG90YWxCaW9tYXNzJykudG9BcnJheSgpWzBdXG4gICAgYWxsX3RvdGFsX3ZhbHVlcyA9IEBnZXRBbGxWYWx1ZXMgdG90YWxfYmlvLkhJU1RPXG4gICAgQHJvdW5kVmFscyB0b3RhbF9iaW9cblxuICAgIGZpc2hfYmlvID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEJpb21hc3NUb29sYm94JywgJ0Zpc2hBYnVuZGFuY2UnKS50b0FycmF5KClbMF1cbiAgICBhbGxfZmlzaF92YWxzID0gQGdldEFsbFZhbHVlcyBmaXNoX2Jpby5ISVNUT1xuICAgIEByb3VuZFZhbHMgZmlzaF9iaW9cbiAgICBcblxuXG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKCkgICBcbiAgICBkM0lzUHJlc2VudCA9IHdpbmRvdy5kMyA/IHRydWUgIDogZmFsc2VcbiAgICBAcm91bmREYXRhIGhhYml0YXRzXG5cblxuICAgICMgc2V0dXAgY29udGV4dCBvYmplY3Qgd2l0aCBkYXRhIGFuZCByZW5kZXIgdGhlIHRlbXBsYXRlIGZyb20gaXRcbiAgICBjb250ZXh0ID1cbiAgICAgIHNrZXRjaDogQG1vZGVsLmZvclRlbXBsYXRlKClcbiAgICAgIHNrZXRjaENsYXNzOiBAc2tldGNoQ2xhc3MuZm9yVGVtcGxhdGUoKVxuICAgICAgYXR0cmlidXRlczogQG1vZGVsLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgYWRtaW46IEBwcm9qZWN0LmlzQWRtaW4gd2luZG93LnVzZXJcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBoYWJpdGF0czogaGFiaXRhdHNcbiAgICAgIGQzSXNQcmVzZW50OiBkM0lzUHJlc2VudFxuICAgICAgaGVyYjogaGVyYl9iaW9cbiAgICAgIGZpc2g6IGZpc2hfYmlvXG4gICAgICB0b3RhbDogdG90YWxfYmlvXG5cblxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cbiAgICBAcmVuZGVySGlzdG9WYWx1ZXMoaGVyYl9iaW8sIGFsbF9oZXJiX3ZhbHMsIFwiLmhlcmJfdml6XCIsIFwiIzY2Y2RhYVwiLFwiSGVyYml2b3JlIEJpb21hc3MgKGcvbV4yKVwiLCBcIkJpb21hc3MgUGVyIFRyYW5zZWN0XCIpXG4gICAgQHJlbmRlckhpc3RvVmFsdWVzKHRvdGFsX2JpbywgYWxsX3RvdGFsX3ZhbHVlcywgXCIudG90YWxfdml6XCIsIFwiI2ZhODA3MlwiLCBcIlRvdGFsIEJpb21hc3MgKGcvbV4yKVwiLCBcIkJpb21hc3MgUGVyIFRyYW5zZWN0XCIpXG4gICAgQHJlbmRlckhpc3RvVmFsdWVzKGZpc2hfYmlvLCBhbGxfZmlzaF92YWxzLCBcIi5maXNoX3ZpelwiLCBcIiM2ODk3YmJcIiwgXCJUb3RhbCBGaXNoIENvdW50XCIsIFwiTnVtYmVyIG9mIEZpc2ggU3BlY2llc1wiKVxuICAgIFxuXG4gIHJlbmRlckhpc3RvVmFsdWVzOiAoYmlvbWFzcywgaGlzdG9fdmFscywgZ3JhcGgsIGNvbG9yLCB4X2F4aXNfbGFiZWwsIGxlZ2VuZF9sYWJlbCkgPT5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIG1lYW4gPSBiaW9tYXNzLlNDT1JFXG4gICAgICBibWluID0gYmlvbWFzcy5NSU5cbiAgICAgIGJtYXggPSBiaW9tYXNzLk1BWFxuXG4gICAgICBsZW4gPSBoaXN0b192YWxzLmxlbmd0aFxuICAgICAgbWF4X2hpc3RvX3ZhbCA9IGhpc3RvX3ZhbHNbbGVuLTFdXG4gICAgICBxdWFudGlsZV9yYW5nZSA9IHtcIlEwXCI6XCJ2ZXJ5IGxvd1wiLCBcIlEyMFwiOiBcImxvd1wiLFwiUTQwXCI6IFwibWlkXCIsXCJRNjBcIjogXCJoaWdoXCIsXCJRODBcIjogXCJ2ZXJ5IGhpZ2hcIn1cbiAgICAgIHFfY29sb3JzID0gW1wiIzQ3YWU0M1wiLCBcIiM2YzBcIiwgXCIjZWUwXCIsIFwiI2ViNFwiLCBcIiNlY2JiODlcIiwgXCIjZWVhYmEwXCJdXG5cblxuICAgICAgbnVtX2JpbnMgPSAxMFxuICAgICAgYmluX3NpemUgPSAxMFxuICAgICAgXG4gICAgICBxdWFudGlsZXMgPSBbXVxuICAgICAgbWF4X2NvdW50X3ZhbCA9IDBcbiAgICAgIG51bV9pbl9iaW5zID0gTWF0aC5jZWlsKGxlbi9udW1fYmlucylcbiAgICAgIGluY3IgPSBtYXhfaGlzdG9fdmFsL251bV9iaW5zXG5cbiAgICAgIGZvciBpIGluIFswLi4ubnVtX2JpbnNdXG4gICAgICAgIFxuICAgICAgICBxX3N0YXJ0ID0gaSpiaW5fc2l6ZVxuICAgICAgICBxX2VuZCA9IHFfc3RhcnQrYmluX3NpemVcbiAgICAgICAgbWluID0gaSppbmNyXG4gICAgICAgIG1heCA9IG1pbitpbmNyXG4gICAgICAgIGNvdW50PTBcblxuICAgICAgICAjVE9ETzogbG9vayBmb3IgYSBtb3JlIGVmZmljaWVudCB3YXkgdG8gZG8gdGhpc1xuICAgICAgICBmb3IgaHYgaW4gaGlzdG9fdmFsc1xuICAgICAgICAgIGlmIGh2ID49IG1pbiBhbmQgaHYgPCBtYXhcbiAgICAgICAgICAgIGNvdW50Kz0xXG5cblxuICAgICAgICBtYXhfY291bnRfdmFsID0gTWF0aC5tYXgoY291bnQsIG1heF9jb3VudF92YWwpXG4gICAgICAgIFxuICAgICAgICB2YWwgPSB7XG4gICAgICAgICAgc3RhcnQ6IHFfc3RhcnRcbiAgICAgICAgICBlbmQ6IHFfZW5kXG4gICAgICAgICAgYmc6IHFfY29sb3JzW01hdGguZmxvb3IoaS8yKV1cbiAgICAgICAgICBiaW5fY291bnQ6IGNvdW50XG4gICAgICAgICAgYmluX21pbjogbWluXG4gICAgICAgICAgYmluX21heDogbWF4XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHF1YW50aWxlcy5wdXNoKHZhbClcblxuICAgIFxuICAgICAgQCQoZ3JhcGgpLmh0bWwoJycpXG4gICAgICBlbCA9IEAkKGdyYXBoKVswXSAgXG5cbiAgICAgICMgSGlzdG9ncmFtXG4gICAgICBtYXJnaW4gPSBcbiAgICAgICAgdG9wOiA0MFxuICAgICAgICByaWdodDogMjBcbiAgICAgICAgYm90dG9tOiA0MFxuICAgICAgICBsZWZ0OiA0NVxuXG4gICAgICB3aWR0aCA9IDQwMCAtIG1hcmdpbi5sZWZ0IC0gbWFyZ2luLnJpZ2h0XG4gICAgICBoZWlnaHQgPSAzNTAgLSBtYXJnaW4udG9wIC0gbWFyZ2luLmJvdHRvbVxuICAgICAgXG4gICAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4X2hpc3RvX3ZhbF0pXG4gICAgICAgIC5yYW5nZShbMCwgd2lkdGhdKVxuXG4gICAgICB5ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgICAgLnJhbmdlKFtoZWlnaHQsIDBdKVxuICAgICAgICAuZG9tYWluKFswLCBtYXhfY291bnRfdmFsXSlcblxuICAgICAgeEF4aXMgPSBkMy5zdmcuYXhpcygpXG4gICAgICAgIC5zY2FsZSh4KVxuICAgICAgICAub3JpZW50KFwiYm90dG9tXCIpXG5cbiAgICAgIHlBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeSlcbiAgICAgICAgLm9yaWVudChcImxlZnRcIilcblxuICAgICAgbWluX21heF9saW5lX3kgPSBtYXhfY291bnRfdmFsIC0gMjBcbiAgICAgIHN2ZyA9IGQzLnNlbGVjdChAJChncmFwaClbMF0pLmFwcGVuZChcInN2Z1wiKVxuICAgICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoICsgbWFyZ2luLmxlZnQgKyBtYXJnaW4ucmlnaHQpXG4gICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCArIG1hcmdpbi50b3AgKyBtYXJnaW4uYm90dG9tKVxuICAgICAgLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoI3ttYXJnaW4ubGVmdH0sICN7bWFyZ2luLnRvcH0pXCIpXG5cbiAgICAgIHN2Zy5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoMCwje2hlaWdodH0pXCIpXG4gICAgICAgIC5jYWxsKHhBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIHdpZHRoIC8gMilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIDApXG4gICAgICAgIC5hdHRyKFwiZHlcIiwgXCIzZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJtaWRkbGVcIilcbiAgICAgICAgLnRleHQoeF9heGlzX2xhYmVsKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieSBheGlzXCIpXG4gICAgICAgIC5jYWxsKHlBeGlzKVxuICAgICAgLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ5XCIsIC00MClcbiAgICAgICAgLmF0dHIoXCJ4XCIsIC04MClcbiAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoLTkwKVwiKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiLjcxZW1cIilcbiAgICAgICAgLnN0eWxlKFwidGV4dC1hbmNob3JcIiwgXCJlbmRcIilcbiAgICAgICAgLnRleHQobGVnZW5kX2xhYmVsKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuYmFyXCIpXG4gICAgICAgICAgLmRhdGEocXVhbnRpbGVzKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJyZWN0XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImJhclwiKVxuICAgICAgICAgIC5hdHRyKFwieFwiLCAoZCwgaSkgLT4geChkLmJpbl9taW4pKVxuICAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgKGQpIC0+IHdpZHRoL251bV9iaW5zKVxuICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4geShkLmJpbl9jb3VudCkpXG4gICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgKGQpIC0+IGhlaWdodCAtIHkoZC5iaW5fY291bnQpKVxuICAgICAgICAgIC5zdHlsZSAnZmlsbCcsIChkKSAtPiBjb2xvclxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDkpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSA5KSArICdweCcpXG4gICAgICAgIC50ZXh0KFwi4pa8XCIpXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIuc2NvcmVUZXh0XCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQobWVhbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZVRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDIyICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAyMikgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCJNZWFuOiBcIitkKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWluU2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1pbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDYpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1pbildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtaW4pXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWluU2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSAyMSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMTIpICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiTWluOiBcIitkKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWF4U2NvcmVMaW5lXCIpXG4gICAgICAgICAgLmRhdGEoW01hdGgucm91bmQoYm1heCldKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDE4KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+ICh4KGQpKyAncHgnKSlcbiAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4gaGVpZ2h0ICsgJ3B4JylcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtNYXRoLnJvdW5kKGJtYXgpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwibWF4U2NvcmVcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeCgoZCkpIC0gNiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMTgpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbTWF0aC5yb3VuZChibWF4KV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1heFNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gMzAgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDMwKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIk1heDogXCIrZClcblxuICAgICAgXG4gICAgICBpZiBncmFwaCA9PSBcIi5oZXJiX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwiaGVyYi1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+QmlvbWFzcyBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgIGlmIGdyYXBoID09IFwiLmZpc2hfdml6XCJcbiAgICAgICAgQCQoZ3JhcGgpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gY2xhc3M9XCJmaXNoLXN3YXRjaFwiPiZuYnNwOzwvc3Bhbj5GaXNoIENvdW50IGluIFJlZ2lvbjwvZGl2PjxkaXYgY2xhc3M9XCJsZWdlbmQtc2tldGNoLXZhbHVlc1wiPuKWvCBTa2V0Y2ggVmFsdWVzPC9kaXY+PC9kaXY+J1xuICAgICAgaWYgZ3JhcGggPT0gXCIudG90YWxfdml6XCJcbiAgICAgICAgQCQoZ3JhcGgpLmFwcGVuZCAnPGRpdiBjbGFzcz1cImxlZ2VuZHNcIj48ZGl2IGNsYXNzPVwibGVnZW5kXCI+PHNwYW4gY2xhc3M9XCJ0b3RhbC1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+QmlvbWFzcyBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgICBcbiAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxiciBzdHlsZT1cImNsZWFyOmJvdGg7XCI+J1xuXG4gIGdldEFsbFZhbHVlczogKGFsbF9zdHIpID0+XG4gICAgdHJ5XG4gICAgICBhbGxfdmFscyA9IGFsbF9zdHIuc3Vic3RyaW5nKDEsIGFsbF9zdHIubGVuZ3RoIC0gMSlcbiAgICAgIGFsbF92YWxzID0gYWxsX3ZhbHMuc3BsaXQoXCIsIFwiKVxuICAgICAgc29ydGVkX3ZhbHMgPSBfLnNvcnRCeSBhbGxfdmFscywgKGQpIC0+ICBwYXJzZUZsb2F0KGQpXG4gICAgICByZXR1cm4gc29ydGVkX3ZhbHNcbiAgICBjYXRjaCBlXG4gICAgICByZXR1cm4gW11cbiAgICBcblxuICByb3VuZFZhbHM6IChkKSA9PiAgICBcbiAgICBkLk1FQU4gPSBwYXJzZUZsb2F0KGQuTUVBTikudG9GaXhlZCgxKVxuICAgIGQuTUFYID0gcGFyc2VGbG9hdChkLk1BWCkudG9GaXhlZCgxKVxuICAgIGQuTUlOID0gcGFyc2VGbG9hdChkLk1JTikudG9GaXhlZCgxKVxuXG4gIHJvdW5kRGF0YTogKGRhdGEpID0+XG4gICAgZm9yIGQgaW4gZGF0YVxuICAgICAgaWYgZC5BUkVBX1NRS00gPCAwLjEgYW5kIGQuQVJFQV9TUUtNID4gMC4wMDAwMVxuICAgICAgICBkLkFSRUFfU1FLTSA9IFwiPCAwLjEgXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZC5BUkVBX1NRS00gPSBwYXJzZUZsb2F0KGQuQVJFQV9TUUtNKS50b0ZpeGVkKDEpXG5cbm1vZHVsZS5leHBvcnRzID0gRW52aXJvbm1lbnRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuZDMgPSB3aW5kb3cuZDNcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnU2l6ZUFuZENvbm5lY3Rpdml0eSdcbiAgICAnRGl2ZUFuZEZpc2hpbmdWYWx1ZSdcbiAgICAnRGlzdGFuY2UnXG4gIF1cbiAgcmVuZGVyOiAoKSAtPlxuXG4gICAgIyBjcmVhdGUgcmFuZG9tIGRhdGEgZm9yIHZpc3VhbGl6YXRpb25cbiAgICBzaXplID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdTaXplJykudG9BcnJheSgpWzBdXG5cbiAgICBjb25uZWN0aXZpdHkgPSBAcmVjb3JkU2V0KCdTaXplQW5kQ29ubmVjdGl2aXR5JywgJ0Nvbm5lY3Rpdml0eScpLnRvQXJyYXkoKVxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKVxuXG4gICAgZGZ2ID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdGaXNoaW5nVmFsdWUnKS50b0FycmF5KClbMF1cbiAgICBkZHYgPSBAcmVjb3JkU2V0KCdEaXZlQW5kRmlzaGluZ1ZhbHVlJywgJ0RpdmVWYWx1ZScpLnRvQXJyYXkoKVswXVxuICAgIFxuXG4gICAgaWYgZGZ2XG4gICAgICBpZiBkZnYuUEVSQ0VOVCA8IDAuMDFcbiAgICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBcIjwgMC4wMVwiXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlID0gcGFyc2VGbG9hdChkZnYuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlID0gXCJ1bmtub3duXCJcblxuICAgIGlmIGRkdlxuICAgICAgaWYgZGR2LlBFUkNFTlQgPCAwLjAxXG4gICAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gXCI8IDAuMDFcIlxuICAgICAgZWxzZVxuICAgICAgICBkaXNwbGFjZWRfZGl2ZV92YWx1ZSA9IHBhcnNlRmxvYXQoZGR2LlBFUkNFTlQpLnRvRml4ZWQoMilcbiAgICBlbHNlXG4gICAgICBkaXNwbGFjZWRfZGl2ZV92YWx1ZSA9IFwidW5rbm93blwiXG5cbiAgICBtaW5EaXN0S00gPSBAcmVjb3JkU2V0KCdEaXN0YW5jZScsICdEaXN0YW5jZScpLnRvQXJyYXkoKVswXVxuICAgIGlmIG1pbkRpc3RLTVxuICAgICAgbWluRGlzdEtNID0gcGFyc2VGbG9hdChtaW5EaXN0S00uTWF4RGlzdCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIG1pbkRpc3RLTSA9IFwiVW5rbm93blwiXG4gICAgIyBzZXR1cCBjb250ZXh0IG9iamVjdCB3aXRoIGRhdGEgYW5kIHJlbmRlciB0aGUgdGVtcGxhdGUgZnJvbSBpdFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgaXNDb2xsZWN0aW9uOiBpc0NvbGxlY3Rpb25cbiAgICAgIHNpemU6IHNpemVcbiAgICAgIGNvbm5lY3Rpdml0eTogY29ubmVjdGl2aXR5XG4gICAgICBcbiAgICAgIGRpc3BsYWNlZF9maXNoaW5nX3ZhbHVlOiBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZVxuICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWU6IGRpc3BsYWNlZF9kaXZlX3ZhbHVlXG4gICAgXG4gICAgICBtaW5EaXN0S006IG1pbkRpc3RLTVxuICAgIEAkZWwuaHRtbCBAdGVtcGxhdGUucmVuZGVyKGNvbnRleHQsIHRlbXBsYXRlcylcbiAgICBAZW5hYmxlTGF5ZXJUb2dnbGVycygpXG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE92ZXJ2aWV3VGFiIiwiT3ZlcnZpZXdUYWIgPSByZXF1aXJlICcuL292ZXJ2aWV3LmNvZmZlZSdcblRyYWRlb2Zmc1RhYiA9IHJlcXVpcmUgJy4vdHJhZGVvZmZzLmNvZmZlZSdcbkVudmlyb25tZW50VGFiID0gcmVxdWlyZSAnLi9lbnZpcm9ubWVudC5jb2ZmZWUnXG5cbndpbmRvdy5hcHAucmVnaXN0ZXJSZXBvcnQgKHJlcG9ydCkgLT5cbiAgcmVwb3J0LnRhYnMgW092ZXJ2aWV3VGFiLCBFbnZpcm9ubWVudFRhYiwgVHJhZGVvZmZzVGFiXVxuICAjIHBhdGggbXVzdCBiZSByZWxhdGl2ZSB0byBkaXN0L1xuICByZXBvcnQuc3R5bGVzaGVldHMgWycuL3JlcG9ydC5jc3MnXVxuIiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcbmQzID0gd2luZG93LmQzXG5fcGFydGlhbHMgPSByZXF1aXJlICdhcGkvdGVtcGxhdGVzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgVHJhZGVvZmZzVGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdUcmFkZW9mZnMnXG4gIGNsYXNzTmFtZTogJ3RyYWRlb2ZmcydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy50cmFkZW9mZnNcbiAgZGVwZW5kZW5jaWVzOlsgXG4gICAgJ01vbnRzZXJyYXRUcmFkZW9mZkFuYWx5c2lzJ1xuICBdXG5cbiAgcmVuZGVyOiAoKSAtPlxuICAgIHRyYWRlb2ZmX2RhdGEgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0VHJhZGVvZmZBbmFseXNpcycsICdTY29yZXMnKS50b0FycmF5KClcbiAgICBAcm91bmREYXRhIHRyYWRlb2ZmX2RhdGFcblxuICAgIHRyYWRlb2ZmcyA9IFsnRmlzaGluZyBhbmQgRGl2aW5nJ11cbiAgICBcbiAgICBmaXNoaW5nX3ZhbHMgPSAoaXRlbS5GaXNoaW5nIGZvciBpdGVtIGluIHRyYWRlb2ZmX2RhdGEpXG4gICAgZGl2aW5nX3ZhbHMgPSAoaXRlbS5EaXZpbmcgZm9yIGl0ZW0gaW4gdHJhZGVvZmZfZGF0YSlcblxuICAgIGZpc2hpbmdfbWluID0gTWF0aC5taW4gZmlzaGluZ192YWxzXG4gICAgZmlzaGluZ19tYXggPSBNYXRoLm1heCBmaXNoaW5nX3ZhbHNcblxuICAgIGRpdmluZ19taW4gPSBNYXRoLm1pbiBkaXZpbmdfdmFsc1xuICAgIGRpdmluZ19tYXggPSBNYXRoLm1heCBkaXZpbmdfdmFsc1xuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKSAgIFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgdHJhZGVvZmZzOiB0cmFkZW9mZnNcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAJCgnLmNob3NlbicpLmNob3Nlbih7ZGlzYWJsZV9zZWFyY2hfdGhyZXNob2xkOiAxMCwgd2lkdGg6JzM4MHB4J30pXG4gICAgQCQoJy5jaG9zZW4nKS5jaGFuZ2UgKCkgPT5cbiAgICAgIF8uZGVmZXIgQHJlbmRlclRyYWRlb2Zmc1xuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCh0cmFkZW9mZl9kYXRhLCAnLmZpc2hpbmctdi1kaXZpbmcnLCBcIlZhbHVlIG9mIEZpc2hpbmdcIiwgXG4gICAgICAgIFwiVmFsdWUgb2YgRGl2aW5nXCIsIFwiRmlzaGluZ1wiLCBcIkRpdmluZ1wiLCBmaXNoaW5nX21pbiwgZmlzaGluZ19tYXgsIGRpdmluZ19taW4sIGRpdmluZ19tYXgpXG5cbiAgc2V0dXBTY2F0dGVyUGxvdDogKHRyYWRlb2ZmX2RhdGEsIGNoYXJ0X25hbWUsIHhsYWIsIHlsYWIsIG1vdXNlWFByb3AsIG1vdXNlWVByb3AsIGZpc2hpbmdNaW4sIGZpc2hpbmdNYXgsIGRpdmluZ01pbiwgZGl2aW5nTWF4KSA9PlxuICAgICAgaCA9IDM4MFxuICAgICAgdyA9IDM4MFxuICAgICAgbWFyZ2luID0ge2xlZnQ6NDAsIHRvcDo1LCByaWdodDo0MCwgYm90dG9tOiA0MCwgaW5uZXI6NX1cbiAgICAgIGhhbGZoID0gKGgrbWFyZ2luLnRvcCttYXJnaW4uYm90dG9tKVxuICAgICAgdG90YWxoID0gaGFsZmgqMlxuICAgICAgaGFsZncgPSAodyttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICB0b3RhbHcgPSBoYWxmdyoyXG5cbiAgICAgICNtYWtlIHN1cmUgaXRzIEBzY2F0dGVycGxvdCB0byBwYXNzIGluIHRoZSByaWdodCBjb250ZXh0ICh0YWIpIGZvciBkM1xuICAgICAgdGhlY2hhcnQgPSBAc2NhdHRlcnBsb3QoY2hhcnRfbmFtZSwgbW91c2VYUHJvcCwgbW91c2VZUHJvcCwgZmlzaGluZ01pbiwgZmlzaGluZ01heCwgZGl2aW5nTWluLCBkaXZpbmdNYXgpLnh2YXIoMClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnl2YXIoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnhsYWIoeGxhYilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnlsYWIoeWxhYilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmhlaWdodChoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAud2lkdGgodylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcmdpbihtYXJnaW4pXG5cbiAgICAgIGNoID0gZDMuc2VsZWN0KEAkKGNoYXJ0X25hbWUpKVxuICAgICAgY2guZGF0dW0odHJhZGVvZmZfZGF0YSlcbiAgICAgICAgLmNhbGwodGhlY2hhcnQpXG4gICAgICBcbiAgICAgIHRvb2x0aXAgPSBkMy5zZWxlY3QoXCJib2R5XCIpXG4gICAgICAgIC5hcHBlbmQoXCJkaXZcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcImNoYXJ0LXRvb2x0aXBcIilcbiAgICAgICAgLmF0dHIoXCJpZFwiLCBcImNoYXJ0LXRvb2x0aXBcIilcbiAgICAgICAgLnRleHQoXCJkYXRhXCIpXG5cbiAgICAgXG4gICAgICB2ZXJ0aWNhbFJ1bGUgPSBkMy5zZWxlY3QoXCJib2R5XCIpXG4gICAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJ2ZXJ0aWNhbFJ1bGVcIilcbiAgICAgICAgICAuc3R5bGUoXCJwb3NpdGlvblwiLCBcImFic29sdXRlXCIpXG4gICAgICAgICAgLnN0eWxlKFwiei1pbmRleFwiLCBcIjE5XCIpXG4gICAgICAgICAgLnN0eWxlKFwid2lkdGhcIiwgXCIxcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJoZWlnaHRcIiwgXCIyNTBweFwiKVxuICAgICAgICAgIC5zdHlsZShcInRvcFwiLCBcIjEwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJib3R0b21cIiwgXCIzMHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwibGVmdFwiLCBcIjBweFwiKVxuICAgICAgICAgIC5zdHlsZShcImJhY2tncm91bmRcIiwgXCJibGFja1wiKTtcblxuICAgICAgdGhlY2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdmVyXCIsIChkKSAtPiBcblxuICAgICAgICAgIHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIikuaHRtbChcIjx1bD48c3Ryb25nPlByb3Bvc2FsOiBcIit3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUrXCI8L3N0cm9uZz48bGk+XCIreGxhYitcIjogXCIrZFttb3VzZVhQcm9wXStcIjwvbGk+PGxpPiBcIit5bGFiK1wiOiBcIitkW21vdXNlWVByb3BdK1wiPC9saT48L3VsPlwiKVxuICAgICAgICBcbiAgICAgIHRoZWNoYXJ0LnBvaW50c1NlbGVjdCgpXG5cbiAgICAgICAgLm9uIFwibW91c2Vtb3ZlXCIsIChkKSAtPiBcbiAgICAgICAgICByZXR1cm4gdG9vbHRpcC5zdHlsZShcInRvcFwiLCAoZXZlbnQucGFnZVktMTApK1wicHhcIikuc3R5bGUoXCJsZWZ0XCIsKGNhbGNfdHRpcChldmVudC5wYWdlWCwgZCwgdG9vbHRpcCkpK1wicHhcIilcbiAgICAgIFxuICAgICAgdGhlY2hhcnQucG9pbnRzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdXRcIiwgKGQpIC0+IFxuICAgICAgICAgIHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKVxuICAgICAgdGhlY2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdmVyXCIsIChkKSAtPiByZXR1cm4gdG9vbHRpcC5zdHlsZShcInZpc2liaWxpdHlcIiwgXCJ2aXNpYmxlXCIpLmh0bWwoXCI8dWw+PHN0cm9uZz5Qcm9wb3NhbDogXCIrd2luZG93LmFwcC5za2V0Y2hlcy5nZXQoZC5QUk9QT1NBTCkuYXR0cmlidXRlcy5uYW1lK1wiPC9zdHJvbmc+PGxpPiBcIit4bGFiK1wiOiBcIitkW21vdXNlWFByb3BdK1wiPC9saT48bGk+IFwiK3lsYWIrXCI6IFwiK2RbbW91c2VZUHJvcF0rXCI8L2xpPjwvdWw+XCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuICAgICAgdGhlY2hhcnQubGFiZWxzU2VsZWN0KClcbiAgICAgICAgLm9uIFwibW91c2VvdXRcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKVxuXG5cbiAgcmVuZGVyVHJhZGVvZmZzOiAoKSA9PlxuICAgIG5hbWUgPSBAJCgnLmNob3NlbicpLnZhbCgpXG4gICAgaWYgbmFtZSA9PSBcIkZpc2hpbmcgYW5kIERpdmluZ1wiXG4gICAgICBAJCgnLmZ2ZF9jb250YWluZXInKS5zaG93KClcblxuXG4gIGNhbGNfdHRpcCA9ICh4bG9jLCBkYXRhLCB0b29sdGlwKSAtPlxuICAgIHRkaXYgPSB0b29sdGlwWzBdWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdGxlZnQgPSB0ZGl2LmxlZnRcbiAgICB0dyA9IHRkaXYud2lkdGhcbiAgICByZXR1cm4geGxvYy0odHcrMTApIGlmICh4bG9jK3R3ID4gdGxlZnQrdHcpXG4gICAgcmV0dXJuIHhsb2MrMTBcblxuXG4gIHNjYXR0ZXJwbG90OiAoY2hhcnRfbmFtZSwgeHZhbCwgeXZhbCwgZmlzaGluZ01pbiwgZmlzaGluZ01heCwgZGl2aW5nTWluLCBkaXZpbmdNYXgpID0+XG4gICAgdmlldyA9IEBcbiAgICB3aWR0aCA9IDM4MFxuICAgIGhlaWdodCA9IDYwMFxuICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgYXhpc3BvcyA9IHt4dGl0bGU6MjUsIHl0aXRsZTozMCwgeGxhYmVsOjUsIHlsYWJlbDoxfVxuICAgIHhsaW0gPSBudWxsXG4gICAgeWxpbSA9IG51bGxcbiAgICBueHRpY2tzID0gNVxuICAgIHh0aWNrcyA9IG51bGxcbiAgICBueXRpY2tzID0gNVxuICAgIHl0aWNrcyA9IG51bGxcbiAgICBcbiAgICByZWN0Y29sb3IgPSBcIndoaXRlXCJcbiAgICBwb2ludHNpemUgPSA1ICMgZGVmYXVsdCA9IG5vIHZpc2libGUgcG9pbnRzIGF0IG1hcmtlcnNcbiAgICB4bGFiID0gXCJYXCJcbiAgICB5bGFiID0gXCJZIHNjb3JlXCJcbiAgICB5c2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIHhzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgbGVnZW5kaGVpZ2h0ID0gMzAwXG4gICAgcG9pbnRzU2VsZWN0ID0gbnVsbFxuICAgIGxhYmVsc1NlbGVjdCA9IG51bGxcbiAgICBsZWdlbmRTZWxlY3QgPSBudWxsXG4gICAgdmVydGljYWxSdWxlID0gbnVsbFxuICAgIGhvcml6b250YWxSdWxlID0gbnVsbFxuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICAjY2xlYXIgb3V0IHRoZSBvbGQgdmFsdWVzXG4gICAgICB2aWV3LiQoY2hhcnRfbmFtZSkuaHRtbCgnJylcbiAgICAgIGVsID0gdmlldy4kKGNoYXJ0X25hbWUpWzBdXG5cbiAgICAjIyB0aGUgbWFpbiBmdW5jdGlvblxuICAgIGNoYXJ0ID0gKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5lYWNoIChkYXRhKSAtPlxuICAgICAgICB4ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZFt4dmFsXSlcbiAgICAgICAgeSA9IGRhdGEubWFwIChkKSAtPiBwYXJzZUZsb2F0KGRbeXZhbF0pXG5cbiAgICAgICAgcGFuZWxvZmZzZXQgPSAwXG4gICAgICAgIHBhbmVsd2lkdGggPSB3aWR0aFxuICAgICAgICBwYW5lbGhlaWdodCA9IGhlaWdodFxuXG4gICAgICAgIHhsaW0gPSBbZDMubWluKHgpLTAuMjUsIHBhcnNlRmxvYXQoZDMubWF4KHgpKzAuMjUpXSBpZiAhKHhsaW0/KVxuICAgICAgICB5bGltID0gW2QzLm1pbih5KS0wLjI1LCBwYXJzZUZsb2F0KGQzLm1heCh5KSswLjI1KV0gaWYgISh5bGltPylcblxuICAgICAgICAjIEknbGwgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyBzb21ldGhpbmcgc21hbGxlciB0aGFuIHdoYXQncyBvYnNlcnZlZFxuICAgICAgICBuYV92YWx1ZSA9IGQzLm1pbih4LmNvbmNhdCB5KSAtIDEwMFxuICAgICAgICBjdXJyZWxlbSA9IGQzLnNlbGVjdCh2aWV3LiQoY2hhcnRfbmFtZSlbMF0pXG4gICAgICAgIHN2ZyA9IGQzLnNlbGVjdCh2aWV3LiQoY2hhcnRfbmFtZSlbMF0pLmFwcGVuZChcInN2Z1wiKS5kYXRhKFtkYXRhXSlcbiAgICAgICAgc3ZnLmFwcGVuZChcImdcIilcblxuICAgICAgICAjIFVwZGF0ZSB0aGUgb3V0ZXIgZGltZW5zaW9ucy5cbiAgICAgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20rZGF0YS5sZW5ndGgqMzUpXG4gICAgICAgIGcgPSBzdmcuc2VsZWN0KFwiZ1wiKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgLmF0dHIoXCJ4XCIsIHBhbmVsb2Zmc2V0K21hcmdpbi5sZWZ0KVxuICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCByZWN0Y29sb3IpXG4gICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIm5vbmVcIilcblxuXG4gICAgICAgICMgc2ltcGxlIHNjYWxlcyAoaWdub3JlIE5BIGJ1c2luZXNzKVxuICAgICAgICB4cmFuZ2UgPSBbbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrbWFyZ2luLmlubmVyLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldCtwYW5lbHdpZHRoLW1hcmdpbi5pbm5lcl1cbiAgICAgICAgeXJhbmdlID0gW21hcmdpbi50b3ArcGFuZWxoZWlnaHQtbWFyZ2luLmlubmVyLCBtYXJnaW4udG9wK21hcmdpbi5pbm5lcl1cbiAgICAgICAgeHNjYWxlLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzY2FsZS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuICAgICAgICB4cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcblxuICAgICAgICAjIGlmIHl0aWNrcyBub3QgcHJvdmlkZWQsIHVzZSBueXRpY2tzIHRvIGNob29zZSBwcmV0dHkgb25lc1xuICAgICAgICB5dGlja3MgPSB5cy50aWNrcyhueXRpY2tzKSBpZiAhKHl0aWNrcz8pXG4gICAgICAgIHh0aWNrcyA9IHhzLnRpY2tzKG54dGlja3MpIGlmICEoeHRpY2tzPylcblxuICAgICAgICAjIHgtYXhpc1xuICAgICAgICB4YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgbWFyZ2luLnRvcCtoZWlnaHQpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueGxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHh0aWNrcykoZCkpXG4gICAgICAgIHhheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwieGF4aXMtdGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrd2lkdGgvMilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeGxhYilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4gbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKzYpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGkgJSAxN1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnModmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcblxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmQtdGV4dFwiKVxuXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmdpbi5sZWZ0KzIwKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IHJldHVybiB3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUpXG4gICAgICAgICMgeS1heGlzXG4gICAgICAgIHlheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgbWFyZ2luLmxlZnQrd2lkdGgpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueWxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHl0aWNrcykoZCkpXG4gICAgICAgIHlheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcC04KyhoZWlnaHQvMikpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueXRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHlsYWIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMjcwLCN7bWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGV9LCN7bWFyZ2luLnRvcCtoZWlnaHQvMn0pXCIpXG5cblxuICAgICAgICBsYWJlbHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwibGFiZWxzXCIpXG4gICAgICAgIGxhYmVsc1NlbGVjdCA9XG4gICAgICAgICAgbGFiZWxzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLnRleHQoKGQpLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHhwb3MgPSB4c2NhbGUoeFtpXSlcbiAgICAgICAgICAgICAgICAgIHN0cmluZ19lbmQgPSB4cG9zK3RoaXMuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKClcbiAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0geHBvcy0odGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSs1KVxuICAgICAgICAgICAgICAgICAgaWYgb3ZlcmxhcF94c3RhcnQgPCA1MFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwX3hzdGFydCA9IDUwXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3ZlcmxhcF94c3RhcnQgaWYgc3RyaW5nX2VuZCA+IHdpZHRoXG4gICAgICAgICAgICAgICAgICByZXR1cm4geHBvcys1XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICB5cG9zID0geXNjYWxlKHlbaV0pXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcysxMCBpZiAoeXBvcyA8IDUwKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHlwb3MtNVxuICAgICAgICAgICAgICAgICAgKVxuXG5cbiAgICAgICAgcG9pbnRzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJpZFwiLCBcInBvaW50c1wiKVxuICAgICAgICBwb2ludHNTZWxlY3QgPVxuICAgICAgICAgIHBvaW50cy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiB4c2NhbGUoeFtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiB5c2NhbGUoeVtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKFt2YWxdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxIGlmICh4W2ldPyBvciB4TkEuaGFuZGxlKSBhbmQgKHlbaV0/IG9yIHlOQS5oYW5kbGUpXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMClcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldClcbiAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgICBcblxuICAgICMjIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyc1xuICAgIGNoYXJ0LndpZHRoID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHdpZHRoIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aWR0aCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuaGVpZ2h0ID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGhlaWdodCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgaGVpZ2h0ID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5tYXJnaW4gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbWFyZ2luIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBtYXJnaW4gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmF4aXNwb3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gYXhpc3BvcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgYXhpc3BvcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG54dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG54dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG55dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG55dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucmVjdGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHJlY3Rjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcmVjdGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c2l6ZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHNpemUgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c2l6ZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzdHJva2UgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzdHJva2UgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c3Ryb2tlID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geXNjYWxlXG5cbiAgICBjaGFydC54c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHhzY2FsZVxuXG4gICAgY2hhcnQucG9pbnRzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBwb2ludHNTZWxlY3RcblxuICAgIGNoYXJ0LmxhYmVsc1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGFiZWxzU2VsZWN0XG5cbiAgICBjaGFydC5sZWdlbmRTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxlZ2VuZFNlbGVjdFxuXG4gICAgY2hhcnQudmVydGljYWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB2ZXJ0aWNhbFJ1bGVcblxuICAgIGNoYXJ0Lmhvcml6b250YWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiBob3Jpem9udGFsUnVsZVxuXG4gICAgIyByZXR1cm4gdGhlIGNoYXJ0IGZ1bmN0aW9uXG4gICAgY2hhcnRcblxuICByb3VuZERhdGE6IChkYXRhKSA9PiBcbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBkLkZpc2hpbmcgPSBwYXJzZUZsb2F0KGQuRmlzaGluZykudG9GaXhlZCgyKVxuICAgICAgZC5EaXZpbmcgPSBwYXJzZUZsb2F0KGQuRGl2aW5nKS50b0ZpeGVkKDIpXG5cbiAgZ2V0Q29sb3JzID0gKGkpIC0+XG4gICAgY29sb3JzID0gW1wiTGlnaHRHcmVlblwiLCBcIkxpZ2h0UGlua1wiLCBcIkxpZ2h0U2t5Qmx1ZVwiLCBcIk1vY2Nhc2luXCIsIFwiQmx1ZVZpb2xldFwiLCBcIkdhaW5zYm9yb1wiLCBcIkRhcmtHcmVlblwiLCBcIkRhcmtUdXJxdW9pc2VcIiwgXCJtYXJvb25cIiwgXCJuYXZ5XCIsIFwiTGVtb25DaGlmZm9uXCIsIFwib3JhbmdlXCIsICBcInJlZFwiLCBcInNpbHZlclwiLCBcInRlYWxcIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdXG4gICAgcmV0dXJuIGNvbG9yc1tpXVxuXG4gIGdldFN0cm9rZUNvbG9yID0gKGkpIC0+XG4gICAgc2NvbG9ycyA9IFtcImJsYWNrXCIsIFwid2hpdGVcIiwgXCJncmF5XCIsIFwiYnJvd25cIiwgXCJOYXZ5XCJdXG4gICAgcmV0dXJuIHNjb2xvcnNbaV1cblxuICAjIGZ1bmN0aW9uIHRvIGRldGVybWluZSByb3VuZGluZyBvZiBheGlzIGxhYmVsc1xuICBmb3JtYXRBeGlzID0gKGQpIC0+XG4gICAgZCA9IGRbMV0gLSBkWzBdXG4gICAgbmRpZyA9IE1hdGguZmxvb3IoIE1hdGgubG9nKGQgJSAxMCkgLyBNYXRoLmxvZygxMCkgKVxuICAgIG5kaWcgPSAwIGlmIG5kaWcgPiAwXG4gICAgbmRpZyA9IE1hdGguYWJzKG5kaWcpXG4gICAgZDMuZm9ybWF0KFwiLiN7bmRpZ31mXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVHJhZGVvZmZzVGFiIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+QmVudGhpYyBIYWJpdGF0cyA8YSBocmVmPVxcXCIjXFxcIiBkYXRhLXRvZ2dsZS1ub2RlPVxcXCI1ODA3OWRkNWExZWMzNmY1NTk1ZmIyYjBcXFwiIGRhdGEtdmlzaWJsZT1cXFwiZmFsc2VcXFwiPnNob3cgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIFRoZSBiZWxvdyB0YWJsZSBkZXNjcmliZXMgdGhlIG92ZXJsYXAgb2YgeW91ciBwbGFuIHdpdGggdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LiBUaGUgTU5JIDIwMTYgYmVudGhpYyBoYWJpdGF0IG1hcCB3YXMgZGlnaXRpemVkIGJ5IGhhbmQgdXNpbmcgYSBjb21iaW5hdGlvbiBvZiBpbiBzaXR1IG9ic2VydmF0aW9ucyBvbiBzY3ViYS9mcmVlIGRpdmUgYXQgc3VydmV5IHNpdGVzIChuID0gYXBwcm94LiA2MDApIGFuZCBkcm9wIGNhbWVyYSBkZXBsb3ltZW50cyAobiA9IDM0MykgYXMgcGFydCBvZiB0aGUgV2FpdHQgSW5zdGl0dXRlIFNjaWVudGlmaWMgQXNzZXNzbWVudC4gUHJlbGltaW5hcnkgY29udGV4dCBmb3IgbWFwcGluZyB3YXMgZ2xlYW5lZCBmcm9tIGJlbnRoaWMgbWFwcyBkZXBpY3RlZCBpbiBXaWxkIGV0LiBhbCAyMDA3IGFuZCBJUkYgMTk5My4gVGhlc2UgbWFwcyBwcm92aWRlZCB2YWx1YWJsZSBpbnNpZ2h0IGludG8gZG9taW5hbnQgYmVudGhpYyBmZWF0dXJlcyBhbmQgdGhlIGludGVycHJldGF0aW9uIG9mIHNpdGUgb2JzZXJ2YXRpb25zLiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjIyNXB4O1xcXCI+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFyZWEgKHNxLiBrbS4pPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+QXJlYSAoJSBvZiBUb3RhbCk8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsMTA3NCwxMjE1LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFSRUFfU1FLTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5CaW9tYXNzPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgVGhlc2UgY2hhcnRzIHNob3cgdGhlIG1pbmltdW0sIG1lYW4gYW5kIG1heGltdW0gYmlvbWFzcyB2YWx1ZSB0YWtlbiB3aXRoaW4geW91ciBza2V0Y2hlZCB6b25lLCBpbiByZWxhdGlvbiB0byB0aGUgZGlzdHJpYnV0aW9uIG9mIGJpb21hc3MgbWVhc3VyZWQgYXJvdW5kIHRoZSBpc2xhbmQuIEJpb21hc3Mgd2FzIGNhbGN1bGF0ZWQgZm9yIEhlcmJpdm9yZXMgYW5kIEFsbCBTcGVjaWVzIGF0IHJlZ3VsYXIgcG9pbnRzIGFsb25nIE1vbnRzZXJyYXQncyBjb2FzdC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwwLDE2MjcsMTg1NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPGRpdiBjbGFzcz1cXFwiaW4tcmVwb3J0LWhlYWRlclxcXCI+SGVyYml2b3JlIEJpb21hc3M8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJoZXJiX3ZpelxcXCIgY2xhc3M9XFxcImhlcmJfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5BbGwgU3BlY2llcyBCaW9tYXNzPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGRpdiBpZD1cXFwidG90YWxfdml6XFxcIiBjbGFzcz1cXFwidG90YWxfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjUwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NZWFuPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWluaW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1heGltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGVyYlwiLGMscCwxKSxjLHAsMCwyMTQ5LDIzMzksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5IZXJiaXZvcmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLk1JTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiaGVyYi5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwidG90YWxcIixjLHAsMSksYyxwLDAsMjM2OSwyNTU4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+VG90YWxzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJ0b3RhbC5TQ09SRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwidG90YWwuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJ0b3RhbC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8aDQ+RmlzaCBBYnVuZGFuY2U8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICBUaGVzZSBjaGFydHMgc2hvdyB0aGUgbWluaW11bSwgbWVhbiBhbmQgbWF4aW11bSBmaXNoIGFidW5kYW5jZSB2YWx1ZSB0YWtlbiB3aXRoaW4geW91ciBza2V0Y2hlZCB6b25lLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDAsMjgzMiwyODg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2IGlkPVxcXCJmaXNoX3ZpelxcXCIgY2xhc3M9XFxcImZpc2hfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjUwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5NZWFuPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGg+TWluaW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPk1heGltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaFwiLGMscCwxKSxjLHAsMCwzMTgxLDMzNzEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5IZXJiaXZvcmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJmaXNoLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJmaXNoLk1JTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiZmlzaC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wib3ZlcnZpZXdcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5TaXplPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNzYsODYsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ6b25lXCIpO307Xy5iKFwiIGlzIDxzdHJvbmc+XCIpO18uYihfLnYoXy5kKFwic2l6ZS5TSVpFX1NRS01cIixjLHAsMCkpKTtfLmIoXCIgc3EuIGttPC9zdHJvbmc+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RGlzdGFuY2UgZnJvbSBQb3J0IExpdHRsZSBCYXk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZSBmYXJ0aGVzdCBwb2ludCBpbiB0aGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzMwLDM0MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInpvbmVcIik7fTtfLmIoXCIgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtaW5EaXN0S01cIixjLHAsMCkpKTtfLmIoXCIga208L3N0cm9uZz4gKG92ZXIgd2F0ZXIpIGZyb20gdGhlIFBvcnQgTGl0dGxlIEJheS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU3ZTJjMzNiZWIyNzViYmExZWM2ZmQ0NFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoZWF0bWFwIGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDY3MSw2ODEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2hcIik7fTtfLmIoXCIgb3ZlcmxhcHMgd2l0aCBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWVcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSB0b3RhbCBmaXNoaW5nIHZhbHVlIHdpdGhpbiBDdXJhY2FvJ3Mgd2F0ZXJzLCBiYXNlZCBvbiB0aGUgdXNlciByZXBvcnRlZCB2YWx1ZSBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXZlIFZhbHVlPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTdlMmMzMDJlYjI3NWJiYTFlYzZmZDNiXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhlYXRtYXAgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTExMywxMTIzLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoXCIpO307Xy5iKFwiIG92ZXJsYXBzIHdpdGggYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImRpc3BsYWNlZF9kaXZlX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZGl2ZSB2YWx1ZSB3aXRoaW4gQ3VyYWNhbydzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZGl2ZSBzaXRlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMTM4MSwyMDY2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5Db25uZWN0aXZpdHk8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5ab25lIE5hbWU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5EaXN0YW5jZSB0byBOZWFyZXN0IFpvbmUgKGttKTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPk5lYXJlc3QgWm9uZSBOYW1lPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImNvbm5lY3Rpdml0eVwiLGMscCwxKSxjLHAsMCwxNjk3LDE4NDcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJESVNUX0tNXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJORUFSX05BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGVtPk5vdGU6PC9lbT4gVGhlIGNvbm5lY3Rpdml0eSBhbmFseXRpYyBoYXMgYmVlbiBkZXZlbG9wZWQgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXMsIGFuZCBkb2VzIG5vdCBhY2NvdW50IGZvciB0aGUgbGVhc3QgY29zdCBwYXRoIGFyb3VuZCBsYW5kLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcbnRoaXNbXCJUZW1wbGF0ZXNcIl1bXCJ0cmFkZW9mZnNcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5UcmFkZW9mZnM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNzAsNzY3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjE4cHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8ZW0+VHJhZGVvZmYgYW5hbHlzaXMgaXMgY3VycmVudGx5IGluIGRldmVsb3BtZW50LCBhbmQgc2hvdWxkIGJlIHVzZWQgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXMgb25seS4gVGhlc2UgYW5hbHl0aWNzIHdpbGwgYWxsb3cgdXNlcnMgdG8gcGxvdCBtdWx0aXBsZSBwbGFuIG9wdGlvbnMgYWdhaW5zdCBlYWNoIG90aGVyIGluIHRlcm1zIG9mIHRoZWlyIGltcGFjdCBvbiBmaXNoaW5nLCBkaXZlIGFuZCBjb25zZXJ2YXRpb24gdmFsdWUgZm9yIE1vbnRzZXJyYXQuPC9lbT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDoxOHB4O21hcmdpbi1ib3R0b206MTVweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIFx0PHNwYW4+U2VsZWN0IGEgU2V0IG9mIFRyYWRlb2ZmIFNjb3JlcyB0byBWaWV3Ojwvc3Bhbj48L2JyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHQ8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHRcdDxvcHRpb24gY2xhc3M9XFxcImRlZmF1bHQtY2hvc2VuLXNlbGVjdGlvblxcXCIgbGFiZWw9XFxcIkZpc2hpbmcgYW5kIERpdmluZ1xcXCI+RmlzaGluZyBhbmQgRGl2aW5nPC9vcHRpb24+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcdFx0PC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBpZD1cXFwicHZ0X2NvbnRhaW5lclxcXCIgY2xhc3M9XFxcInB2dF9jb250YWluZXJcXFwiPjxkaXYgIGlkPVxcXCJmaXNoaW5nLXYtZGl2aW5nXFxcIiBjbGFzcz1cXFwiZmlzaGluZy12LWRpdmluZ1xcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgXHQgIFx0PHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0XHQ8aT5ObyB0cmFkZW9mZiBhbmFseXNpcyBhdmFpbGFibGUgZm9yIGluZGl2aWR1YWwgem9uZXMuPC9pPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
