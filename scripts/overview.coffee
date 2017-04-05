ReportTab = require 'reportTab'
templates = require '../templates/templates.js'
d3 = window.d3

class OverviewTab extends ReportTab
  name: 'Overview'
  className: 'overview'
  template: templates.overview
  dependencies:[ 
    'SizeAndConnectivity'
    'DiveAndFishingValue'
    'Distance'
    'MinDimensionToolbox'
  ]
  render: () ->

    # create random data for visualization
    size = @recordSet('SizeAndConnectivity', 'Size').toArray()[0]

    connectivity = @recordSet('SizeAndConnectivity', 'Connectivity').toArray()
    isCollection = @model.isCollection()

    dfv = @recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0]
    ddv = @recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0]
    

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

    console.log('is cons goal:', isConservationZone)
    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      size: size
      connectivity: connectivity
      
      displaced_fishing_value: displaced_fishing_value
      displaced_dive_value: displaced_dive_value
    
      minDistKM: minDistKM
      isConservationZone: isConservationZone
      meetsMinWidthGoal: meetsMinWidthGoal
      min_dim :minWidth

    @$el.html @template.render(context, templates)
    @enableLayerTogglers()

  processMinDimension: (data) =>

    for d in data
      if parseFloat(d.WIDTH) > 1.0
        d.MEETS_THRESH = true
      else
        d.MEETS_THRESH = false

module.exports = OverviewTab