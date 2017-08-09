OverviewTab = require './overview.coffee'
TradeoffsTab = require './tradeoffs.coffee'
EnvironmentTab = require './environment.coffee'

window.app.registerReport (report) ->
  report.tabs [OverviewTab, EnvironmentTab]
  # path must be relative to dist/
  report.stylesheets ['./report.css']
