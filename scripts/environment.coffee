ReportTab = require 'reportTab'
templates = require '../templates/templates.js'

_partials = require '../node_modules/seasketch-reporting-api/templates/templates.js'
partials = []
for key, val of _partials
  partials[key.replace('node_modules/seasketch-reporting-api/', '')] = val


d3 = window.d3

class EnvironmentTab extends ReportTab
  name: 'Environment'
  className: 'environment'
  template: templates.environment
  dependencies:[ 
    'MontserratHabitatToolbox'
    'MontserratBiomassToolbox'
  ]

  render: () ->
    # create random data for visualization
    habitats = @recordSet('MontserratHabitatToolbox', 'Habitats').toArray()
    habitats = _.sortBy habitats, (h) ->  parseFloat(h.PERC)
    habitats = habitats.reverse()

    herb_bio = @recordSet('MontserratBiomassToolbox', 'HerbivoreBiomass').toArray()[0]
    all_herb_vals = @getAllValues herb_bio.HISTO
    @roundVals herb_bio

    total_bio = @recordSet('MontserratBiomassToolbox', 'TotalBiomass').toArray()[0]
    all_total_values = @getAllValues total_bio.HISTO
    @roundVals total_bio

    fish_bio = @recordSet('MontserratBiomassToolbox', 'FishAbundance').toArray()[0]
    all_fish_vals = @getAllValues fish_bio.HISTO
    @roundVals fish_bio
    



    isCollection = @model.isCollection()   
    d3IsPresent = window.d3 ? true  : false
    @roundData habitats


    # setup context object with data and render the template from it
    context =
      sketch: @model.forTemplate()
      sketchClass: @sketchClass.forTemplate()
      attributes: @model.getAttributes()
      admin: @project.isAdmin window.user
      isCollection: isCollection
      habitats: habitats
      d3IsPresent: d3IsPresent
      herb: herb_bio
      fish: fish_bio
      total: total_bio


    @$el.html @template.render(context, templates)
    @enableLayerTogglers()

    @renderHistoValues(herb_bio, all_herb_vals, ".herb_viz", "#66cdaa","Herbivore Biomass (g/m^2)", "Biomass Per Transect")
    @renderHistoValues(total_bio, all_total_values, ".total_viz", "#fa8072", "Total Biomass (g/m^2)", "Biomass Per Transect")
    @renderHistoValues(fish_bio, all_fish_vals, ".fish_viz", "#6897bb", "Total Fish Count", "Number of Fish Species")
    

  renderHistoValues: (biomass, histo_vals, graph, color, x_axis_label, legend_label) =>
    if window.d3
      mean = biomass.SCORE
      bmin = biomass.MIN
      bmax = biomass.MAX

      len = histo_vals.length
      max_histo_val = histo_vals[len-1]
      quantile_range = {"Q0":"very low", "Q20": "low","Q40": "mid","Q60": "high","Q80": "very high"}
      q_colors = ["#47ae43", "#6c0", "#ee0", "#eb4", "#ecbb89", "#eeaba0"]


      num_bins = 10
      bin_size = 10
      
      quantiles = []
      max_count_val = 0
      num_in_bins = Math.ceil(len/num_bins)
      incr = max_histo_val/num_bins

      for i in [0...num_bins]
        
        q_start = i*bin_size
        q_end = q_start+bin_size
        min = i*incr
        max = min+incr
        count=0

        #TODO: look for a more efficient way to do this
        for hv in histo_vals
          if hv >= min and hv < max
            count+=1


        max_count_val = Math.max(count, max_count_val)
        
        val = {
          start: q_start
          end: q_end
          bg: q_colors[Math.floor(i/2)]
          bin_count: count
          bin_min: min
          bin_max: max
        }
        
        quantiles.push(val)

    
      @$(graph).html('')
      el = @$(graph)[0]  

      # Histogram
      margin = 
        top: 40
        right: 20
        bottom: 40
        left: 45

      width = 400 - margin.left - margin.right
      height = 350 - margin.top - margin.bottom
      
      x = d3.scale.linear()
        .domain([0, max_histo_val])
        .range([0, width])

      y = d3.scale.linear()
        .range([height, 0])
        .domain([0, max_count_val])

      xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

      yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

      min_max_line_y = max_count_val - 20
      svg = d3.select(@$(graph)[0]).append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(#{margin.left}, #{margin.top})")

      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0,#{height})")
        .call(xAxis)
      .append("text")
        .attr("x", width / 2)
        .attr("y", 0)
        .attr("dy", "3em")
        .style("text-anchor", "middle")
        .text(x_axis_label)

      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
      .append("text")
        .attr("y", -40)
        .attr("x", -80)
        .attr("transform", "rotate(-90)")
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(legend_label)


      svg.selectAll(".bar")
          .data(quantiles)
        .enter().append("rect")
          .attr("class", "bar")
          .attr("x", (d, i) -> x(d.bin_min))
          .attr("width", (d) -> width/num_bins)
          .attr("y", (d) -> y(d.bin_count))
          .attr("height", (d) -> height - y(d.bin_count))
          .style 'fill', (d) -> color


      svg.selectAll(".scoreLine")
          .data([Math.round(mean)])
        .enter().append("line")
        .attr("class", "scoreLine")
        .attr("x1", (d) -> (x((d)) )+ 'px')
        .attr("y1", (d) -> (y(max_count_val) - 9) + 'px')
        .attr("x2", (d) -> (x(d)+ 'px'))
        .attr("y2", (d) -> height + 'px')

      svg.selectAll(".score")
          .data([Math.round(mean)])
        .enter().append("text")
        .attr("class", "score")
        .attr("x", (d) -> (x((d)) - 6 )+ 'px')
        .attr("y", (d) -> (y(max_count_val) - 9) + 'px')
        .text("▼")

      svg.selectAll(".scoreText")
          .data([Math.round(mean)])
        .enter().append("text")
        .attr("class", "scoreText")
        .attr("x", (d) -> (x(d) - 22 )+ 'px')
        .attr("y", (d) -> (y(max_count_val) - 22) + 'px')
        .text((d) -> "Mean: "+d)


      svg.selectAll(".minScoreLine")
          .data([Math.round(bmin)])
        .enter().append("line")
        .attr("class", "minScoreLine")
        .attr("x1", (d) -> (x((d)) )+ 'px')
        .attr("y1", (d) -> (y(max_count_val) - 6) + 'px')
        .attr("x2", (d) -> (x(d)+ 'px'))
        .attr("y2", (d) -> height + 'px')

      svg.selectAll(".minScore")
          .data([Math.round(bmin)])
        .enter().append("text")
        .attr("class", "minScore")
        .attr("x", (d) -> (x((d)) - 6 )+ 'px')
        .attr("y", (d) -> (y(max_count_val)) + 'px')
        .text("▼")


      svg.selectAll(".minScoreText")
          .data([Math.round(bmin)])
        .enter().append("text")
        .attr("class", "minScoreText")
        .attr("x", (d) -> (x(d) - 21 )+ 'px')
        .attr("y", (d) -> (y(max_count_val) - 12) + 'px')
        .text((d) -> "Min: "+d)


      svg.selectAll(".maxScoreLine")
          .data([Math.round(bmax)])
        .enter().append("line")
        .attr("class", "maxScoreLine")
        .attr("x1", (d) -> (x((d)) )+ 'px')
        .attr("y1", (d) -> (y(max_count_val) - 18) + 'px')
        .attr("x2", (d) -> (x(d)+ 'px'))
        .attr("y2", (d) -> height + 'px')

      svg.selectAll(".maxScore")
          .data([Math.round(bmax)])
        .enter().append("text")
        .attr("class", "maxScore")
        .attr("x", (d) -> (x((d)) - 6 )+ 'px')
        .attr("y", (d) -> (y(max_count_val) - 18) + 'px')
        .text("▼")

      svg.selectAll(".maxScoreText")
          .data([Math.round(bmax)])
        .enter().append("text")
        .attr("class", "maxScoreText")
        .attr("x", (d) -> (x(d) - 30 )+ 'px')
        .attr("y", (d) -> (y(max_count_val) - 30) + 'px')
        .text((d) -> "Max: "+d)

      
      if graph == ".herb_viz"
        @$(graph).append '<div class="legends"><div class="legend"><span class="herb-swatch">&nbsp;</span>Biomass in Region</div><div class="legend-sketch-values">▼ Sketch Values</div></div>'
      if graph == ".fish_viz"
        @$(graph).append '<div class="legends"><div class="legend"><span class="fish-swatch">&nbsp;</span>Fish Count in Region</div><div class="legend-sketch-values">▼ Sketch Values</div></div>'
      if graph == ".total_viz"
        @$(graph).append '<div class="legends"><div class="legend"><span class="total-swatch">&nbsp;</span>Biomass in Region</div><div class="legend-sketch-values">▼ Sketch Values</div></div>'
       
      @$(graph).append '<br style="clear:both;">'

  getAllValues: (all_str) =>
    try
      all_vals = all_str.substring(1, all_str.length - 1)
      all_vals = all_vals.split(", ")
      sorted_vals = _.sortBy all_vals, (d) ->  parseFloat(d)
      return sorted_vals
    catch e
      return []
    

  roundVals: (d) =>    
    d.MEAN = parseFloat(d.MEAN).toFixed(1)
    d.MAX = parseFloat(d.MAX).toFixed(1)
    d.MIN = parseFloat(d.MIN).toFixed(1)

  roundData: (data) =>
    for d in data
      if d.AREA_SQKM < 0.1 and d.AREA_SQKM > 0.00001
        d.AREA_SQKM = "< 0.1 "
      else
        d.AREA_SQKM = parseFloat(d.AREA_SQKM).toFixed(1)

module.exports = EnvironmentTab