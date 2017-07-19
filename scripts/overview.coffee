ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3
_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'SizeAndConnectivity'
    'DiveAndFishingValue'
    'Distance'
    'MinDimensionToolbox'
    'MontserratBiomassToolbox'

  ]
  render: () ->

    # create random data for visualization
    size = @recordSet('SizeAndConnectivity', 'Size').toArray()[0]
    
    size.PERC = Number((parseFloat(size.SIZE_SQKM)/340.06)*100.0).toFixed(1)
    connectivity = @recordSet('SizeAndConnectivity', 'Connectivity').toArray()
    isCollection = @model.isCollection()

    try
      dfv = @recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0]
      ddv = @recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0]
    catch err
      console.log("error: ",err)
    '''
    try
      satest = @recordSet('SATestToolbox', 'ResultMsg')
      console.log("-->> Spatial Analyst Test on 10.5: ", satest.data.value)
    catch e
      console.log("Spatial Analyst 10.5 failed", e)
    
    try
      satest = @recordSet('SATestToolbox10.4', 'ResultMsg')
      console.log("-->> Spatial Analyst Test on 10.4: ", satest.data.value)
    catch e
      console.log("Spatial Analyst 10.4 failed", e)
    '''
    if dfv
      if dfv.PERCENT < 0.01
        displaced_fishing_value = "< 0.01"
      else
        displaced_fishing_value = parseFloat(dfv.PERCENT).toFixed(2)
    else
      displaced_fishing_value = "unknown"

    if ddv
      if ddv.PERCENT < 0.01
        displaced_dive_value = "< 0.01"
      else
        displaced_dive_value = parseFloat(ddv.PERCENT).toFixed(2)
    else
      displaced_dive_value = "unknown"

    minDistKM = @recordSet('Distance', 'Distance').toArray()[0]
    if minDistKM
      minDistKM = parseFloat(minDistKM.MaxDist).toFixed(2)
    else
      minDistKM = "Unknown"

    minWidth = @recordSet('MinDimensionToolbox', 'Dimensions').toArray()
    console.log("minwidth: ", minWidth)
    if minWidth?.length > 0

      isConservationZone = true
      if isCollection
        @processMinDimension minWidth
      else
        meetsMinWidthGoal = (parseFloat(minWidth[0].WIDTH) > 1.0)
    else
      isConservationZone = false
      meetsMinWidthGoal = false

    fishpots = @recordSet('MontserratBiomassToolbox', 'FishPot').toArray()
    if fishpots?.length > 0

      fishpot_count = fishpots[0].COUNT
      fishpot_total = fishpots[0].TOTAL
    else
      fishpot_count = 0
      fishpot_total = 157

    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      hasD3: window.d3
      size: size
      connectivity: connectivity
      
      displaced_fishing_value: displaced_fishing_value
      displaced_dive_value: displaced_dive_value
    
      minDistKM: minDistKM
      isConservationZone: isConservationZone
      meetsMinWidthGoal: meetsMinWidthGoal
      min_dim :minWidth

      fishpot_count: fishpot_count
      fishpot_total: fishpot_total

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()
    @drawFishPotBars(fishpot_count, fishpot_total)


  drawFishPotBars: (fishpot_count, fishpot_total) =>
    if window.d3
      isCollection = @model.isCollection()
      suffix = "sketch"

      if isCollection
        suffix="collection"

      count = fishpot_count
      total = fishpot_total
      outside_sketch_start = total*0.48

      label = count+"/"+total+" of the fish pots within Montserrat's waters are found within this "+suffix
      range = [
        {
          bg: "#8e5e50"
          start: 0
          end: count
          class: 'in-sketch'
          value: count
          name: label
        },
        {
          bg: '#dddddd'
          start: count
          end: total
          class: 'outside-sketch'
          value: total
          label_start: outside_sketch_start
          name: ''
        }
      ]

      @drawBars(range, total)  

  drawBars: (range, max_value) =>
    el = @$('.viz')[0]
    x = d3.scale.linear()
      .domain([0, max_value])
      .range([0, 400])

    chart = d3.select(el)
    chart.selectAll("div.range")
      .data(range)
    .enter().append("div")
      .style("width", (d) -> Math.round(x(d.end - d.start),0) + 'px')
      .attr("class", (d) -> "range " + d.class)
      .append("span")
        .text((d) -> "#{d.name}")
        .style("left", (d) -> if d.label_start then x(d.label_start)+'px' else '')
        .attr("class", (d) -> "label-pots-"+d.class)

  processMinDimension: (data) =>

    for d in data
      if parseFloat(d.WIDTH) > 1.0
        d.MEETS_THRESH = true
      else
        d.MEETS_THRESH = false

module.exports = OverviewTab