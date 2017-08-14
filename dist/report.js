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
    this.getHasZoneWithGoal = __bind(this.getHasZoneWithGoal, this);
    this.getHasSanctuaryOrPartialTake = __bind(this.getHasSanctuaryOrPartialTake, this);
    _ref = EnvironmentTab.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  EnvironmentTab.prototype.name = 'Environment';

  EnvironmentTab.prototype.className = 'environment';

  EnvironmentTab.prototype.template = templates.environment;

  EnvironmentTab.prototype.dependencies = ['MontserratHabitatToolbox', 'MontserratCoralToolbox', 'MontserratSnapAndGroupToolbox'];

  EnvironmentTab.prototype.render = function() {
    var all_sandg_vals, context, coral_count, d3IsPresent, habitats, hasPartialTake, hasSanctuary, hasZoneWithGoal, isCollection, nogoal_coral_count, pt_habitats, sanc_habitats, sandg, _ref1;
    isCollection = this.model.isCollection();
    d3IsPresent = (_ref1 = window.d3) != null ? _ref1 : {
      "true": false
    };
    if (isCollection) {
      hasZoneWithGoal = this.getHasZoneWithGoal(this.model.getChildren());
      hasSanctuary = this.getHasSanctuaryOrPartialTake(this.model.getChildren(), "Sanctuary");
      hasPartialTake = this.getHasSanctuaryOrPartialTake(this.model.getChildren(), "Marine Reserve - Partial Take");
    } else {
      hasZoneWithGoal = this.getHasZoneWithGoal([this.model]);
      hasSanctuary = this.getHasSanctuaryOrPartialTake([this.model], "Sanctuary");
      hasPartialTake = this.getHasSanctuaryOrPartialTake([this.model], "Marine Reserve - Partial Take");
    }
    console.log("has zone with goal: ", hasZoneWithGoal);
    console.log("has sanc: ", hasSanctuary);
    console.log("has pt: ", hasPartialTake);
    habitats = this.recordSet('MontserratHabitatToolbox', 'Habitats').toArray();
    habitats = _.sortBy(habitats, function(h) {
      return parseFloat(h.PERC);
    });
    habitats = habitats.reverse();
    this.addTarget(habitats);
    sanc_habitats = this.recordSet('MontserratHabitatToolbox', 'SanctuaryHabitats').toArray();
    sanc_habitats = _.sortBy(sanc_habitats, function(h) {
      return parseFloat(h.PERC);
    });
    sanc_habitats = sanc_habitats.reverse();
    this.addTarget(sanc_habitats);
    pt_habitats = this.recordSet('MontserratHabitatToolbox', 'PartialTakeHabitats').toArray();
    pt_habitats = _.sortBy(pt_habitats, function(h) {
      return parseFloat(h.PERC);
    });
    pt_habitats = pt_habitats.reverse();
    this.addTarget(pt_habitats);
    console.log("sanc habitats: ", sanc_habitats);
    console.log("pt habitats: ", pt_habitats);
    'nogoal_habitats = @recordSet(\'MontserratHabitatToolbox\', \'NonReserveHabitats\').toArray()\nnogoal_habitats = _.sortBy nogoal_habitats, (h) ->  parseFloat(h.PERC)\nnogoal_habitats = nogoal_habitats.reverse()';
    sandg = this.recordSet('MontserratSnapAndGroupToolbox', 'SnapAndGroup').toArray()[0];
    all_sandg_vals = this.getAllValues(sandg.HISTO);
    'herb_bio = @recordSet(\'MontserratBiomassToolbox\', \'HerbivoreBiomass\').toArray()[0]\nall_herb_vals = @getAllValues herb_bio.HISTO\n@roundVals herb_bio\n\ntotal_bio = @recordSet(\'MontserratBiomassToolbox\', \'TotalBiomass\').toArray()[0]\nall_total_values = @getAllValues total_bio.HISTO\n@roundVals total_bio\n\nfish_bio = @recordSet(\'MontserratBiomassToolbox\', \'FishAbundance\').toArray()[0]\nall_fish_vals = @getAllValues fish_bio.HISTO\n@roundVals fish_bio';
    coral_count = this.recordSet('MontserratCoralToolbox', 'Coral').toArray();
    nogoal_coral_count = this.recordSet('MontserratCoralToolbox', 'NonReserveCoral').toArray();
    this.roundData(habitats);
    this.roundData(sanc_habitats);
    this.roundData(pt_habitats);
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      habitats: habitats,
      sanc_habitats: sanc_habitats,
      pt_habitats: pt_habitats,
      d3IsPresent: d3IsPresent,
      coral_count: coral_count,
      sandg: sandg,
      hasD3: window.d3,
      hasZoneWithGoal: hasZoneWithGoal,
      hasSanctuary: hasSanctuary,
      hasPartialTake: hasPartialTake
    };
    this.$el.html(this.template.render(context, templates));
    this.enableLayerTogglers();
    this.renderHistoValues(sandg, all_sandg_vals, ".sandg_viz", "#66cdaa", "Abundance of Juvenile Snapper, Grouper, and Parrotfish", "Count");
    this.drawCoralBars(coral_count, 0);
    return this.drawCoralBars(nogoal_coral_count, 3);
  };

  EnvironmentTab.prototype.getHasSanctuaryOrPartialTake = function(sketches, target) {
    var attr, sketch, zonesWithNoGoalCount, _i, _j, _len, _len1, _ref1;
    zonesWithNoGoalCount = 0;
    for (_i = 0, _len = sketches.length; _i < _len; _i++) {
      sketch = sketches[_i];
      _ref1 = sketch.getAttributes();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        if (attr.exportid === "ZONE_TYPE") {
          console.log("attr value: ", attr.value);
          if (attr.value === target) {
            zonesWithNoGoalCount += 1;
          }
        }
      }
    }
    return zonesWithNoGoalCount > 0;
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
      console.log("mean: ", mean);
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
      svg.selectAll(".scoreLine").data([parseFloat(mean).toFixed(2)]).enter().append("line").attr("class", "scoreLine").attr("x1", function(d) {
        return (x(d)) + 'px';
      }).attr("y1", function(d) {
        return (y(max_count_val) - 9) + 'px';
      }).attr("x2", function(d) {
        return x(d) + 'px';
      }).attr("y2", function(d) {
        return height + 'px';
      });
      svg.selectAll(".score").data([parseFloat(mean).toFixed(2)]).enter().append("text").attr("class", "score").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 9) + 'px';
      }).text("▼");
      svg.selectAll(".scoreText").data([parseFloat(mean).toFixed(2)]).enter().append("text").attr("class", "scoreText").attr("x", function(d) {
        return (x(d) - 22) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 22) + 'px';
      }).text(function(d) {
        return "Mean: " + d;
      });
      svg.selectAll(".minScoreLine").data([parseFloat(bmin).toFixed(2)]).enter().append("line").attr("class", "minScoreLine").attr("x1", function(d) {
        return (x(d)) + 'px';
      }).attr("y1", function(d) {
        return (y(max_count_val) - 6) + 'px';
      }).attr("x2", function(d) {
        return x(d) + 'px';
      }).attr("y2", function(d) {
        return height + 'px';
      });
      svg.selectAll(".minScore").data([parseFloat(bmin).toFixed(2)]).enter().append("text").attr("class", "minScore").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val)) + 'px';
      }).text("▼");
      svg.selectAll(".minScoreText").data([parseFloat(bmin).toFixed(2)]).enter().append("text").attr("class", "minScoreText").attr("x", function(d) {
        return (x(d) - 21) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 12) + 'px';
      }).text(function(d) {
        return "Min: " + d;
      });
      svg.selectAll(".maxScoreLine").data([parseFloat(bmax).toFixed(2)]).enter().append("line").attr("class", "maxScoreLine").attr("x1", function(d) {
        return (x(d)) + 'px';
      }).attr("y1", function(d) {
        return (y(max_count_val) - 18) + 'px';
      }).attr("x2", function(d) {
        return x(d) + 'px';
      }).attr("y2", function(d) {
        return height + 'px';
      });
      svg.selectAll(".maxScore").data([parseFloat(bmax).toFixed(2)]).enter().append("text").attr("class", "maxScore").attr("x", function(d) {
        return (x(d) - 6) + 'px';
      }).attr("y", function(d) {
        return (y(max_count_val) - 18) + 'px';
      }).text("▼");
      svg.selectAll(".maxScoreText").data([parseFloat(bmax).toFixed(2)]).enter().append("text").attr("class", "maxScoreText").attr("x", function(d) {
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
    var connectivity, context, curr_size, cv, dcv, ddv, dfv, displaced_conservation_value, displaced_dive_value, displaced_fishing_value, displaced_protected_area_conservation_value, displaced_protected_area_dive_value, displaced_protected_area_fishing_value, displaced_pt_conservation_value, displaced_pt_dive_value, displaced_pt_fishing_value, displaced_sanc_conservation_value, displaced_sanc_dive_value, displaced_sanc_fishing_value, dv, e, err, fishpot_count, fishpot_total, fishpots, fv, hasMultiUseZones, hasPartialTake, hasPartialTakeData, hasProtectedAreas, hasSanctuaries, hasSanctuaryData, hasUtilityZones, hasVolcanicExclusionZone, isCollection, isConservationZone, meetsMinWidthGoal, minDistKM, minWidth, multiUseZonePerc, multiUseZoneSize, partialTakePerc, partialTakeSize, pcv, pdv, pfv, protectedAreaPerc, protectedAreaSize, pt_cv, pt_dv, pt_fv, sanc_cv, sanc_dv, sanc_fv, sanctuaryPerc, sanctuarySize, scv, sdv, sfv, showDiveAndFishing, size, size_per_zone, spz, total_size, utilityZonePerc, utilityZoneSize, volcanicExclusionZonePerc, volcanicExclusionZoneSize, _i, _len;
    size = this.recordSet('SizeAndConnectivity', 'Size').toArray()[0];
    total_size = 340.06;
    size.PERC = Number((parseFloat(size.SIZE_SQKM) / total_size) * 100.0).toFixed(1);
    connectivity = this.recordSet('SizeAndConnectivity', 'Connectivity').toArray();
    isCollection = this.model.isCollection();
    try {
      dfv = this.recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0];
      ddv = this.recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0];
      dcv = this.recordSet('DiveAndFishingValue', 'ConservationValue').toArray()[0];
    } catch (_error) {
      err = _error;
      console.log("error: ", err);
    }
    hasSanctuaryData = false;
    try {
      sanc_fv = this.recordSet('DiveAndFishingValue', 'SanctuaryFishingValue').toArray()[0];
      sanc_dv = this.recordSet('DiveAndFishingValue', 'SanctuaryDiveValue').toArray()[0];
      sanc_cv = this.recordSet('DiveAndFishingValue', 'SanctuaryConservationValue').toArray()[0];
      hasSanctuaryData = true;
    } catch (_error) {
      err = _error;
      sanc_fv = [];
      sanc_dv = [];
      sanc_cv = [];
      hasSanctuaryData = false;
    }
    hasPartialTakeData = false;
    try {
      pt_fv = this.recordSet('DiveAndFishingValue', 'PartialTakeFishingValue').toArray()[0];
      pt_dv = this.recordSet('DiveAndFishingValue', 'PartialTakeDiveValue').toArray()[0];
      pt_cv = this.recordSet('DiveAndFishingValue', 'PartialTakeConservationValue').toArray()[0];
      console.log("------>>>>pt cv: ", pt_cv);
      hasPartialTakeData = true;
    } catch (_error) {
      err = _error;
      console.log("no pt.....");
      pt_fv = [];
      pt_dv = [];
      hasPartialTakeData = false;
    }
    hasProtectedAreas = false;
    hasSanctuaries = false;
    hasPartialTake = false;
    hasUtilityZones = false;
    hasMultiUseZones = false;
    hasVolcanicExclusionZone = false;
    try {
      size_per_zone = this.recordSet('SizeAndConnectivity', 'SizePerZone').toArray();
      console.log("sizes per zone: ", size_per_zone);
      protectedAreaSize = 0.0;
      protectedAreaPerc = 0.0;
      sanctuarySize = 0.0;
      sanctuaryPerc = 0.0;
      partialTakeSize = 0.0;
      partialTakePerc = 0.0;
      utilityZoneSize = 0.0;
      utilityZonePerc = 0.0;
      multiUseZoneSize = 0.0;
      multiUseZonePerc = 0.0;
      volcanicExclusionZoneSize = 0.0;
      volcanicExclusionZonePerc = 0.0;
      for (_i = 0, _len = size_per_zone.length; _i < _len; _i++) {
        spz = size_per_zone[_i];
        curr_size = parseFloat(spz.SIZE_SQKM);
        if (spz.ZONE_TYPE === "Sanctuary") {
          sanctuarySize = curr_size;
          protectedAreaSize += curr_size;
          hasProtectedAreas = true;
          hasSanctuaries = true;
        } else if (spz.ZONE_TYPE === "Marine Reserve - Partial Take") {
          partialTakeSize = curr_size;
          protectedAreaSize += curr_size;
          hasProtectedAreas = true;
          hasPartialTake = true;
        } else if (spz.ZONE_TYPE === "Multiuse") {
          hasMultiUseZones = true;
          multiUseZoneSize = curr_size;
        } else if (spz.ZONE_TYPE === "Volcanic Exclusion Zone") {
          hasVolcanicExclusionZone = true;
          volcanicExclusionZoneSize = curr_size;
        } else {
          hasUtilityZones = true;
          utilityZoneSize += curr_size;
        }
      }
    } catch (_error) {
      e = _error;
      console.log("e: ", e);
    }
    protectedAreaSize = parseFloat(protectedAreaSize).toFixed(2);
    sanctuarySize = parseFloat(sanctuarySize).toFixed(2);
    partialTakeSize = parseFloat(partialTakeSize).toFixed(2);
    multiUseZoneSize = parseFloat(multiUseZoneSize).toFixed(2);
    utilityZoneSize = parseFloat(utilityZoneSize).toFixed(2);
    volcanicExclusionZoneSize = parseFloat(volcanicExclusionZoneSize).toFixed(2);
    protectedAreaPerc = Number((protectedAreaSize / total_size) * 100.0).toFixed(1);
    sanctuaryPerc = Number((sanctuarySize / total_size) * 100.0).toFixed(1);
    partialTakePerc = Number((partialTakeSize / total_size) * 100.0).toFixed(1);
    utilityZonePerc = Number((utilityZoneSize / total_size) * 100.0).toFixed(1);
    multiUseZonePerc = Number((multiUseZoneSize / total_size) * 100.0).toFixed(1);
    volcanicExclusionZonePerc = Number((volcanicExclusionZoneSize / total_size) * 100.0).toFixed(1);
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
    if (dcv) {
      if (dcv.PERCENT < 0.01) {
        displaced_conservation_value = "< 0.01";
      } else {
        displaced_conservation_value = parseFloat(dcv.PERCENT).toFixed(2);
      }
    } else {
      displaced_conservation_value = "unknown";
    }
    if (hasSanctuaryData) {
      if (sanc_fv.PERCENT < 0.01) {
        displaced_sanc_fishing_value = "< 0.01";
      } else {
        displaced_sanc_fishing_value = parseFloat(sanc_fv.PERCENT).toFixed(2);
      }
      if (sanc_dv.PERCENT < 0.01) {
        displaced_sanc_dive_value = "< 0.01";
      } else {
        displaced_sanc_dive_value = parseFloat(sanc_dv.PERCENT).toFixed(2);
      }
      if (sanc_cv.PERCENT < 0.01) {
        displaced_sanc_conservation_value = "< 0.01";
      } else {
        displaced_sanc_conservation_value = parseFloat(sanc_cv.PERCENT).toFixed(2);
      }
    } else {
      displaced_sanc_fishing_value = "0.0";
      displaced_sanc_dive_value = "0.0";
      displaced_sanc_conservation_value = 0.0;
    }
    if (hasPartialTakeData) {
      if (pt_fv.PERCENT < 0.01) {
        displaced_pt_fishing_value = "< 0.01";
      } else {
        displaced_pt_fishing_value = parseFloat(pt_fv.PERCENT).toFixed(2);
      }
      if (pt_dv.PERCENT < 0.01) {
        displaced_pt_dive_value = "< 0.01";
      } else {
        displaced_pt_dive_value = parseFloat(pt_dv.PERCENT).toFixed(2);
      }
      if (pt_cv.PERCENT < 0.01) {
        displaced_pt_conservation_value = "< 0.01";
      } else {
        displaced_pt_conservation_value = parseFloat(pt_cv.PERCENT).toFixed(2);
      }
    } else {
      displaced_pt_fishing_value = "0";
      displaced_pt_dive_value = "0";
      displaced_pt_conservation_value = "0";
    }
    if (isCollection) {
      fv = 0.0;
      dv = 0.0;
      cv = 0.0;
      if (hasSanctuaries) {
        sfv = parseFloat(sanc_fv.PERCENT);
        sdv = parseFloat(sanc_dv.PERCENT);
        scv = parseFloat(sanc_cv.PERCENT);
        fv += sfv;
        dv += sdv;
        cv += scv;
      }
      if (hasPartialTake) {
        pfv = parseFloat(pt_fv.PERCENT);
        pdv = parseFloat(pt_dv.PERCENT);
        pcv = parseFloat(pt_cv.PERCENT);
        fv += pfv;
        dv += pdv;
        cv += pcv;
      }
      displaced_protected_area_fishing_value = fv.toFixed(2);
      displaced_protected_area_dive_value = dv.toFixed(2);
      displaced_protected_area_conservation_value = cv.toFixed(2);
    } else {
      displaced_protected_area_fishing_value = displaced_fishing_value;
      displaced_protected_area_dive_value = displaced_dive_value;
      displaced_protected_area_conservation_value = displaced_conservation_value;
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
    showDiveAndFishing = !isCollection || (isCollection && hasProtectedAreas);
    context = {
      sketch: this.model.forTemplate(),
      sketchClass: this.sketchClass.forTemplate(),
      attributes: this.model.getAttributes(),
      admin: this.project.isAdmin(window.user),
      isCollection: isCollection,
      hasD3: window.d3,
      size: size,
      connectivity: connectivity,
      displaced_protected_area_dive_value: displaced_protected_area_dive_value,
      displaced_protected_area_fishing_value: displaced_protected_area_fishing_value,
      displaced_protected_area_conservation_value: displaced_protected_area_conservation_value,
      displaced_sanc_fishing_value: displaced_sanc_fishing_value,
      displaced_sanc_dive_value: displaced_sanc_dive_value,
      displaced_sanc_conservation_value: displaced_sanc_conservation_value,
      displaced_pt_fishing_value: displaced_pt_fishing_value,
      displaced_pt_dive_value: displaced_pt_dive_value,
      displaced_pt_conservation_value: displaced_pt_conservation_value,
      hasPartialTakeData: hasPartialTakeData,
      hasSanctuaryData: hasSanctuaryData,
      minDistKM: minDistKM,
      isConservationZone: isConservationZone,
      meetsMinWidthGoal: meetsMinWidthGoal,
      min_dim: minWidth,
      fishpot_count: fishpot_count,
      fishpot_total: fishpot_total,
      hasProtectedAreas: hasProtectedAreas,
      protectedAreaSize: protectedAreaSize,
      protectedAreaPerc: protectedAreaPerc,
      hasSanctuaries: hasSanctuaries,
      sanctuarySize: sanctuarySize,
      sanctuaryPerc: sanctuaryPerc,
      hasPartialTake: hasPartialTake,
      partialTakeSize: partialTakeSize,
      partialTakePerc: partialTakePerc,
      hasUtilityZones: hasUtilityZones,
      utilityZoneSize: utilityZoneSize,
      utilityZonePerc: utilityZonePerc,
      hasMultiUseZones: hasMultiUseZones,
      multiUseZoneSize: multiUseZoneSize,
      multiUseZonePerc: multiUseZonePerc,
      hasVolcanicExclusionZone: hasVolcanicExclusionZone,
      volcanicExclusionZoneSize: volcanicExclusionZoneSize,
      volcanicExclusionZonePerc: volcanicExclusionZonePerc,
      showDiveAndFishing: showDiveAndFishing
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


},{"../node_modules/seasketch-reporting-api/templates/templates.js":"CNqB+b","../templates/templates.js":15,"reportTab":"a21iR2"}],13:[function(require,module,exports){
var EnvironmentTab, OverviewTab, TradeoffsTab;

OverviewTab = require('./overview.coffee');

TradeoffsTab = require('./tradeoffs.coffee');

EnvironmentTab = require('./environment.coffee');

window.app.registerReport(function(report) {
  report.tabs([OverviewTab, EnvironmentTab]);
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
this["Templates"]["environment"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,20,3524,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>Benthic Habitats ");if(_.s(_.f("isCollection",c,p,1),c,p,0,107,129,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("in All Marine Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        The following table describes the overlap between ");if(_.s(_.f("isCollection",c,p,1),c,p,0,328,372,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("the marine reserve sketches within your plan");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("your sketch");};_.b(" and the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right. The MNI 2016 benthic habitat map was digitized by hand using a combination of in situ observations on scuba/free dive at survey sites (n = approx. 600) and drop camera deployments (n = 343) as part of the Waitt Institute Scientific Assessment. Preliminary context for mapping was gleaned from benthic maps depicted in Wild et. al 2007 and IRF 1993. These maps provided valuable insight into dominant benthic features and the interpretation of site observations. ");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table data-paging=\"10\">");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 10% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 20% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Meets 30% Goal?<sup>*</sup></th>");_.b("\n" + i);_.b("            <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("            <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("            <th>Area (% of Total)</th>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("habitats",c,p,1),c,p,0,1483,3013,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_10_GOAL",c,p,1),c,p,0,1552,1625,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_10_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,1709,1776,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_20_GOAL",c,p,1),c,p,0,2011,2084,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_20_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,2168,2235,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_30_GOAL",c,p,1),c,p,0,2470,2543,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_30_GOAL",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("NO_GOAL",c,p,1),c,p,0,2627,2694,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                    <div class=\"no-goal\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("NO_GOAL",c,p,1),c,p,1,0,0,"")){_.b("                    <div class=\"small-red-x\"></div>");_.b("\n");};};_.b("              </td>");_.b("\n" + i);_.b("           ");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("        </tbody>");_.b("\n" + i);_.b("        <tfoot>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td colspan=\"6\" style=\"padding-left:10px;text-align:left;\">");_.b("\n" + i);_.b("              <sup>*</sup>Indicates whether the selected Marine Reserves zones have reached th conservation goal of preserving 10/20/30% of each habitat. A green check indicates that the goal is met, red x means that the goal is not met, and a gray dash indicates that there is no goal for that habitat.");_.b("\n" + i);_.b("            </td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </tfoot>");_.b("\n" + i);_.b("      </table>");_.b("\n" + i);_.b("</div>");_.b("\n");});c.pop();}_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,3563,5755,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("hasSanctuary",c,p,1),c,p,0,3583,4634,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("   <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Benthic Habitats ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3674,3688,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("in Sanctuaries");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("        <p>");_.b("\n" + i);_.b("          The following table describes the overlap of ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3886,3952,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("the sketches in your plan that are in no take marine reserves with");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("your sketch and");};_.b(" the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right.");_.b("\n" + i);_.b("        </p>");_.b("\n" + i);_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("              <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("              <th>Area (% of Total)</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("sanc_habitats",c,p,1),c,p,0,4414,4567,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}if(_.s(_.f("hasPartialTake",c,p,1),c,p,0,4673,5735,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("   <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Benthic Habitats ");if(_.s(_.f("isCollection",c,p,1),c,p,0,4764,4788,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("in Partial Take Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58079dd5a1ec36f5595fb2b0\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("        <p>");_.b("\n" + i);_.b("          The following table describes the overlap of ");if(_.s(_.f("isCollection",c,p,1),c,p,0,4986,5057,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("the sketches in your plan that are in partial take marine reserves with");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("your sketch and");};_.b(" the benthic habitats of Montserrat, which you can view by checking the 'show layer' box at right.");_.b("\n" + i);_.b("        </p>");_.b("\n" + i);_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Habitat</th>");_.b("\n" + i);_.b("              <th>Area (sq. km.)</th>");_.b("\n" + i);_.b("              <th>Area (% of Total)</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("pt_habitats",c,p,1),c,p,0,5517,5670,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("HAB_TYPE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("AREA_SQKM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("PERC",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}});c.pop();}_.b("\n" + i);if(_.s(_.f("hasZoneWithGoal",c,p,1),c,p,0,5794,7222,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("    <h4>IUCN Listed Coral ");if(_.s(_.f("isCollection",c,p,1),c,p,0,5882,5899,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("- Marine Reserves");});c.pop();}_.b("<a href=\"#\" data-toggle-node=\"58e671fc4af25d590ba4ccef\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Three IUCN listed corals have been observed within Montserrat waters. The following graphics show the number of the known observations that are found within the selected ");if(_.s(_.f("isCollection",c,p,1),c,p,0,6218,6249,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<b>marine reserve</b> sketches ");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(".");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,6333,6682,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_a\">");_.b("\n" + i);_.b("            <div><i>Orbicella annularis </i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"orb_f\">");_.b("\n" + i);_.b("            <div><i>Orbicella faveolata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("          <div class=\"viz\" id=\"acro\">");_.b("\n" + i);_.b("            <div><i>Acropora palmata</i></div>");_.b("\n" + i);_.b("          </div>");_.b("\n" + i);_.b("        </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:40px;\">Name<sup>*</sup></th>");_.b("\n" + i);_.b("              <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("              <th>Total</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("coral_count",c,p,1),c,p,0,7000,7144,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("COUNT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("TOT",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b(" </div>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Nursery Areas</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    These charts show the minimum, mean and maximum abundance measurements of nursery areas that were taken within your ");if(_.s(_.f("isCollection",c,p,1),c,p,0,7440,7450,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(", in relation to the distribution of abundance within Montserrat waters.");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,7602,7708,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"in-report-header\">Nursery Areas</div>");_.b("\n" + i);_.b("    <div id=\"sandg_viz\" class=\"sandg_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("          <th>Mean</th>");_.b("\n" + i);_.b("          <th>Minimum</th>");_.b("\n" + i);_.b("          <th>Maximum</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);if(_.s(_.f("sandg",c,p,1),c,p,0,7980,8162,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <tr>");_.b("\n" + i);_.b("            <td>Nursery Areas</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.d("sandg.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.d("sandg.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            <td>");_.b(_.v(_.d("sandg.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n");});c.pop();}_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("<!--");_.b("\n" + i);_.b("   <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Fish Biomass</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        These charts show the minimum, mean and maximum fish biomass value taken within your sketched zone, in relation to the distribution of biomass measured around the island. Biomass was calculated for Herbivores and All Species at regular points along Montserrat's coast.");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,8612,8849,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <div class=\"in-report-header\">Herbivore Biomass</div>");_.b("\n" + i);_.b("        <div id=\"herb_viz\" class=\"herb_viz\"></div>");_.b("\n" + i);_.b("        <div class=\"in-report-header\">All Species Biomass</div>");_.b("\n" + i);_.b("        <div id=\"total_viz\" class=\"total_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("              <th>Mean</th>");_.b("\n" + i);_.b("              <th>Minimum</th>");_.b("\n" + i);_.b("              <th>Maximum</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("herb",c,p,1),c,p,0,9168,9372,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <tr>");_.b("\n" + i);_.b("                <td>Herbivores</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("herb.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("herb.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("herb.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              </tr>");_.b("\n");});c.pop();}if(_.s(_.f("total",c,p,1),c,p,0,9404,9607,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <tr>");_.b("\n" + i);_.b("                <td>Totals</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("total.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("total.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("total.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              </tr>");_.b("\n");});c.pop();}_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b("   </div>");_.b("\n" + i);_.b("\n" + i);_.b("   <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Fish Abundance</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        These charts show the minimum, mean and maximum fish abundance value taken within your sketched zone.");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);if(_.s(_.f("d3IsPresent",c,p,1),c,p,0,9901,9959,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <div id=\"fish_viz\" class=\"fish_viz\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("d3IsPresent",c,p,1),c,p,1,0,0,"")){_.b("        <table data-paging=\"10\">");_.b("\n" + i);_.b("          <thead>");_.b("\n" + i);_.b("            <tr>");_.b("\n" + i);_.b("              <th style=\"width:250px;\"></th>");_.b("\n" + i);_.b("              <th>Mean</th>");_.b("\n" + i);_.b("              <th>Minimum</th>");_.b("\n" + i);_.b("              <th>Maximum</th>");_.b("\n" + i);_.b("            </tr>");_.b("\n" + i);_.b("          </thead>");_.b("\n" + i);_.b("          <tbody>");_.b("\n" + i);if(_.s(_.f("fish",c,p,1),c,p,0,10278,10482,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("              <tr>");_.b("\n" + i);_.b("                <td>Herbivores</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("fish.SCORE",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("fish.MIN",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("                <td>");_.b(_.v(_.d("fish.MAX",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              </tr>");_.b("\n");});c.pop();}_.b("\n" + i);_.b("          </tbody>");_.b("\n" + i);_.b("        </table>");_.b("\n");};_.b("    </div>");_.b("\n" + i);_.b("  -->");_.b("\n");return _.fl();;});
this["Templates"]["overview"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Size</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,76,86,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.d("size.SIZE_SQKM",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("    <strong>");_.b(_.v(_.d("size.PERC",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,334,2242,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("hasProtectedAreas",c,p,1),c,p,0,361,640,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <p>");_.b("\n" + i);_.b("      The <b>partial take and no take marine reserves</b> in this collection are <strong>");_.b(_.v(_.f("protectedAreaSize",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("      <strong>");_.b(_.v(_.f("protectedAreaPerc",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("    </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasSanctuaries",c,p,1),c,p,0,686,948,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>no take marine reserves</b> in this collection are <strong>");_.b(_.v(_.f("sanctuarySize",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("        <strong>");_.b(_.v(_.f("sanctuaryPerc",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasPartialTake",c,p,1),c,p,0,991,1262,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>partial take marine reserves</b> in this collection are <strong>");_.b(_.v(_.f("partialTakeSize",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("        <strong>");_.b(_.v(_.f("partialTakePerc",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasUtilityZones",c,p,1),c,p,0,1306,1562,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>utility zones</b> in this collection are <strong>");_.b(_.v(_.f("utilityZoneSize",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("        <strong>");_.b(_.v(_.f("utilityZonePerc",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasMultiUseZones",c,p,1),c,p,0,1608,1868,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>multi use zones</b> in this collection are <strong>");_.b(_.v(_.f("multiUseZoneSize",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("        <strong>");_.b(_.v(_.f("multiUseZonePerc",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}if(_.s(_.f("hasVolcanicExclusionZone",c,p,1),c,p,0,1923,2210,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>volcanic exclusion zones</b> in this collection are <strong>");_.b(_.v(_.f("volcanicExclusionZoneSize",c,p,0)));_.b(" sq. km</strong>, which represents ");_.b("\n" + i);_.b("        <strong>");_.b(_.v(_.f("volcanicExclusionZonePerc",c,p,0)));_.b("%</strong> of Montserrat's waters within 3 nautical miles of the coastline.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}_.b("</div>");_.b("\n" + i);if(_.s(_.f("showDiveAndFishing",c,p,1),c,p,0,2290,6358,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Fishing Value<a href=\"#\" data-toggle-node=\"57e2c33beb275bba1ec6fd46\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,2474,2540,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<b>no take and partial take marine reserves</b> in this collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlap");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" with approximately <strong>");_.b(_.v(_.f("displaced_protected_area_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Montserrat's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("hasSanctuaryData",c,p,1),c,p,0,2859,3175,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("isCollection",c,p,1),c,p,0,2881,3155,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>no take marine reserves</b> in this collection overlap with approximately <strong>");_.b(_.v(_.f("displaced_sanc_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Montserrat's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("hasPartialTakeData",c,p,1),c,p,0,3222,3541,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("isCollection",c,p,1),c,p,0,3244,3521,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>partial take marine reserves</b> in this collection overlap with approximately <strong>");_.b(_.v(_.f("displaced_pt_fishing_value",c,p,0)));_.b("%</strong> of the total fishing value within Montserrat's waters, based on the user reported value of fishing grounds.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Dive Value<a href=\"#\" data-toggle-node=\"57e2c302eb275bba1ec6fd3d\" data-visible=\"false\">show heatmap layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,3753,3819,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<b>no take and partial take marine reserves</b> in this collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlap");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" with approximately <strong>");_.b(_.v(_.f("displaced_protected_area_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Montserrat's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("hasSanctuaryData",c,p,1),c,p,0,4127,4432,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("isCollection",c,p,1),c,p,0,4149,4412,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>no take marine reserves</b> in this collection overlap with approximately <strong>");_.b(_.v(_.f("displaced_sanc_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Montserrat's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("hasPartialTakeData",c,p,1),c,p,0,4479,4787,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("isCollection",c,p,1),c,p,0,4501,4767,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>partial take marine reserves</b> in this collection overlap with approximately <strong>");_.b(_.v(_.f("displaced_pt_dive_value",c,p,0)));_.b("%</strong> of the total dive value within Montserrat's waters, based on the user reported value of dive sites.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Conservation Value<a href=\"#\" data-toggle-node=\"5935e6cb1a6ce8a953b33d37\" data-visible=\"false\">show conservation layer</a></h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The ");if(_.s(_.f("isCollection",c,p,1),c,p,0,5012,5078,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("<b>no take and partial take marine reserves</b> in this collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("sketch");};_.b(" overlap");if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("s");};_.b(" with approximately <strong>");_.b(_.v(_.f("displaced_protected_area_conservation_value",c,p,0)));_.b("%</strong> of the conservation priority areas within Montserrat’s waters. Priority conservation areas were selected using prioritizr systematic conservation prioritization package in R. They were identified to meet habitat protection goals and protect areas of high species richness, while minimizing the overlap with fishing activity.");_.b("\n" + i);_.b("    ");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);if(_.s(_.f("hasSanctuaryData",c,p,1),c,p,0,5624,5950,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("isCollection",c,p,1),c,p,0,5646,5930,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>no take marine reserves</b> in this collection overlap with approximately <strong>");_.b(_.v(_.f("displaced_sanc_conservation_value",c,p,0)));_.b("%</strong> of the total conservation priority areas within Montserrat's waters, based on the prioritizr conservation value.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}if(_.s(_.f("hasPartialTakeData",c,p,1),c,p,0,5997,6326,"{{ }}")){_.rs(c,p,function(c,p,_){if(_.s(_.f("isCollection",c,p,1),c,p,0,6019,6306,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("      <p>");_.b("\n" + i);_.b("        The <b>partial take marine reserves</b> in this collection overlap with approximately <strong>");_.b(_.v(_.f("displaced_pt_conservation_value",c,p,0)));_.b("%</strong> of the total conservation priority areas within Montserrat's waters, based on the prioritizr conservation value.");_.b("\n" + i);_.b("      </p>");_.b("\n");});c.pop();}});c.pop();}_.b("</div>");_.b("\n" + i);_.b("\n");});c.pop();}_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("<h4>Fish Pots <a href=\"#\" data-toggle-node=\"58ed7cb54af25d590ba4fc3c\" data-visible=\"false\">show layer</a></h4>");_.b("\n" + i);if(_.s(_.f("hasD3",c,p,1),c,p,0,6533,6645,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div>");_.b("\n" + i);_.b("      <div class=\"viz\" id=\"fish_pots\">");_.b("\n" + i);_.b("        <div><i>Fish Pots</i></div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("    </div>");_.b("\n");});c.pop();}if(!_.s(_.f("hasD3",c,p,1),c,p,1,0,0,"")){_.b("    <table data-paging=\"10\">");_.b("\n" + i);_.b("      <thead>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <th style=\"width:225px;\">Count</th>");_.b("\n" + i);_.b("          <th>Total</th>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </thead>");_.b("\n" + i);_.b("      <tbody>");_.b("\n" + i);_.b("        <tr>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("fishpot_count",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("          <td>");_.b(_.v(_.f("fishpot_total",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("        </tr>");_.b("\n" + i);_.b("      </tbody>");_.b("\n" + i);_.b("    </table>");_.b("\n");};_.b("</div>");_.b("\n" + i);_.b("\n" + i);if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){if(_.s(_.f("isConservationZone",c,p,1),c,p,0,7032,7661,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("    <div class=\"reportSection\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <div style=\"padding-left:10px\">");_.b("\n" + i);if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,7166,7221,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("          <div class=\"big-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("          <div class=\"big-red-x\"></div>");_.b("\n");};_.b("        <div style=\"display:inline;padding-left:5px;font-size:1.1em\">");_.b("\n" + i);_.b("          This zone <b>");if(_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,0,7461,7467,"{{ }}")){_.rs(c,p,function(c,p,_){_.b(" meets");});c.pop();}if(!_.s(_.f("meetsMinWidthGoal",c,p,1),c,p,1,0,0,"")){_.b("does not meet");};_.b("</b> the conservation goal of having a minimum width of <b>at least 1km</b>.");_.b("\n" + i);_.b("        </div>");_.b("\n" + i);_.b("      </div>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}};if(_.s(_.f("isCollection",c,p,1),c,p,0,7720,8577,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Minimum Size Goal</h4>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        Marine Reserve Zones should have a minimum width of at least 1 kilometer to meet conservation goals.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td style=\"width:60px;text-align:center;\">Meets 1km Goal?</td>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("min_dim",c,p,1),c,p,0,8151,8536,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b("\n" + i);if(_.s(_.f("MEETS_THRESH",c,p,1),c,p,0,8221,8294,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("                  <div class=\"small-green-check\"></div>");_.b("\n");});c.pop();}if(!_.s(_.f("MEETS_THRESH",c,p,1),c,p,1,0,0,"")){_.b("                  <div class=\"small-red-x\"></div>");_.b("\n");};_.b("              </td>");_.b("\n" + i);_.b("              <td style=\"text-align:left;\">");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("   </div>");_.b("\n");});c.pop();}_.b("  <!--");_.b("\n" + i);_.b("  <div class=\"reportSection tableContainer\">");_.b("\n" + i);_.b("      <h4>Connectivity</h4>");_.b("\n" + i);_.b("      <table>");_.b("\n" + i);_.b("        <thead>");_.b("\n" + i);_.b("          <tr>");_.b("\n" + i);_.b("            <td>Zone Name</td>");_.b("\n" + i);_.b("            <td>Distance to Nearest Zone (km)</td>");_.b("\n" + i);_.b("            <td>Nearest Zone Name</td>");_.b("\n" + i);_.b("          </tr>");_.b("\n" + i);_.b("        </thead>");_.b("\n" + i);_.b("        <tbody>");_.b("\n" + i);if(_.s(_.f("connectivity",c,p,1),c,p,0,8917,9067,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("            <tr>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("DIST_KM",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("              <td>");_.b(_.v(_.f("NEAR_NAME",c,p,0)));_.b("</td>");_.b("\n" + i);_.b("            </tr>");_.b("\n");});c.pop();}_.b("      </table>");_.b("\n" + i);_.b("      <p>");_.b("\n" + i);_.b("        <em>Note:</em> The connectivity analytic has been developed for demonstration purposes, and does not account for the least cost path around land.");_.b("\n" + i);_.b("      </p>");_.b("\n" + i);_.b("   </div>");_.b("\n" + i);_.b(" ");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b(" <div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Distance from Port Little Bay</h4>");_.b("\n" + i);_.b("  <p>");_.b("\n" + i);_.b("    The farthest point in the ");if(_.s(_.f("isCollection",c,p,1),c,p,0,9412,9422,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("collection");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("zone");};_.b(" is <strong>");_.b(_.v(_.f("minDistKM",c,p,0)));_.b(" km</strong> (over water) from the Port Little Bay.");_.b("\n" + i);_.b("  </p>");_.b("\n" + i);_.b("</div>");_.b("\n" + i);_.b("-->");_.b("\n" + i);_.b("\n" + i);_.b("\n" + i);_.b("\n");return _.fl();;});
this["Templates"]["tradeoffs"] = new Hogan.Template(function(c,p,i){var _=this;_.b(i=i||"");_.b("\n" + i);_.b("<div class=\"reportSection\">");_.b("\n" + i);_.b("  <h4>Tradeoffs</h4>");_.b("\n" + i);if(_.s(_.f("isCollection",c,p,1),c,p,0,70,1081,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("  	<p style=\"margin-left:18px;\">");_.b("\n" + i);_.b("  		<em>Tradeoff analysis is currently in development, and should be used for demonstration purposes only. These analytics will allow users to plot multiple plan options against each other in terms of their impact on fishing, dive and conservation value for Montserrat.</em>");_.b("\n" + i);_.b("  	</p>");_.b("\n" + i);_.b("  	<div style=\"margin-left:18px;margin-bottom:15px\">");_.b("\n" + i);_.b("	  	<span>Select a Set of Tradeoff Scores to View:</span></br>");_.b("\n" + i);_.b("		<select class=\"chosen\">");_.b("\n" + i);if(_.s(_.f("tradeoffs",c,p,1),c,p,0,549,674,"{{ }}")){_.rs(c,p,function(c,p,_){_.b("        <option class=\"");_.b(_.v(_.d(". == \"Fishing and Diving\" ? 'default-chosen-selection' : ''",c,p,0)));_.b("\"  value=\"");_.b(_.v(_.d(".",c,p,0)));_.b("\">");_.b(_.v(_.d(".",c,p,0)));_.b("</option>");_.b("\n");});c.pop();}_.b("		</select>");_.b("\n" + i);_.b("	</div>");_.b("\n" + i);_.b("  	<div id=\"fvd_container\" class=\"fvd_container\"><div  id=\"fishing-v-diving\" class=\"fishing-v-diving\"></div></div>");_.b("\n" + i);_.b("    <div id=\"fvc_container\" class=\"fvc_container\"><div  id=\"fishing-v-conservation\" class=\"fishing-v-conservation\"></div></div>");_.b("\n" + i);_.b("    <div id=\"dvc_container\" class=\"dvc_container\"><div  id=\"diving-v-conservation\" class=\"diving-v-conservation\"></div></div>");_.b("\n");});c.pop();}if(!_.s(_.f("isCollection",c,p,1),c,p,1,0,0,"")){_.b("  	  	<p>");_.b("\n" + i);_.b("  			<i>No tradeoff analysis available for individual zones.</i>");_.b("\n" + i);_.b("  		</p>");_.b("\n");};_.b("</div>");return _.fl();;});

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = this["Templates"];
}
},{}]},{},[13])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvZ3J1bnQtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvZW5hYmxlTGF5ZXJUb2dnbGVycy5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9ub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvc2NyaXB0cy9qb2JJdGVtLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3JlcG9ydFJlc3VsdHMuY29mZmVlIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3NjcmlwdHMvcmVwb3J0VGFiLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9zY3JpcHRzL3V0aWxzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzIiwiL1VzZXJzL2Rhbl95b2N1bS9EZXNrdG9wL2dpdGh1Yi9iaC1tb250c2VycmF0LXJlcG9ydHMvc2NyaXB0cy9lbnZpcm9ubWVudC5jb2ZmZWUiLCIvVXNlcnMvZGFuX3lvY3VtL0Rlc2t0b3AvZ2l0aHViL2JoLW1vbnRzZXJyYXQtcmVwb3J0cy9zY3JpcHRzL292ZXJ2aWV3LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvcmVwb3J0LmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3NjcmlwdHMvdHJhZGVvZmZzLmNvZmZlZSIsIi9Vc2Vycy9kYW5feW9jdW0vRGVza3RvcC9naXRodWIvYmgtbW9udHNlcnJhdC1yZXBvcnRzL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQSxDQUFPLENBQVUsQ0FBQSxHQUFYLENBQU4sRUFBa0I7Q0FDaEIsS0FBQSwyRUFBQTtDQUFBLENBQUEsQ0FBQTtDQUFBLENBQ0EsQ0FBQSxHQUFZO0NBRFosQ0FFQSxDQUFBLEdBQU07QUFDQyxDQUFQLENBQUEsQ0FBQSxDQUFBO0NBQ0UsRUFBQSxDQUFBLEdBQU8scUJBQVA7Q0FDQSxTQUFBO0lBTEY7Q0FBQSxDQU1BLENBQVcsQ0FBQSxJQUFYLGFBQVc7Q0FFWDtDQUFBLE1BQUEsb0NBQUE7d0JBQUE7Q0FDRSxFQUFXLENBQVgsR0FBVyxDQUFYO0NBQUEsRUFDUyxDQUFULEVBQUEsRUFBaUIsS0FBUjtDQUNUO0NBQ0UsRUFBTyxDQUFQLEVBQUEsVUFBTztDQUFQLEVBQ08sQ0FBUCxDQURBLENBQ0E7QUFDK0IsQ0FGL0Is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Q0FsZVQsRUFnZWlCOztDQWhlakIsQ0FxZUEsQ0FBYSxNQUFDLENBQWQ7Q0FDRSxHQUFBLElBQUE7Q0FBQSxFQUFJLENBQUo7Q0FBQSxDQUNtQixDQUFaLENBQVAsQ0FBTztDQUNQLEVBQW1CLENBQW5CO0NBQUEsRUFBTyxDQUFQLEVBQUE7TUFGQTtDQUFBLEVBR08sQ0FBUDtDQUNHLENBQUQsQ0FBUyxDQUFBLEVBQVgsS0FBQTtDQTFlRixFQXFlYTs7Q0FyZWI7O0NBRHlCOztBQTZlM0IsQ0FyZkEsRUFxZmlCLEdBQVgsQ0FBTixLQXJmQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCJtb2R1bGUuZXhwb3J0cyA9IChlbCkgLT5cbiAgJGVsID0gJCBlbFxuICBhcHAgPSB3aW5kb3cuYXBwXG4gIHRvYyA9IGFwcC5nZXRUb2MoKVxuICB1bmxlc3MgdG9jXG4gICAgY29uc29sZS5sb2cgJ05vIHRhYmxlIG9mIGNvbnRlbnRzIGZvdW5kJ1xuICAgIHJldHVyblxuICB0b2dnbGVycyA9ICRlbC5maW5kKCdhW2RhdGEtdG9nZ2xlLW5vZGVdJylcbiAgIyBTZXQgaW5pdGlhbCBzdGF0ZVxuICBmb3IgdG9nZ2xlciBpbiB0b2dnbGVycy50b0FycmF5KClcbiAgICAkdG9nZ2xlciA9ICQodG9nZ2xlcilcbiAgICBub2RlaWQgPSAkdG9nZ2xlci5kYXRhKCd0b2dnbGUtbm9kZScpXG4gICAgdHJ5XG4gICAgICB2aWV3ID0gdG9jLmdldENoaWxkVmlld0J5SWQgbm9kZWlkXG4gICAgICBub2RlID0gdmlldy5tb2RlbFxuICAgICAgJHRvZ2dsZXIuYXR0ciAnZGF0YS12aXNpYmxlJywgISFub2RlLmdldCgndmlzaWJsZScpXG4gICAgICAkdG9nZ2xlci5kYXRhICd0b2NJdGVtJywgdmlld1xuICAgIGNhdGNoIGVcbiAgICAgICR0b2dnbGVyLmF0dHIgJ2RhdGEtbm90LWZvdW5kJywgJ3RydWUnXG5cbiAgdG9nZ2xlcnMub24gJ2NsaWNrJywgKGUpIC0+XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgJGVsID0gJChlLnRhcmdldClcbiAgICB2aWV3ID0gJGVsLmRhdGEoJ3RvY0l0ZW0nKVxuICAgIGlmIHZpZXdcbiAgICAgIHZpZXcudG9nZ2xlVmlzaWJpbGl0eShlKVxuICAgICAgJGVsLmF0dHIgJ2RhdGEtdmlzaWJsZScsICEhdmlldy5tb2RlbC5nZXQoJ3Zpc2libGUnKVxuICAgIGVsc2VcbiAgICAgIGFsZXJ0IFwiTGF5ZXIgbm90IGZvdW5kIGluIHRoZSBjdXJyZW50IFRhYmxlIG9mIENvbnRlbnRzLiBcXG5FeHBlY3RlZCBub2RlaWQgI3skZWwuZGF0YSgndG9nZ2xlLW5vZGUnKX1cIlxuIiwiY2xhc3MgSm9iSXRlbSBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgY2xhc3NOYW1lOiAncmVwb3J0UmVzdWx0J1xuICBldmVudHM6IHt9XG4gIGJpbmRpbmdzOlxuICAgIFwiaDYgYVwiOlxuICAgICAgb2JzZXJ2ZTogXCJzZXJ2aWNlTmFtZVwiXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBhdHRyaWJ1dGVzOiBbe1xuICAgICAgICBuYW1lOiAnaHJlZidcbiAgICAgICAgb2JzZXJ2ZTogJ3NlcnZpY2VVcmwnXG4gICAgICB9XVxuICAgIFwiLnN0YXJ0ZWRBdFwiOlxuICAgICAgb2JzZXJ2ZTogW1wic3RhcnRlZEF0XCIsIFwic3RhdHVzXCJdXG4gICAgICB2aXNpYmxlOiAoKSAtPlxuICAgICAgICBAbW9kZWwuZ2V0KCdzdGF0dXMnKSBub3QgaW4gWydjb21wbGV0ZScsICdlcnJvciddXG4gICAgICB1cGRhdGVWaWV3OiB0cnVlXG4gICAgICBvbkdldDogKCkgLT5cbiAgICAgICAgaWYgQG1vZGVsLmdldCgnc3RhcnRlZEF0JylcbiAgICAgICAgICByZXR1cm4gXCJTdGFydGVkIFwiICsgbW9tZW50KEBtb2RlbC5nZXQoJ3N0YXJ0ZWRBdCcpKS5mcm9tTm93KCkgKyBcIi4gXCJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIFwiXCJcbiAgICBcIi5zdGF0dXNcIjogICAgICBcbiAgICAgIG9ic2VydmU6IFwic3RhdHVzXCJcbiAgICAgIG9uR2V0OiAocykgLT5cbiAgICAgICAgc3dpdGNoIHNcbiAgICAgICAgICB3aGVuICdwZW5kaW5nJ1xuICAgICAgICAgICAgXCJ3YWl0aW5nIGluIGxpbmVcIlxuICAgICAgICAgIHdoZW4gJ3J1bm5pbmcnXG4gICAgICAgICAgICBcInJ1bm5pbmcgYW5hbHl0aWNhbCBzZXJ2aWNlXCJcbiAgICAgICAgICB3aGVuICdjb21wbGV0ZSdcbiAgICAgICAgICAgIFwiY29tcGxldGVkXCJcbiAgICAgICAgICB3aGVuICdlcnJvcidcbiAgICAgICAgICAgIFwiYW4gZXJyb3Igb2NjdXJyZWRcIlxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHNcbiAgICBcIi5xdWV1ZUxlbmd0aFwiOiBcbiAgICAgIG9ic2VydmU6IFwicXVldWVMZW5ndGhcIlxuICAgICAgb25HZXQ6ICh2KSAtPlxuICAgICAgICBzID0gXCJXYWl0aW5nIGJlaGluZCAje3Z9IGpvYlwiXG4gICAgICAgIGlmIHYubGVuZ3RoID4gMVxuICAgICAgICAgIHMgKz0gJ3MnXG4gICAgICAgIHJldHVybiBzICsgXCIuIFwiXG4gICAgICB2aXNpYmxlOiAodikgLT5cbiAgICAgICAgdj8gYW5kIHBhcnNlSW50KHYpID4gMFxuICAgIFwiLmVycm9yc1wiOlxuICAgICAgb2JzZXJ2ZTogJ2Vycm9yJ1xuICAgICAgdXBkYXRlVmlldzogdHJ1ZVxuICAgICAgdmlzaWJsZTogKHYpIC0+XG4gICAgICAgIHY/Lmxlbmd0aCA+IDJcbiAgICAgIG9uR2V0OiAodikgLT5cbiAgICAgICAgaWYgdj9cbiAgICAgICAgICBKU09OLnN0cmluZ2lmeSh2LCBudWxsLCAnICAnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgbnVsbFxuXG4gIGNvbnN0cnVjdG9yOiAoQG1vZGVsKSAtPlxuICAgIHN1cGVyKClcblxuICByZW5kZXI6ICgpIC0+XG4gICAgQCRlbC5odG1sIFwiXCJcIlxuICAgICAgPGg2PjxhIGhyZWY9XCIjXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PC9hPjxzcGFuIGNsYXNzPVwic3RhdHVzXCI+PC9zcGFuPjwvaDY+XG4gICAgICA8ZGl2PlxuICAgICAgICA8c3BhbiBjbGFzcz1cInN0YXJ0ZWRBdFwiPjwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJxdWV1ZUxlbmd0aFwiPjwvc3Bhbj5cbiAgICAgICAgPHByZSBjbGFzcz1cImVycm9yc1wiPjwvcHJlPlxuICAgICAgPC9kaXY+XG4gICAgXCJcIlwiXG4gICAgQHN0aWNraXQoKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvYkl0ZW0iLCJjbGFzcyBSZXBvcnRSZXN1bHRzIGV4dGVuZHMgQmFja2JvbmUuQ29sbGVjdGlvblxuXG4gIGRlZmF1bHRQb2xsaW5nSW50ZXJ2YWw6IDMwMDBcblxuICBjb25zdHJ1Y3RvcjogKEBza2V0Y2gsIEBkZXBzKSAtPlxuICAgIEB1cmwgPSB1cmwgPSBcIi9yZXBvcnRzLyN7QHNrZXRjaC5pZH0vI3tAZGVwcy5qb2luKCcsJyl9XCJcbiAgICBzdXBlcigpXG5cbiAgcG9sbDogKCkgPT5cbiAgICBAZmV0Y2gge1xuICAgICAgc3VjY2VzczogKCkgPT5cbiAgICAgICAgQHRyaWdnZXIgJ2pvYnMnXG4gICAgICAgIGZvciByZXN1bHQgaW4gQG1vZGVsc1xuICAgICAgICAgIGlmIHJlc3VsdC5nZXQoJ3N0YXR1cycpIG5vdCBpbiBbJ2NvbXBsZXRlJywgJ2Vycm9yJ11cbiAgICAgICAgICAgIHVubGVzcyBAaW50ZXJ2YWxcbiAgICAgICAgICAgICAgQGludGVydmFsID0gc2V0SW50ZXJ2YWwgQHBvbGwsIEBkZWZhdWx0UG9sbGluZ0ludGVydmFsXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICBjb25zb2xlLmxvZyBAbW9kZWxzWzBdLmdldCgncGF5bG9hZFNpemVCeXRlcycpXG4gICAgICAgICAgcGF5bG9hZFNpemUgPSBNYXRoLnJvdW5kKCgoQG1vZGVsc1swXS5nZXQoJ3BheWxvYWRTaXplQnl0ZXMnKSBvciAwKSAvIDEwMjQpICogMTAwKSAvIDEwMFxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiRmVhdHVyZVNldCBzZW50IHRvIEdQIHdlaWdoZWQgaW4gYXQgI3twYXlsb2FkU2l6ZX1rYlwiXG4gICAgICAgICMgYWxsIGNvbXBsZXRlIHRoZW5cbiAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoQGludGVydmFsKSBpZiBAaW50ZXJ2YWxcbiAgICAgICAgaWYgcHJvYmxlbSA9IF8uZmluZChAbW9kZWxzLCAocikgLT4gci5nZXQoJ2Vycm9yJyk/KVxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIFwiUHJvYmxlbSB3aXRoICN7cHJvYmxlbS5nZXQoJ3NlcnZpY2VOYW1lJyl9IGpvYlwiXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBAdHJpZ2dlciAnZmluaXNoZWQnXG4gICAgICBlcnJvcjogKGUsIHJlcywgYSwgYikgPT5cbiAgICAgICAgdW5sZXNzIHJlcy5zdGF0dXMgaXMgMFxuICAgICAgICAgIGlmIHJlcy5yZXNwb25zZVRleHQ/Lmxlbmd0aFxuICAgICAgICAgICAgdHJ5XG4gICAgICAgICAgICAgIGpzb24gPSBKU09OLnBhcnNlKHJlcy5yZXNwb25zZVRleHQpXG4gICAgICAgICAgICBjYXRjaFxuICAgICAgICAgICAgICAjIGRvIG5vdGhpbmdcbiAgICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbChAaW50ZXJ2YWwpIGlmIEBpbnRlcnZhbFxuICAgICAgICAgIEB0cmlnZ2VyICdlcnJvcicsIGpzb24/LmVycm9yPy5tZXNzYWdlIG9yXG4gICAgICAgICAgICAnUHJvYmxlbSBjb250YWN0aW5nIHRoZSBTZWFTa2V0Y2ggc2VydmVyJ1xuICAgIH1cblxubW9kdWxlLmV4cG9ydHMgPSBSZXBvcnRSZXN1bHRzXG4iLCJlbmFibGVMYXllclRvZ2dsZXJzID0gcmVxdWlyZSAnLi9lbmFibGVMYXllclRvZ2dsZXJzLmNvZmZlZSdcbnJvdW5kID0gcmVxdWlyZSgnLi91dGlscy5jb2ZmZWUnKS5yb3VuZFxuUmVwb3J0UmVzdWx0cyA9IHJlcXVpcmUgJy4vcmVwb3J0UmVzdWx0cy5jb2ZmZWUnXG50ID0gcmVxdWlyZSgnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcycpXG50ZW1wbGF0ZXMgPVxuICByZXBvcnRMb2FkaW5nOiB0Wydub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvcmVwb3J0TG9hZGluZyddXG5Kb2JJdGVtID0gcmVxdWlyZSAnLi9qb2JJdGVtLmNvZmZlZSdcbkNvbGxlY3Rpb25WaWV3ID0gcmVxdWlyZSgndmlld3MvY29sbGVjdGlvblZpZXcnKVxuXG5jbGFzcyBSZWNvcmRTZXRcblxuICBjb25zdHJ1Y3RvcjogKEBkYXRhLCBAdGFiLCBAc2tldGNoQ2xhc3NJZCkgLT5cblxuICB0b0FycmF5OiAoKSAtPlxuICAgIGlmIEBza2V0Y2hDbGFzc0lkXG4gICAgICBkYXRhID0gXy5maW5kIEBkYXRhLnZhbHVlLCAodikgPT5cbiAgICAgICAgdi5mZWF0dXJlcz9bMF0/LmF0dHJpYnV0ZXM/WydTQ19JRCddIGlzIEBza2V0Y2hDbGFzc0lkXG4gICAgICB1bmxlc3MgZGF0YVxuICAgICAgICB0aHJvdyBcIkNvdWxkIG5vdCBmaW5kIGRhdGEgZm9yIHNrZXRjaENsYXNzICN7QHNrZXRjaENsYXNzSWR9XCJcbiAgICBlbHNlXG4gICAgICBpZiBfLmlzQXJyYXkgQGRhdGEudmFsdWVcbiAgICAgICAgZGF0YSA9IEBkYXRhLnZhbHVlWzBdXG4gICAgICBlbHNlXG4gICAgICAgIGRhdGEgPSBAZGF0YS52YWx1ZVxuICAgIF8ubWFwIGRhdGEuZmVhdHVyZXMsIChmZWF0dXJlKSAtPlxuICAgICAgZmVhdHVyZS5hdHRyaWJ1dGVzXG5cbiAgcmF3OiAoYXR0cikgLT5cbiAgICBhdHRycyA9IF8ubWFwIEB0b0FycmF5KCksIChyb3cpIC0+XG4gICAgICByb3dbYXR0cl1cbiAgICBhdHRycyA9IF8uZmlsdGVyIGF0dHJzLCAoYXR0cikgLT4gYXR0ciAhPSB1bmRlZmluZWRcbiAgICBpZiBhdHRycy5sZW5ndGggaXMgMFxuICAgICAgY29uc29sZS5sb2cgQGRhdGFcbiAgICAgIEB0YWIucmVwb3J0RXJyb3IgXCJDb3VsZCBub3QgZ2V0IGF0dHJpYnV0ZSAje2F0dHJ9IGZyb20gcmVzdWx0c1wiXG4gICAgICB0aHJvdyBcIkNvdWxkIG5vdCBnZXQgYXR0cmlidXRlICN7YXR0cn1cIlxuICAgIGVsc2UgaWYgYXR0cnMubGVuZ3RoIGlzIDFcbiAgICAgIHJldHVybiBhdHRyc1swXVxuICAgIGVsc2VcbiAgICAgIHJldHVybiBhdHRyc1xuXG4gIGludDogKGF0dHIpIC0+XG4gICAgcmF3ID0gQHJhdyhhdHRyKVxuICAgIGlmIF8uaXNBcnJheShyYXcpXG4gICAgICBfLm1hcCByYXcsIHBhcnNlSW50XG4gICAgZWxzZVxuICAgICAgcGFyc2VJbnQocmF3KVxuXG4gIGZsb2F0OiAoYXR0ciwgZGVjaW1hbFBsYWNlcz0yKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiByb3VuZCh2YWwsIGRlY2ltYWxQbGFjZXMpXG4gICAgZWxzZVxuICAgICAgcm91bmQocmF3LCBkZWNpbWFsUGxhY2VzKVxuXG4gIGJvb2w6IChhdHRyKSAtPlxuICAgIHJhdyA9IEByYXcoYXR0cilcbiAgICBpZiBfLmlzQXJyYXkocmF3KVxuICAgICAgXy5tYXAgcmF3LCAodmFsKSAtPiB2YWwudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpIGlzICd0cnVlJ1xuICAgIGVsc2VcbiAgICAgIHJhdy50b1N0cmluZygpLnRvTG93ZXJDYXNlKCkgaXMgJ3RydWUnXG5cbmNsYXNzIFJlcG9ydFRhYiBleHRlbmRzIEJhY2tib25lLlZpZXdcbiAgbmFtZTogJ0luZm9ybWF0aW9uJ1xuICBkZXBlbmRlbmNpZXM6IFtdXG5cbiAgaW5pdGlhbGl6ZTogKEBtb2RlbCwgQG9wdGlvbnMpIC0+XG4gICAgIyBXaWxsIGJlIGluaXRpYWxpemVkIGJ5IFNlYVNrZXRjaCB3aXRoIHRoZSBmb2xsb3dpbmcgYXJndW1lbnRzOlxuICAgICMgICAqIG1vZGVsIC0gVGhlIHNrZXRjaCBiZWluZyByZXBvcnRlZCBvblxuICAgICMgICAqIG9wdGlvbnNcbiAgICAjICAgICAtIC5wYXJlbnQgLSB0aGUgcGFyZW50IHJlcG9ydCB2aWV3XG4gICAgIyAgICAgICAgY2FsbCBAb3B0aW9ucy5wYXJlbnQuZGVzdHJveSgpIHRvIGNsb3NlIHRoZSB3aG9sZSByZXBvcnQgd2luZG93XG4gICAgQGFwcCA9IHdpbmRvdy5hcHBcbiAgICBfLmV4dGVuZCBALCBAb3B0aW9uc1xuICAgIEByZXBvcnRSZXN1bHRzID0gbmV3IFJlcG9ydFJlc3VsdHMoQG1vZGVsLCBAZGVwZW5kZW5jaWVzKVxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdlcnJvcicsIEByZXBvcnRFcnJvclxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdqb2JzJywgQHJlbmRlckpvYkRldGFpbHNcbiAgICBAbGlzdGVuVG9PbmNlIEByZXBvcnRSZXN1bHRzLCAnam9icycsIEByZXBvcnRKb2JzXG4gICAgQGxpc3RlblRvIEByZXBvcnRSZXN1bHRzLCAnZmluaXNoZWQnLCBfLmJpbmQgQHJlbmRlciwgQFxuICAgIEBsaXN0ZW5Ub09uY2UgQHJlcG9ydFJlc3VsdHMsICdyZXF1ZXN0JywgQHJlcG9ydFJlcXVlc3RlZFxuXG4gIHJlbmRlcjogKCkgLT5cbiAgICB0aHJvdyAncmVuZGVyIG1ldGhvZCBtdXN0IGJlIG92ZXJpZGRlbidcblxuICBzaG93OiAoKSAtPlxuICAgIEAkZWwuc2hvdygpXG4gICAgQHZpc2libGUgPSB0cnVlXG4gICAgaWYgQGRlcGVuZGVuY2llcz8ubGVuZ3RoIGFuZCAhQHJlcG9ydFJlc3VsdHMubW9kZWxzLmxlbmd0aFxuICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgZWxzZSBpZiAhQGRlcGVuZGVuY2llcz8ubGVuZ3RoXG4gICAgICBAcmVuZGVyKClcbiAgICAgIEAkKCdbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcmxGaWVsZF0gLnZhbHVlLCBbZGF0YS1hdHRyaWJ1dGUtdHlwZT1VcGxvYWRGaWVsZF0gLnZhbHVlJykuZWFjaCAoKSAtPlxuICAgICAgICB0ZXh0ID0gJChAKS50ZXh0KClcbiAgICAgICAgaHRtbCA9IFtdXG4gICAgICAgIGZvciB1cmwgaW4gdGV4dC5zcGxpdCgnLCcpXG4gICAgICAgICAgaWYgdXJsLmxlbmd0aFxuICAgICAgICAgICAgbmFtZSA9IF8ubGFzdCh1cmwuc3BsaXQoJy8nKSlcbiAgICAgICAgICAgIGh0bWwucHVzaCBcIlwiXCI8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPVwiI3t1cmx9XCI+I3tuYW1lfTwvYT5cIlwiXCJcbiAgICAgICAgJChAKS5odG1sIGh0bWwuam9pbignLCAnKVxuXG5cbiAgaGlkZTogKCkgLT5cbiAgICBAJGVsLmhpZGUoKVxuICAgIEB2aXNpYmxlID0gZmFsc2VcblxuICByZW1vdmU6ICgpID0+XG4gICAgd2luZG93LmNsZWFySW50ZXJ2YWwgQGV0YUludGVydmFsXG4gICAgQHN0b3BMaXN0ZW5pbmcoKVxuICAgIHN1cGVyKClcblxuICByZXBvcnRSZXF1ZXN0ZWQ6ICgpID0+XG4gICAgQCRlbC5odG1sIHRlbXBsYXRlcy5yZXBvcnRMb2FkaW5nLnJlbmRlcih7fSlcblxuICByZXBvcnRFcnJvcjogKG1zZywgY2FuY2VsbGVkUmVxdWVzdCkgPT5cbiAgICB1bmxlc3MgY2FuY2VsbGVkUmVxdWVzdFxuICAgICAgaWYgbXNnIGlzICdKT0JfRVJST1InXG4gICAgICAgIEBzaG93RXJyb3IgJ0Vycm9yIHdpdGggc3BlY2lmaWMgam9iJ1xuICAgICAgZWxzZVxuICAgICAgICBAc2hvd0Vycm9yIG1zZ1xuXG4gIHNob3dFcnJvcjogKG1zZykgPT5cbiAgICBAJCgnLnByb2dyZXNzJykucmVtb3ZlKClcbiAgICBAJCgncC5lcnJvcicpLnJlbW92ZSgpXG4gICAgQCQoJ2g0JykudGV4dChcIkFuIEVycm9yIE9jY3VycmVkXCIpLmFmdGVyIFwiXCJcIlxuICAgICAgPHAgY2xhc3M9XCJlcnJvclwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+I3ttc2d9PC9wPlxuICAgIFwiXCJcIlxuXG4gIHJlcG9ydEpvYnM6ICgpID0+XG4gICAgdW5sZXNzIEBtYXhFdGFcbiAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICBAJCgnaDQnKS50ZXh0IFwiQW5hbHl6aW5nIERlc2lnbnNcIlxuXG4gIHN0YXJ0RXRhQ291bnRkb3duOiAoKSA9PlxuICAgIGlmIEBtYXhFdGFcbiAgICAgIF8uZGVsYXkgKCkgPT5cbiAgICAgICAgQHJlcG9ydFJlc3VsdHMucG9sbCgpXG4gICAgICAsIChAbWF4RXRhICsgMSkgKiAxMDAwXG4gICAgICBfLmRlbGF5ICgpID0+XG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLmNzcyAndHJhbnNpdGlvbi10aW1pbmctZnVuY3Rpb24nLCAnbGluZWFyJ1xuICAgICAgICBAJCgnLnByb2dyZXNzIC5iYXInKS5jc3MgJ3RyYW5zaXRpb24tZHVyYXRpb24nLCBcIiN7QG1heEV0YSArIDF9c1wiXG4gICAgICAgIEAkKCcucHJvZ3Jlc3MgLmJhcicpLndpZHRoKCcxMDAlJylcbiAgICAgICwgNTAwXG5cbiAgcmVuZGVySm9iRGV0YWlsczogKCkgPT5cbiAgICBtYXhFdGEgPSBudWxsXG4gICAgZm9yIGpvYiBpbiBAcmVwb3J0UmVzdWx0cy5tb2RlbHNcbiAgICAgIGlmIGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgICAgICBpZiAhbWF4RXRhIG9yIGpvYi5nZXQoJ2V0YVNlY29uZHMnKSA+IG1heEV0YVxuICAgICAgICAgIG1heEV0YSA9IGpvYi5nZXQoJ2V0YVNlY29uZHMnKVxuICAgIGlmIG1heEV0YVxuICAgICAgQG1heEV0YSA9IG1heEV0YVxuICAgICAgQCQoJy5wcm9ncmVzcyAuYmFyJykud2lkdGgoJzUlJylcbiAgICAgIEBzdGFydEV0YUNvdW50ZG93bigpXG5cbiAgICBAJCgnW3JlbD1kZXRhaWxzXScpLmNzcygnZGlzcGxheScsICdibG9jaycpXG4gICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5jbGljayAoZSkgPT5cbiAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgQCQoJ1tyZWw9ZGV0YWlsc10nKS5oaWRlKClcbiAgICAgIEAkKCcuZGV0YWlscycpLnNob3coKVxuICAgIGZvciBqb2IgaW4gQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICBpdGVtID0gbmV3IEpvYkl0ZW0oam9iKVxuICAgICAgaXRlbS5yZW5kZXIoKVxuICAgICAgQCQoJy5kZXRhaWxzJykuYXBwZW5kIGl0ZW0uZWxcblxuICBnZXRSZXN1bHQ6IChpZCkgLT5cbiAgICByZXN1bHRzID0gQGdldFJlc3VsdHMoKVxuICAgIHJlc3VsdCA9IF8uZmluZCByZXN1bHRzLCAocikgLT4gci5wYXJhbU5hbWUgaXMgaWRcbiAgICB1bmxlc3MgcmVzdWx0P1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByZXN1bHQgd2l0aCBpZCAnICsgaWQpXG4gICAgcmVzdWx0LnZhbHVlXG5cbiAgZ2V0Rmlyc3RSZXN1bHQ6IChwYXJhbSwgaWQpIC0+XG4gICAgcmVzdWx0ID0gQGdldFJlc3VsdChwYXJhbSlcbiAgICB0cnlcbiAgICAgIHJldHVybiByZXN1bHRbMF0uZmVhdHVyZXNbMF0uYXR0cmlidXRlc1tpZF1cbiAgICBjYXRjaCBlXG4gICAgICB0aHJvdyBcIkVycm9yIGZpbmRpbmcgI3twYXJhbX06I3tpZH0gaW4gZ3AgcmVzdWx0c1wiXG5cbiAgZ2V0UmVzdWx0czogKCkgLT5cbiAgICByZXN1bHRzID0gQHJlcG9ydFJlc3VsdHMubWFwKChyZXN1bHQpIC0+IHJlc3VsdC5nZXQoJ3Jlc3VsdCcpLnJlc3VsdHMpXG4gICAgdW5sZXNzIHJlc3VsdHM/Lmxlbmd0aFxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncCByZXN1bHRzJylcbiAgICBfLmZpbHRlciByZXN1bHRzLCAocmVzdWx0KSAtPlxuICAgICAgcmVzdWx0LnBhcmFtTmFtZSBub3QgaW4gWydSZXN1bHRDb2RlJywgJ1Jlc3VsdE1zZyddXG5cbiAgcmVjb3JkU2V0OiAoZGVwZW5kZW5jeSwgcGFyYW1OYW1lLCBza2V0Y2hDbGFzc0lkPWZhbHNlKSAtPlxuICAgIHVubGVzcyBkZXBlbmRlbmN5IGluIEBkZXBlbmRlbmNpZXNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIlVua25vd24gZGVwZW5kZW5jeSAje2RlcGVuZGVuY3l9XCJcbiAgICBkZXAgPSBAcmVwb3J0UmVzdWx0cy5maW5kIChyKSAtPiByLmdldCgnc2VydmljZU5hbWUnKSBpcyBkZXBlbmRlbmN5XG4gICAgdW5sZXNzIGRlcFxuICAgICAgY29uc29sZS5sb2cgQHJlcG9ydFJlc3VsdHMubW9kZWxzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IgXCJDb3VsZCBub3QgZmluZCByZXN1bHRzIGZvciAje2RlcGVuZGVuY3l9LlwiXG4gICAgcGFyYW0gPSBfLmZpbmQgZGVwLmdldCgncmVzdWx0JykucmVzdWx0cywgKHBhcmFtKSAtPlxuICAgICAgcGFyYW0ucGFyYW1OYW1lIGlzIHBhcmFtTmFtZVxuICAgIHVubGVzcyBwYXJhbVxuICAgICAgY29uc29sZS5sb2cgZGVwLmdldCgnZGF0YScpLnJlc3VsdHNcbiAgICAgIHRocm93IG5ldyBFcnJvciBcIkNvdWxkIG5vdCBmaW5kIHBhcmFtICN7cGFyYW1OYW1lfSBpbiAje2RlcGVuZGVuY3l9XCJcbiAgICBuZXcgUmVjb3JkU2V0KHBhcmFtLCBALCBza2V0Y2hDbGFzc0lkKVxuXG4gIGVuYWJsZVRhYmxlUGFnaW5nOiAoKSAtPlxuICAgIEAkKCdbZGF0YS1wYWdpbmddJykuZWFjaCAoKSAtPlxuICAgICAgJHRhYmxlID0gJChAKVxuICAgICAgcGFnZVNpemUgPSAkdGFibGUuZGF0YSgncGFnaW5nJylcbiAgICAgIHJvd3MgPSAkdGFibGUuZmluZCgndGJvZHkgdHInKS5sZW5ndGhcbiAgICAgIHBhZ2VzID0gTWF0aC5jZWlsKHJvd3MgLyBwYWdlU2l6ZSlcbiAgICAgIGlmIHBhZ2VzID4gMVxuICAgICAgICAkdGFibGUuYXBwZW5kIFwiXCJcIlxuICAgICAgICAgIDx0Zm9vdD5cbiAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgPHRkIGNvbHNwYW49XCIjeyR0YWJsZS5maW5kKCd0aGVhZCB0aCcpLmxlbmd0aH1cIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwicGFnaW5hdGlvblwiPlxuICAgICAgICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5QcmV2PC9hPjwvbGk+XG4gICAgICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICA8L3Rmb290PlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgdWwgPSAkdGFibGUuZmluZCgndGZvb3QgdWwnKVxuICAgICAgICBmb3IgaSBpbiBfLnJhbmdlKDEsIHBhZ2VzICsgMSlcbiAgICAgICAgICB1bC5hcHBlbmQgXCJcIlwiXG4gICAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj4je2l9PC9hPjwvbGk+XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHVsLmFwcGVuZCBcIlwiXCJcbiAgICAgICAgICA8bGk+PGEgaHJlZj1cIiNcIj5OZXh0PC9hPjwvbGk+XG4gICAgICAgIFwiXCJcIlxuICAgICAgICAkdGFibGUuZmluZCgnbGkgYScpLmNsaWNrIChlKSAtPlxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgICAgICRhID0gJCh0aGlzKVxuICAgICAgICAgIHRleHQgPSAkYS50ZXh0KClcbiAgICAgICAgICBpZiB0ZXh0IGlzICdOZXh0J1xuICAgICAgICAgICAgYSA9ICRhLnBhcmVudCgpLnBhcmVudCgpLmZpbmQoJy5hY3RpdmUnKS5uZXh0KCkuZmluZCgnYScpXG4gICAgICAgICAgICB1bmxlc3MgYS50ZXh0KCkgaXMgJ05leHQnXG4gICAgICAgICAgICAgIGEuY2xpY2soKVxuICAgICAgICAgIGVsc2UgaWYgdGV4dCBpcyAnUHJldidcbiAgICAgICAgICAgIGEgPSAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucHJldigpLmZpbmQoJ2EnKVxuICAgICAgICAgICAgdW5sZXNzIGEudGV4dCgpIGlzICdQcmV2J1xuICAgICAgICAgICAgICBhLmNsaWNrKClcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAkYS5wYXJlbnQoKS5wYXJlbnQoKS5maW5kKCcuYWN0aXZlJykucmVtb3ZlQ2xhc3MgJ2FjdGl2ZSdcbiAgICAgICAgICAgICRhLnBhcmVudCgpLmFkZENsYXNzICdhY3RpdmUnXG4gICAgICAgICAgICBuID0gcGFyc2VJbnQodGV4dClcbiAgICAgICAgICAgICR0YWJsZS5maW5kKCd0Ym9keSB0cicpLmhpZGUoKVxuICAgICAgICAgICAgb2Zmc2V0ID0gcGFnZVNpemUgKiAobiAtIDEpXG4gICAgICAgICAgICAkdGFibGUuZmluZChcInRib2R5IHRyXCIpLnNsaWNlKG9mZnNldCwgbipwYWdlU2l6ZSkuc2hvdygpXG4gICAgICAgICQoJHRhYmxlLmZpbmQoJ2xpIGEnKVsxXSkuY2xpY2soKVxuXG4gICAgICBpZiBub1Jvd3NNZXNzYWdlID0gJHRhYmxlLmRhdGEoJ25vLXJvd3MnKVxuICAgICAgICBpZiByb3dzIGlzIDBcbiAgICAgICAgICBwYXJlbnQgPSAkdGFibGUucGFyZW50KClcbiAgICAgICAgICAkdGFibGUucmVtb3ZlKClcbiAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2xhc3MgJ3RhYmxlQ29udGFpbmVyJ1xuICAgICAgICAgIHBhcmVudC5hcHBlbmQgXCI8cD4je25vUm93c01lc3NhZ2V9PC9wPlwiXG5cbiAgZW5hYmxlTGF5ZXJUb2dnbGVyczogKCkgLT5cbiAgICBlbmFibGVMYXllclRvZ2dsZXJzKEAkZWwpXG5cbiAgZ2V0Q2hpbGRyZW46IChza2V0Y2hDbGFzc0lkKSAtPlxuICAgIF8uZmlsdGVyIEBjaGlsZHJlbiwgKGNoaWxkKSAtPiBjaGlsZC5nZXRTa2V0Y2hDbGFzcygpLmlkIGlzIHNrZXRjaENsYXNzSWRcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcG9ydFRhYlxuIiwibW9kdWxlLmV4cG9ydHMgPVxuICBcbiAgcm91bmQ6IChudW1iZXIsIGRlY2ltYWxQbGFjZXMpIC0+XG4gICAgdW5sZXNzIF8uaXNOdW1iZXIgbnVtYmVyXG4gICAgICBudW1iZXIgPSBwYXJzZUZsb2F0KG51bWJlcilcbiAgICBtdWx0aXBsaWVyID0gTWF0aC5wb3cgMTAsIGRlY2ltYWxQbGFjZXNcbiAgICBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllciIsInRoaXNbXCJUZW1wbGF0ZXNcIl0gPSB0aGlzW1wiVGVtcGxhdGVzXCJdIHx8IHt9O1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZUl0ZW1cIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7Xy5iKFwiPHRyIGRhdGEtYXR0cmlidXRlLWlkPVxcXCJcIik7Xy5iKF8udihfLmYoXCJpZFwiLGMscCwwKSkpO18uYihcIlxcXCIgZGF0YS1hdHRyaWJ1dGUtZXhwb3J0aWQ9XFxcIlwiKTtfLmIoXy52KF8uZihcImV4cG9ydGlkXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiBkYXRhLWF0dHJpYnV0ZS10eXBlPVxcXCJcIik7Xy5iKF8udihfLmYoXCJ0eXBlXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDx0ZCBjbGFzcz1cXFwibmFtZVxcXCI+XCIpO18uYihfLnYoXy5mKFwibmFtZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8dGQgY2xhc3M9XFxcInZhbHVlXFxcIj5cIik7Xy5iKF8udihfLmYoXCJmb3JtYXR0ZWRWYWx1ZVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC90cj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9hdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCI8dGFibGUgY2xhc3M9XFxcImF0dHJpYnV0ZXNcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJhdHRyaWJ1dGVzXCIsYyxwLDEpLGMscCwwLDQ0LDEyMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoIV8ucyhfLmYoXCJkb05vdEV4cG9ydFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihfLnJwKFwiYXR0cmlidXRlcy9hdHRyaWJ1dGVJdGVtXCIsYyxwLFwiICAgIFwiKSk7fTt9KTtjLnBvcCgpO31fLmIoXCI8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7cmV0dXJuIF8uZmwoKTs7fSk7XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wibm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL2dlbmVyaWNBdHRyaWJ1dGVzXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO2lmKF8ucyhfLmQoXCJza2V0Y2hDbGFzcy5kZWxldGVkXCIsYyxwLDEpLGMscCwwLDI0LDI3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwiYWxlcnQgYWxlcnQtd2FyblxcXCIgc3R5bGU9XFxcIm1hcmdpbi1ib3R0b206MTBweDtcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgVGhpcyBza2V0Y2ggd2FzIGNyZWF0ZWQgdXNpbmcgdGhlIFxcXCJcIik7Xy5iKF8udihfLmQoXCJza2V0Y2hDbGFzcy5uYW1lXCIsYyxwLDApKSk7Xy5iKFwiXFxcIiB0ZW1wbGF0ZSwgd2hpY2ggaXNcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIG5vIGxvbmdlciBhdmFpbGFibGUuIFlvdSB3aWxsIG5vdCBiZSBhYmxlIHRvIGNvcHkgdGhpcyBza2V0Y2ggb3IgbWFrZSBuZXdcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIHNrZXRjaGVzIG9mIHRoaXMgdHlwZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlwiKTtfLmIoXy52KF8uZChcInNrZXRjaENsYXNzLm5hbWVcIixjLHAsMCkpKTtfLmIoXCIgQXR0cmlidXRlczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKF8ucnAoXCJhdHRyaWJ1dGVzL2F0dHJpYnV0ZXNUYWJsZVwiLGMscCxcIiAgICBcIikpO18uYihcIiAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm5vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS9yZXBvcnRMb2FkaW5nXCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydExvYWRpbmdcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPCEtLSA8ZGl2IGNsYXNzPVxcXCJzcGlubmVyXFxcIj4zPC9kaXY+IC0tPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlJlcXVlc3RpbmcgUmVwb3J0IGZyb20gU2VydmVyPC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBjbGFzcz1cXFwiYmFyXFxcIiBzdHlsZT1cXFwid2lkdGg6IDEwMCU7XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGEgaHJlZj1cXFwiI1xcXCIgcmVsPVxcXCJkZXRhaWxzXFxcIj5kZXRhaWxzPC9hPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJkZXRhaWxzXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiKTtyZXR1cm4gXy5mbCgpOzt9KTtcblxuaWYodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IHRoaXNbXCJUZW1wbGF0ZXNcIl07XG59IiwiUmVwb3J0VGFiID0gcmVxdWlyZSAncmVwb3J0VGFiJ1xudGVtcGxhdGVzID0gcmVxdWlyZSAnLi4vdGVtcGxhdGVzL3RlbXBsYXRlcy5qcydcblxuX3BhcnRpYWxzID0gcmVxdWlyZSAnLi4vbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpL3RlbXBsYXRlcy90ZW1wbGF0ZXMuanMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5cbmQzID0gd2luZG93LmQzXG5cbmNsYXNzIEVudmlyb25tZW50VGFiIGV4dGVuZHMgUmVwb3J0VGFiXG4gIG5hbWU6ICdFbnZpcm9ubWVudCdcbiAgY2xhc3NOYW1lOiAnZW52aXJvbm1lbnQnXG4gIHRlbXBsYXRlOiB0ZW1wbGF0ZXMuZW52aXJvbm1lbnRcbiAgZGVwZW5kZW5jaWVzOlsgXG4gICAgJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCdcbiAgICAnTW9udHNlcnJhdENvcmFsVG9vbGJveCdcbiAgICAnTW9udHNlcnJhdFNuYXBBbmRHcm91cFRvb2xib3gnXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG5cbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKCkgICBcbiAgICBkM0lzUHJlc2VudCA9IHdpbmRvdy5kMyA/IHRydWUgIDogZmFsc2VcbiAgICBpZiBpc0NvbGxlY3Rpb25cbiAgICAgIGhhc1pvbmVXaXRoR29hbCA9IEBnZXRIYXNab25lV2l0aEdvYWwgQG1vZGVsLmdldENoaWxkcmVuKClcbiAgICAgIGhhc1NhbmN0dWFyeSA9IEBnZXRIYXNTYW5jdHVhcnlPclBhcnRpYWxUYWtlKEBtb2RlbC5nZXRDaGlsZHJlbigpLCBcIlNhbmN0dWFyeVwiKVxuICAgICAgaGFzUGFydGlhbFRha2UgPSBAZ2V0SGFzU2FuY3R1YXJ5T3JQYXJ0aWFsVGFrZShAbW9kZWwuZ2V0Q2hpbGRyZW4oKSwgXCJNYXJpbmUgUmVzZXJ2ZSAtIFBhcnRpYWwgVGFrZVwiKVxuICAgIGVsc2VcbiAgICAgIGhhc1pvbmVXaXRoR29hbCA9IEBnZXRIYXNab25lV2l0aEdvYWwoW0Btb2RlbF0pXG4gICAgICBoYXNTYW5jdHVhcnkgPSBAZ2V0SGFzU2FuY3R1YXJ5T3JQYXJ0aWFsVGFrZShbQG1vZGVsXSwgXCJTYW5jdHVhcnlcIilcbiAgICAgIGhhc1BhcnRpYWxUYWtlID0gQGdldEhhc1NhbmN0dWFyeU9yUGFydGlhbFRha2UoW0Btb2RlbF0sXCJNYXJpbmUgUmVzZXJ2ZSAtIFBhcnRpYWwgVGFrZVwiKVxuXG4gICAgY29uc29sZS5sb2coXCJoYXMgem9uZSB3aXRoIGdvYWw6IFwiLCBoYXNab25lV2l0aEdvYWwpXG4gICAgY29uc29sZS5sb2coXCJoYXMgc2FuYzogXCIsIGhhc1NhbmN0dWFyeSlcbiAgICBjb25zb2xlLmxvZyhcImhhcyBwdDogXCIsIGhhc1BhcnRpYWxUYWtlKVxuXG4gICAgaGFiaXRhdHMgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0SGFiaXRhdFRvb2xib3gnLCAnSGFiaXRhdHMnKS50b0FycmF5KClcbiAgICBoYWJpdGF0cyA9IF8uc29ydEJ5IGhhYml0YXRzLCAoaCkgLT4gIHBhcnNlRmxvYXQoaC5QRVJDKVxuICAgIGhhYml0YXRzID0gaGFiaXRhdHMucmV2ZXJzZSgpXG4gICAgQGFkZFRhcmdldCBoYWJpdGF0c1xuXG4gICAgc2FuY19oYWJpdGF0cyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRIYWJpdGF0VG9vbGJveCcsICdTYW5jdHVhcnlIYWJpdGF0cycpLnRvQXJyYXkoKVxuICAgIHNhbmNfaGFiaXRhdHMgPSBfLnNvcnRCeSBzYW5jX2hhYml0YXRzLCAoaCkgLT4gIHBhcnNlRmxvYXQoaC5QRVJDKVxuICAgIHNhbmNfaGFiaXRhdHMgPSBzYW5jX2hhYml0YXRzLnJldmVyc2UoKVxuICAgIEBhZGRUYXJnZXQgc2FuY19oYWJpdGF0c1xuICAgIFxuICAgIHB0X2hhYml0YXRzID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEhhYml0YXRUb29sYm94JywgJ1BhcnRpYWxUYWtlSGFiaXRhdHMnKS50b0FycmF5KClcbiAgICBwdF9oYWJpdGF0cyA9IF8uc29ydEJ5IHB0X2hhYml0YXRzLCAoaCkgLT4gIHBhcnNlRmxvYXQoaC5QRVJDKVxuICAgIHB0X2hhYml0YXRzID0gcHRfaGFiaXRhdHMucmV2ZXJzZSgpXG4gICAgQGFkZFRhcmdldCBwdF9oYWJpdGF0c1xuXG4gICAgY29uc29sZS5sb2coXCJzYW5jIGhhYml0YXRzOiBcIiwgc2FuY19oYWJpdGF0cylcbiAgICBjb25zb2xlLmxvZyhcInB0IGhhYml0YXRzOiBcIiwgcHRfaGFiaXRhdHMpXG4gICAgJycnXG4gICAgbm9nb2FsX2hhYml0YXRzID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEhhYml0YXRUb29sYm94JywgJ05vblJlc2VydmVIYWJpdGF0cycpLnRvQXJyYXkoKVxuICAgIG5vZ29hbF9oYWJpdGF0cyA9IF8uc29ydEJ5IG5vZ29hbF9oYWJpdGF0cywgKGgpIC0+ICBwYXJzZUZsb2F0KGguUEVSQylcbiAgICBub2dvYWxfaGFiaXRhdHMgPSBub2dvYWxfaGFiaXRhdHMucmV2ZXJzZSgpXG4gICAgJycnXG5cbiAgICBzYW5kZyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRTbmFwQW5kR3JvdXBUb29sYm94JywgJ1NuYXBBbmRHcm91cCcpLnRvQXJyYXkoKVswXVxuICAgIGFsbF9zYW5kZ192YWxzID0gQGdldEFsbFZhbHVlcyBzYW5kZy5ISVNUT1xuXG4gICAgJycnXG4gICAgaGVyYl9iaW8gPSBAcmVjb3JkU2V0KCdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnLCAnSGVyYml2b3JlQmlvbWFzcycpLnRvQXJyYXkoKVswXVxuICAgIGFsbF9oZXJiX3ZhbHMgPSBAZ2V0QWxsVmFsdWVzIGhlcmJfYmlvLkhJU1RPXG4gICAgQHJvdW5kVmFscyBoZXJiX2Jpb1xuXG4gICAgdG90YWxfYmlvID0gQHJlY29yZFNldCgnTW9udHNlcnJhdEJpb21hc3NUb29sYm94JywgJ1RvdGFsQmlvbWFzcycpLnRvQXJyYXkoKVswXVxuICAgIGFsbF90b3RhbF92YWx1ZXMgPSBAZ2V0QWxsVmFsdWVzIHRvdGFsX2Jpby5ISVNUT1xuICAgIEByb3VuZFZhbHMgdG90YWxfYmlvXG5cbiAgICBmaXNoX2JpbyA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCcsICdGaXNoQWJ1bmRhbmNlJykudG9BcnJheSgpWzBdXG4gICAgYWxsX2Zpc2hfdmFscyA9IEBnZXRBbGxWYWx1ZXMgZmlzaF9iaW8uSElTVE9cbiAgICBAcm91bmRWYWxzIGZpc2hfYmlvXG4gICAgJycnXG5cbiAgICBjb3JhbF9jb3VudCA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRDb3JhbFRvb2xib3gnLCAnQ29yYWwnKS50b0FycmF5KClcbiAgICBub2dvYWxfY29yYWxfY291bnQgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0Q29yYWxUb29sYm94JywgJ05vblJlc2VydmVDb3JhbCcpLnRvQXJyYXkoKVxuICAgICAgIFxuICAgIEByb3VuZERhdGEgaGFiaXRhdHNcbiAgICBAcm91bmREYXRhIHNhbmNfaGFiaXRhdHNcbiAgICBAcm91bmREYXRhIHB0X2hhYml0YXRzXG5cbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuXG4gICAgICBoYWJpdGF0czogaGFiaXRhdHNcbiAgICAgIHNhbmNfaGFiaXRhdHM6IHNhbmNfaGFiaXRhdHNcbiAgICAgIHB0X2hhYml0YXRzOiBwdF9oYWJpdGF0c1xuICAgICAgZDNJc1ByZXNlbnQ6IGQzSXNQcmVzZW50XG5cbiAgICAgICNoZXJiOiBoZXJiX2Jpb1xuICAgICAgI2Zpc2g6IGZpc2hfYmlvXG4gICAgICAjdG90YWw6IHRvdGFsX2Jpb1xuICAgICAgY29yYWxfY291bnQ6IGNvcmFsX2NvdW50XG4gICAgICBzYW5kZzogc2FuZGdcbiAgICAgIGhhc0QzOiB3aW5kb3cuZDNcbiAgICAgIGhhc1pvbmVXaXRoR29hbDogaGFzWm9uZVdpdGhHb2FsXG4gICAgICBoYXNTYW5jdHVhcnk6IGhhc1NhbmN0dWFyeVxuICAgICAgaGFzUGFydGlhbFRha2U6IGhhc1BhcnRpYWxUYWtlXG4gICAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuXG4gICAgQHJlbmRlckhpc3RvVmFsdWVzKHNhbmRnLCBhbGxfc2FuZGdfdmFscywgXCIuc2FuZGdfdml6XCIsIFwiIzY2Y2RhYVwiLFwiQWJ1bmRhbmNlIG9mIEp1dmVuaWxlIFNuYXBwZXIsIEdyb3VwZXIsIGFuZCBQYXJyb3RmaXNoXCIsIFwiQ291bnRcIiApXG4gICAgI0ByZW5kZXJIaXN0b1ZhbHVlcyhoZXJiX2JpbywgYWxsX2hlcmJfdmFscywgXCIuaGVyYl92aXpcIiwgXCIjNjZjZGFhXCIsXCJIZXJiaXZvcmUgQmlvbWFzcyAoZy9tXjIpXCIsIFwiQmlvbWFzcyBQZXIgVHJhbnNlY3RcIilcbiAgICAjQHJlbmRlckhpc3RvVmFsdWVzKHRvdGFsX2JpbywgYWxsX3RvdGFsX3ZhbHVlcywgXCIudG90YWxfdml6XCIsIFwiI2ZhODA3MlwiLCBcIlRvdGFsIEJpb21hc3MgKGcvbV4yKVwiLCBcIkJpb21hc3MgUGVyIFRyYW5zZWN0XCIpXG4gICAgI0ByZW5kZXJIaXN0b1ZhbHVlcyhmaXNoX2JpbywgYWxsX2Zpc2hfdmFscywgXCIuZmlzaF92aXpcIiwgXCIjNjg5N2JiXCIsIFwiVG90YWwgRmlzaCBDb3VudFwiLCBcIk51bWJlciBvZiBGaXNoIFNwZWNpZXNcIilcblxuICAgIEBkcmF3Q29yYWxCYXJzKGNvcmFsX2NvdW50LCAwKVxuICAgIEBkcmF3Q29yYWxCYXJzKG5vZ29hbF9jb3JhbF9jb3VudCwgMylcblxuXG5cbiAgZ2V0SGFzU2FuY3R1YXJ5T3JQYXJ0aWFsVGFrZTogKHNrZXRjaGVzLCB0YXJnZXQpID0+XG4gICAgem9uZXNXaXRoTm9Hb2FsQ291bnQgPSAwXG4gICAgZm9yIHNrZXRjaCBpbiBza2V0Y2hlc1xuICAgICAgZm9yIGF0dHIgaW4gc2tldGNoLmdldEF0dHJpYnV0ZXMoKVxuICAgICAgICBpZiBhdHRyLmV4cG9ydGlkID09IFwiWk9ORV9UWVBFXCJcbiAgICAgICAgICBjb25zb2xlLmxvZyhcImF0dHIgdmFsdWU6IFwiLCBhdHRyLnZhbHVlKVxuICAgICAgICAgIGlmIChhdHRyLnZhbHVlID09IHRhcmdldClcbiAgICAgICAgICAgIHpvbmVzV2l0aE5vR29hbENvdW50Kz0xXG5cbiAgICByZXR1cm4gem9uZXNXaXRoTm9Hb2FsQ291bnQgPiAwXG5cbiAgZ2V0SGFzWm9uZVdpdGhHb2FsOiAoc2tldGNoZXMpID0+XG4gICAgem9uZXNXaXRoR29hbENvdW50ID0gMFxuICAgIGZvciBza2V0Y2ggaW4gc2tldGNoZXNcbiAgICAgIGZvciBhdHRyIGluIHNrZXRjaC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgICAgaWYgYXR0ci5leHBvcnRpZCA9PSBcIlpPTkVfVFlQRVwiXG4gICAgICAgICAgaWYgKGF0dHIudmFsdWUgPT0gXCJTYW5jdHVhcnlcIiBvciBhdHRyLnZhbHVlID09IFwiTWFyaW5lIFJlc2VydmUgLSBQYXJ0aWFsIFRha2VcIilcbiAgICAgICAgICAgIHpvbmVzV2l0aEdvYWxDb3VudCs9MVxuICAgICAgICAgIFxuICAgIHJldHVybiB6b25lc1dpdGhHb2FsQ291bnQgPiAwXG5cblxuICBkcmF3Q29yYWxCYXJzOiAoY29yYWxfY291bnRzLCBzdGFydF9kZXgpID0+XG4gICAgIyBDaGVjayBpZiBkMyBpcyBwcmVzZW50LiBJZiBub3QsIHdlJ3JlIHByb2JhYmx5IGRlYWxpbmcgd2l0aCBJRVxuXG4gICAgICBpZiB3aW5kb3cuZDNcbiAgICAgICAgaXNDb2xsZWN0aW9uID0gQG1vZGVsLmlzQ29sbGVjdGlvbigpXG4gICAgICAgIHN1ZmZpeCA9IFwic2tldGNoXCJcbiAgICAgICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICAgICAgc3VmZml4PVwiY29sbGVjdGlvblwiXG4gICAgICAgIGZvciBjb3JhbCBpbiBjb3JhbF9jb3VudHNcbiAgICAgICAgICBcbiAgICAgICAgICBuYW1lID0gY29yYWwuTkFNRVxuICAgICAgICAgIGNvdW50ID0gcGFyc2VJbnQoY29yYWwuQ09VTlQpXG4gICAgICAgICAgdG90YWwgPSBwYXJzZUludChjb3JhbC5UT1QpXG4gICAgICAgICAgb3V0c2lkZV9za2V0Y2hfc3RhcnQgPSB0b3RhbCowLjQ4XG5cbiAgICAgICAgICBsYWJlbCA9IGNvdW50K1wiL1wiK3RvdGFsK1wiIG9mIHRoZSBrbm93biBvYnNlcnZhdGlvbnMgYXJlIGZvdW5kIHdpdGhpbiB0aGlzIFwiK3N1ZmZpeFxuICAgICAgICAgIHJhbmdlID0gW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZzogXCIjOGU1ZTUwXCJcbiAgICAgICAgICAgICAgc3RhcnQ6IDBcbiAgICAgICAgICAgICAgZW5kOiBjb3VudFxuICAgICAgICAgICAgICBjbGFzczogJ2luLXNrZXRjaCdcbiAgICAgICAgICAgICAgdmFsdWU6IGNvdW50XG4gICAgICAgICAgICAgIG5hbWU6IGxhYmVsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBiZzogJyNkZGRkZGQnXG4gICAgICAgICAgICAgIHN0YXJ0OiBjb3VudFxuICAgICAgICAgICAgICBlbmQ6IHRvdGFsXG4gICAgICAgICAgICAgIGNsYXNzOiAnb3V0c2lkZS1za2V0Y2gnXG4gICAgICAgICAgICAgIHZhbHVlOiB0b3RhbFxuICAgICAgICAgICAgICBsYWJlbF9zdGFydDogb3V0c2lkZV9za2V0Y2hfc3RhcnRcbiAgICAgICAgICAgICAgbmFtZTogJydcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdXG5cbiAgICAgICAgICBpZiBuYW1lID09IFwiT3JiaWNlbGxhIGFubnVsYXJpc1wiXG4gICAgICAgICAgICBpbmRleCA9IHN0YXJ0X2RleFxuICAgICAgICAgIGVsc2UgaWYgbmFtZSA9PSBcIk9yYmljZWxsYSBmYXZlb2xhdGFcIlxuICAgICAgICAgICAgaW5kZXggPSBzdGFydF9kZXgrMVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIGluZGV4ID0gc3RhcnRfZGV4KzJcblxuICAgICAgICAgIEBkcmF3QmFycyhyYW5nZSwgaW5kZXgsIHRvdGFsKVxuXG5cbiAgZHJhd0JhcnM6IChyYW5nZSwgaW5kZXgsIG1heF92YWx1ZSkgPT5cblxuICAgIGVsID0gQCQoJy52aXonKVtpbmRleF1cbiAgICB4ID0gZDMuc2NhbGUubGluZWFyKClcbiAgICAgIC5kb21haW4oWzAsIG1heF92YWx1ZV0pXG4gICAgICAucmFuZ2UoWzAsIDQwMF0pXG5cbiAgICBjaGFydCA9IGQzLnNlbGVjdChlbClcbiAgICBjaGFydC5zZWxlY3RBbGwoXCJkaXYucmFuZ2VcIilcbiAgICAgIC5kYXRhKHJhbmdlKVxuICAgIC5lbnRlcigpLmFwcGVuZChcImRpdlwiKVxuICAgICAgLnN0eWxlKFwid2lkdGhcIiwgKGQpIC0+IE1hdGgucm91bmQoeChkLmVuZCAtIGQuc3RhcnQpLDApICsgJ3B4JylcbiAgICAgIC5hdHRyKFwiY2xhc3NcIiwgKGQpIC0+IFwicmFuZ2UgXCIgKyBkLmNsYXNzKVxuICAgICAgLmFwcGVuZChcInNwYW5cIilcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiI3tkLm5hbWV9XCIpXG4gICAgICAgIC5zdHlsZShcImxlZnRcIiwgKGQpIC0+IGlmIGQubGFiZWxfc3RhcnQgdGhlbiB4KGQubGFiZWxfc3RhcnQpKydweCcgZWxzZSAnJylcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJsYWJlbC1cIitkLmNsYXNzKVxuXG4gIHJlbmRlckhpc3RvVmFsdWVzOiAoYmlvbWFzcywgaGlzdG9fdmFscywgZ3JhcGgsIGNvbG9yLCB4X2F4aXNfbGFiZWwsIGxlZ2VuZF9sYWJlbCkgPT5cbiAgICBpZiB3aW5kb3cuZDNcbiAgICAgIG1lYW4gPSBiaW9tYXNzLlNDT1JFXG4gICAgICBjb25zb2xlLmxvZyhcIm1lYW46IFwiLCBtZWFuKVxuICAgICAgYm1pbiA9IGJpb21hc3MuTUlOXG4gICAgICBibWF4ID0gYmlvbWFzcy5NQVhcblxuICAgICAgbGVuID0gaGlzdG9fdmFscy5sZW5ndGhcbiAgICAgIG1heF9oaXN0b192YWwgPSBoaXN0b192YWxzW2xlbi0xXVxuICAgICAgcXVhbnRpbGVfcmFuZ2UgPSB7XCJRMFwiOlwidmVyeSBsb3dcIiwgXCJRMjBcIjogXCJsb3dcIixcIlE0MFwiOiBcIm1pZFwiLFwiUTYwXCI6IFwiaGlnaFwiLFwiUTgwXCI6IFwidmVyeSBoaWdoXCJ9XG4gICAgICBxX2NvbG9ycyA9IFtcIiM0N2FlNDNcIiwgXCIjNmMwXCIsIFwiI2VlMFwiLCBcIiNlYjRcIiwgXCIjZWNiYjg5XCIsIFwiI2VlYWJhMFwiXVxuXG5cbiAgICAgIG51bV9iaW5zID0gMTBcbiAgICAgIGJpbl9zaXplID0gMTBcbiAgICAgIFxuICAgICAgcXVhbnRpbGVzID0gW11cbiAgICAgIG1heF9jb3VudF92YWwgPSAwXG4gICAgICBudW1faW5fYmlucyA9IE1hdGguY2VpbChsZW4vbnVtX2JpbnMpXG4gICAgICBpbmNyID0gbWF4X2hpc3RvX3ZhbC9udW1fYmluc1xuXG4gICAgICBmb3IgaSBpbiBbMC4uLm51bV9iaW5zXVxuICAgICAgICBcbiAgICAgICAgcV9zdGFydCA9IGkqYmluX3NpemVcbiAgICAgICAgcV9lbmQgPSBxX3N0YXJ0K2Jpbl9zaXplXG4gICAgICAgIG1pbiA9IGkqaW5jclxuICAgICAgICBtYXggPSBtaW4raW5jclxuICAgICAgICBjb3VudD0wXG5cbiAgICAgICAgI1RPRE86IGxvb2sgZm9yIGEgbW9yZSBlZmZpY2llbnQgd2F5IHRvIGRvIHRoaXNcbiAgICAgICAgZm9yIGh2IGluIGhpc3RvX3ZhbHNcbiAgICAgICAgICBpZiBodiA+PSBtaW4gYW5kIGh2IDwgbWF4XG4gICAgICAgICAgICBjb3VudCs9MVxuXG5cbiAgICAgICAgbWF4X2NvdW50X3ZhbCA9IE1hdGgubWF4KGNvdW50LCBtYXhfY291bnRfdmFsKVxuICAgICAgICBcbiAgICAgICAgdmFsID0ge1xuICAgICAgICAgIHN0YXJ0OiBxX3N0YXJ0XG4gICAgICAgICAgZW5kOiBxX2VuZFxuICAgICAgICAgIGJnOiBxX2NvbG9yc1tNYXRoLmZsb29yKGkvMildXG4gICAgICAgICAgYmluX2NvdW50OiBjb3VudFxuICAgICAgICAgIGJpbl9taW46IG1pblxuICAgICAgICAgIGJpbl9tYXg6IG1heFxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBxdWFudGlsZXMucHVzaCh2YWwpXG5cbiAgICBcbiAgICAgIEAkKGdyYXBoKS5odG1sKCcnKVxuICAgICAgZWwgPSBAJChncmFwaClbMF0gIFxuXG4gICAgICAjIEhpc3RvZ3JhbVxuICAgICAgbWFyZ2luID0gXG4gICAgICAgIHRvcDogNDBcbiAgICAgICAgcmlnaHQ6IDIwXG4gICAgICAgIGJvdHRvbTogNDBcbiAgICAgICAgbGVmdDogNDVcblxuICAgICAgd2lkdGggPSA0MDAgLSBtYXJnaW4ubGVmdCAtIG1hcmdpbi5yaWdodFxuICAgICAgI25vdGU6IHVzaW5nIHRoaXMgdG8gdHJhbnNsYXRlIHRoZSB4IGF4aXMgd2FzIGNhdXNpbmcgYSBwcm9ibGVtLFxuICAgICAgI3NvIGkganVzdCBoYXJkY29kZWQgaXQgZm9yIG5vdy4uLlxuICAgICAgaGVpZ2h0ID0gMzUwIC0gbWFyZ2luLnRvcCAtIG1hcmdpbi5ib3R0b21cbiAgICAgIFxuICAgICAgeCA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5kb21haW4oWzAsIG1heF9oaXN0b192YWxdKVxuICAgICAgICAucmFuZ2UoWzAsIHdpZHRoXSlcblxuICAgICAgeSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgICAgIC5yYW5nZShbaGVpZ2h0LCAwXSlcbiAgICAgICAgLmRvbWFpbihbMCwgbWF4X2NvdW50X3ZhbF0pXG5cbiAgICAgIHhBeGlzID0gZDMuc3ZnLmF4aXMoKVxuICAgICAgICAuc2NhbGUoeClcbiAgICAgICAgLm9yaWVudChcImJvdHRvbVwiKVxuXG4gICAgICB5QXhpcyA9IGQzLnN2Zy5heGlzKClcbiAgICAgICAgLnNjYWxlKHkpXG4gICAgICAgIC5vcmllbnQoXCJsZWZ0XCIpXG5cbiAgICAgIG1pbl9tYXhfbGluZV95ID0gbWF4X2NvdW50X3ZhbCAtIDIwXG4gICAgICBzdmcgPSBkMy5zZWxlY3QoQCQoZ3JhcGgpWzBdKS5hcHBlbmQoXCJzdmdcIilcbiAgICAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCArIG1hcmdpbi5sZWZ0ICsgbWFyZ2luLnJpZ2h0KVxuICAgICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQgKyBtYXJnaW4udG9wICsgbWFyZ2luLmJvdHRvbSlcbiAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKCN7bWFyZ2luLmxlZnR9LCAje21hcmdpbi50b3B9KVwiKVxuXG4gICAgICBzdmcuYXBwZW5kKFwiZ1wiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwieCBheGlzXCIpXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwidHJhbnNsYXRlKDAsMjcwKVwiKVxuICAgICAgICAuY2FsbCh4QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCB3aWR0aCAvIDIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAwKVxuICAgICAgICAuYXR0cihcImR5XCIsIFwiM2VtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgIC50ZXh0KHhfYXhpc19sYWJlbClcblxuICAgICAgc3ZnLmFwcGVuZChcImdcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICAuY2FsbCh5QXhpcylcbiAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieVwiLCAtNDApXG4gICAgICAgIC5hdHRyKFwieFwiLCAtODApXG4gICAgICAgIC5hdHRyKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKC05MClcIilcbiAgICAgICAgLmF0dHIoXCJkeVwiLCBcIi43MWVtXCIpXG4gICAgICAgIC5zdHlsZShcInRleHQtYW5jaG9yXCIsIFwiZW5kXCIpXG4gICAgICAgIC50ZXh0KGxlZ2VuZF9sYWJlbClcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLmJhclwiKVxuICAgICAgICAgIC5kYXRhKHF1YW50aWxlcylcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJiYXJcIilcbiAgICAgICAgICAuYXR0cihcInhcIiwgKGQsIGkpIC0+IHgoZC5iaW5fbWluKSlcbiAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIChkKSAtPiB3aWR0aC9udW1fYmlucylcbiAgICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+IHkoZC5iaW5fY291bnQpKVxuICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIChkKSAtPiBoZWlnaHQgLSB5KGQuYmluX2NvdW50KSlcbiAgICAgICAgICAuc3R5bGUgJ2ZpbGwnLCAoZCkgLT4gY29sb3JcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlTGluZVwiKVxuICAgICAgICAgIC5kYXRhKFtwYXJzZUZsb2F0KG1lYW4pLnRvRml4ZWQoMildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJzY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDkpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLnNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW3BhcnNlRmxvYXQobWVhbikudG9GaXhlZCgyKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoKGQpKSAtIDYgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDkpICsgJ3B4JylcbiAgICAgICAgLnRleHQoXCLilrxcIilcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5zY29yZVRleHRcIilcbiAgICAgICAgICAuZGF0YShbcGFyc2VGbG9hdChtZWFuKS50b0ZpeGVkKDIpXSlcbiAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwic2NvcmVUZXh0XCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoZCkgLSAyMiApKyAncHgnKVxuICAgICAgICAuYXR0cihcInlcIiwgKGQpIC0+ICh5KG1heF9jb3VudF92YWwpIC0gMjIpICsgJ3B4JylcbiAgICAgICAgLnRleHQoKGQpIC0+IFwiTWVhbjogXCIrZClcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlTGluZVwiKVxuICAgICAgICAgIC5kYXRhKFtwYXJzZUZsb2F0KGJtaW4pLnRvRml4ZWQoMildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtaW5TY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDYpICsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ4MlwiLCAoZCkgLT4gKHgoZCkrICdweCcpKVxuICAgICAgICAuYXR0cihcInkyXCIsIChkKSAtPiBoZWlnaHQgKyAncHgnKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1pblNjb3JlXCIpXG4gICAgICAgICAgLmRhdGEoW3BhcnNlRmxvYXQoYm1pbikudG9GaXhlZCgyKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1pblNjb3JlXCIpXG4gICAgICAgIC5hdHRyKFwieFwiLCAoZCkgLT4gKHgoKGQpKSAtIDYgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSkgKyAncHgnKVxuICAgICAgICAudGV4dChcIuKWvFwiKVxuXG5cbiAgICAgIHN2Zy5zZWxlY3RBbGwoXCIubWluU2NvcmVUZXh0XCIpXG4gICAgICAgICAgLmRhdGEoW3BhcnNlRmxvYXQoYm1pbikudG9GaXhlZCgyKV0pXG4gICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcIm1pblNjb3JlVGV4dFwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KGQpIC0gMjEgKSsgJ3B4JylcbiAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDEyKSArICdweCcpXG4gICAgICAgIC50ZXh0KChkKSAtPiBcIk1pbjogXCIrZClcblxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1heFNjb3JlTGluZVwiKVxuICAgICAgICAgIC5kYXRhKFtwYXJzZUZsb2F0KGJtYXgpLnRvRml4ZWQoMildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZUxpbmVcIilcbiAgICAgICAgLmF0dHIoXCJ4MVwiLCAoZCkgLT4gKHgoKGQpKSApKyAncHgnKVxuICAgICAgICAuYXR0cihcInkxXCIsIChkKSAtPiAoeShtYXhfY291bnRfdmFsKSAtIDE4KSArICdweCcpXG4gICAgICAgIC5hdHRyKFwieDJcIiwgKGQpIC0+ICh4KGQpKyAncHgnKSlcbiAgICAgICAgLmF0dHIoXCJ5MlwiLCAoZCkgLT4gaGVpZ2h0ICsgJ3B4JylcblxuICAgICAgc3ZnLnNlbGVjdEFsbChcIi5tYXhTY29yZVwiKVxuICAgICAgICAgIC5kYXRhKFtwYXJzZUZsb2F0KGJtYXgpLnRvRml4ZWQoMildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZVwiKVxuICAgICAgICAuYXR0cihcInhcIiwgKGQpIC0+ICh4KChkKSkgLSA2ICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAxOCkgKyAncHgnKVxuICAgICAgICAudGV4dChcIuKWvFwiKVxuXG4gICAgICBzdmcuc2VsZWN0QWxsKFwiLm1heFNjb3JlVGV4dFwiKVxuICAgICAgICAgIC5kYXRhKFtwYXJzZUZsb2F0KGJtYXgpLnRvRml4ZWQoMildKVxuICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJtYXhTY29yZVRleHRcIilcbiAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiAoeChkKSAtIDMwICkrICdweCcpXG4gICAgICAgIC5hdHRyKFwieVwiLCAoZCkgLT4gKHkobWF4X2NvdW50X3ZhbCkgLSAzMCkgKyAncHgnKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCJNYXg6IFwiK2QpXG5cbiAgICAgIFxuICAgICAgaWYgZ3JhcGggPT0gXCIuaGVyYl92aXpcIlxuICAgICAgICBAJChncmFwaCkuYXBwZW5kICc8ZGl2IGNsYXNzPVwibGVnZW5kc1wiPjxkaXYgY2xhc3M9XCJsZWdlbmRcIj48c3BhbiBjbGFzcz1cImhlcmItc3dhdGNoXCI+Jm5ic3A7PC9zcGFuPkJpb21hc3MgaW4gUmVnaW9uPC9kaXY+PGRpdiBjbGFzcz1cImxlZ2VuZC1za2V0Y2gtdmFsdWVzXCI+4pa8IFNrZXRjaCBWYWx1ZXM8L2Rpdj48L2Rpdj4nXG4gICAgICBpZiBncmFwaCA9PSBcIi5maXNoX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwiZmlzaC1zd2F0Y2hcIj4mbmJzcDs8L3NwYW4+RmlzaCBDb3VudCBpbiBSZWdpb248L2Rpdj48ZGl2IGNsYXNzPVwibGVnZW5kLXNrZXRjaC12YWx1ZXNcIj7ilrwgU2tldGNoIFZhbHVlczwvZGl2PjwvZGl2PidcbiAgICAgIGlmIGdyYXBoID09IFwiLnRvdGFsX3ZpelwiXG4gICAgICAgIEAkKGdyYXBoKS5hcHBlbmQgJzxkaXYgY2xhc3M9XCJsZWdlbmRzXCI+PGRpdiBjbGFzcz1cImxlZ2VuZFwiPjxzcGFuIGNsYXNzPVwidG90YWwtc3dhdGNoXCI+Jm5ic3A7PC9zcGFuPkJpb21hc3MgaW4gUmVnaW9uPC9kaXY+PGRpdiBjbGFzcz1cImxlZ2VuZC1za2V0Y2gtdmFsdWVzXCI+4pa8IFNrZXRjaCBWYWx1ZXM8L2Rpdj48L2Rpdj4nXG4gICAgICAgXG4gICAgICBAJChncmFwaCkuYXBwZW5kICc8YnIgc3R5bGU9XCJjbGVhcjpib3RoO1wiPidcblxuICBnZXRBbGxWYWx1ZXM6IChhbGxfc3RyKSA9PlxuICAgIHRyeVxuICAgICAgYWxsX3ZhbHMgPSBhbGxfc3RyLnN1YnN0cmluZygxLCBhbGxfc3RyLmxlbmd0aCAtIDEpXG4gICAgICBhbGxfdmFscyA9IGFsbF92YWxzLnNwbGl0KFwiLCBcIilcbiAgICAgIHNvcnRlZF92YWxzID0gXy5zb3J0QnkgYWxsX3ZhbHMsIChkKSAtPiAgcGFyc2VGbG9hdChkKVxuICAgICAgcmV0dXJuIHNvcnRlZF92YWxzXG4gICAgY2F0Y2ggZVxuICAgICAgcmV0dXJuIFtdXG4gICAgXG4gIGFkZFRhcmdldDogKGRhdGEpID0+XG4gICAgZm9yIGQgaW4gZGF0YVxuICAgICAgaWYgZC5IQUJfVFlQRSA9PSBcIkFydGlmaWNpYWwgUmVlZlwiXG4gICAgICAgIGQuTUVFVFNfR09BTCA9IGZhbHNlXG4gICAgICAgIGQuTk9fR09BTCA9IHRydWVcbiAgICAgIGVsc2VcbiAgICAgICAgZC5NRUVUU18xMF9HT0FMID0gKHBhcnNlRmxvYXQoZC5QRVJDKSA+IDEwLjApXG4gICAgICAgIGQuTUVFVFNfMjBfR09BTCA9IChwYXJzZUZsb2F0KGQuUEVSQykgPiAyMC4wKVxuICAgICAgICBkLk1FRVRTXzMwX0dPQUwgPSAocGFyc2VGbG9hdChkLlBFUkMpID4gMzAuMClcblxuICByb3VuZFZhbHM6IChkKSA9PiAgICBcbiAgICAgIGQuTUVBTiA9IHBhcnNlRmxvYXQoZC5NRUFOKS50b0ZpeGVkKDEpXG4gICAgICBkLk1BWCA9IHBhcnNlRmxvYXQoZC5NQVgpLnRvRml4ZWQoMSlcbiAgICAgIGQuTUlOID0gcGFyc2VGbG9hdChkLk1JTikudG9GaXhlZCgxKVxuXG4gIHJvdW5kRGF0YTogKGRhdGEpID0+XG4gICAgZm9yIGQgaW4gZGF0YVxuICAgICAgaWYgZC5BUkVBX1NRS00gPCAwLjEgYW5kIGQuQVJFQV9TUUtNID4gMC4wMDAwMVxuICAgICAgICBkLkFSRUFfU1FLTSA9IFwiPCAwLjEgXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZC5BUkVBX1NRS00gPSBwYXJzZUZsb2F0KGQuQVJFQV9TUUtNKS50b0ZpeGVkKDEpXG5cbm1vZHVsZS5leHBvcnRzID0gRW52aXJvbm1lbnRUYWIiLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuZDMgPSB3aW5kb3cuZDNcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJy4uL25vZGVfbW9kdWxlcy9zZWFza2V0Y2gtcmVwb3J0aW5nLWFwaS90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xucGFydGlhbHMgPSBbXVxuZm9yIGtleSwgdmFsIG9mIF9wYXJ0aWFsc1xuICBwYXJ0aWFsc1trZXkucmVwbGFjZSgnbm9kZV9tb2R1bGVzL3NlYXNrZXRjaC1yZXBvcnRpbmctYXBpLycsICcnKV0gPSB2YWxcblxuY2xhc3MgT3ZlcnZpZXdUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ092ZXJ2aWV3J1xuICBjbGFzc05hbWU6ICdvdmVydmlldydcbiAgdGVtcGxhdGU6IHRlbXBsYXRlcy5vdmVydmlld1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnU2l6ZUFuZENvbm5lY3Rpdml0eSdcbiAgICAnRGl2ZUFuZEZpc2hpbmdWYWx1ZSdcbiAgICAnRGlzdGFuY2UnXG4gICAgJ01pbkRpbWVuc2lvblRvb2xib3gnXG4gICAgJ01vbnRzZXJyYXRCaW9tYXNzVG9vbGJveCdcblxuICBdXG4gIHJlbmRlcjogKCkgLT5cblxuICAgICMgY3JlYXRlIHJhbmRvbSBkYXRhIGZvciB2aXN1YWxpemF0aW9uXG4gICAgc2l6ZSA9IEByZWNvcmRTZXQoJ1NpemVBbmRDb25uZWN0aXZpdHknLCAnU2l6ZScpLnRvQXJyYXkoKVswXVxuICAgIHRvdGFsX3NpemUgPSAzNDAuMDZcbiAgICBzaXplLlBFUkMgPSBOdW1iZXIoKHBhcnNlRmxvYXQoc2l6ZS5TSVpFX1NRS00pL3RvdGFsX3NpemUpKjEwMC4wKS50b0ZpeGVkKDEpXG4gICAgY29ubmVjdGl2aXR5ID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdDb25uZWN0aXZpdHknKS50b0FycmF5KClcbiAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcblxuICAgIHRyeVxuICAgICAgZGZ2ID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdGaXNoaW5nVmFsdWUnKS50b0FycmF5KClbMF1cbiAgICAgIGRkdiA9IEByZWNvcmRTZXQoJ0RpdmVBbmRGaXNoaW5nVmFsdWUnLCAnRGl2ZVZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgICBkY3YgPSBAcmVjb3JkU2V0KCdEaXZlQW5kRmlzaGluZ1ZhbHVlJywgJ0NvbnNlcnZhdGlvblZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgY2F0Y2ggZXJyXG4gICAgICBjb25zb2xlLmxvZyhcImVycm9yOiBcIixlcnIpXG5cbiAgICBoYXNTYW5jdHVhcnlEYXRhID0gZmFsc2VcbiAgICB0cnlcbiAgICAgIHNhbmNfZnYgPSBAcmVjb3JkU2V0KCdEaXZlQW5kRmlzaGluZ1ZhbHVlJywgJ1NhbmN0dWFyeUZpc2hpbmdWYWx1ZScpLnRvQXJyYXkoKVswXVxuICAgICAgc2FuY19kdiA9IEByZWNvcmRTZXQoJ0RpdmVBbmRGaXNoaW5nVmFsdWUnLCAnU2FuY3R1YXJ5RGl2ZVZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgICBzYW5jX2N2ID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdTYW5jdHVhcnlDb25zZXJ2YXRpb25WYWx1ZScpLnRvQXJyYXkoKVswXVxuICAgICAgaGFzU2FuY3R1YXJ5RGF0YSA9IHRydWVcbiAgICBjYXRjaCBlcnJcbiAgICAgIHNhbmNfZnYgPSBbXVxuICAgICAgc2FuY19kdiA9IFtdXG4gICAgICBzYW5jX2N2ID0gW11cbiAgICAgIGhhc1NhbmN0dWFyeURhdGEgPSBmYWxzZVxuXG4gICAgaGFzUGFydGlhbFRha2VEYXRhID0gZmFsc2VcbiAgICB0cnlcbiAgICAgIHB0X2Z2ID0gQHJlY29yZFNldCgnRGl2ZUFuZEZpc2hpbmdWYWx1ZScsICdQYXJ0aWFsVGFrZUZpc2hpbmdWYWx1ZScpLnRvQXJyYXkoKVswXVxuICAgICAgcHRfZHYgPSBAcmVjb3JkU2V0KCdEaXZlQW5kRmlzaGluZ1ZhbHVlJywgJ1BhcnRpYWxUYWtlRGl2ZVZhbHVlJykudG9BcnJheSgpWzBdXG4gICAgICBwdF9jdiA9IEByZWNvcmRTZXQoJ0RpdmVBbmRGaXNoaW5nVmFsdWUnLCAnUGFydGlhbFRha2VDb25zZXJ2YXRpb25WYWx1ZScpLnRvQXJyYXkoKVswXVxuICAgICAgY29uc29sZS5sb2coXCItLS0tLS0+Pj4+cHQgY3Y6IFwiLCBwdF9jdilcbiAgICAgIGhhc1BhcnRpYWxUYWtlRGF0YSA9IHRydWVcbiAgICBjYXRjaCBlcnJcbiAgICAgIGNvbnNvbGUubG9nKFwibm8gcHQuLi4uLlwiKVxuICAgICAgcHRfZnYgPSBbXVxuICAgICAgcHRfZHYgPSBbXVxuICAgICAgaGFzUGFydGlhbFRha2VEYXRhID0gZmFsc2VcblxuXG4gICAgaGFzUHJvdGVjdGVkQXJlYXMgPSBmYWxzZVxuICAgIGhhc1NhbmN0dWFyaWVzID0gZmFsc2VcbiAgICBoYXNQYXJ0aWFsVGFrZSA9IGZhbHNlXG4gICAgaGFzVXRpbGl0eVpvbmVzID0gZmFsc2VcbiAgICBoYXNNdWx0aVVzZVpvbmVzID0gZmFsc2VcbiAgICBoYXNWb2xjYW5pY0V4Y2x1c2lvblpvbmUgPSBmYWxzZVxuXG4gICAgdHJ5XG4gICAgICBzaXplX3Blcl96b25lID0gQHJlY29yZFNldCgnU2l6ZUFuZENvbm5lY3Rpdml0eScsICdTaXplUGVyWm9uZScpLnRvQXJyYXkoKVxuICAgICAgY29uc29sZS5sb2coXCJzaXplcyBwZXIgem9uZTogXCIsIHNpemVfcGVyX3pvbmUpXG4gICAgICBwcm90ZWN0ZWRBcmVhU2l6ZSA9IDAuMFxuICAgICAgcHJvdGVjdGVkQXJlYVBlcmMgPSAwLjBcblxuICAgICAgc2FuY3R1YXJ5U2l6ZSA9IDAuMFxuICAgICAgc2FuY3R1YXJ5UGVyYyA9IDAuMFxuXG4gICAgICBwYXJ0aWFsVGFrZVNpemUgPSAwLjBcbiAgICAgIHBhcnRpYWxUYWtlUGVyYyA9IDAuMFxuXG4gICAgICB1dGlsaXR5Wm9uZVNpemUgPSAwLjBcbiAgICAgIHV0aWxpdHlab25lUGVyYyA9IDAuMFxuXG4gICAgICBtdWx0aVVzZVpvbmVTaXplID0gMC4wXG4gICAgICBtdWx0aVVzZVpvbmVQZXJjID0gMC4wXG5cbiAgICAgIHZvbGNhbmljRXhjbHVzaW9uWm9uZVNpemUgPSAwLjBcbiAgICAgIHZvbGNhbmljRXhjbHVzaW9uWm9uZVBlcmMgPSAwLjBcblxuICAgICAgZm9yIHNweiBpbiBzaXplX3Blcl96b25lXG4gICAgICAgIGN1cnJfc2l6ZSA9IHBhcnNlRmxvYXQoc3B6LlNJWkVfU1FLTSlcbiAgICAgICAgaWYgc3B6LlpPTkVfVFlQRSA9PSBcIlNhbmN0dWFyeVwiXG4gICAgICAgICAgc2FuY3R1YXJ5U2l6ZT1jdXJyX3NpemVcbiAgICAgICAgICBwcm90ZWN0ZWRBcmVhU2l6ZSs9Y3Vycl9zaXplXG4gICAgICAgICAgaGFzUHJvdGVjdGVkQXJlYXMgPSB0cnVlXG4gICAgICAgICAgaGFzU2FuY3R1YXJpZXMgPSB0cnVlXG4gICAgICAgIGVsc2UgaWYgc3B6LlpPTkVfVFlQRSA9PSBcIk1hcmluZSBSZXNlcnZlIC0gUGFydGlhbCBUYWtlXCJcbiAgICAgICAgICBwYXJ0aWFsVGFrZVNpemUgPSBjdXJyX3NpemVcbiAgICAgICAgICBwcm90ZWN0ZWRBcmVhU2l6ZSs9Y3Vycl9zaXplXG4gICAgICAgICAgaGFzUHJvdGVjdGVkQXJlYXMgPSB0cnVlXG4gICAgICAgICAgaGFzUGFydGlhbFRha2UgPSB0cnVlXG4gICAgICAgIGVsc2UgaWYgc3B6LlpPTkVfVFlQRSA9PSBcIk11bHRpdXNlXCJcbiAgICAgICAgICBoYXNNdWx0aVVzZVpvbmVzID0gdHJ1ZVxuICAgICAgICAgIG11bHRpVXNlWm9uZVNpemUgPSBjdXJyX3NpemVcbiAgICAgICAgZWxzZSBpZiBzcHouWk9ORV9UWVBFID09IFwiVm9sY2FuaWMgRXhjbHVzaW9uIFpvbmVcIlxuICAgICAgICAgIGhhc1ZvbGNhbmljRXhjbHVzaW9uWm9uZSA9IHRydWVcbiAgICAgICAgICB2b2xjYW5pY0V4Y2x1c2lvblpvbmVTaXplID0gY3Vycl9zaXplXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBoYXNVdGlsaXR5Wm9uZXMgPSB0cnVlXG4gICAgICAgICAgdXRpbGl0eVpvbmVTaXplKz1jdXJyX3NpemVcblxuICAgIGNhdGNoIGVcbiAgICAgIGNvbnNvbGUubG9nKFwiZTogXCIsIGUpXG4gICAgICAjaXRzIG9rLCBqdXN0IGlnbm9yZSB0aGUgc2l6ZXMgcGVyIHpvbmVcbiAgICBcbiAgICBwcm90ZWN0ZWRBcmVhU2l6ZSA9IHBhcnNlRmxvYXQocHJvdGVjdGVkQXJlYVNpemUpLnRvRml4ZWQoMilcbiAgICBzYW5jdHVhcnlTaXplID0gcGFyc2VGbG9hdChzYW5jdHVhcnlTaXplKS50b0ZpeGVkKDIpXG4gICAgcGFydGlhbFRha2VTaXplID0gcGFyc2VGbG9hdChwYXJ0aWFsVGFrZVNpemUpLnRvRml4ZWQoMilcbiAgICBtdWx0aVVzZVpvbmVTaXplID0gcGFyc2VGbG9hdChtdWx0aVVzZVpvbmVTaXplKS50b0ZpeGVkKDIpXG4gICAgdXRpbGl0eVpvbmVTaXplID0gcGFyc2VGbG9hdCh1dGlsaXR5Wm9uZVNpemUpLnRvRml4ZWQoMilcbiAgICB2b2xjYW5pY0V4Y2x1c2lvblpvbmVTaXplID0gcGFyc2VGbG9hdCh2b2xjYW5pY0V4Y2x1c2lvblpvbmVTaXplKS50b0ZpeGVkKDIpXG5cbiAgICBwcm90ZWN0ZWRBcmVhUGVyYyA9IE51bWJlcigocHJvdGVjdGVkQXJlYVNpemUvdG90YWxfc2l6ZSkqMTAwLjApLnRvRml4ZWQoMSlcbiAgICBzYW5jdHVhcnlQZXJjID0gTnVtYmVyKChzYW5jdHVhcnlTaXplL3RvdGFsX3NpemUpKjEwMC4wKS50b0ZpeGVkKDEpXG4gICAgcGFydGlhbFRha2VQZXJjID0gTnVtYmVyKChwYXJ0aWFsVGFrZVNpemUvdG90YWxfc2l6ZSkqMTAwLjApLnRvRml4ZWQoMSlcbiAgICB1dGlsaXR5Wm9uZVBlcmMgPSBOdW1iZXIoKHV0aWxpdHlab25lU2l6ZS90b3RhbF9zaXplKSoxMDAuMCkudG9GaXhlZCgxKVxuICAgIG11bHRpVXNlWm9uZVBlcmMgPSBOdW1iZXIoKG11bHRpVXNlWm9uZVNpemUvdG90YWxfc2l6ZSkqMTAwLjApLnRvRml4ZWQoMSlcbiAgICB2b2xjYW5pY0V4Y2x1c2lvblpvbmVQZXJjID0gTnVtYmVyKCh2b2xjYW5pY0V4Y2x1c2lvblpvbmVTaXplL3RvdGFsX3NpemUpKjEwMC4wKS50b0ZpeGVkKDEpXG5cbiAgICBpZiBkZnZcbiAgICAgIGlmIGRmdi5QRVJDRU5UIDwgMC4wMVxuICAgICAgICBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZSA9IFwiPCAwLjAxXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBwYXJzZUZsb2F0KGRmdi5QRVJDRU5UKS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgZGlzcGxhY2VkX2Zpc2hpbmdfdmFsdWUgPSBcInVua25vd25cIlxuXG4gICAgaWYgZGR2XG4gICAgICBpZiBkZHYuUEVSQ0VOVCA8IDAuMDFcbiAgICAgICAgZGlzcGxhY2VkX2RpdmVfdmFsdWUgPSBcIjwgMC4wMVwiXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gcGFyc2VGbG9hdChkZHYuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIGRpc3BsYWNlZF9kaXZlX3ZhbHVlID0gXCJ1bmtub3duXCJcblxuICAgIGlmIGRjdlxuICAgICAgaWYgZGN2LlBFUkNFTlQgPCAwLjAxXG4gICAgICAgIGRpc3BsYWNlZF9jb25zZXJ2YXRpb25fdmFsdWUgPSBcIjwgMC4wMVwiXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYWNlZF9jb25zZXJ2YXRpb25fdmFsdWUgPSBwYXJzZUZsb2F0KGRjdi5QRVJDRU5UKS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgZGlzcGxhY2VkX2NvbnNlcnZhdGlvbl92YWx1ZSA9IFwidW5rbm93blwiXG5cbiAgICBpZiBoYXNTYW5jdHVhcnlEYXRhXG4gICAgICBpZiBzYW5jX2Z2LlBFUkNFTlQgPCAwLjAxXG4gICAgICAgIGRpc3BsYWNlZF9zYW5jX2Zpc2hpbmdfdmFsdWUgPSBcIjwgMC4wMVwiXG4gICAgICBlbHNlXG4gICAgICAgIGRpc3BsYWNlZF9zYW5jX2Zpc2hpbmdfdmFsdWUgPSBwYXJzZUZsb2F0KHNhbmNfZnYuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgICAgaWYgc2FuY19kdi5QRVJDRU5UIDwgMC4wMVxuICAgICAgICBkaXNwbGFjZWRfc2FuY19kaXZlX3ZhbHVlID0gXCI8IDAuMDFcIlxuICAgICAgZWxzZVxuICAgICAgICBkaXNwbGFjZWRfc2FuY19kaXZlX3ZhbHVlID0gcGFyc2VGbG9hdChzYW5jX2R2LlBFUkNFTlQpLnRvRml4ZWQoMilcbiAgICAgIGlmIHNhbmNfY3YuUEVSQ0VOVCA8IDAuMDFcbiAgICAgICAgZGlzcGxhY2VkX3NhbmNfY29uc2VydmF0aW9uX3ZhbHVlID0gXCI8IDAuMDFcIlxuICAgICAgZWxzZVxuICAgICAgICBkaXNwbGFjZWRfc2FuY19jb25zZXJ2YXRpb25fdmFsdWUgPSBwYXJzZUZsb2F0KHNhbmNfY3YuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIGRpc3BsYWNlZF9zYW5jX2Zpc2hpbmdfdmFsdWUgPSBcIjAuMFwiXG4gICAgICBkaXNwbGFjZWRfc2FuY19kaXZlX3ZhbHVlID0gXCIwLjBcIlxuICAgICAgZGlzcGxhY2VkX3NhbmNfY29uc2VydmF0aW9uX3ZhbHVlID0gMC4wXG5cbiAgICBpZiBoYXNQYXJ0aWFsVGFrZURhdGFcbiAgICAgIGlmIHB0X2Z2LlBFUkNFTlQgPCAwLjAxXG4gICAgICAgIGRpc3BsYWNlZF9wdF9maXNoaW5nX3ZhbHVlID0gXCI8IDAuMDFcIlxuICAgICAgZWxzZVxuICAgICAgICBkaXNwbGFjZWRfcHRfZmlzaGluZ192YWx1ZSA9IHBhcnNlRmxvYXQocHRfZnYuUEVSQ0VOVCkudG9GaXhlZCgyKVxuXG4gICAgICBpZiBwdF9kdi5QRVJDRU5UIDwgMC4wMVxuICAgICAgICBkaXNwbGFjZWRfcHRfZGl2ZV92YWx1ZSA9IFwiPCAwLjAxXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzcGxhY2VkX3B0X2RpdmVfdmFsdWUgPSBwYXJzZUZsb2F0KHB0X2R2LlBFUkNFTlQpLnRvRml4ZWQoMilcblxuICAgICAgaWYgcHRfY3YuUEVSQ0VOVCA8IDAuMDFcbiAgICAgICAgZGlzcGxhY2VkX3B0X2NvbnNlcnZhdGlvbl92YWx1ZSA9IFwiPCAwLjAxXCJcbiAgICAgIGVsc2VcbiAgICAgICAgZGlzcGxhY2VkX3B0X2NvbnNlcnZhdGlvbl92YWx1ZSA9IHBhcnNlRmxvYXQocHRfY3YuUEVSQ0VOVCkudG9GaXhlZCgyKVxuICAgIGVsc2VcbiAgICAgIGRpc3BsYWNlZF9wdF9maXNoaW5nX3ZhbHVlID0gXCIwXCJcbiAgICAgIGRpc3BsYWNlZF9wdF9kaXZlX3ZhbHVlID0gXCIwXCJcbiAgICAgIGRpc3BsYWNlZF9wdF9jb25zZXJ2YXRpb25fdmFsdWUgPSBcIjBcIlxuXG4gICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICBmdiA9IDAuMFxuICAgICAgZHYgPSAwLjBcbiAgICAgIGN2ID0gMC4wXG4gICAgICBpZiBoYXNTYW5jdHVhcmllc1xuICAgICAgICBzZnYgPSBwYXJzZUZsb2F0KHNhbmNfZnYuUEVSQ0VOVClcbiAgICAgICAgc2R2ID0gcGFyc2VGbG9hdChzYW5jX2R2LlBFUkNFTlQpXG4gICAgICAgIHNjdiA9IHBhcnNlRmxvYXQoc2FuY19jdi5QRVJDRU5UKVxuICAgICAgICBmdis9c2Z2XG4gICAgICAgIGR2Kz1zZHZcbiAgICAgICAgY3YrPXNjdlxuICAgICAgaWYgaGFzUGFydGlhbFRha2VcbiAgICAgICAgcGZ2ID0gcGFyc2VGbG9hdChwdF9mdi5QRVJDRU5UKVxuICAgICAgICBwZHYgPSBwYXJzZUZsb2F0KHB0X2R2LlBFUkNFTlQpXG4gICAgICAgIHBjdiA9IHBhcnNlRmxvYXQocHRfY3YuUEVSQ0VOVClcbiAgICAgICAgZnYrPXBmdlxuICAgICAgICBkdis9cGR2XG4gICAgICAgIGN2Kz1wY3ZcblxuICAgICAgZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2Zpc2hpbmdfdmFsdWUgPSAoZnYpLnRvRml4ZWQoMilcbiAgICAgIGRpc3BsYWNlZF9wcm90ZWN0ZWRfYXJlYV9kaXZlX3ZhbHVlID0gKGR2KS50b0ZpeGVkKDIpXG4gICAgICBkaXNwbGFjZWRfcHJvdGVjdGVkX2FyZWFfY29uc2VydmF0aW9uX3ZhbHVlID0gKGN2KS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2Zpc2hpbmdfdmFsdWUgPSBkaXNwbGFjZWRfZmlzaGluZ192YWx1ZVxuICAgICAgZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2RpdmVfdmFsdWUgPSBkaXNwbGFjZWRfZGl2ZV92YWx1ZVxuICAgICAgZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2NvbnNlcnZhdGlvbl92YWx1ZSA9IGRpc3BsYWNlZF9jb25zZXJ2YXRpb25fdmFsdWVcblxuICAgIG1pbkRpc3RLTSA9IEByZWNvcmRTZXQoJ0Rpc3RhbmNlJywgJ0Rpc3RhbmNlJykudG9BcnJheSgpWzBdXG4gICAgaWYgbWluRGlzdEtNXG4gICAgICBtaW5EaXN0S00gPSBwYXJzZUZsb2F0KG1pbkRpc3RLTS5NYXhEaXN0KS50b0ZpeGVkKDIpXG4gICAgZWxzZVxuICAgICAgbWluRGlzdEtNID0gXCJVbmtub3duXCJcblxuICAgIG1pbldpZHRoID0gQHJlY29yZFNldCgnTWluRGltZW5zaW9uVG9vbGJveCcsICdEaW1lbnNpb25zJykudG9BcnJheSgpXG4gICAgY29uc29sZS5sb2coXCJtaW53aWR0aDogXCIsIG1pbldpZHRoKVxuXG4gICAgaWYgbWluV2lkdGg/Lmxlbmd0aCA+IDBcbiAgICAgIGlzQ29uc2VydmF0aW9uWm9uZSA9IHRydWVcbiAgICAgIGlmIGlzQ29sbGVjdGlvblxuICAgICAgICBAcHJvY2Vzc01pbkRpbWVuc2lvbiBtaW5XaWR0aFxuICAgICAgZWxzZVxuICAgICAgICBtZWV0c01pbldpZHRoR29hbCA9IChwYXJzZUZsb2F0KG1pbldpZHRoWzBdLldJRFRIKSA+IDEuMClcbiAgICBlbHNlXG4gICAgICBpc0NvbnNlcnZhdGlvblpvbmUgPSBmYWxzZVxuICAgICAgbWVldHNNaW5XaWR0aEdvYWwgPSBmYWxzZVxuXG4gICAgZmlzaHBvdHMgPSBAcmVjb3JkU2V0KCdNb250c2VycmF0QmlvbWFzc1Rvb2xib3gnLCAnRmlzaFBvdCcpLnRvQXJyYXkoKVxuICAgIGlmIGZpc2hwb3RzPy5sZW5ndGggPiAwXG5cbiAgICAgIGZpc2hwb3RfY291bnQgPSBmaXNocG90c1swXS5DT1VOVFxuICAgICAgZmlzaHBvdF90b3RhbCA9IGZpc2hwb3RzWzBdLlRPVEFMXG4gICAgZWxzZVxuICAgICAgZmlzaHBvdF9jb3VudCA9IDBcbiAgICAgIGZpc2hwb3RfdG90YWwgPSAxNTdcblxuICAgIHNob3dEaXZlQW5kRmlzaGluZyA9ICFpc0NvbGxlY3Rpb24gfHwgKGlzQ29sbGVjdGlvbiAmJiBoYXNQcm90ZWN0ZWRBcmVhcylcbiAgICAjIHNldHVwIGNvbnRleHQgb2JqZWN0IHdpdGggZGF0YSBhbmQgcmVuZGVyIHRoZSB0ZW1wbGF0ZSBmcm9tIGl0XG4gICAgY29udGV4dCA9XG4gICAgICBza2V0Y2g6IEBtb2RlbC5mb3JUZW1wbGF0ZSgpXG4gICAgICBza2V0Y2hDbGFzczogQHNrZXRjaENsYXNzLmZvclRlbXBsYXRlKClcbiAgICAgIGF0dHJpYnV0ZXM6IEBtb2RlbC5nZXRBdHRyaWJ1dGVzKClcbiAgICAgIGFkbWluOiBAcHJvamVjdC5pc0FkbWluIHdpbmRvdy51c2VyXG4gICAgICBpc0NvbGxlY3Rpb246IGlzQ29sbGVjdGlvblxuICAgICAgaGFzRDM6IHdpbmRvdy5kM1xuICAgICAgc2l6ZTogc2l6ZVxuICAgICAgY29ubmVjdGl2aXR5OiBjb25uZWN0aXZpdHlcbiAgICAgIFxuICAgICAgZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2RpdmVfdmFsdWU6IGRpc3BsYWNlZF9wcm90ZWN0ZWRfYXJlYV9kaXZlX3ZhbHVlXG4gICAgICBkaXNwbGFjZWRfcHJvdGVjdGVkX2FyZWFfZmlzaGluZ192YWx1ZTogZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2Zpc2hpbmdfdmFsdWVcbiAgICAgIGRpc3BsYWNlZF9wcm90ZWN0ZWRfYXJlYV9jb25zZXJ2YXRpb25fdmFsdWU6IGRpc3BsYWNlZF9wcm90ZWN0ZWRfYXJlYV9jb25zZXJ2YXRpb25fdmFsdWVcblxuICAgICAgZGlzcGxhY2VkX3NhbmNfZmlzaGluZ192YWx1ZTogZGlzcGxhY2VkX3NhbmNfZmlzaGluZ192YWx1ZVxuICAgICAgZGlzcGxhY2VkX3NhbmNfZGl2ZV92YWx1ZTogZGlzcGxhY2VkX3NhbmNfZGl2ZV92YWx1ZVxuICAgICAgZGlzcGxhY2VkX3NhbmNfY29uc2VydmF0aW9uX3ZhbHVlOiBkaXNwbGFjZWRfc2FuY19jb25zZXJ2YXRpb25fdmFsdWVcbiAgICAgIGRpc3BsYWNlZF9wdF9maXNoaW5nX3ZhbHVlOiBkaXNwbGFjZWRfcHRfZmlzaGluZ192YWx1ZVxuICAgICAgZGlzcGxhY2VkX3B0X2RpdmVfdmFsdWU6IGRpc3BsYWNlZF9wdF9kaXZlX3ZhbHVlXG4gICAgICBkaXNwbGFjZWRfcHRfY29uc2VydmF0aW9uX3ZhbHVlOiBkaXNwbGFjZWRfcHRfY29uc2VydmF0aW9uX3ZhbHVlXG5cblxuICAgICAgaGFzUGFydGlhbFRha2VEYXRhOiBoYXNQYXJ0aWFsVGFrZURhdGFcbiAgICAgIGhhc1NhbmN0dWFyeURhdGE6IGhhc1NhbmN0dWFyeURhdGFcblxuXG4gICAgICBtaW5EaXN0S006IG1pbkRpc3RLTVxuICAgICAgaXNDb25zZXJ2YXRpb25ab25lOiBpc0NvbnNlcnZhdGlvblpvbmVcbiAgICAgIG1lZXRzTWluV2lkdGhHb2FsOiBtZWV0c01pbldpZHRoR29hbFxuICAgICAgbWluX2RpbSA6bWluV2lkdGhcblxuICAgICAgZmlzaHBvdF9jb3VudDogZmlzaHBvdF9jb3VudFxuICAgICAgZmlzaHBvdF90b3RhbDogZmlzaHBvdF90b3RhbFxuXG4gICAgICBoYXNQcm90ZWN0ZWRBcmVhczogaGFzUHJvdGVjdGVkQXJlYXNcbiAgICAgIHByb3RlY3RlZEFyZWFTaXplOiBwcm90ZWN0ZWRBcmVhU2l6ZVxuICAgICAgcHJvdGVjdGVkQXJlYVBlcmM6IHByb3RlY3RlZEFyZWFQZXJjXG5cbiAgICAgIGhhc1NhbmN0dWFyaWVzOiBoYXNTYW5jdHVhcmllc1xuICAgICAgc2FuY3R1YXJ5U2l6ZTogc2FuY3R1YXJ5U2l6ZVxuICAgICAgc2FuY3R1YXJ5UGVyYzogc2FuY3R1YXJ5UGVyY1xuXG4gICAgICBoYXNQYXJ0aWFsVGFrZTogaGFzUGFydGlhbFRha2VcbiAgICAgIHBhcnRpYWxUYWtlU2l6ZTogcGFydGlhbFRha2VTaXplXG4gICAgICBwYXJ0aWFsVGFrZVBlcmM6IHBhcnRpYWxUYWtlUGVyY1xuXG4gICAgICBoYXNVdGlsaXR5Wm9uZXM6IGhhc1V0aWxpdHlab25lc1xuICAgICAgdXRpbGl0eVpvbmVTaXplOiB1dGlsaXR5Wm9uZVNpemVcbiAgICAgIHV0aWxpdHlab25lUGVyYzogdXRpbGl0eVpvbmVQZXJjXG5cbiAgICAgIGhhc011bHRpVXNlWm9uZXM6IGhhc011bHRpVXNlWm9uZXNcbiAgICAgIG11bHRpVXNlWm9uZVNpemU6IG11bHRpVXNlWm9uZVNpemVcbiAgICAgIG11bHRpVXNlWm9uZVBlcmM6IG11bHRpVXNlWm9uZVBlcmNcblxuICAgICAgaGFzVm9sY2FuaWNFeGNsdXNpb25ab25lOiBoYXNWb2xjYW5pY0V4Y2x1c2lvblpvbmVcbiAgICAgIHZvbGNhbmljRXhjbHVzaW9uWm9uZVNpemU6IHZvbGNhbmljRXhjbHVzaW9uWm9uZVNpemVcbiAgICAgIHZvbGNhbmljRXhjbHVzaW9uWm9uZVBlcmM6IHZvbGNhbmljRXhjbHVzaW9uWm9uZVBlcmNcblxuICAgICAgc2hvd0RpdmVBbmRGaXNoaW5nOiBzaG93RGl2ZUFuZEZpc2hpbmdcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCB0ZW1wbGF0ZXMpXG4gICAgQGVuYWJsZUxheWVyVG9nZ2xlcnMoKVxuICAgIEBkcmF3RmlzaFBvdEJhcnMoZmlzaHBvdF9jb3VudCwgZmlzaHBvdF90b3RhbClcblxuXG4gIGRyYXdGaXNoUG90QmFyczogKGZpc2hwb3RfY291bnQsIGZpc2hwb3RfdG90YWwpID0+XG4gICAgaWYgd2luZG93LmQzXG4gICAgICBpc0NvbGxlY3Rpb24gPSBAbW9kZWwuaXNDb2xsZWN0aW9uKClcbiAgICAgIHN1ZmZpeCA9IFwic2tldGNoXCJcblxuICAgICAgaWYgaXNDb2xsZWN0aW9uXG4gICAgICAgIHN1ZmZpeD1cImNvbGxlY3Rpb25cIlxuXG4gICAgICBjb3VudCA9IGZpc2hwb3RfY291bnRcbiAgICAgIHRvdGFsID0gZmlzaHBvdF90b3RhbFxuICAgICAgb3V0c2lkZV9za2V0Y2hfc3RhcnQgPSB0b3RhbCowLjQ4XG5cbiAgICAgIGxhYmVsID0gY291bnQrXCIvXCIrdG90YWwrXCIgb2YgdGhlIGZpc2ggcG90cyB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycyBhcmUgZm91bmQgd2l0aGluIHRoaXMgXCIrc3VmZml4XG4gICAgICByYW5nZSA9IFtcbiAgICAgICAge1xuICAgICAgICAgIGJnOiBcIiM4ZTVlNTBcIlxuICAgICAgICAgIHN0YXJ0OiAwXG4gICAgICAgICAgZW5kOiBjb3VudFxuICAgICAgICAgIGNsYXNzOiAnaW4tc2tldGNoJ1xuICAgICAgICAgIHZhbHVlOiBjb3VudFxuICAgICAgICAgIG5hbWU6IGxhYmVsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBiZzogJyNkZGRkZGQnXG4gICAgICAgICAgc3RhcnQ6IGNvdW50XG4gICAgICAgICAgZW5kOiB0b3RhbFxuICAgICAgICAgIGNsYXNzOiAnb3V0c2lkZS1za2V0Y2gnXG4gICAgICAgICAgdmFsdWU6IHRvdGFsXG4gICAgICAgICAgbGFiZWxfc3RhcnQ6IG91dHNpZGVfc2tldGNoX3N0YXJ0XG4gICAgICAgICAgbmFtZTogJydcbiAgICAgICAgfVxuICAgICAgXVxuXG4gICAgICBAZHJhd0JhcnMocmFuZ2UsIHRvdGFsKSAgXG5cbiAgZHJhd0JhcnM6IChyYW5nZSwgbWF4X3ZhbHVlKSA9PlxuICAgIGVsID0gQCQoJy52aXonKVswXVxuICAgIHggPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgICAgLmRvbWFpbihbMCwgbWF4X3ZhbHVlXSlcbiAgICAgIC5yYW5nZShbMCwgNDAwXSlcblxuICAgIGNoYXJ0ID0gZDMuc2VsZWN0KGVsKVxuICAgIGNoYXJ0LnNlbGVjdEFsbChcImRpdi5yYW5nZVwiKVxuICAgICAgLmRhdGEocmFuZ2UpXG4gICAgLmVudGVyKCkuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAuc3R5bGUoXCJ3aWR0aFwiLCAoZCkgLT4gTWF0aC5yb3VuZCh4KGQuZW5kIC0gZC5zdGFydCksMCkgKyAncHgnKVxuICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCkgLT4gXCJyYW5nZSBcIiArIGQuY2xhc3MpXG4gICAgICAuYXBwZW5kKFwic3BhblwiKVxuICAgICAgICAudGV4dCgoZCkgLT4gXCIje2QubmFtZX1cIilcbiAgICAgICAgLnN0eWxlKFwibGVmdFwiLCAoZCkgLT4gaWYgZC5sYWJlbF9zdGFydCB0aGVuIHgoZC5sYWJlbF9zdGFydCkrJ3B4JyBlbHNlICcnKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIChkKSAtPiBcImxhYmVsLXBvdHMtXCIrZC5jbGFzcylcblxuICBwcm9jZXNzTWluRGltZW5zaW9uOiAoZGF0YSkgPT5cblxuICAgIGZvciBkIGluIGRhdGFcbiAgICAgIGlmIHBhcnNlRmxvYXQoZC5XSURUSCkgPiAxLjBcbiAgICAgICAgZC5NRUVUU19USFJFU0ggPSB0cnVlXG4gICAgICBlbHNlXG4gICAgICAgIGQuTUVFVFNfVEhSRVNIID0gZmFsc2VcblxubW9kdWxlLmV4cG9ydHMgPSBPdmVydmlld1RhYiIsIk92ZXJ2aWV3VGFiID0gcmVxdWlyZSAnLi9vdmVydmlldy5jb2ZmZWUnXG5UcmFkZW9mZnNUYWIgPSByZXF1aXJlICcuL3RyYWRlb2Zmcy5jb2ZmZWUnXG5FbnZpcm9ubWVudFRhYiA9IHJlcXVpcmUgJy4vZW52aXJvbm1lbnQuY29mZmVlJ1xuXG53aW5kb3cuYXBwLnJlZ2lzdGVyUmVwb3J0IChyZXBvcnQpIC0+XG4gIHJlcG9ydC50YWJzIFtPdmVydmlld1RhYiwgRW52aXJvbm1lbnRUYWJdXG4gICMgcGF0aCBtdXN0IGJlIHJlbGF0aXZlIHRvIGRpc3QvXG4gIHJlcG9ydC5zdHlsZXNoZWV0cyBbJy4vcmVwb3J0LmNzcyddXG4iLCJSZXBvcnRUYWIgPSByZXF1aXJlICdyZXBvcnRUYWInXG50ZW1wbGF0ZXMgPSByZXF1aXJlICcuLi90ZW1wbGF0ZXMvdGVtcGxhdGVzLmpzJ1xuZDMgPSB3aW5kb3cuZDNcbl9wYXJ0aWFscyA9IHJlcXVpcmUgJ2FwaS90ZW1wbGF0ZXMnXG5wYXJ0aWFscyA9IFtdXG5mb3Iga2V5LCB2YWwgb2YgX3BhcnRpYWxzXG4gIHBhcnRpYWxzW2tleS5yZXBsYWNlKCdub2RlX21vZHVsZXMvc2Vhc2tldGNoLXJlcG9ydGluZy1hcGkvJywgJycpXSA9IHZhbFxuXG5jbGFzcyBUcmFkZW9mZnNUYWIgZXh0ZW5kcyBSZXBvcnRUYWJcbiAgbmFtZTogJ1RyYWRlb2ZmcydcbiAgY2xhc3NOYW1lOiAndHJhZGVvZmZzJ1xuICB0ZW1wbGF0ZTogdGVtcGxhdGVzLnRyYWRlb2Zmc1xuICBkZXBlbmRlbmNpZXM6WyBcbiAgICAnTW9udHNlcnJhdFRyYWRlb2ZmQW5hbHlzaXMnXG4gIF1cblxuICByZW5kZXI6ICgpIC0+XG4gICAgdHJhZGVvZmZfZGF0YSA9IEByZWNvcmRTZXQoJ01vbnRzZXJyYXRUcmFkZW9mZkFuYWx5c2lzJywgJ1Njb3JlcycpLnRvQXJyYXkoKVxuICAgIEByb3VuZERhdGEgdHJhZGVvZmZfZGF0YVxuXG4gICAgdHJhZGVvZmZzID0gWydGaXNoaW5nIGFuZCBEaXZpbmcnLCAnRmlzaGluZyBhbmQgQ29uc2VydmF0aW9uJywgJ0RpdmluZyBhbmQgQ29uc2VydmF0aW9uJ11cbiAgICBcbiAgICBmaXNoaW5nX3ZhbHMgPSAoaXRlbS5GaXNoaW5nIGZvciBpdGVtIGluIHRyYWRlb2ZmX2RhdGEpXG4gICAgZGl2aW5nX3ZhbHMgPSAoaXRlbS5EaXZpbmcgZm9yIGl0ZW0gaW4gdHJhZGVvZmZfZGF0YSlcbiAgICBjb25zZXJ2YXRpb25fdmFscyA9IChpdGVtLkNvbnNlcnZhdGlvbiBmb3IgaXRlbSBpbiB0cmFkZW9mZl9kYXRhKVxuXG4gICAgZmlzaGluZ19taW4gPSBNYXRoLm1pbiBmaXNoaW5nX3ZhbHNcbiAgICBmaXNoaW5nX21heCA9IE1hdGgubWF4IGZpc2hpbmdfdmFsc1xuXG4gICAgZGl2aW5nX21pbiA9IE1hdGgubWluIGRpdmluZ192YWxzXG4gICAgZGl2aW5nX21heCA9IE1hdGgubWF4IGRpdmluZ192YWxzXG5cbiAgICBjb25zZXJ2YXRpb25fbWluID0gTWF0aC5taW4gY29uc2VydmF0aW9uX3ZhbHNcbiAgICBjb25zZXJ2YXRpb25fbWF4ID0gTWF0aC5tYXggY29uc2VydmF0aW9uX3ZhbHNcblxuICAgIGlzQ29sbGVjdGlvbiA9IEBtb2RlbC5pc0NvbGxlY3Rpb24oKSAgIFxuICAgIGNvbnRleHQgPVxuICAgICAgc2tldGNoOiBAbW9kZWwuZm9yVGVtcGxhdGUoKVxuICAgICAgc2tldGNoQ2xhc3M6IEBza2V0Y2hDbGFzcy5mb3JUZW1wbGF0ZSgpXG4gICAgICBhdHRyaWJ1dGVzOiBAbW9kZWwuZ2V0QXR0cmlidXRlcygpXG4gICAgICBhZG1pbjogQHByb2plY3QuaXNBZG1pbiB3aW5kb3cudXNlclxuICAgICAgdHJhZGVvZmZzOiB0cmFkZW9mZnNcbiAgICAgIGlzQ29sbGVjdGlvbjogaXNDb2xsZWN0aW9uXG4gICAgICBcbiAgICBAJGVsLmh0bWwgQHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBwYXJ0aWFscylcbiAgICBAJCgnLmNob3NlbicpLmNob3Nlbih7ZGlzYWJsZV9zZWFyY2hfdGhyZXNob2xkOiAxMCwgd2lkdGg6JzM4MHB4J30pXG4gICAgQCQoJy5jaG9zZW4nKS5jaGFuZ2UgKCkgPT5cbiAgICAgIF8uZGVmZXIgQHJlbmRlclRyYWRlb2Zmc1xuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICBAc2V0dXBTY2F0dGVyUGxvdCh0cmFkZW9mZl9kYXRhLCAnLmZpc2hpbmctdi1kaXZpbmcnLCBcIlZhbHVlIG9mIEZpc2hpbmdcIiwgXG4gICAgICAgIFwiVmFsdWUgb2YgRGl2aW5nXCIsIFwiRmlzaGluZ1wiLCBcIkRpdmluZ1wiLCBmaXNoaW5nX21pbiwgZmlzaGluZ19tYXgsIGRpdmluZ19taW4sIGRpdmluZ19tYXgpXG5cbiAgICAgIEBzZXR1cFNjYXR0ZXJQbG90KHRyYWRlb2ZmX2RhdGEsICcuZmlzaGluZy12LWNvbnNlcnZhdGlvbicsIFwiVmFsdWUgb2YgRmlzaGluZ1wiLCBcbiAgICAgICAgXCJWYWx1ZSBvZiBDb25zZXJ2YXRpb25cIiwgXCJGaXNoaW5nXCIsIFwiQ29uc2VydmF0aW9uXCIsIGZpc2hpbmdfbWluLCBmaXNoaW5nX21heCwgY29uc2VydmF0aW9uX21pbiwgY29uc2VydmF0aW9uX21heClcblxuICAgICAgQHNldHVwU2NhdHRlclBsb3QodHJhZGVvZmZfZGF0YSwgJy5kaXZpbmctdi1jb25zZXJ2YXRpb24nLCBcIlZhbHVlIG9mIERpdmluZ1wiLCBcbiAgICAgICAgXCJWYWx1ZSBvZiBDb25zZXJ2YXRpb25cIiwgXCJEaXZpbmdcIiwgXCJDb25zZXJ2YXRpb25cIiwgZGl2aW5nX21pbiwgZGl2aW5nX21heCwgY29uc2VydmF0aW9uX21pbiwgY29uc2VydmF0aW9uX21heClcblxuICBzZXR1cFNjYXR0ZXJQbG90OiAodHJhZGVvZmZfZGF0YSwgY2hhcnRfbmFtZSwgeGxhYiwgeWxhYiwgbW91c2VYUHJvcCwgbW91c2VZUHJvcCwgZmlzaGluZ01pbiwgZmlzaGluZ01heCwgZGl2aW5nTWluLCBkaXZpbmdNYXgpID0+XG4gICAgICBoID0gMzgwXG4gICAgICB3ID0gMzgwXG4gICAgICBtYXJnaW4gPSB7bGVmdDo0MCwgdG9wOjUsIHJpZ2h0OjQwLCBib3R0b206IDQwLCBpbm5lcjo1fVxuICAgICAgaGFsZmggPSAoaCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20pXG4gICAgICB0b3RhbGggPSBoYWxmaCoyXG4gICAgICBoYWxmdyA9ICh3K21hcmdpbi5sZWZ0K21hcmdpbi5yaWdodClcbiAgICAgIHRvdGFsdyA9IGhhbGZ3KjJcblxuICAgICAgI21ha2Ugc3VyZSBpdHMgQHNjYXR0ZXJwbG90IHRvIHBhc3MgaW4gdGhlIHJpZ2h0IGNvbnRleHQgKHRhYikgZm9yIGQzXG4gICAgICB0aGVjaGFydCA9IEBzY2F0dGVycGxvdChjaGFydF9uYW1lLCBtb3VzZVhQcm9wLCBtb3VzZVlQcm9wLCBmaXNoaW5nTWluLCBmaXNoaW5nTWF4LCBkaXZpbmdNaW4sIGRpdmluZ01heCkueHZhcigwKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueXZhcigxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueGxhYih4bGFiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAueWxhYih5bGFiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuaGVpZ2h0KGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aWR0aCh3KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFyZ2luKG1hcmdpbilcblxuICAgICAgY2ggPSBkMy5zZWxlY3QoQCQoY2hhcnRfbmFtZSkpXG4gICAgICBjaC5kYXR1bSh0cmFkZW9mZl9kYXRhKVxuICAgICAgICAuY2FsbCh0aGVjaGFydClcbiAgICAgIFxuICAgICAgdG9vbHRpcCA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgLmFwcGVuZChcImRpdlwiKVxuICAgICAgICAuYXR0cihcImNsYXNzXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAuYXR0cihcImlkXCIsIFwiY2hhcnQtdG9vbHRpcFwiKVxuICAgICAgICAudGV4dChcImRhdGFcIilcblxuICAgICBcbiAgICAgIHZlcnRpY2FsUnVsZSA9IGQzLnNlbGVjdChcImJvZHlcIilcbiAgICAgICAgICAuYXBwZW5kKFwiZGl2XCIpXG4gICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBcInZlcnRpY2FsUnVsZVwiKVxuICAgICAgICAgIC5zdHlsZShcInBvc2l0aW9uXCIsIFwiYWJzb2x1dGVcIilcbiAgICAgICAgICAuc3R5bGUoXCJ6LWluZGV4XCIsIFwiMTlcIilcbiAgICAgICAgICAuc3R5bGUoXCJ3aWR0aFwiLCBcIjFweFwiKVxuICAgICAgICAgIC5zdHlsZShcImhlaWdodFwiLCBcIjI1MHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwidG9wXCIsIFwiMTBweFwiKVxuICAgICAgICAgIC5zdHlsZShcImJvdHRvbVwiLCBcIjMwcHhcIilcbiAgICAgICAgICAuc3R5bGUoXCJsZWZ0XCIsIFwiMHB4XCIpXG4gICAgICAgICAgLnN0eWxlKFwiYmFja2dyb3VuZFwiLCBcImJsYWNrXCIpO1xuXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IFxuXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwidmlzaWJsZVwiKS5odG1sKFwiPHVsPjxzdHJvbmc+UHJvcG9zYWw6IFwiK3dpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZStcIjwvc3Ryb25nPjxsaT5cIit4bGFiK1wiOiBcIitkW21vdXNlWFByb3BdK1wiPC9saT48bGk+IFwiK3lsYWIrXCI6IFwiK2RbbW91c2VZUHJvcF0rXCI8L2xpPjwvdWw+XCIpXG4gICAgICAgIFxuICAgICAgdGhlY2hhcnQucG9pbnRzU2VsZWN0KClcblxuICAgICAgICAub24gXCJtb3VzZW1vdmVcIiwgKGQpIC0+IFxuICAgICAgICAgIHJldHVybiB0b29sdGlwLnN0eWxlKFwidG9wXCIsIChldmVudC5wYWdlWS0xMCkrXCJweFwiKS5zdHlsZShcImxlZnRcIiwoY2FsY190dGlwKGV2ZW50LnBhZ2VYLCBkLCB0b29sdGlwKSkrXCJweFwiKVxuICAgICAgXG4gICAgICB0aGVjaGFydC5wb2ludHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gXG4gICAgICAgICAgcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW92ZXJcIiwgKGQpIC0+IHJldHVybiB0b29sdGlwLnN0eWxlKFwidmlzaWJpbGl0eVwiLCBcInZpc2libGVcIikuaHRtbChcIjx1bD48c3Ryb25nPlByb3Bvc2FsOiBcIit3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUrXCI8L3N0cm9uZz48bGk+IFwiK3hsYWIrXCI6IFwiK2RbbW91c2VYUHJvcF0rXCI8L2xpPjxsaT4gXCIreWxhYitcIjogXCIrZFttb3VzZVlQcm9wXStcIjwvbGk+PC91bD5cIilcbiAgICAgIHRoZWNoYXJ0LmxhYmVsc1NlbGVjdCgpXG4gICAgICAgIC5vbiBcIm1vdXNlbW92ZVwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ0b3BcIiwgKGV2ZW50LnBhZ2VZLTEwKStcInB4XCIpLnN0eWxlKFwibGVmdFwiLChjYWxjX3R0aXAoZXZlbnQucGFnZVgsIGQsIHRvb2x0aXApKStcInB4XCIpXG4gICAgICB0aGVjaGFydC5sYWJlbHNTZWxlY3QoKVxuICAgICAgICAub24gXCJtb3VzZW91dFwiLCAoZCkgLT4gcmV0dXJuIHRvb2x0aXAuc3R5bGUoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpXG5cblxuICByZW5kZXJUcmFkZW9mZnM6ICgpID0+XG4gICAgbmFtZSA9IEAkKCcuY2hvc2VuJykudmFsKClcbiAgICBpZiBuYW1lID09IFwiRmlzaGluZyBhbmQgRGl2aW5nXCJcbiAgICAgIEAkKCcuZnZkX2NvbnRhaW5lcicpLnNob3coKVxuICAgICAgQCQoJy5mdmNfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmR2Y19jb250YWluZXInKS5oaWRlKClcbiAgICBlbHNlIGlmIG5hbWUgPT0gXCJGaXNoaW5nIGFuZCBDb25zZXJ2YXRpb25cIlxuICAgICAgQCQoJy5mdmRfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmZ2Y19jb250YWluZXInKS5zaG93KClcbiAgICAgIEAkKCcuZHZjX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgIGVsc2UgaWYgbmFtZSA9PSBcIkRpdmluZyBhbmQgQ29uc2VydmF0aW9uXCJcbiAgICAgIEAkKCcuZnZkX2NvbnRhaW5lcicpLmhpZGUoKVxuICAgICAgQCQoJy5mdmNfY29udGFpbmVyJykuaGlkZSgpXG4gICAgICBAJCgnLmR2Y19jb250YWluZXInKS5zaG93KClcblxuXG4gIGNhbGNfdHRpcCA9ICh4bG9jLCBkYXRhLCB0b29sdGlwKSAtPlxuICAgIHRkaXYgPSB0b29sdGlwWzBdWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG4gICAgdGxlZnQgPSB0ZGl2LmxlZnRcbiAgICB0dyA9IHRkaXYud2lkdGhcbiAgICByZXR1cm4geGxvYy0odHcrMTApIGlmICh4bG9jK3R3ID4gdGxlZnQrdHcpXG4gICAgcmV0dXJuIHhsb2MrMTBcblxuXG4gIHNjYXR0ZXJwbG90OiAoY2hhcnRfbmFtZSwgeHZhbCwgeXZhbCwgZmlzaGluZ01pbiwgZmlzaGluZ01heCwgZGl2aW5nTWluLCBkaXZpbmdNYXgpID0+XG4gICAgdmlldyA9IEBcbiAgICB3aWR0aCA9IDM4MFxuICAgIGhlaWdodCA9IDYwMFxuICAgIG1hcmdpbiA9IHtsZWZ0OjQwLCB0b3A6NSwgcmlnaHQ6NDAsIGJvdHRvbTogNDAsIGlubmVyOjV9XG4gICAgYXhpc3BvcyA9IHt4dGl0bGU6MjUsIHl0aXRsZTozMCwgeGxhYmVsOjUsIHlsYWJlbDoxfVxuICAgIHhsaW0gPSBudWxsXG4gICAgeWxpbSA9IG51bGxcbiAgICBueHRpY2tzID0gNVxuICAgIHh0aWNrcyA9IG51bGxcbiAgICBueXRpY2tzID0gNVxuICAgIHl0aWNrcyA9IG51bGxcbiAgICBcbiAgICByZWN0Y29sb3IgPSBcIndoaXRlXCJcbiAgICBwb2ludHNpemUgPSA1ICMgZGVmYXVsdCA9IG5vIHZpc2libGUgcG9pbnRzIGF0IG1hcmtlcnNcbiAgICB4bGFiID0gXCJYXCJcbiAgICB5bGFiID0gXCJZIHNjb3JlXCJcbiAgICB5c2NhbGUgPSBkMy5zY2FsZS5saW5lYXIoKVxuICAgIHhzY2FsZSA9IGQzLnNjYWxlLmxpbmVhcigpXG4gICAgbGVnZW5kaGVpZ2h0ID0gMzAwXG4gICAgcG9pbnRzU2VsZWN0ID0gbnVsbFxuICAgIGxhYmVsc1NlbGVjdCA9IG51bGxcbiAgICBsZWdlbmRTZWxlY3QgPSBudWxsXG4gICAgdmVydGljYWxSdWxlID0gbnVsbFxuICAgIGhvcml6b250YWxSdWxlID0gbnVsbFxuXG4gICAgaWYgd2luZG93LmQzXG4gICAgICAjY2xlYXIgb3V0IHRoZSBvbGQgdmFsdWVzXG4gICAgICB2aWV3LiQoY2hhcnRfbmFtZSkuaHRtbCgnJylcbiAgICAgIGVsID0gdmlldy4kKGNoYXJ0X25hbWUpWzBdXG5cbiAgICAjIyB0aGUgbWFpbiBmdW5jdGlvblxuICAgIGNoYXJ0ID0gKHNlbGVjdGlvbikgLT5cbiAgICAgIHNlbGVjdGlvbi5lYWNoIChkYXRhKSAtPlxuICAgICAgICB4ID0gZGF0YS5tYXAgKGQpIC0+IHBhcnNlRmxvYXQoZFt4dmFsXSlcbiAgICAgICAgeSA9IGRhdGEubWFwIChkKSAtPiBwYXJzZUZsb2F0KGRbeXZhbF0pXG5cbiAgICAgICAgcGFuZWxvZmZzZXQgPSAwXG4gICAgICAgIHBhbmVsd2lkdGggPSB3aWR0aFxuICAgICAgICBwYW5lbGhlaWdodCA9IGhlaWdodFxuXG4gICAgICAgIHhsaW0gPSBbZDMubWluKHgpLTAuMjUsIHBhcnNlRmxvYXQoZDMubWF4KHgpKzAuMjUpXSBpZiAhKHhsaW0/KVxuICAgICAgICB5bGltID0gW2QzLm1pbih5KS0wLjI1LCBwYXJzZUZsb2F0KGQzLm1heCh5KSswLjI1KV0gaWYgISh5bGltPylcblxuICAgICAgICAjIEknbGwgcmVwbGFjZSBtaXNzaW5nIHZhbHVlcyBzb21ldGhpbmcgc21hbGxlciB0aGFuIHdoYXQncyBvYnNlcnZlZFxuICAgICAgICBuYV92YWx1ZSA9IGQzLm1pbih4LmNvbmNhdCB5KSAtIDEwMFxuICAgICAgICBjdXJyZWxlbSA9IGQzLnNlbGVjdCh2aWV3LiQoY2hhcnRfbmFtZSlbMF0pXG4gICAgICAgIHN2ZyA9IGQzLnNlbGVjdCh2aWV3LiQoY2hhcnRfbmFtZSlbMF0pLmFwcGVuZChcInN2Z1wiKS5kYXRhKFtkYXRhXSlcbiAgICAgICAgc3ZnLmFwcGVuZChcImdcIilcblxuICAgICAgICAjIFVwZGF0ZSB0aGUgb3V0ZXIgZGltZW5zaW9ucy5cbiAgICAgICAgc3ZnLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aCttYXJnaW4ubGVmdCttYXJnaW4ucmlnaHQpXG4gICAgICAgICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCttYXJnaW4udG9wK21hcmdpbi5ib3R0b20rZGF0YS5sZW5ndGgqMzUpXG4gICAgICAgIGcgPSBzdmcuc2VsZWN0KFwiZ1wiKVxuXG4gICAgICAgICMgYm94XG4gICAgICAgIGcuYXBwZW5kKFwicmVjdFwiKVxuICAgICAgICAgLmF0dHIoXCJ4XCIsIHBhbmVsb2Zmc2V0K21hcmdpbi5sZWZ0KVxuICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3ApXG4gICAgICAgICAuYXR0cihcImhlaWdodFwiLCBwYW5lbGhlaWdodClcbiAgICAgICAgIC5hdHRyKFwid2lkdGhcIiwgcGFuZWx3aWR0aClcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCByZWN0Y29sb3IpXG4gICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcIm5vbmVcIilcblxuXG4gICAgICAgICMgc2ltcGxlIHNjYWxlcyAoaWdub3JlIE5BIGJ1c2luZXNzKVxuICAgICAgICB4cmFuZ2UgPSBbbWFyZ2luLmxlZnQrcGFuZWxvZmZzZXQrbWFyZ2luLmlubmVyLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldCtwYW5lbHdpZHRoLW1hcmdpbi5pbm5lcl1cbiAgICAgICAgeXJhbmdlID0gW21hcmdpbi50b3ArcGFuZWxoZWlnaHQtbWFyZ2luLmlubmVyLCBtYXJnaW4udG9wK21hcmdpbi5pbm5lcl1cbiAgICAgICAgeHNjYWxlLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzY2FsZS5kb21haW4oeWxpbSkucmFuZ2UoeXJhbmdlKVxuICAgICAgICB4cyA9IGQzLnNjYWxlLmxpbmVhcigpLmRvbWFpbih4bGltKS5yYW5nZSh4cmFuZ2UpXG4gICAgICAgIHlzID0gZDMuc2NhbGUubGluZWFyKCkuZG9tYWluKHlsaW0pLnJhbmdlKHlyYW5nZSlcblxuICAgICAgICAjIGlmIHl0aWNrcyBub3QgcHJvdmlkZWQsIHVzZSBueXRpY2tzIHRvIGNob29zZSBwcmV0dHkgb25lc1xuICAgICAgICB5dGlja3MgPSB5cy50aWNrcyhueXRpY2tzKSBpZiAhKHl0aWNrcz8pXG4gICAgICAgIHh0aWNrcyA9IHhzLnRpY2tzKG54dGlja3MpIGlmICEoeHRpY2tzPylcblxuICAgICAgICAjIHgtYXhpc1xuICAgICAgICB4YXhpcyA9IGcuYXBwZW5kKFwiZ1wiKS5hdHRyKFwiY2xhc3NcIiwgXCJ4IGF4aXNcIilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YSh4dGlja3MpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwibGluZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwieDFcIiwgKGQpIC0+IHhzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngyXCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgbWFyZ2luLnRvcCtoZWlnaHQpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHh0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkKSAtPiB4c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueGxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHh0aWNrcykoZCkpXG4gICAgICAgIHhheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwieGF4aXMtdGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInhcIiwgbWFyZ2luLmxlZnQrd2lkdGgvMilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcCtoZWlnaHQrYXhpc3Bvcy54dGl0bGUpXG4gICAgICAgICAgICAgLnRleHQoeGxhYilcbiAgICAgICAgeGF4aXMuc2VsZWN0QWxsKFwiZW1wdHlcIilcbiAgICAgICAgICAgICAuZGF0YShkYXRhKVxuICAgICAgICAgICAgIC5lbnRlcigpXG4gICAgICAgICAgICAgLmFwcGVuZChcImNpcmNsZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY3hcIiwgKGQsaSkgLT4gbWFyZ2luLmxlZnQpXG4gICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiBtYXJnaW4udG9wK2hlaWdodCtheGlzcG9zLnh0aXRsZSsoKGkrMSkqMzApKzYpXG4gICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGkgJSAxN1xuICAgICAgICAgICAgICAgICAgICAgICAgICBjb2wgPSBnZXRDb2xvcnModmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcblxuICAgICAgICB4YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAuYXBwZW5kKFwidGV4dFwiKVxuICAgICAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgXCJsZWdlbmQtdGV4dFwiKVxuXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hcmdpbi5sZWZ0KzIwKVxuICAgICAgICAgICAgIC5hdHRyKFwieVwiLCAoZCxpKSAtPlxuICAgICAgICAgICAgICAgIG1hcmdpbi50b3AraGVpZ2h0K2F4aXNwb3MueHRpdGxlKygoaSsxKSozMCkpXG4gICAgICAgICAgICAgLnRleHQoKGQpIC0+IHJldHVybiB3aW5kb3cuYXBwLnNrZXRjaGVzLmdldChkLlBST1BPU0FMKS5hdHRyaWJ1dGVzLm5hbWUpXG4gICAgICAgICMgeS1heGlzXG4gICAgICAgIHlheGlzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJjbGFzc1wiLCBcInkgYXhpc1wiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJsaW5lXCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5MVwiLCAoZCkgLT4geXNjYWxlKGQpKVxuICAgICAgICAgICAgIC5hdHRyKFwieTJcIiwgKGQpIC0+IHlzY2FsZShkKSlcbiAgICAgICAgICAgICAuYXR0cihcIngxXCIsIG1hcmdpbi5sZWZ0KVxuICAgICAgICAgICAgIC5hdHRyKFwieDJcIiwgbWFyZ2luLmxlZnQrd2lkdGgpXG4gICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIFwibm9uZVwiKVxuICAgICAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCAxKVxuICAgICAgICAgICAgIC5zdHlsZShcInBvaW50ZXItZXZlbnRzXCIsIFwibm9uZVwiKVxuICAgICAgICB5YXhpcy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgIC5kYXRhKHl0aWNrcylcbiAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkKSAtPiB5c2NhbGUoZCkpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueWxhYmVsKVxuICAgICAgICAgICAgIC50ZXh0KChkKSAtPiBmb3JtYXRBeGlzKHl0aWNrcykoZCkpXG4gICAgICAgIHlheGlzLmFwcGVuZChcInRleHRcIikuYXR0cihcImNsYXNzXCIsIFwidGl0bGVcIilcbiAgICAgICAgICAgICAuYXR0cihcInlcIiwgbWFyZ2luLnRvcC04KyhoZWlnaHQvMikpXG4gICAgICAgICAgICAgLmF0dHIoXCJ4XCIsIG1hcmdpbi5sZWZ0LWF4aXNwb3MueXRpdGxlKVxuICAgICAgICAgICAgIC50ZXh0KHlsYWIpXG4gICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMjcwLCN7bWFyZ2luLmxlZnQtYXhpc3Bvcy55dGl0bGV9LCN7bWFyZ2luLnRvcCtoZWlnaHQvMn0pXCIpXG5cblxuICAgICAgICBsYWJlbHMgPSBnLmFwcGVuZChcImdcIikuYXR0cihcImlkXCIsIFwibGFiZWxzXCIpXG4gICAgICAgIGxhYmVsc1NlbGVjdCA9XG4gICAgICAgICAgbGFiZWxzLnNlbGVjdEFsbChcImVtcHR5XCIpXG4gICAgICAgICAgICAgICAgLmRhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICAuZW50ZXIoKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJ0ZXh0XCIpXG4gICAgICAgICAgICAgICAgLnRleHQoKGQpLT4gcmV0dXJuIHdpbmRvdy5hcHAuc2tldGNoZXMuZ2V0KGQuUFJPUE9TQUwpLmF0dHJpYnV0ZXMubmFtZSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInhcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgIHhwb3MgPSB4c2NhbGUoeFtpXSlcbiAgICAgICAgICAgICAgICAgIHN0cmluZ19lbmQgPSB4cG9zK3RoaXMuZ2V0Q29tcHV0ZWRUZXh0TGVuZ3RoKClcbiAgICAgICAgICAgICAgICAgIG92ZXJsYXBfeHN0YXJ0ID0geHBvcy0odGhpcy5nZXRDb21wdXRlZFRleHRMZW5ndGgoKSs1KVxuICAgICAgICAgICAgICAgICAgaWYgb3ZlcmxhcF94c3RhcnQgPCA1MFxuICAgICAgICAgICAgICAgICAgICBvdmVybGFwX3hzdGFydCA9IDUwXG4gICAgICAgICAgICAgICAgICByZXR1cm4gb3ZlcmxhcF94c3RhcnQgaWYgc3RyaW5nX2VuZCA+IHdpZHRoXG4gICAgICAgICAgICAgICAgICByZXR1cm4geHBvcys1XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ5XCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICB5cG9zID0geXNjYWxlKHlbaV0pXG4gICAgICAgICAgICAgICAgICByZXR1cm4geXBvcysxMCBpZiAoeXBvcyA8IDUwKVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIHlwb3MtNVxuICAgICAgICAgICAgICAgICAgKVxuXG5cbiAgICAgICAgcG9pbnRzID0gZy5hcHBlbmQoXCJnXCIpLmF0dHIoXCJpZFwiLCBcInBvaW50c1wiKVxuICAgICAgICBwb2ludHNTZWxlY3QgPVxuICAgICAgICAgIHBvaW50cy5zZWxlY3RBbGwoXCJlbXB0eVwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKGRhdGEpXG4gICAgICAgICAgICAgICAgLmVudGVyKClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFwiY2lyY2xlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeFwiLCAoZCxpKSAtPiB4c2NhbGUoeFtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjeVwiLCAoZCxpKSAtPiB5c2NhbGUoeVtpXSkpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCAoZCxpKSAtPiBcInB0I3tpfVwiKVxuICAgICAgICAgICAgICAgIC5hdHRyKFwiclwiLCBwb2ludHNpemUpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIChkLGkpIC0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbCA9IGlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0Q29sb3JzKFt2YWxdKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCAoZCwgaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsID0gTWF0aC5mbG9vcihpLzE3KSAlIDVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgY29sID0gZ2V0U3Ryb2tlQ29sb3IodmFsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIjFcIilcbiAgICAgICAgICAgICAgICAuYXR0cihcIm9wYWNpdHlcIiwgKGQsaSkgLT5cbiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAxIGlmICh4W2ldPyBvciB4TkEuaGFuZGxlKSBhbmQgKHlbaV0/IG9yIHlOQS5oYW5kbGUpXG4gICAgICAgICAgICAgICAgICAgICByZXR1cm4gMClcblxuICAgICAgICAjIGJveFxuICAgICAgICBnLmFwcGVuZChcInJlY3RcIilcbiAgICAgICAgICAgICAgIC5hdHRyKFwieFwiLCBtYXJnaW4ubGVmdCtwYW5lbG9mZnNldClcbiAgICAgICAgICAgICAgIC5hdHRyKFwieVwiLCBtYXJnaW4udG9wKVxuICAgICAgICAgICAgICAgLmF0dHIoXCJoZWlnaHRcIiwgcGFuZWxoZWlnaHQpXG4gICAgICAgICAgICAgICAuYXR0cihcIndpZHRoXCIsIHBhbmVsd2lkdGgpXG4gICAgICAgICAgICAgICAuYXR0cihcImZpbGxcIiwgXCJub25lXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZVwiLCBcImJsYWNrXCIpXG4gICAgICAgICAgICAgICAuYXR0cihcInN0cm9rZS13aWR0aFwiLCBcIm5vbmVcIilcbiAgICAgICAgICAgICAgICBcblxuICAgICMjIGNvbmZpZ3VyYXRpb24gcGFyYW1ldGVyc1xuICAgIGNoYXJ0LndpZHRoID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHdpZHRoIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB3aWR0aCA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQuaGVpZ2h0ID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIGhlaWdodCBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgaGVpZ2h0ID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5tYXJnaW4gPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gbWFyZ2luIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICBtYXJnaW4gPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LmF4aXNwb3MgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gYXhpc3BvcyBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgYXhpc3BvcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueGxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueHRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG54dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG54dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnh0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHh0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueWxpbSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5bGltIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB5bGltID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5ueXRpY2tzID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIG55dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIG55dGlja3MgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0Lnl0aWNrcyA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB5dGlja3MgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl0aWNrcyA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucmVjdGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHJlY3Rjb2xvciBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgcmVjdGNvbG9yID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC5wb2ludGNvbG9yID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHBvaW50Y29sb3IgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50Y29sb3IgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnBvaW50c2l6ZSA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiBwb2ludHNpemUgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c2l6ZSA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQucG9pbnRzdHJva2UgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4gcG9pbnRzdHJva2UgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHBvaW50c3Ryb2tlID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC54bGFiID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHhsYWIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHhsYWIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlsYWIgPSAodmFsdWUpIC0+XG4gICAgICByZXR1cm4geWxhYiBpZiAhYXJndW1lbnRzLmxlbmd0aFxuICAgICAgeWxhYiA9IHZhbHVlXG4gICAgICBjaGFydFxuXG4gICAgY2hhcnQueHZhciA9ICh2YWx1ZSkgLT5cbiAgICAgIHJldHVybiB4dmFyIGlmICFhcmd1bWVudHMubGVuZ3RoXG4gICAgICB4dmFyID0gdmFsdWVcbiAgICAgIGNoYXJ0XG5cbiAgICBjaGFydC55dmFyID0gKHZhbHVlKSAtPlxuICAgICAgcmV0dXJuIHl2YXIgaWYgIWFyZ3VtZW50cy5sZW5ndGhcbiAgICAgIHl2YXIgPSB2YWx1ZVxuICAgICAgY2hhcnRcblxuICAgIGNoYXJ0LnlzY2FsZSA9ICgpIC0+XG4gICAgICByZXR1cm4geXNjYWxlXG5cbiAgICBjaGFydC54c2NhbGUgPSAoKSAtPlxuICAgICAgcmV0dXJuIHhzY2FsZVxuXG4gICAgY2hhcnQucG9pbnRzU2VsZWN0ID0gKCkgLT5cbiAgICAgIHJldHVybiBwb2ludHNTZWxlY3RcblxuICAgIGNoYXJ0LmxhYmVsc1NlbGVjdCA9ICgpIC0+XG4gICAgICByZXR1cm4gbGFiZWxzU2VsZWN0XG5cbiAgICBjaGFydC5sZWdlbmRTZWxlY3QgPSAoKSAtPlxuICAgICAgcmV0dXJuIGxlZ2VuZFNlbGVjdFxuXG4gICAgY2hhcnQudmVydGljYWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiB2ZXJ0aWNhbFJ1bGVcblxuICAgIGNoYXJ0Lmhvcml6b250YWxSdWxlID0gKCkgLT5cbiAgICAgIHJldHVybiBob3Jpem9udGFsUnVsZVxuXG4gICAgIyByZXR1cm4gdGhlIGNoYXJ0IGZ1bmN0aW9uXG4gICAgY2hhcnRcblxuICByb3VuZERhdGE6IChkYXRhKSA9PiBcbiAgICBmb3IgZCBpbiBkYXRhXG4gICAgICBkLkZpc2hpbmcgPSBwYXJzZUZsb2F0KGQuRmlzaGluZykudG9GaXhlZCgyKVxuICAgICAgZC5EaXZpbmcgPSBwYXJzZUZsb2F0KGQuRGl2aW5nKS50b0ZpeGVkKDIpXG5cbiAgZ2V0Q29sb3JzID0gKGkpIC0+XG4gICAgY29sb3JzID0gW1wiTGlnaHRHcmVlblwiLCBcIkxpZ2h0UGlua1wiLCBcIkxpZ2h0U2t5Qmx1ZVwiLCBcIk1vY2Nhc2luXCIsIFwiQmx1ZVZpb2xldFwiLCBcIkdhaW5zYm9yb1wiLCBcIkRhcmtHcmVlblwiLCBcIkRhcmtUdXJxdW9pc2VcIiwgXCJtYXJvb25cIiwgXCJuYXZ5XCIsIFwiTGVtb25DaGlmZm9uXCIsIFwib3JhbmdlXCIsICBcInJlZFwiLCBcInNpbHZlclwiLCBcInRlYWxcIiwgXCJ3aGl0ZVwiLCBcImJsYWNrXCJdXG4gICAgcmV0dXJuIGNvbG9yc1tpXVxuXG4gIGdldFN0cm9rZUNvbG9yID0gKGkpIC0+XG4gICAgc2NvbG9ycyA9IFtcImJsYWNrXCIsIFwid2hpdGVcIiwgXCJncmF5XCIsIFwiYnJvd25cIiwgXCJOYXZ5XCJdXG4gICAgcmV0dXJuIHNjb2xvcnNbaV1cblxuICAjIGZ1bmN0aW9uIHRvIGRldGVybWluZSByb3VuZGluZyBvZiBheGlzIGxhYmVsc1xuICBmb3JtYXRBeGlzID0gKGQpIC0+XG4gICAgZCA9IGRbMV0gLSBkWzBdXG4gICAgbmRpZyA9IE1hdGguZmxvb3IoIE1hdGgubG9nKGQgJSAxMCkgLyBNYXRoLmxvZygxMCkgKVxuICAgIG5kaWcgPSAwIGlmIG5kaWcgPiAwXG4gICAgbmRpZyA9IE1hdGguYWJzKG5kaWcpXG4gICAgZDMuZm9ybWF0KFwiLiN7bmRpZ31mXCIpXG5cbm1vZHVsZS5leHBvcnRzID0gVHJhZGVvZmZzVGFiIiwidGhpc1tcIlRlbXBsYXRlc1wiXSA9IHRoaXNbXCJUZW1wbGF0ZXNcIl0gfHwge307XG50aGlzW1wiVGVtcGxhdGVzXCJdW1wiZW52aXJvbm1lbnRcIl0gPSBuZXcgSG9nYW4uVGVtcGxhdGUoZnVuY3Rpb24oYyxwLGkpe3ZhciBfPXRoaXM7Xy5iKGk9aXx8XCJcIik7aWYoXy5zKF8uZihcImhhc1pvbmVXaXRoR29hbFwiLGMscCwxKSxjLHAsMCwyMCwzNTI0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5CZW50aGljIEhhYml0YXRzIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDEwNywxMjksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcImluIEFsbCBNYXJpbmUgUmVzZXJ2ZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTgwNzlkZDVhMWVjMzZmNTU5NWZiMmIwXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgZm9sbG93aW5nIHRhYmxlIGRlc2NyaWJlcyB0aGUgb3ZlcmxhcCBiZXR3ZWVuIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDMyOCwzNzIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcInRoZSBtYXJpbmUgcmVzZXJ2ZSBza2V0Y2hlcyB3aXRoaW4geW91ciBwbGFuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwieW91ciBza2V0Y2hcIik7fTtfLmIoXCIgYW5kIHRoZSBiZW50aGljIGhhYml0YXRzIG9mIE1vbnRzZXJyYXQsIHdoaWNoIHlvdSBjYW4gdmlldyBieSBjaGVja2luZyB0aGUgJ3Nob3cgbGF5ZXInIGJveCBhdCByaWdodC4gVGhlIE1OSSAyMDE2IGJlbnRoaWMgaGFiaXRhdCBtYXAgd2FzIGRpZ2l0aXplZCBieSBoYW5kIHVzaW5nIGEgY29tYmluYXRpb24gb2YgaW4gc2l0dSBvYnNlcnZhdGlvbnMgb24gc2N1YmEvZnJlZSBkaXZlIGF0IHN1cnZleSBzaXRlcyAobiA9IGFwcHJveC4gNjAwKSBhbmQgZHJvcCBjYW1lcmEgZGVwbG95bWVudHMgKG4gPSAzNDMpIGFzIHBhcnQgb2YgdGhlIFdhaXR0IEluc3RpdHV0ZSBTY2llbnRpZmljIEFzc2Vzc21lbnQuIFByZWxpbWluYXJ5IGNvbnRleHQgZm9yIG1hcHBpbmcgd2FzIGdsZWFuZWQgZnJvbSBiZW50aGljIG1hcHMgZGVwaWN0ZWQgaW4gV2lsZCBldC4gYWwgMjAwNyBhbmQgSVJGIDE5OTMuIFRoZXNlIG1hcHMgcHJvdmlkZWQgdmFsdWFibGUgaW5zaWdodCBpbnRvIGRvbWluYW50IGJlbnRoaWMgZmVhdHVyZXMgYW5kIHRoZSBpbnRlcnByZXRhdGlvbiBvZiBzaXRlIG9ic2VydmF0aW9ucy4gXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjQwcHg7XFxcIj5NZWV0cyAxMCUgR29hbD88c3VwPio8L3N1cD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDo0MHB4O1xcXCI+TWVldHMgMjAlIEdvYWw/PHN1cD4qPC9zdXA+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk1lZXRzIDMwJSBHb2FsPzxzdXA+Kjwvc3VwPjwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyMjVweDtcXFwiPkhhYml0YXQ8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0aD5BcmVhIChzcS4ga20uKTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRoPkFyZWEgKCUgb2YgVG90YWwpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhYml0YXRzXCIsYyxwLDEpLGMscCwwLDE0ODMsMzAxMyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfMTBfR09BTFwiLGMscCwxKSxjLHAsMCwxNTUyLDE2MjUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfMTBfR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwwLDE3MDksMTc3NixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJuby1nb2FsXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfMjBfR09BTFwiLGMscCwxKSxjLHAsMCwyMDExLDIwODQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfMjBfR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwwLDIxNjgsMjIzNSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJuby1nb2FsXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiTUVFVFNfMzBfR09BTFwiLGMscCwxKSxjLHAsMCwyNDcwLDI1NDMsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTUVFVFNfMzBfR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe2lmKF8ucyhfLmYoXCJOT19HT0FMXCIsYyxwLDEpLGMscCwwLDI2MjcsMjY5NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJuby1nb2FsXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiTk9fR09BTFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cXFwic21hbGwtcmVkLXhcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fTt9O18uYihcIiAgICAgICAgICAgICAgPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJIQUJfVFlQRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFSRUFfU1FLTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRmb290PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkIGNvbHNwYW49XFxcIjZcXFwiIHN0eWxlPVxcXCJwYWRkaW5nLWxlZnQ6MTBweDt0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDxzdXA+Kjwvc3VwPkluZGljYXRlcyB3aGV0aGVyIHRoZSBzZWxlY3RlZCBNYXJpbmUgUmVzZXJ2ZXMgem9uZXMgaGF2ZSByZWFjaGVkIHRoIGNvbnNlcnZhdGlvbiBnb2FsIG9mIHByZXNlcnZpbmcgMTAvMjAvMzAlIG9mIGVhY2ggaGFiaXRhdC4gQSBncmVlbiBjaGVjayBpbmRpY2F0ZXMgdGhhdCB0aGUgZ29hbCBpcyBtZXQsIHJlZCB4IG1lYW5zIHRoYXQgdGhlIGdvYWwgaXMgbm90IG1ldCwgYW5kIGEgZ3JheSBkYXNoIGluZGljYXRlcyB0aGF0IHRoZXJlIGlzIG5vIGdvYWwgZm9yIHRoYXQgaGFiaXRhdC5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90Zm9vdD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDM1NjMsNTc1NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyeVwiLGMscCwxKSxjLHAsMCwzNTgzLDQ2MzQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5CZW50aGljIEhhYml0YXRzIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDM2NzQsMzY4OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiaW4gU2FuY3R1YXJpZXNcIik7fSk7Yy5wb3AoKTt9Xy5iKFwiPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTgwNzlkZDVhMWVjMzZmNTU5NWZiMmIwXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgVGhlIGZvbGxvd2luZyB0YWJsZSBkZXNjcmliZXMgdGhlIG92ZXJsYXAgb2YgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzg4NiwzOTUyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJ0aGUgc2tldGNoZXMgaW4geW91ciBwbGFuIHRoYXQgYXJlIGluIG5vIHRha2UgbWFyaW5lIHJlc2VydmVzIHdpdGhcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ5b3VyIHNrZXRjaCBhbmRcIik7fTtfLmIoXCIgdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjIyNXB4O1xcXCI+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGg+QXJlYSAoc3EuIGttLik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPkFyZWEgKCUgb2YgVG90YWwpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmNfaGFiaXRhdHNcIixjLHAsMSksYyxwLDAsNDQxNCw0NTY3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiSEFCX1RZUEVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkFSRUFfU1FLTVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiUEVSQ1wiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNQYXJ0aWFsVGFrZVwiLGMscCwxKSxjLHAsMCw0NjczLDU3MzUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5CZW50aGljIEhhYml0YXRzIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDQ3NjQsNDc4OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiaW4gUGFydGlhbCBUYWtlIFJlc2VydmVzXCIpO30pO2MucG9wKCk7fV8uYihcIjxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4MDc5ZGQ1YTFlYzM2ZjU1OTVmYjJiMFxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIFRoZSBmb2xsb3dpbmcgdGFibGUgZGVzY3JpYmVzIHRoZSBvdmVybGFwIG9mIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDQ5ODYsNTA1NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwidGhlIHNrZXRjaGVzIGluIHlvdXIgcGxhbiB0aGF0IGFyZSBpbiBwYXJ0aWFsIHRha2UgbWFyaW5lIHJlc2VydmVzIHdpdGhcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ5b3VyIHNrZXRjaCBhbmRcIik7fTtfLmIoXCIgdGhlIGJlbnRoaWMgaGFiaXRhdHMgb2YgTW9udHNlcnJhdCwgd2hpY2ggeW91IGNhbiB2aWV3IGJ5IGNoZWNraW5nIHRoZSAnc2hvdyBsYXllcicgYm94IGF0IHJpZ2h0LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjIyNXB4O1xcXCI+SGFiaXRhdDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGg+QXJlYSAoc3EuIGttLik8L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPkFyZWEgKCUgb2YgVG90YWwpPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInB0X2hhYml0YXRzXCIsYyxwLDEpLGMscCwwLDU1MTcsNTY3MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkhBQl9UWVBFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJBUkVBX1NRS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIlBFUkNcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCIgICAgICAgICAgPC90Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNab25lV2l0aEdvYWxcIixjLHAsMSksYyxwLDAsNTc5NCw3MjIyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxoND5JVUNOIExpc3RlZCBDb3JhbCBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw1ODgyLDU4OTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIi0gTWFyaW5lIFJlc2VydmVzXCIpO30pO2MucG9wKCk7fV8uYihcIjxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4ZTY3MWZjNGFmMjVkNTkwYmE0Y2NlZlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhyZWUgSVVDTiBsaXN0ZWQgY29yYWxzIGhhdmUgYmVlbiBvYnNlcnZlZCB3aXRoaW4gTW9udHNlcnJhdCB3YXRlcnMuIFRoZSBmb2xsb3dpbmcgZ3JhcGhpY3Mgc2hvdyB0aGUgbnVtYmVyIG9mIHRoZSBrbm93biBvYnNlcnZhdGlvbnMgdGhhdCBhcmUgZm91bmQgd2l0aGluIHRoZSBzZWxlY3RlZCBcIik7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw2MjE4LDYyNDksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIjxiPm1hcmluZSByZXNlcnZlPC9iPiBza2V0Y2hlcyBcIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJ6b25lXCIpO307Xy5iKFwiLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaGFzRDNcIixjLHAsMSksYyxwLDAsNjMzMyw2NjgyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICA8ZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJvcmJfYVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPGRpdj48aT5PcmJpY2VsbGEgYW5udWxhcmlzIDwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgaWQ9XFxcIm9yYl9mXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPk9yYmljZWxsYSBmYXZlb2xhdGE8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJ2aXpcXFwiIGlkPVxcXCJhY3JvXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8ZGl2PjxpPkFjcm9wb3JhIHBhbG1hdGE8L2k+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc0QzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6NDBweDtcXFwiPk5hbWU8c3VwPio8L3N1cD48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyMjVweDtcXFwiPkNvdW50PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5Ub3RhbDwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJjb3JhbF9jb3VudFwiLGMscCwxKSxjLHAsMCw3MDAwLDcxNDQsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJDT1VOVFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5mKFwiVE9UXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0Pk51cnNlcnkgQXJlYXM8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIFRoZXNlIGNoYXJ0cyBzaG93IHRoZSBtaW5pbXVtLCBtZWFuIGFuZCBtYXhpbXVtIGFidW5kYW5jZSBtZWFzdXJlbWVudHMgb2YgbnVyc2VyeSBhcmVhcyB0aGF0IHdlcmUgdGFrZW4gd2l0aGluIHlvdXIgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNzQ0MCw3NDUwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIiwgaW4gcmVsYXRpb24gdG8gdGhlIGRpc3RyaWJ1dGlvbiBvZiBhYnVuZGFuY2Ugd2l0aGluIE1vbnRzZXJyYXQgd2F0ZXJzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwwLDc2MDIsNzcwOCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxkaXYgY2xhc3M9XFxcImluLXJlcG9ydC1oZWFkZXJcXFwiPk51cnNlcnkgQXJlYXM8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPGRpdiBpZD1cXFwic2FuZGdfdml6XFxcIiBjbGFzcz1cXFwic2FuZGdfdml6XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiZDNJc1ByZXNlbnRcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjI1MHB4O1xcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGg+TWluaW11bTwvdGg+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aD5NYXhpbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcInNhbmRnXCIsYyxwLDEpLGMscCwwLDc5ODAsODE2MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+TnVyc2VyeSBBcmVhczwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInNhbmRnLlNDT1JFXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwic2FuZGcuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwic2FuZGcuTUFYXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiKTt9O18uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8IS0tXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGg0PkZpc2ggQmlvbWFzczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGVzZSBjaGFydHMgc2hvdyB0aGUgbWluaW11bSwgbWVhbiBhbmQgbWF4aW11bSBmaXNoIGJpb21hc3MgdmFsdWUgdGFrZW4gd2l0aGluIHlvdXIgc2tldGNoZWQgem9uZSwgaW4gcmVsYXRpb24gdG8gdGhlIGRpc3RyaWJ1dGlvbiBvZiBiaW9tYXNzIG1lYXN1cmVkIGFyb3VuZCB0aGUgaXNsYW5kLiBCaW9tYXNzIHdhcyBjYWxjdWxhdGVkIGZvciBIZXJiaXZvcmVzIGFuZCBBbGwgU3BlY2llcyBhdCByZWd1bGFyIHBvaW50cyBhbG9uZyBNb250c2VycmF0J3MgY29hc3QuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwwLDg2MTIsODg0OSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5IZXJiaXZvcmUgQmlvbWFzczwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPGRpdiBpZD1cXFwiaGVyYl92aXpcXFwiIGNsYXNzPVxcXCJoZXJiX3ZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGNsYXNzPVxcXCJpbi1yZXBvcnQtaGVhZGVyXFxcIj5BbGwgU3BlY2llcyBCaW9tYXNzPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2IGlkPVxcXCJ0b3RhbF92aXpcXFwiIGNsYXNzPVxcXCJ0b3RhbF92aXpcXFwiPjwvZGl2PlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgPHRhYmxlIGRhdGEtcGFnaW5nPVxcXCIxMFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8dGggc3R5bGU9XFxcIndpZHRoOjI1MHB4O1xcXCI+PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5NZWFuPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5NaW5pbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aD5NYXhpbXVtPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhlcmJcIixjLHAsMSksYyxwLDAsOTE2OCw5MzcyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPkhlcmJpdm9yZXM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiaGVyYi5TQ09SRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLk1JTlwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmQoXCJoZXJiLk1BWFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcInRvdGFsXCIsYyxwLDEpLGMscCwwLDk0MDQsOTYwNyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5Ub3RhbHM8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwidG90YWwuU0NPUkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwidG90YWwuTUlOXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcInRvdGFsLk1BWFwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5GaXNoIEFidW5kYW5jZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGVzZSBjaGFydHMgc2hvdyB0aGUgbWluaW11bSwgbWVhbiBhbmQgbWF4aW11bSBmaXNoIGFidW5kYW5jZSB2YWx1ZSB0YWtlbiB3aXRoaW4geW91ciBza2V0Y2hlZCB6b25lLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJkM0lzUHJlc2VudFwiLGMscCwxKSxjLHAsMCw5OTAxLDk5NTksXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgICAgPGRpdiBpZD1cXFwiZmlzaF92aXpcXFwiIGNsYXNzPVxcXCJmaXNoX3ZpelxcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImQzSXNQcmVzZW50XCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgICAgICA8dGFibGUgZGF0YS1wYWdpbmc9XFxcIjEwXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgIDx0aCBzdHlsZT1cXFwid2lkdGg6MjUwcHg7XFxcIj48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPk1lYW48L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPk1pbmltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRoPk1heGltdW08L3RoPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGhlYWQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiZmlzaFwiLGMscCwxKSxjLHAsMCwxMDI3OCwxMDQ4MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgICAgIDx0ZD5IZXJiaXZvcmVzPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZChcImZpc2guU0NPUkVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiZmlzaC5NSU5cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgICA8dGQ+XCIpO18uYihfLnYoXy5kKFwiZmlzaC5NQVhcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAtLT5cIik7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcIm92ZXJ2aWV3XCJdID0gbmV3IEhvZ2FuLlRlbXBsYXRlKGZ1bmN0aW9uKGMscCxpKXt2YXIgXz10aGlzO18uYihpPWl8fFwiXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+U2l6ZTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDc2LDg2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCJjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiem9uZVwiKTt9O18uYihcIiBpcyA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZChcInNpemUuU0laRV9TUUtNXCIsYyxwLDApKSk7Xy5iKFwiIHNxLiBrbTwvc3Ryb25nPiwgd2hpY2ggcmVwcmVzZW50cyBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmQoXCJzaXplLlBFUkNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDMzNCwyMjQyLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZihfLnMoXy5mKFwiaGFzUHJvdGVjdGVkQXJlYXNcIixjLHAsMSksYyxwLDAsMzYxLDY0MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIFRoZSA8Yj5wYXJ0aWFsIHRha2UgYW5kIG5vIHRha2UgbWFyaW5lIHJlc2VydmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb24gYXJlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicHJvdGVjdGVkQXJlYVNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3EuIGttPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwicHJvdGVjdGVkQXJlYVBlcmNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyaWVzXCIsYyxwLDEpLGMscCwwLDY4Niw5NDgsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIDxiPm5vIHRha2UgbWFyaW5lIHJlc2VydmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb24gYXJlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwic2FuY3R1YXJ5U2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcS4ga208L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInNhbmN0dWFyeVBlcmNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzUGFydGlhbFRha2VcIixjLHAsMSksYyxwLDAsOTkxLDEyNjIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIDxiPnBhcnRpYWwgdGFrZSBtYXJpbmUgcmVzZXJ2ZXM8L2I+IGluIHRoaXMgY29sbGVjdGlvbiBhcmUgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwYXJ0aWFsVGFrZVNpemVcIixjLHAsMCkpKTtfLmIoXCIgc3EuIGttPC9zdHJvbmc+LCB3aGljaCByZXByZXNlbnRzIFwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJwYXJ0aWFsVGFrZVBlcmNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzVXRpbGl0eVpvbmVzXCIsYyxwLDEpLGMscCwwLDEzMDYsMTU2MixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgPGI+dXRpbGl0eSB6b25lczwvYj4gaW4gdGhpcyBjb2xsZWN0aW9uIGFyZSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInV0aWxpdHlab25lU2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcS4ga208L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInV0aWxpdHlab25lUGVyY1wiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgTW9udHNlcnJhdCdzIHdhdGVycyB3aXRoaW4gMyBuYXV0aWNhbCBtaWxlcyBvZiB0aGUgY29hc3RsaW5lLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNNdWx0aVVzZVpvbmVzXCIsYyxwLDEpLGMscCwwLDE2MDgsMTg2OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgPGI+bXVsdGkgdXNlIHpvbmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb24gYXJlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwibXVsdGlVc2Vab25lU2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcS4ga208L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcIm11bHRpVXNlWm9uZVBlcmNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzVm9sY2FuaWNFeGNsdXNpb25ab25lXCIsYyxwLDEpLGMscCwwLDE5MjMsMjIxMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgPGI+dm9sY2FuaWMgZXhjbHVzaW9uIHpvbmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb24gYXJlIDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwidm9sY2FuaWNFeGNsdXNpb25ab25lU2l6ZVwiLGMscCwwKSkpO18uYihcIiBzcS4ga208L3N0cm9uZz4sIHdoaWNoIHJlcHJlc2VudHMgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcInZvbGNhbmljRXhjbHVzaW9uWm9uZVBlcmNcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIE1vbnRzZXJyYXQncyB3YXRlcnMgd2l0aGluIDMgbmF1dGljYWwgbWlsZXMgb2YgdGhlIGNvYXN0bGluZS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwic2hvd0RpdmVBbmRGaXNoaW5nXCIsYyxwLDEpLGMscCwwLDIyOTAsNjM1OCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvblxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8aDQ+RmlzaGluZyBWYWx1ZTxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU3ZTJjMzNiZWIyNzViYmExZWM2ZmQ0NlxcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBoZWF0bWFwIGxheWVyPC9hPjwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8cD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgVGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDI0NzQsMjU0MCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiPGI+bm8gdGFrZSBhbmQgcGFydGlhbCB0YWtlIG1hcmluZSByZXNlcnZlczwvYj4gaW4gdGhpcyBjb2xsZWN0aW9uXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwic2tldGNoXCIpO307Xy5iKFwiIG92ZXJsYXBcIik7aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJzXCIpO307Xy5iKFwiIHdpdGggYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImRpc3BsYWNlZF9wcm90ZWN0ZWRfYXJlYV9maXNoaW5nX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZmlzaGluZyB2YWx1ZSB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNTYW5jdHVhcnlEYXRhXCIsYyxwLDEpLGMscCwwLDI4NTksMzE3NSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCwyODgxLDMxNTUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIDxiPm5vIHRha2UgbWFyaW5lIHJlc2VydmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb24gb3ZlcmxhcCB3aXRoIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJkaXNwbGFjZWRfc2FuY19maXNoaW5nX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZmlzaGluZyB2YWx1ZSB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZmlzaGluZyBncm91bmRzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX0pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNQYXJ0aWFsVGFrZURhdGFcIixjLHAsMSksYyxwLDAsMzIyMiwzNTQxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDMyNDQsMzUyMSxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgPGI+cGFydGlhbCB0YWtlIG1hcmluZSByZXNlcnZlczwvYj4gaW4gdGhpcyBjb2xsZWN0aW9uIG92ZXJsYXAgd2l0aCBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZGlzcGxhY2VkX3B0X2Zpc2hpbmdfdmFsdWVcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSB0b3RhbCBmaXNoaW5nIHZhbHVlIHdpdGhpbiBNb250c2VycmF0J3Mgd2F0ZXJzLCBiYXNlZCBvbiB0aGUgdXNlciByZXBvcnRlZCB2YWx1ZSBvZiBmaXNoaW5nIGdyb3VuZHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9fSk7Yy5wb3AoKTt9Xy5iKFwiPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxoND5EaXZlIFZhbHVlPGEgaHJlZj1cXFwiI1xcXCIgZGF0YS10b2dnbGUtbm9kZT1cXFwiNTdlMmMzMDJlYjI3NWJiYTFlYzZmZDNkXFxcIiBkYXRhLXZpc2libGU9XFxcImZhbHNlXFxcIj5zaG93IGhlYXRtYXAgbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsMzc1MywzODE5LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8Yj5ubyB0YWtlIGFuZCBwYXJ0aWFsIHRha2UgbWFyaW5lIHJlc2VydmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2hcIik7fTtfLmIoXCIgb3ZlcmxhcFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgd2l0aCBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2RpdmVfdmFsdWVcIixjLHAsMCkpKTtfLmIoXCIlPC9zdHJvbmc+IG9mIHRoZSB0b3RhbCBkaXZlIHZhbHVlIHdpdGhpbiBNb250c2VycmF0J3Mgd2F0ZXJzLCBiYXNlZCBvbiB0aGUgdXNlciByZXBvcnRlZCB2YWx1ZSBvZiBkaXZlIHNpdGVzLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNTYW5jdHVhcnlEYXRhXCIsYyxwLDEpLGMscCwwLDQxMjcsNDQzMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw0MTQ5LDQ0MTIsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIDxiPm5vIHRha2UgbWFyaW5lIHJlc2VydmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb24gb3ZlcmxhcCB3aXRoIGFwcHJveGltYXRlbHkgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJkaXNwbGFjZWRfc2FuY19kaXZlX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZGl2ZSB2YWx1ZSB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZGl2ZSBzaXRlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319KTtjLnBvcCgpO31pZihfLnMoXy5mKFwiaGFzUGFydGlhbFRha2VEYXRhXCIsYyxwLDEpLGMscCwwLDQ0NzksNDc4NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw0NTAxLDQ3NjcsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICAgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgVGhlIDxiPnBhcnRpYWwgdGFrZSBtYXJpbmUgcmVzZXJ2ZXM8L2I+IGluIHRoaXMgY29sbGVjdGlvbiBvdmVybGFwIHdpdGggYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImRpc3BsYWNlZF9wdF9kaXZlX3ZhbHVlXCIsYyxwLDApKSk7Xy5iKFwiJTwvc3Ryb25nPiBvZiB0aGUgdG90YWwgZGl2ZSB2YWx1ZSB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHVzZXIgcmVwb3J0ZWQgdmFsdWUgb2YgZGl2ZSBzaXRlcy5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3A+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319KTtjLnBvcCgpO31fLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkNvbnNlcnZhdGlvbiBWYWx1ZTxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU5MzVlNmNiMWE2Y2U4YTk1M2IzM2QzN1xcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBjb25zZXJ2YXRpb24gbGF5ZXI8L2E+PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgXCIpO2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNTAxMiw1MDc4LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCI8Yj5ubyB0YWtlIGFuZCBwYXJ0aWFsIHRha2UgbWFyaW5lIHJlc2VydmVzPC9iPiBpbiB0aGlzIGNvbGxlY3Rpb25cIik7fSk7Yy5wb3AoKTt9aWYoIV8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJza2V0Y2hcIik7fTtfLmIoXCIgb3ZlcmxhcFwiKTtpZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInNcIik7fTtfLmIoXCIgd2l0aCBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZGlzcGxhY2VkX3Byb3RlY3RlZF9hcmVhX2NvbnNlcnZhdGlvbl92YWx1ZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIGNvbnNlcnZhdGlvbiBwcmlvcml0eSBhcmVhcyB3aXRoaW4gTW9udHNlcnJhdOKAmXMgd2F0ZXJzLiBQcmlvcml0eSBjb25zZXJ2YXRpb24gYXJlYXMgd2VyZSBzZWxlY3RlZCB1c2luZyBwcmlvcml0aXpyIHN5c3RlbWF0aWMgY29uc2VydmF0aW9uIHByaW9yaXRpemF0aW9uIHBhY2thZ2UgaW4gUi4gVGhleSB3ZXJlIGlkZW50aWZpZWQgdG8gbWVldCBoYWJpdGF0IHByb3RlY3Rpb24gZ29hbHMgYW5kIHByb3RlY3QgYXJlYXMgb2YgaGlnaCBzcGVjaWVzIHJpY2huZXNzLCB3aGlsZSBtaW5pbWl6aW5nIHRoZSBvdmVybGFwIHdpdGggZmlzaGluZyBhY3Rpdml0eS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICA8L3A+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImhhc1NhbmN0dWFyeURhdGFcIixjLHAsMSksYyxwLDAsNTYyNCw1OTUwLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDU2NDYsNTkzMCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgPGI+bm8gdGFrZSBtYXJpbmUgcmVzZXJ2ZXM8L2I+IGluIHRoaXMgY29sbGVjdGlvbiBvdmVybGFwIHdpdGggYXBwcm94aW1hdGVseSA8c3Ryb25nPlwiKTtfLmIoXy52KF8uZihcImRpc3BsYWNlZF9zYW5jX2NvbnNlcnZhdGlvbl92YWx1ZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIHRvdGFsIGNvbnNlcnZhdGlvbiBwcmlvcml0eSBhcmVhcyB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHByaW9yaXRpenIgY29uc2VydmF0aW9uIHZhbHVlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX0pO2MucG9wKCk7fWlmKF8ucyhfLmYoXCJoYXNQYXJ0aWFsVGFrZURhdGFcIixjLHAsMSksYyxwLDAsNTk5Nyw2MzI2LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDYwMTksNjMwNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBUaGUgPGI+cGFydGlhbCB0YWtlIG1hcmluZSByZXNlcnZlczwvYj4gaW4gdGhpcyBjb2xsZWN0aW9uIG92ZXJsYXAgd2l0aCBhcHByb3hpbWF0ZWx5IDxzdHJvbmc+XCIpO18uYihfLnYoXy5mKFwiZGlzcGxhY2VkX3B0X2NvbnNlcnZhdGlvbl92YWx1ZVwiLGMscCwwKSkpO18uYihcIiU8L3N0cm9uZz4gb2YgdGhlIHRvdGFsIGNvbnNlcnZhdGlvbiBwcmlvcml0eSBhcmVhcyB3aXRoaW4gTW9udHNlcnJhdCdzIHdhdGVycywgYmFzZWQgb24gdGhlIHByaW9yaXRpenIgY29uc2VydmF0aW9uIHZhbHVlLlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDwvcD5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fX0pO2MucG9wKCk7fV8uYihcIjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCI8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8aDQ+RmlzaCBQb3RzIDxhIGhyZWY9XFxcIiNcXFwiIGRhdGEtdG9nZ2xlLW5vZGU9XFxcIjU4ZWQ3Y2I1NGFmMjVkNTkwYmE0ZmMzY1xcXCIgZGF0YS12aXNpYmxlPVxcXCJmYWxzZVxcXCI+c2hvdyBsYXllcjwvYT48L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJoYXNEM1wiLGMscCwxKSxjLHAsMCw2NTMzLDY2NDUsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgY2xhc3M9XFxcInZpelxcXCIgaWQ9XFxcImZpc2hfcG90c1xcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZGl2PjxpPkZpc2ggUG90czwvaT48L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImhhc0QzXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7Xy5iKFwiICAgIDx0YWJsZSBkYXRhLXBhZ2luZz1cXFwiMTBcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoIHN0eWxlPVxcXCJ3aWR0aDoyMjVweDtcXFwiPkNvdW50PC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRoPlRvdGFsPC90aD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8dGJvZHk+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDx0ZD5cIik7Xy5iKF8udihfLmYoXCJmaXNocG90X2NvdW50XCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcImZpc2hwb3RfdG90YWxcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8L3Rib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8L3RhYmxlPlwiKTtfLmIoXCJcXG5cIik7fTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO2lmKCFfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwxLDAsMCxcIlwiKSl7aWYoXy5zKF8uZihcImlzQ29uc2VydmF0aW9uWm9uZVwiLGMscCwxKSxjLHAsMCw3MDMyLDc2NjEsXCJ7eyB9fVwiKSl7Xy5ycyhjLHAsZnVuY3Rpb24oYyxwLF8pe18uYihcIiAgICA8ZGl2IGNsYXNzPVxcXCJyZXBvcnRTZWN0aW9uXFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICA8aDQ+TWluaW11bSBTaXplIEdvYWw8L2g0PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxkaXYgc3R5bGU9XFxcInBhZGRpbmctbGVmdDoxMHB4XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDAsNzE2Niw3MjIxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiYmlnLWdyZWVuLWNoZWNrXFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCIgICAgICAgICAgPGRpdiBjbGFzcz1cXFwiYmlnLXJlZC14XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgICAgICA8ZGl2IHN0eWxlPVxcXCJkaXNwbGF5OmlubGluZTtwYWRkaW5nLWxlZnQ6NXB4O2ZvbnQtc2l6ZToxLjFlbVxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIFRoaXMgem9uZSA8Yj5cIik7aWYoXy5zKF8uZihcIm1lZXRzTWluV2lkdGhHb2FsXCIsYyxwLDEpLGMscCwwLDc0NjEsNzQ2NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiIG1lZXRzXCIpO30pO2MucG9wKCk7fWlmKCFfLnMoXy5mKFwibWVldHNNaW5XaWR0aEdvYWxcIixjLHAsMSksYyxwLDEsMCwwLFwiXCIpKXtfLmIoXCJkb2VzIG5vdCBtZWV0XCIpO307Xy5iKFwiPC9iPiB0aGUgY29uc2VydmF0aW9uIGdvYWwgb2YgaGF2aW5nIGEgbWluaW11bSB3aWR0aCBvZiA8Yj5hdCBsZWFzdCAxa208L2I+LlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgPC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO319O2lmKF8ucyhfLmYoXCJpc0NvbGxlY3Rpb25cIixjLHAsMSksYyxwLDAsNzcyMCw4NTc3LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb24gdGFibGVDb250YWluZXJcXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDxoND5NaW5pbXVtIFNpemUgR29hbDwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICBNYXJpbmUgUmVzZXJ2ZSBab25lcyBzaG91bGQgaGF2ZSBhIG1pbmltdW0gd2lkdGggb2YgYXQgbGVhc3QgMSBraWxvbWV0ZXIgdG8gbWVldCBjb25zZXJ2YXRpb24gZ29hbHMuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgIDx0YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgIDx0ZCBzdHlsZT1cXFwid2lkdGg6NjBweDt0ZXh0LWFsaWduOmNlbnRlcjtcXFwiPk1lZXRzIDFrbSBHb2FsPzwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlpvbmUgTmFtZTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgIDwvdHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8L3RoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRib2R5PlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJtaW5fZGltXCIsYyxwLDEpLGMscCwwLDgxNTEsODUzNixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJNRUVUU19USFJFU0hcIixjLHAsMSksYyxwLDAsODIyMSw4Mjk0LFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVxcXCJzbWFsbC1ncmVlbi1jaGVja1xcXCI+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcIk1FRVRTX1RIUkVTSFwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XFxcInNtYWxsLXJlZC14XFxcIj48L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiICAgICAgICAgICAgICA8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOmxlZnQ7XFxcIj5cIik7Xy5iKF8udihfLmYoXCJOQU1FXCIsYyxwLDApKSk7Xy5iKFwiPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIik7fSk7Yy5wb3AoKTt9Xy5iKFwiICAgICAgPC90YWJsZT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICA8L2Rpdj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgPCEtLVwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGRpdiBjbGFzcz1cXFwicmVwb3J0U2VjdGlvbiB0YWJsZUNvbnRhaW5lclxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPGg0PkNvbm5lY3Rpdml0eTwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHRhYmxlPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPHRoZWFkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8dHI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPlpvbmUgTmFtZTwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPHRkPkRpc3RhbmNlIHRvIE5lYXJlc3QgWm9uZSAoa20pPC90ZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgICAgICA8dGQ+TmVhcmVzdCBab25lIE5hbWU8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICA8L3RyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgPC90aGVhZD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgICAgICAgIDx0Ym9keT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtpZihfLnMoXy5mKFwiY29ubmVjdGl2aXR5XCIsYyxwLDEpLGMscCwwLDg5MTcsOTA2NyxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICAgICAgPHRyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5BTUVcIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIkRJU1RfS01cIixjLHAsMCkpKTtfLmIoXCI8L3RkPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICAgICAgICAgICAgPHRkPlwiKTtfLmIoXy52KF8uZihcIk5FQVJfTkFNRVwiLGMscCwwKSkpO18uYihcIjwvdGQ+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICAgICAgPC90cj5cIik7Xy5iKFwiXFxuXCIpO30pO2MucG9wKCk7fV8uYihcIiAgICAgIDwvdGFibGU+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgICA8ZW0+Tm90ZTo8L2VtPiBUaGUgY29ubmVjdGl2aXR5IGFuYWx5dGljIGhhcyBiZWVuIGRldmVsb3BlZCBmb3IgZGVtb25zdHJhdGlvbiBwdXJwb3NlcywgYW5kIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZSBsZWFzdCBjb3N0IHBhdGggYXJvdW5kIGxhbmQuXCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgICAgPC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgIDwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiBcIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiIDxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PkRpc3RhbmNlIGZyb20gUG9ydCBMaXR0bGUgQmF5PC9oND5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDxwPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICBUaGUgZmFydGhlc3QgcG9pbnQgaW4gdGhlIFwiKTtpZihfLnMoXy5mKFwiaXNDb2xsZWN0aW9uXCIsYyxwLDEpLGMscCwwLDk0MTIsOTQyMixcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiY29sbGVjdGlvblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcInpvbmVcIik7fTtfLmIoXCIgaXMgPHN0cm9uZz5cIik7Xy5iKF8udihfLmYoXCJtaW5EaXN0S01cIixjLHAsMCkpKTtfLmIoXCIga208L3N0cm9uZz4gKG92ZXIgd2F0ZXIpIGZyb20gdGhlIFBvcnQgTGl0dGxlIEJheS5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIDwvcD5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCI8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCItLT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXFxuXCIpO3JldHVybiBfLmZsKCk7O30pO1xudGhpc1tcIlRlbXBsYXRlc1wiXVtcInRyYWRlb2Zmc1wiXSA9IG5ldyBIb2dhbi5UZW1wbGF0ZShmdW5jdGlvbihjLHAsaSl7dmFyIF89dGhpcztfLmIoaT1pfHxcIlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIjxkaXYgY2xhc3M9XFxcInJlcG9ydFNlY3Rpb25cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgPGg0PlRyYWRlb2ZmczwvaDQ+XCIpO18uYihcIlxcblwiICsgaSk7aWYoXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMCw3MCwxMDgxLFwie3sgfX1cIikpe18ucnMoYyxwLGZ1bmN0aW9uKGMscCxfKXtfLmIoXCIgIFx0PHAgc3R5bGU9XFxcIm1hcmdpbi1sZWZ0OjE4cHg7XFxcIj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0XHQ8ZW0+VHJhZGVvZmYgYW5hbHlzaXMgaXMgY3VycmVudGx5IGluIGRldmVsb3BtZW50LCBhbmQgc2hvdWxkIGJlIHVzZWQgZm9yIGRlbW9uc3RyYXRpb24gcHVycG9zZXMgb25seS4gVGhlc2UgYW5hbHl0aWNzIHdpbGwgYWxsb3cgdXNlcnMgdG8gcGxvdCBtdWx0aXBsZSBwbGFuIG9wdGlvbnMgYWdhaW5zdCBlYWNoIG90aGVyIGluIHRlcm1zIG9mIHRoZWlyIGltcGFjdCBvbiBmaXNoaW5nLCBkaXZlIGFuZCBjb25zZXJ2YXRpb24gdmFsdWUgZm9yIE1vbnRzZXJyYXQuPC9lbT5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PC9wPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHQ8ZGl2IHN0eWxlPVxcXCJtYXJnaW4tbGVmdDoxOHB4O21hcmdpbi1ib3R0b206MTVweFxcXCI+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQgIFx0PHNwYW4+U2VsZWN0IGEgU2V0IG9mIFRyYWRlb2ZmIFNjb3JlcyB0byBWaWV3Ojwvc3Bhbj48L2JyPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIlx0XHQ8c2VsZWN0IGNsYXNzPVxcXCJjaG9zZW5cXFwiPlwiKTtfLmIoXCJcXG5cIiArIGkpO2lmKF8ucyhfLmYoXCJ0cmFkZW9mZnNcIixjLHAsMSksYyxwLDAsNTQ5LDY3NCxcInt7IH19XCIpKXtfLnJzKGMscCxmdW5jdGlvbihjLHAsXyl7Xy5iKFwiICAgICAgICA8b3B0aW9uIGNsYXNzPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuID09IFxcXCJGaXNoaW5nIGFuZCBEaXZpbmdcXFwiID8gJ2RlZmF1bHQtY2hvc2VuLXNlbGVjdGlvbicgOiAnJ1wiLGMscCwwKSkpO18uYihcIlxcXCIgIHZhbHVlPVxcXCJcIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiXFxcIj5cIik7Xy5iKF8udihfLmQoXCIuXCIsYyxwLDApKSk7Xy5iKFwiPC9vcHRpb24+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31fLmIoXCJcdFx0PC9zZWxlY3Q+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiXHQ8L2Rpdj5cIik7Xy5iKFwiXFxuXCIgKyBpKTtfLmIoXCIgIFx0PGRpdiBpZD1cXFwiZnZkX2NvbnRhaW5lclxcXCIgY2xhc3M9XFxcImZ2ZF9jb250YWluZXJcXFwiPjxkaXYgIGlkPVxcXCJmaXNoaW5nLXYtZGl2aW5nXFxcIiBjbGFzcz1cXFwiZmlzaGluZy12LWRpdmluZ1xcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICAgIDxkaXYgaWQ9XFxcImZ2Y19jb250YWluZXJcXFwiIGNsYXNzPVxcXCJmdmNfY29udGFpbmVyXFxcIj48ZGl2ICBpZD1cXFwiZmlzaGluZy12LWNvbnNlcnZhdGlvblxcXCIgY2xhc3M9XFxcImZpc2hpbmctdi1jb25zZXJ2YXRpb25cXFwiPjwvZGl2PjwvZGl2PlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgICA8ZGl2IGlkPVxcXCJkdmNfY29udGFpbmVyXFxcIiBjbGFzcz1cXFwiZHZjX2NvbnRhaW5lclxcXCI+PGRpdiAgaWQ9XFxcImRpdmluZy12LWNvbnNlcnZhdGlvblxcXCIgY2xhc3M9XFxcImRpdmluZy12LWNvbnNlcnZhdGlvblxcXCI+PC9kaXY+PC9kaXY+XCIpO18uYihcIlxcblwiKTt9KTtjLnBvcCgpO31pZighXy5zKF8uZihcImlzQ29sbGVjdGlvblwiLGMscCwxKSxjLHAsMSwwLDAsXCJcIikpe18uYihcIiAgXHQgIFx0PHA+XCIpO18uYihcIlxcblwiICsgaSk7Xy5iKFwiICBcdFx0XHQ8aT5ObyB0cmFkZW9mZiBhbmFseXNpcyBhdmFpbGFibGUgZm9yIGluZGl2aWR1YWwgem9uZXMuPC9pPlwiKTtfLmIoXCJcXG5cIiArIGkpO18uYihcIiAgXHRcdDwvcD5cIik7Xy5iKFwiXFxuXCIpO307Xy5iKFwiPC9kaXY+XCIpO3JldHVybiBfLmZsKCk7O30pO1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gdGhpc1tcIlRlbXBsYXRlc1wiXTtcbn0iXX0=
