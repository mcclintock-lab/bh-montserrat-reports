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
    total_size = 340.06
    size.PERC = Number((parseFloat(size.SIZE_SQKM)/total_size)*100.0).toFixed(1)
    connectivity = @recordSet('SizeAndConnectivity', 'Connectivity').toArray()
    isCollection = @model.isCollection()

    try
      dfv = @recordSet('DiveAndFishingValue', 'FishingValue').toArray()[0]
      ddv = @recordSet('DiveAndFishingValue', 'DiveValue').toArray()[0]
    catch err
      console.log("error: ",err)

    hasSanctuaryData = false
    try
      sanc_fv = @recordSet('DiveAndFishingValue', 'SanctuaryFishingValue').toArray()[0]
      sanc_dv = @recordSet('DiveAndFishingValue', 'SanctuaryDiveValue').toArray()[0]
      hasSanctuaryData = true
    catch err
      sanc_fv = []
      sanc_dv = []
      hasSanctuaryData = false

    hasPartialTakeData = false
    try
      pt_fv = @recordSet('DiveAndFishingValue', 'PartialTakeFishingValue').toArray()[0]
      pt_dv = @recordSet('DiveAndFishingValue', 'PartialTakeDiveValue').toArray()[0]
      hasPartialTakeData = true
    catch err
      pt_fv = []
      pt_dv = []
      hasPartialTakeData = false

    hasProtectedAreas = false
    hasSanctuaries = false
    hasPartialTake = false
    hasUtilityZones = false
    hasMultiUseZones = false
    hasVolcanicExclusionZone = false

    try
      size_per_zone = @recordSet('SizeAndConnectivity', 'SizePerZone').toArray()
      console.log("sizes per zone: ", size_per_zone)
      protectedAreaSize = 0.0
      protectedAreaPerc = 0.0

      sanctuarySize = 0.0
      sanctuaryPerc = 0.0

      partialTakeSize = 0.0
      partialTakePerc = 0.0

      utilityZoneSize = 0.0
      utilityZonePerc = 0.0

      multiUseZoneSize = 0.0
      multiUseZonePerc = 0.0

      volcanicExclusionZoneSize = 0.0
      volcanicExclusionZonePerc = 0.0

      for spz in size_per_zone
        curr_size = parseFloat(spz.SIZE_SQKM)
        if spz.ZONE_TYPE == "Sanctuary"
          sanctuarySize=curr_size
          protectedAreaSize+=curr_size
          hasProtectedAreas = true
          hasSanctuaries = true
        else if spz.ZONE_TYPE == "Marine Reserve - Partial Take"
          partialTakeSize = curr_size
          protectedAreaSize+=curr_size
          hasProtectedAreas = true
          hasPartialTake = true
        else if spz.ZONE_TYPE == "Multiuse"
          hasMultiUseZones = true
          multiUseZoneSize = curr_size
        else if spz.ZONE_TYPE == "Volcanic Exclusion Zone"
          hasVolcanicExclusionZone = true
          volcanicExclusionZoneSize = curr_size
        else
          hasUtilityZones = true
          utilityZoneSize+=curr_size

    catch e
      console.log("e: ", e)
      #its ok, just ignore the sizes per zone
    
    protectedAreaSize = parseFloat(protectedAreaSize).toFixed(2)
    sanctuarySize = parseFloat(sanctuarySize).toFixed(2)
    partialTakeSize = parseFloat(partialTakeSize).toFixed(2)
    multiUseZoneSize = parseFloat(multiUseZoneSize).toFixed(2)
    utilityZoneSize = parseFloat(utilityZoneSize).toFixed(2)
    volcanicExclusionZoneSize = parseFloat(volcanicExclusionZoneSize).toFixed(2)

    protectedAreaPerc = Number((protectedAreaSize/total_size)*100.0).toFixed(1)
    sanctuaryPerc = Number((sanctuarySize/total_size)*100.0).toFixed(1)
    partialTakePerc = Number((partialTakeSize/total_size)*100.0).toFixed(1)
    utilityZonePerc = Number((utilityZoneSize/total_size)*100.0).toFixed(1)
    multiUseZonePerc = Number((multiUseZoneSize/total_size)*100.0).toFixed(1)
    volcanicExclusionZonePerc = Number((volcanicExclusionZoneSize/total_size)*100.0).toFixed(1)


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

    if hasSanctuaryData
      if sanc_fv.PERCENT < 0.01
        displaced_sanc_fishing_value = "< 0.01"
      else
        displaced_sanc_fishing_value = parseFloat(sanc_fv.PERCENT).toFixed(2)
      if sanc_dv.PERCENT < 0.01
        displaced_sanc_dive_value = "< 0.01"
      else
        displaced_sanc_dive_value = parseFloat(sanc_dv.PERCENT).toFixed(2)
    else
      displaced_sanc_fishing_value = "unknown"
      displaced_sanc_dive_value = "unknown"

    if hasPartialTakeData
      if pt_fv.PERCENT < 0.01
        displaced_pt_fishing_value = "< 0.01"
      else
        displaced_pt_fishing_value = parseFloat(pt_fv.PERCENT).toFixed(2)

      if pt_dv.PERCENT < 0.01
        displaced_pt_dive_value = "< 0.01"
      else
        displaced_pt_dive_value = parseFloat(pt_dv.PERCENT).toFixed(2)
    else
      displaced_pt_fishing_value = "unknown"
      displaced_pt_dive_value = "unknown"

    if isCollection
      sfv = parseFloat(sanc_fv.PERCENT)
      pfv = parseFloat(pt_fv.PERCENT)
      fv = 0.0
      if hasSanctuaries
        fv+=sfv
      if hasPartialTake
        fv+=pfv
      displaced_protected_area_fishing_value = (fv).toFixed(2)

      sdv = parseFloat(sanc_dv.PERCENT)
      pdv = parseFloat(pt_dv.PERCENT)
      dv = 0.0
      if hasSanctuaries
        dv+=sdv
      if hasPartialTake
        dv+=pdv

      displaced_protected_area_dive_value = (dv).toFixed(2)
    else
      displaced_protected_area_fishing_value = displaced_fishing_value
      displaced_protected_area_dive_value = displaced_dive_value

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

    showDiveAndFishing = !isCollection || (isCollection && hasProtectedAreas)
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
      
      displaced_protected_area_dive_value: displaced_protected_area_dive_value
      displaced_protected_area_fishing_value: displaced_protected_area_fishing_value

      displaced_sanc_fishing_value: displaced_sanc_fishing_value
      displaced_sanc_dive_value: displaced_sanc_dive_value
      displaced_pt_fishing_value: displaced_pt_fishing_value
      displaced_pt_dive_value: displaced_pt_dive_value
      hasPartialTakeData: hasPartialTakeData
      hasSanctuaryData: hasSanctuaryData


      minDistKM: minDistKM
      isConservationZone: isConservationZone
      meetsMinWidthGoal: meetsMinWidthGoal
      min_dim :minWidth

      fishpot_count: fishpot_count
      fishpot_total: fishpot_total

      hasProtectedAreas: hasProtectedAreas
      protectedAreaSize: protectedAreaSize
      protectedAreaPerc: protectedAreaPerc

      hasSanctuaries: hasSanctuaries
      sanctuarySize: sanctuarySize
      sanctuaryPerc: sanctuaryPerc

      hasPartialTake: hasPartialTake
      partialTakeSize: partialTakeSize
      partialTakePerc: partialTakePerc

      hasUtilityZones: hasUtilityZones
      utilityZoneSize: utilityZoneSize
      utilityZonePerc: utilityZonePerc

      hasMultiUseZones: hasMultiUseZones
      multiUseZoneSize: multiUseZoneSize
      multiUseZonePerc: multiUseZonePerc

      hasVolcanicExclusionZone: hasVolcanicExclusionZone
      volcanicExclusionZoneSize: volcanicExclusionZoneSize
      volcanicExclusionZonePerc: volcanicExclusionZonePerc

      showDiveAndFishing: showDiveAndFishing
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