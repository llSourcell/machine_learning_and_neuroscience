(function() {
  spectraVis = {};
  params = {};
  var networkWidth;
  var networkHeight;
  var svgNetworkMap;
  var subjectObject;
  var curSubject;
  var edgeStatID;
  var NUM_COLORS = 11;
  var NODE_RADIUS = 10;
  var EDGE_WIDTH = 2;
  var stopAnimation = true;
  var curCh1;
  var curCh2;
  var curFreqInd;
  var curTimeInd;
  var mouseFlag = true;
  var edgeFilter;
  var networkView;
  var svgCh1;
  var svgEdgeStat;
  var svgCh2;
  var svgSpectraLegend;
  var svgEdgeStatLegend;
  var edgeStatLegendTitle;
  var svgAnatomicalLegend;
  var svgTimeSlice;
  var panelWidth;
  var edgeFilterDropdown;
  var networkSpinner;
  var spect1Spinner;
  var spect2Spinner;
  var edgeSpinner;
  var panelWidth;
  var panelHeight;
  var legendWidth;
  var timeSliceWidth;
  var timeSliceHeight;
  var edgeInfo;
  var subjectData;
  var visInfo;
  var margin;
  var edgeStatName;
  var channel;
  var edgeData;
  var time;
  var freq;

  colorbrewer.PiYG[NUM_COLORS].reverse();
  colorbrewer.RdBu[NUM_COLORS].reverse();

  spectraVis.init = function(params) {
    margin = {
      top: 30,
      right: 30,
      bottom: 30,
      left: 30,
    };
    panelWidth = document.getElementById('SpectraCh1Panel').offsetWidth - margin.left - margin.right;
    panelHeight = document.getElementById('SpectraCh1Panel').offsetWidth * (4 / 5) - margin.top - margin.bottom;
    legendWidth = document.getElementById('legendKey').offsetWidth - 5 - 5 - 30; // -30 comes from css padding. Kind of hacky.
    var colorbarLegendHeight = 60;
    var anatomicalLegendHeight = 100 - margin.top - margin.bottom;
    timeSliceWidth = panelWidth;
    timeSliceHeight = 180 - margin.top - margin.bottom;
    var spinnerOpts = {
      zIndex: 100,
    };
    freq = +params.freq;
    time = +params.time;
    edgeFilter = params.edgeFilter || 'All';
    networkView = params.networkView || 'Anatomical';
    curCh1 = params.curCh1;
    curCh2 = params.curCh2;
    curSubject = params.curSubject;
    edgeStatID = params.edgeStatID;

    // Heatmap Panels
    svgCh1 = d3.select('#SpectraCh1Panel')
      .append('svg')
      .attr('width', panelWidth + margin.left + margin.right)
      .attr('height', panelHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    svgEdgeStat = d3.select('#EdgeStatPanel')
      .append('svg')
      .attr('width', panelWidth + margin.left + margin.right)
      .attr('height', panelHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    svgCh2 = d3.select('#SpectraCh2Panel')
      .append('svg')
      .attr('width', panelWidth + margin.left + margin.right)
      .attr('height', panelHeight + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Legend SVG
    svgSpectraLegend = d3.selectAll('#legendKey').select('#spectraLegend')
      .append('svg')
      .attr('width', legendWidth + 5 + 5)
      .attr('height', 50)
      .append('g')
      .attr('transform', 'translate(' + 5 + ',' + 25 + ')');
    svgSpectraLegend.append('text')
      .attr('transform', 'translate(-5, -5)')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .text('Difference in Power');
    svgEdgeStatLegend = d3.selectAll('#legendKey').select('#edgeStatLegend')
      .append('svg')
      .attr('width', legendWidth + 5 + 5)
      .attr('height', 50)
      .append('g')
      .attr('transform', 'translate(' + 5 + ',' + 25 + ')');
    edgeStatLegendTitle = svgEdgeStatLegend.append('text')
      .attr('transform', 'translate(-5, -5)')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .text('Edge Statistic');
    svgAnatomicalLegend = d3.selectAll('#legendKey').select('#anatomicalLegend')
      .append('svg')
      .attr('width', legendWidth + 5 + 5)
      .append('g')
      .attr('transform', 'translate(' + 5 + ',' + 25 + ')');
    svgAnatomicalLegend.append('text')
      .attr('transform', 'translate(-5, -10)')
      .attr('font-size', 12)
      .attr('font-weight', 700)
      .text('Brain Areas');

    // Time Slice SVG
    svgTimeSlice = d3.select('#timeSlice')
      .append('svg')
      .attr('width', timeSliceWidth + 40 + 40)
      .attr('height', timeSliceHeight + 40 + 40)
      .append('g')
      .attr('transform', 'translate(' + 40 + ',' + 40 + ')');

    // Set up help overlay
    var overlay = d3.select('#overlay');
    var helpButton = d3.select('button#help-button');
    overlay.selectAll('.close')
      .on('click', function() {
        overlay.style('display', 'none');
      });

    helpButton
      .on('click', function() {
        overlay
          .style('display', 'block');
      });

    // Set up permalink button
    var permalink = d3.select('#permalink');
    var linkButton = d3.select('button#link');
    linkButton
      .on('click', function() {
        permalink
          .style('display', 'block');
        var linkString = window.location.origin + window.location.pathname + '?' +
          'curSubject=' + curSubject +
          '&edgeStatID=' + edgeStatID +
          '&edgeFilter=' + edgeFilter +
          '&networkView=' + networkView +
          '&time=' + visInfo.tax[curTimeInd] +
          '&freq=' + visInfo.fax[curFreqInd] +
          '&curCh1=' + curCh1 +
          '&curCh2=' + curCh2;
        permalink.selectAll('textarea').html(linkString);
        permalink.selectAll('.bookmark').attr('href', linkString);
      });

    permalink.selectAll('.close')
      .on('click', function() {
        permalink.style('display', 'none');
      });

    // Set up export svg button
    var exportButton = d3.select('button#export');
    exportButton
      .on('click', function() {
        var networkSVG = d3.select('#NetworkPanel').select('svg').node();
        var networkSaveName = 'Network' + '_' +
          curSubject + '_' +
          edgeStatID + '_' +
          networkView + '_' +
          visInfo.tax[curTimeInd] + visInfo.tunits + '_' +
          visInfo.fax[curFreqInd] + visInfo.funits;

        d3_save_svg.save(networkSVG, {filename: networkSaveName});

        var ch1SaveName = 'Spectra' + '_' +
          curSubject + '_' +
          'Ch' + curCh1;

        var ch1SVG = d3.select('#SpectraCh1Panel').select('svg').node();
        d3_save_svg.save(ch1SVG, {filename: ch1SaveName});

        var ch2SaveName = 'Spectra' + '_' +
          curSubject + '_' +
          'Ch' + curCh2;

        var ch2SVG = d3.select('#SpectraCh2Panel').select('svg').node();
        d3_save_svg.save(ch2SVG, {filename: ch2SaveName});

        var edgeSaveName = edgeStatID + '_' +
          curSubject + '_' +
          'Ch' + curCh1 + '_' +
          'Ch' + curCh2;

        var edgeSVG = d3.select('#EdgeStatPanel').select('svg').node();
        d3_save_svg.save(edgeSVG, {filename: edgeSaveName});

        d3.selectAll('circle.node')[0]
          .forEach(function(n) {n.setAttribute('style', '');
        });
      });

    // Set up edge area dropdown menus
    edgeFilterDropdown = d3.select('#EdgeFilterDropdown');
    edgeFilterDropdown.selectAll('button')
      .text(edgeFilter)
      .append('span')
      .attr('class', 'caret');

    // Spinners
    networkSpinner = new Spinner(spinnerOpts);
    spect1Spinner = new Spinner(spinnerOpts);
    spect2Spinner = new Spinner(spinnerOpts);
    edgeSpinner = new Spinner(spinnerOpts);

    // Load subject data
    queue()
      .defer(d3.json, 'DATA/subjects.json')
      .defer(d3.json, 'DATA/visInfo.json')
      .defer(d3.json, 'DATA/edgeTypes.json')
      .await(createMenu);
  };

  // Functions
  function createMenu(error, subjects, vI, eI) {
    visInfo = vI;
    edgeInfo = eI;

    if (visInfo.tax.indexOf(time) !== -1) {
      curTimeInd = visInfo.tax.indexOf(time);
    } else {
      curTimeInd = 0;
    }

    if (visInfo.fax.indexOf(freq) !== -1) {
      curFreqInd = visInfo.fax.indexOf(freq);
    } else {
      curFreqInd = 0;
    }

    // Populate dropdown menu with subjects
    subjectData = subjects;
    var subjectDropdown = d3.select('#SubjectDropdown');
    var subjectMenu = subjectDropdown.selectAll('.dropdown-menu').selectAll('li').data(subjectData);
    subjectMenu.enter()
      .append('li')
      .attr('id', function(d) {
        return d.subjectID;
      })
      .attr('role', 'presentation')
      .append('a')
      .attr('role', 'menuitem')
      .attr('tabindex', -1)
      .text(function(d) {
        return d.subjectID;
      });

    // Default to the first subject
    curSubject = curSubject || subjectData[0].subjectID;
    subjectDropdown.selectAll('button')
      .text(curSubject)
      .append('span')
      .attr('class', 'caret');

    // Create dropdown for edge types
    var edgeDropdown = d3.select('#EdgeStatTypeDropdown');
    var edgeOptions = edgeDropdown.select('ul').selectAll('li').data(edgeInfo);
    edgeOptions.enter()
      .append('li')
      .attr('id', function(d) {
        return d.edgeStatID;
      })
      .append('a')
      .attr('role', 'menuitem')
      .attr('tabindex', -1)
      .text(function(d) {
        return d.edgeStatName;
      });

    edgeOptions.exit()
      .remove();

    // Default to the first subject
    edgeStatID = edgeStatID || edgeInfo[0].edgeStatID;
    edgeStatName = edgeInfo.filter(function(e) {return e.edgeStatID === edgeStatID;})[0].edgeStatName;
    edgeDropdown.selectAll('button')
      .text(edgeStatName)
      .append('span')
      .attr('class', 'caret');

    // Set brain area legend height
    d3.selectAll('#legendKey').selectAll('#anatomicalLegend').selectAll('svg')
      .attr('height', 14 + visInfo.brainRegions.length * 15.14);

    // Load channel data
    loadChannelData();
  }

  // Load channel file and set the network svg to be the right aspect ratio for the brain
  function loadChannelData() {

    var channelFile = 'channels_' + curSubject + '.json';

    subjectObject = subjectData.filter(function(d) {
      return d.subjectID === curSubject;
    })[0];

    var aspectRatio = subjectObject.brainXpixels / subjectObject.brainYpixels;
    networkWidth = document.getElementById('NetworkPanel').offsetWidth - margin.left - margin.right;
    networkHeight = document.getElementById('NetworkPanel').offsetWidth * (1 / aspectRatio) - margin.top - margin.bottom;

    svgNetworkMap = d3.select('#NetworkPanel').selectAll('svg').data([subjectObject], function(d) {
      return d.subjectID;
    });

    svgNetworkMap.exit().remove();
    svgNetworkMap = svgNetworkMap.enter()
      .append('svg')
      .attr('width', networkWidth)
      .attr('height', networkHeight)
      .append('g');
    networkSpinner.spin(document.getElementById('NetworkPanel'));
    svgNetworkMap.style('display', 'none');
    d3.json('DATA/' + channelFile, function(isError, channelData) {

      channel = channelData;

      // Default to first two channels if no channels are not already specified
      curCh1 = curCh1 || channel[0].channelID;
      curCh2 = curCh2 || channel[1].channelID;

      loadEdges();
    });
  }

  function loadEdges() {
    // Load the edge file for the current subject
    var edgeFile = 'edges_' + curSubject + '_' + edgeStatID + '.json';
    d3.json('DATA/' + edgeFile, function(isError, eD) {
      edgeData = eD;
      loadSpectra();
    });
  }

  function loadSpectra() {

    // Start loading spinners
    spect1Spinner.spin(document.getElementById('SpectraCh1Panel'));
    spect2Spinner.spin(document.getElementById('SpectraCh2Panel'));
    edgeSpinner.spin(document.getElementById('EdgeStatPanel'));
    svgCh1.style('display', 'none');
    svgCh2.style('display', 'none');
    svgEdgeStat.style('display', 'none');
    svgTimeSlice.style('display', 'none');

    var spectCh1File = 'spectrogram_' + curSubject + '_' + curCh1 + '.json';
    var spectCh2File = 'spectrogram_' + curSubject + '_' + curCh2 + '.json';

    // Load the rest of the files in parallel
    queue()
      .defer(d3.json, 'DATA/' + spectCh1File)
      .defer(d3.json, 'DATA/' + spectCh2File)
      .await(display);
  }

  // Draw
  function display(isError, spect1, spect2) {

    var timeScale;
    var timeScaleLinear;
    var freqScale;
    var powerScale;
    var tAx;
    var fAx;
    var powerScale;
    var networkXScale;
    var networkYScale;
    var force;
    var timeSlider;
    var freqSlider;
    var timeSliderText;
    var freqSliderText;
    var subjectDropdown;
    var edgeStatScale;
    var edgeStatTypeDropdown;
    var brainRegionColor;
    var timeSliderStep;
    var timeMaxStepInd;
    var networkXExtent;
    var networkYExtent;
    var edgeStat;
    var powerLineFun;
    var edgeStatLineFun;
    var timeSlicePowerScale;
    var timeSliceNetworkStatScale;
    var spect1Line;
    var spect2Line;
    var edgeStatLine;
    var powerScale;
    var edgeStatScale;
    var isFreq;
    var isWeightedNetwork;
    var corrScale;
    var curEdgeInfo;
    var scaledChannel;

    tAx = visInfo.tax; // Time Axis
    fAx = visInfo.fax; // Frequency Axis
    // Get the edge statistic corresponding to the selected channels
    edgeStat = edgeData.filter(function(e) {
      return (e.source === curCh1 && e.target === curCh2) ||
        (e.source === curCh2 && e.target === curCh1);
    })[0];

    // Get the edge statastic name and units
    curEdgeInfo = edgeInfo
      .filter(function(e) {
        return e.edgeStatID === edgeStatID;
      })[0];

    isFreq = curEdgeInfo.isFreq;
    isWeightedNetwork = curEdgeInfo.isWeightedNetwork;

    // Set up scales and slider values
    setupScales();
    setupSliders();

    // Initialize charts
    var powerChart = heatmap()
      .height(panelHeight)
      .width(panelWidth)
      .yScale(freqScale)
      .xScale(timeScale)
      .xLabel('Time (' + visInfo.tunits + ')')
      .yLabel('Frequency (' + visInfo.funits + ')')
      .colorScale(powerScale)
      .rectMouseOver(rectMouseOver)
      .rectMouseClick(rectMouseClick);

    var cohChart = heatmap()
      .height(panelHeight)
      .width(panelWidth)
      .yScale(freqScale)
      .xScale(timeScale)
      .xLabel('Time (' + visInfo.tunits + ')')
      .yLabel('Frequency (' + visInfo.funits + ')')
      .colorScale(edgeStatScale)
      .rectMouseOver(rectMouseOver)
      .rectMouseClick(rectMouseClick);

    var corrChart = timeseries()
      .height(panelHeight)
      .width(panelWidth)
      .yScale(corrScale)
      .xScale(timeScale)
      .xLabel('Time (' + visInfo.tunits + ')')
      .yLabel(edgeStatName)
      .rectMouseOver(rectMouseOver)
      .rectMouseClick(rectMouseClick);

    var cohTimeSlice = timeseries()
      .height(timeSliceHeight)
      .width(timeSliceWidth)
      .yScale(timeSliceEdgeStatScale)
      .xScale(timeScale)
      .yAxisOrientation('left')
      .xLabel('Time (' + visInfo.tunits + ')')
      .yLabel(edgeStatName);

    var powerTimeSlice = timeseries()
      .height(timeSliceHeight)
      .width(timeSliceWidth)
      .yScale(timeSlicePowerScale)
      .xScale(timeScale)
      .yAxisOrientation('right')
      .xLabel('Time (' + visInfo.tunits + ')')
      .yLabel('Power Difference')
      .lineColor('green');

    // Draw charts
    drawNetwork();
    svgNetworkMap.style('display', '');
    networkSpinner.stop();

    svgCh1
      .datum(spect1.data)
      .call(powerChart);
    svgCh1.style('display', '');
    spect1Spinner.stop();

    svgCh2
      .datum(spect2.data)
      .call(powerChart);
    spect2Spinner.stop();
    svgCh2.style('display', '');

    if (isFreq) {
      svgEdgeStat
        .html('');
      svgEdgeStat
        .datum(edgeStat.data)
        .call(cohChart);
      drawTimeSlice();
    } else {
      // Remove coherence and time slice charts
      svgEdgeStat
        .html('');
      svgTimeSlice
        .html('');
      svgEdgeStat
        .datum(edgeStat.data)
        .call(corrChart);
    }

    svgEdgeStat.style('display', '');
    edgeSpinner.stop();
    svgTimeSlice.style('display', '');

    // Draw legends and titles
    drawTitles();
    drawLegends();

    // Handle buttons
    subjectLoad();
    edgeStatTypeLoad();
    edgeFilterLoad();
    networkViewLoad();
    playButtonStart();
    resetButton();

    function setupSliders() {

      timeSlider = d3.select('#timeSlider');
      timeSliderText = d3.select('#timeSlider-value');
      freqSlider = d3.select('#freqSlider');
      freqSliderText = d3.select('#freqSlider-value');

      timeSliderStep = d3.round(tAx[1] - tAx[0], 4);
      timeMaxStepInd = tAx.length - 1;

      timeSlider.property('min', d3.min(tAx));
      timeSlider.property('max', d3.max(tAx));
      timeSlider.property('step', timeSliderStep);
      timeSlider.property('value', tAx[curTimeInd]);
      timeSlider.on('input', updateTimeSlider);
      timeSliderText.text(tAx[curTimeInd] + ' ms');

      freqSlider.property('min', d3.min(fAx));
      freqSlider.property('max', d3.max(fAx));
      freqSlider.property('step', fAx[1] - fAx[0]);
      freqSlider.property('value', fAx[curFreqInd]);
      freqSlider.on('input', updateFreqSlider);
      freqSliderText.text(fAx[curFreqInd] + ' Hz');
    }

    function setupScales() {
      var powerColors = colorbrewer.PiYG[NUM_COLORS];
      var edgeStatColors = colorbrewer.RdBu[NUM_COLORS];
      var powerMin;
      var powerMax;
      var powerExtent;
      var edgeStatMin;
      var edgeStatMax;
      var edgeStatExtent;

      brainRegionColor = d3.scale.ordinal()
        .domain(visInfo.brainRegions)
        .range(colorbrewer.Pastel1[7]);

      powerMin = d3.min(
        [d3.min(spect1.data, function(d) {
            return d3.min(d, function(e) {
              return e;
            });
          }),

          d3.min(spect2.data, function(d) {
            return d3.min(d, function(e) {
              return e;
            });
          }),
        ]

      );

      powerMax = d3.max(
        [d3.max(spect1.data, function(d) {
            return d3.max(d, function(e) {
              return e;
            });
          }),

          d3.max(spect2.data, function(d) {
            return d3.max(d, function(e) {
              return e;
            });
          }),
        ]
      );

      powerExtent = symmetricExtent(powerMin, powerMax);

      networkXExtent = subjectObject.brainXLim;
      networkYExtent = subjectObject.brainYLim;

      edgeStatMin = d3.min(edgeData, function(d) {
        return d3.min(d.data, function(e) {
          return d3.min(e, function(f) {
            return f;
          });
        });
      });

      edgeStatMax = d3.max(edgeData, function(d) {
        return d3.max(d.data, function(e) {
          return d3.max(e, function(f) {
            return f;
          });
        });
      });

      edgeStatExtent = symmetricExtent(edgeStatMin, edgeStatMax);

      powerScale = d3.scale.linear()
        .domain(powerExtent)
        .range(powerColors);
      if (isWeightedNetwork) {
        edgeStatScale = d3.scale.linear()
          .domain(edgeStatExtent)
          .range(edgeStatColors);
      } else {
        edgeStatColors = [0, (NUM_COLORS - 1) / 2, NUM_COLORS - 1].map(function(n) { return edgeStatColors[n];});

        edgeStatScale = d3.scale.ordinal()
          .domain([-1, 0, 1])
          .range(edgeStatColors);
      }

      timeScale = d3.scale.ordinal()
        .domain(tAx)
        .rangeBands([0, panelWidth]);

      timeScaleLinear = d3.scale.linear()
        .domain(d3.extent(tAx))
        .range([0, panelWidth]);

      freqScale = d3.scale.ordinal()
        .domain(fAx)
        .rangeBands([panelHeight, 0]);

      timeSlicePowerScale = d3.scale.linear()
        .domain(powerExtent)
        .range(linspace(timeSliceHeight, 0, NUM_COLORS));
      timeSliceEdgeStatScale = d3.scale.linear()
        .domain(edgeStatExtent)
        .range(linspace(timeSliceHeight, 0, NUM_COLORS));

      networkXScale = d3.scale.linear()
        .domain(networkXExtent)
        .range([0, networkWidth]);
      networkYScale = d3.scale.linear()
        .domain(networkYExtent)
        .range([networkHeight, 0]);

      corrScale = d3.scale.linear()
        .domain(edgeStatExtent)
        .range(linspace(0, panelHeight, NUM_COLORS));

      function symmetricExtent(min, max) {
        if (Math.abs(min) >= Math.abs(max)) {
          max = Math.abs(min);
        } else {
          min = -1 * max;
        }

        return linspace(min, max, 11);
      }

      // from https://github.com/sloisel/numeric
      function linspace(a, b, n) {
        if (typeof n === 'undefined') {
          n = Math.max(Math.round(b - a) + 1, 1);
        };

        if (n < 2) {
          return n === 1 ? [a] : [];
        }

        var i;
        var ret = Array(n);
        n--;
        for (i = n; i >= 0; i--) {
          ret[i] = (i * b + (n - i) * a) / n;
        }

        return ret;
      }
    }

    function drawNetwork() {
      var nodesGroup;
      var edgesGroup;
      var nodeG;
      var strokeStyle;
      var nodeClickNames = [];
      var brainImage;
      var edge;
      var edgeLine;
      var brainImageG;
      var nodeCircle;
      var nodeText;

      if (networkView === 'Anatomical') {
        scaledChannel = channel.map(function(n) {
          var obj = copyObject(n);
          obj.x = networkXScale(n.x);
          obj.y = networkYScale(n.y);
          obj.fixed = true;
          return obj;
        });
      } else {
        scaledChannel = channel.map(function(n, i) {
          var obj = copyObject(n);
          if (typeof scaledChannel === 'undefined') {
            obj.x = networkXScale(n.x);
            obj.y = networkYScale(n.y);
          } else {
            obj.x = scaledChannel[i].x;
            obj.y = scaledChannel[i].y;
            obj.px = scaledChannel[i].px;
            obj.py = scaledChannel[i].py;
          }

          obj.fixed = false;
          return obj;
        });
      }

      // Replace source name by source object
      edge = edgeData.map(function(e) {
        var obj = copyObject(e);
        obj.source = scaledChannel.filter(function(n) {
          return n.channelID === e.source;
        })[0];

        obj.target = scaledChannel.filter(function(n) {
          return n.channelID === e.target;
        })[0];

        obj.data = obj.data[curTimeInd][curFreqInd];
        return obj;
      });

      edge = edge.filter(edgeFiltering);

      force = d3.layout.force()
        .nodes(scaledChannel)
        .links(edge)
        .charge(-375)
        .linkDistance(networkHeight / 3)
        .size([networkWidth, networkHeight])
        .start();

      brainImageG = svgNetworkMap.selectAll('g#BRAIN_IMAGE').data([{}]);
      brainImageG.enter()
        .append('g')
        .attr('id', 'BRAIN_IMAGE');
      edgesGroup = svgNetworkMap.selectAll('g#EDGES').data([{}]);
      edgesGroup.enter()
        .append('g')
        .attr('id', 'EDGES');
      nodesGroup = svgNetworkMap.selectAll('g#NODES').data([{}]);
      nodesGroup.enter()
        .append('g')
        .attr('id', 'NODES');

      edgeLine = edgesGroup.selectAll('.edge').data(edge, function(e) {
        return curSubject + '_' + e.source.channelID + '_' + e.target.channelID;
      });

      edgeLine.enter()
        .append('line')
        .attr('class', 'edge')
        .style('stroke-width', EDGE_WIDTH)
        .attr('x1', function(d) {
          return xPos(d.source);
        })
        .attr('y1', function(d) {
          return yPos(d.source);
        })
        .attr('x2', function(d) {
          return xPos(d.target);
        })
        .attr('y2', function(d) {
          return yPos(d.target);
        });

      edgeLine.exit()
        .remove();
      edgeLine
        .style('stroke', function(d) {
          return edgeStatScale(d.data);
        })
        .on('mouseover', edgeMouseOver)
        .on('mouseout', edgeMouseOut)
        .on('click', edgeMouseClick);

      nodeG = nodesGroup.selectAll('g.gnode').data(scaledChannel, function(d) {
        return curSubject + '_' + d.channelID;
      });

      nodeG.enter()
        .append('g')
        .attr('class', 'gnode')
        .attr('transform', function(d) {
          return 'translate(' + [xPos(d), yPos(d)] + ')';
        })
        .on('click', nodeMouseClick);
      nodeG.exit().remove();

      nodeCircle = nodeG.selectAll('circle.node').data(function(d) {
        return [d];
      });

      nodeCircle.enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', NODE_RADIUS)
        .attr('fill', '#ddd')
        .attr('opacity', 1);
      nodeCircle
        .attr('fill', function(d) {
          return brainRegionColor(d.region);
        })
        .style('stroke', 'white');

      nodeCircle.filter(function(d) {return d.channelID == curCh1 || d.channelID == curCh2;})
        .style('stroke', 'black');

      nodeText = nodeG.selectAll('text.nodeLabel').data(function(d) {
        return [d];
      });

      nodeText.enter()
        .append('text')
        .attr('class', 'nodeLabel')
        .text(function(d) {
          return d.channelID;
        });

      // For every iteration of force simulation 'tick'
      force.on('tick', function() {

        // Translate the groups
        nodeG.attr('transform', function(d) {
          return 'translate(' + [xPos(d), yPos(d)] + ')';
        });

        edgeLine.attr('x1', function(d) {
            return xPos(d.source);
          })
          .attr('y1', function(d) {
            return yPos(d.source);
          })
          .attr('x2', function(d) {
            return xPos(d.target);
          })
          .attr('y2', function(d) {
            return yPos(d.target);
          });

        if (networkView !== 'Topological') {
          force.stop();
        }

      });

      brainImage = brainImageG.selectAll('image').data([subjectObject], function(d) {
        return d.brainFilename;
      });

      if (networkView === 'Anatomical') {
        brainImage.enter()
          .append('image')
          .attr('width', networkWidth)
          .attr('height', networkHeight);

        // replace link by data URI
        getImageBase64('DATA/brainImages/' + subjectObject.brainFilename, function(err, d) {
          brainImage
            .attr('xlink:href', 'data:image/png;base64,' + d);
        });
      }

      brainImage.exit()
        .remove();
      if (networkView === 'Topological') {
        brainImage.remove();
      };

      function xPos(d) {
        return Math.max(NODE_RADIUS, Math.min(networkWidth - NODE_RADIUS, d.x));
      }

      function yPos(d) {
        return Math.max(NODE_RADIUS, Math.min(networkHeight - NODE_RADIUS, d.y));
      }

      function edgeMouseOver(e) {

        var curEdge = d3.select(this);
        strokeStyle = curEdge.style('stroke');
        curEdge
          .style('stroke-width', 2 * EDGE_WIDTH)
          .style('stroke', function() {
            if (e.data < 0) {
              return edgeStatScale(d3.min(edgeStatScale.domain()));
            } else {
              return edgeStatScale(d3.max(edgeStatScale.domain()));
            }
          });

        var curNodes = d3.selectAll('circle.node')
          .filter(function(n) {
            return (n.channelID === e.source.channelID) || (n.channelID === e.target.channelID);
          })
          .attr('r', NODE_RADIUS * 1.2);
      }

      function edgeMouseOut(e) {
        var curEdge = d3.select(this);
        if (typeof strokeStyle !== 'undefined') {
          curEdge
            .style('stroke-width', EDGE_WIDTH)
            .style('stroke', strokeStyle);
          d3.selectAll('circle.node')
            .filter(function(n) {
              return (n.channelID === e.source.channelID) || (n.channelID === e.target.channelID);
            })
            .attr('r', NODE_RADIUS);
        }
      }

      function edgeMouseClick(e) {
        var re = /\d+/;
        curCh1 = re.exec(e.source.channelID)[0];
        curCh2 = re.exec(e.target.channelID)[0];
        mouseFlag = true;
        svgNetworkMap.select('text#HOLD').remove();
        loadSpectra();
        edgeMouseOut.call(this, e);
      }

      function nodeMouseClick(e) {
        var curNode = d3.select(this);
        var nodeInd = nodeClickNames.indexOf(+e.channelID);

        if (nodeInd > -1) {
          // If clicked on node is in the array, remove
          curNode.selectAll('circle')
            .attr('r', NODE_RADIUS);
          nodeClickNames.splice(nodeInd, 1);
        } else {
          // Else add to array
          curNode.selectAll('circle')
            .attr('r', 1.2 * NODE_RADIUS);
          nodeClickNames.push(+e.channelID);
        }

        if (nodeClickNames.length === 2) {
          var re = /\d+/;
          curCh1 = re.exec(nodeClickNames[0])[0];
          curCh2 = re.exec(nodeClickNames[1])[0];
          mouseFlag = true;
          svgNetworkMap.select('text#HOLD').remove();
          d3.selectAll('circle.node')
            .filter(function(n) {
              return (n.channelID === nodeClickNames[0].toString()) || (n.channelID === nodeClickNames[1].toString());
            })
            .attr('fill', '#ddd')
            .attr('r', NODE_RADIUS);
          nodeClickNames = [];
          loadSpectra();
        }
      }

      function edgeFiltering(e) {
        var showEdge = true;

        // If edge type is binary, don't display edges corresponding to no edge
        if (!isWeightedNetwork) {
          showEdge = (e.data !== 0);
        }

        // Now filter by edge connection type (within brain area, etc)
        switch (edgeFilter) {
          case 'Within':
            showEdge = (e.source.region === e.target.region) && showEdge;
            break;
          case 'Between':
            showEdge = (e.source.region !== e.target.region) && showEdge;
            break;
        }

        return showEdge;
      }
    };

    function heatmap() {
      var colorScale = d3.scale.linear();
      var xScale = d3.scale.ordinal();
      var yScale = d3.scale.ordinal();
      var rectMouseOver = function() {};

      var rectMouseClick = function() {};

      var height = 500;
      var width = 500;
      var xLabel = '';
      var yLabel = '';

      function chart(selection) {

        selection.each(function(data) {
          var heatmapG;
          var heatmapRect;
          var xAxis;
          var yAxis;
          var zeroG;
          var xAxisG;
          var yAxisG;
          var zeroLine;
          var curPlot = d3.select(this);

          xScale.rangeBands([0, width]);
          yScale.rangeBands([height, 0]);

          heatmapG = curPlot.selectAll('g.heatmapX').data(data);
          heatmapG.enter()
            .append('g')
            .attr('transform', function(d, i) {
              return 'translate(' + xScale(xScale.domain()[i]) + ', 0)';
            })
            .attr('class', 'heatmapX');
          heatmapG.exit()
            .remove();
          heatmapRect = heatmapG.selectAll('rect').data(function(d) {
            return d;
          });

          heatmapRect.enter()
            .append('rect')
            .attr('x', 0)
            .attr('y', function(d, i) {
              return yScale(yScale.domain()[i]);
            })
            .attr('height', yScale.rangeBand())
            .attr('width', xScale.rangeBand())
            .style('fill', 'white');
          heatmapRect
            .style('fill', function(d) {
              return colorScale(d);
            })
            .style('stroke', function(d) {
              return colorScale(d);
            })
            .on('mouseover', rectMouseOver)
            .on('click', rectMouseClick);
          heatmapRect.exit()
            .remove();

          xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(3)
            .tickValues([d3.min(xScale.domain()), 0, d3.max(xScale.domain())])
            .tickSize(0, 0, 0);
          yAxis = d3.svg.axis()
            .scale(yScale)
            .orient('left')
            .tickValues(['10', '20', '40', '60', '90', '150', '200'])
            .tickSize(0, 0, 0);

          xAxisG = curPlot.selectAll('g.axis#x').data([{}]);
          xAxisG.enter()
            .append('g')
            .attr('class', 'axis')
            .attr('id', 'x')
            .attr('transform', 'translate(0,' + height + ')')
            .append('text')
            .attr('x', xScale(0))
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dy', 2 + 'em')
            .text(xLabel);
          xAxisG.call(xAxis);

          yAxisG = curPlot.selectAll('g.axis#y').data([{}]);
          yAxisG.enter()
            .append('g')
            .attr('class', 'axis')
            .attr('id', 'y')
            .append('text')
            .attr('x', -height / 2)
            .attr('dy', -2 + 'em')
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text(yLabel);
          yAxisG.call(yAxis);

          zeroG = curPlot.selectAll('g.zeroLine').data([
            [
              [0, height],
            ],
          ]);
          zeroG.enter()
            .append('g')
            .attr('class', 'zeroLine');
          zeroLine = zeroG.selectAll('path').data(function(d) {
            return d;
          });

          zeroLine.enter()
            .append('path');
          zeroLine
            .attr('d', d3.svg.line()
              .x(xScale(0))
              .y(function(d) {
                return d;
              })
              .interpolate('linear'))
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .style('opacity', 0.7);
        });
      }

      chart.colorScale = function(scale) {
        if (!arguments.length) return colorScale;
        colorScale = scale;
        return chart;
      };

      chart.xScale = function(scale) {
        if (!arguments.length) return xScale;
        xScale = scale;
        return chart;
      };

      chart.yScale = function(scale) {
        if (!arguments.length) return yScale;
        yScale = scale;
        return chart;
      };

      chart.rectMouseOver = function(fun) {
        if (!arguments.length) return rectMouseOver;
        rectMouseOver = fun;
        return chart;
      };

      chart.rectMouseClick = function(fun) {
        if (!arguments.length) return rectMouseClick;
        rectMouseClick = fun;
        return chart;
      };

      chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
      };

      chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
      };

      chart.yLabel = function(value) {
        if (!arguments.length) return yLabel;
        yLabel = value;
        return chart;
      };

      chart.xLabel = function(value) {
        if (!arguments.length) return xLabel;
        xLabel = value;
        return chart;
      };

      return chart;
    }

    function drawTitles() {

      spectTitle(svgCh1, curCh1);
      spectTitle(svgCh2, curCh2);
      edgeTitle();
      edgeStatLegendTitle.text(edgeStatName);

      function edgeTitle() {
        var titleEdge = svgEdgeStat.selectAll('g.title').data([edgeStat], function(d) {
          return edgeStatName + '-' + d.source + '-' + d.target;
        });

        titleEdge.exit()
          .remove();
        titleEdge.enter()
          .append('g')
          .attr('transform', 'translate(' + timeScaleLinear(0) + ', -10)')
          .attr('class', 'title');

        var titleLabel = titleEdge.selectAll('text.infoLabel').data(function(d) {
          return [d];
        });

        titleLabel.enter()
          .append('text')
          .attr('class', 'infoLabel')
          .attr('text-anchor', 'middle');
        titleLabel
          .text(edgeStatName + ':');

        var boundBox = titleLabel.node().getBBox();

        var titleLine = titleEdge.selectAll('line.nodeLabel').data([{}]);

        titleLine.enter()
          .append('line')
          .attr('class', 'edge')
          .style('stroke-width', EDGE_WIDTH)
          .attr('stroke', 'black');
        titleLine
          .attr('x1', boundBox.x + boundBox.width + NODE_RADIUS)
          .attr('y1', -NODE_RADIUS / 2)
          .attr('x2', boundBox.x + boundBox.width + NODE_RADIUS + 30)
          .attr('y2', -NODE_RADIUS / 2);

        var titleCircleG = titleEdge.selectAll('g').data(
          [
            channel.filter(function(d) {
              return d.channelID === curCh1;
            }),

            channel.filter(function(d) {
              return d.channelID === curCh2;
            }),
          ]
        );

        titleCircleG.enter()
          .append('g');

        titleCircleG
          .attr('transform', function(d, i) {
            return 'translate(' + (boundBox.x + boundBox.width + NODE_RADIUS + i * 30) + ', ' + (-NODE_RADIUS / 2) + ')';
          });

        var titleCircle = titleCircleG.selectAll('circle.node').data(function(d, i) {
          return [
            [d, i],
          ];
        });

        titleCircle.enter()
          .append('circle')
          .attr('class', 'node')
          .attr('r', NODE_RADIUS)
          .attr('fill', '#ddd')
          .attr('opacity', 1);

        titleCircle
          .attr('fill', function(d) {
            return brainRegionColor(d[0][0].region);
          });

        var titleText = titleCircleG.selectAll('text.nodeLabel').data(function(d, i) {
          return [
            [d, i],
          ];
        });

        titleText.enter()
          .append('text')
          .attr('class', 'nodeLabel');

        titleText
          .text(function(d) {
            return d[0][0].channelID;
          });

      }

      function spectTitle(svgCh, channelID) {
        var titleCh = svgCh.selectAll('g.title')
          .data(channel.filter(function(d) {
            return d.channelID === channelID;
          }), function(d) {

            return d.SubjectID + '_' + d.channelID;
          });

        titleCh.exit().remove();
        titleCh.enter()
          .append('g')
          .attr('transform', 'translate(' + timeScaleLinear(0) + ', -10)')
          .attr('class', 'title');

        titleLabel = titleCh.selectAll('text.infoLabel').data(function(d) {
          return [d];
        });

        titleLabel.enter()
          .append('text')
          .attr('class', 'infoLabel')
          .attr('text-anchor', 'middle')
          .text('Spectra: Ch');

        var boundBox = titleLabel.node().getBBox();

        var titleCircle = titleCh.selectAll('circle.node').data(function(d) {
          return [d];
        });

        titleCircle.enter()
          .append('circle')
          .attr('class', 'node')
          .attr('r', NODE_RADIUS)
          .attr('transform', 'translate(' + (-boundBox.x  + NODE_RADIUS + 5) + ', ' + (-NODE_RADIUS / 2) + ')')
          .attr('fill', '#ddd')
          .attr('opacity', 1);

        titleCircle
          .attr('fill', function(d) {
            return brainRegionColor(d.region);
          });

        var titleText = titleCh.selectAll('text.nodeLabel').data(function(d) {
          return [d];
        });

        titleText.enter()
          .append('text')
          .attr('class', 'nodeLabel')
          .attr('transform', 'translate(' + (-boundBox.x  + NODE_RADIUS + 5) + ', ' + (-NODE_RADIUS / 2) + ')');
        titleText
          .text(function(d) {
            return d.channelID;
          });

      }
    }

    function drawLegends() {
      var powerG;
      var powerLegendRect;
      var legendScale;
      var powerAxisG;
      var powerAxis;
      var edgeStatG;
      var edgeStatLegendRect;
      var edgeStatAxisG;
      var edgeStatAxis;
      var anatomicalG;
      var anatomicalCircle;
      var anatomicalText;
      var formatter = d3.format('.1f');

      var rectWidth = legendWidth / (NUM_COLORS + 1);
      var rectHeight = rectWidth * 0.5;

      // Power Legend
      powerG = svgSpectraLegend.selectAll('g#powerLegend').data([{}]);
      powerG.enter()
        .append('g')
        .attr('id', 'powerLegend');

      powerLegend = d3.legend.color()
        .shape('rect')
        .shapeWidth(rectWidth)
        .shapeHeight(rectHeight)
        .labelOffset(5)
        .cells(NUM_COLORS)
        .orient('horizontal')
        .scale(powerScale);
      powerG.call(powerLegend);

      // Edge Statistic Legend
      edgeStatG = svgEdgeStatLegend.selectAll('g#edgeStatLegend').data([{}]);
      edgeStatG.enter()
        .append('g')
        .attr('id', 'edgeStatLegend');

      edgeLegend = d3.legend.color()
        .shape('rect')
        .shapeWidth(rectWidth)
        .shapeHeight(rectHeight)
        .labelOffset(5)
        .cells(NUM_COLORS)
        .orient('horizontal')
        .scale(edgeStatScale);
      edgeStatG.call(edgeLegend);

      // Anatomical legend
      anatomicalLegendG = svgAnatomicalLegend.selectAll('g#anatomicalLegend').data([{}]);
      anatomicalLegendG.enter()
        .append('g')
        .attr('id', 'anatomicalLegend');

      anatomicalLegend = d3.legend.color()
        .shape('circle')
        .shapeRadius(NODE_RADIUS / 2)
        .labelOffset(5)
        .orient('vertical')
        .scale(brainRegionColor);
      anatomicalLegendG.call(anatomicalLegend);
    }

    function drawTimeSlice() {

      var cohSlice = svgTimeSlice.selectAll('g#cohSlice')
        .data([edgeStat.data.map(function(d) {
          return d[curFreqInd];
        }),
      ]);

      cohSlice.enter()
        .append('g')
        .attr('id', 'cohSlice');
      cohSlice
        .call(cohTimeSlice);

      var spect1Slice = svgTimeSlice.selectAll('g#spect1Slice')
        .data([spect1.data.map(function(d) {
          return d[curFreqInd];
        }),
      ]);

      spect1Slice.enter()
        .append('g')
        .attr('id', 'spect1Slice');
      spect1Slice
        .call(powerTimeSlice);

      var spect2Slice = svgTimeSlice.selectAll('g#spect2Slice')
        .data([spect2.data.map(function(d) {
          return d[curFreqInd];
        }),
      ]);

      spect2Slice.enter()
        .append('g')
        .attr('id', 'spect2Slice');
      spect2Slice
        .call(powerTimeSlice);

      var timeTitle = svgTimeSlice.selectAll('text.title').data([fAx[curFreqInd]]);
      timeTitle.enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('class', 'title')
        .attr('x', timeSliceWidth / 2)
        .attr('y', 0)
        .attr('dy', -1 + 'em');
      timeTitle
        .text(function(d) {
          return 'Time Slice @ Frequency ' + d + ' ' + visInfo.funits;
        });
    }

    function timeseries() {

      var xScale = d3.scale.ordinal();
      var yScale = d3.scale.linear();
      var height = 600;
      var width = 600;
      var rectMouseOver = function() {};

      var rectMouseClick = function() {};

      var xLabel = '';
      var yLabel = '';
      var yAxisOrientation = 'left';
      var lineColor = 'blue';

      function chart(selection) {

        selection.each(function(data) {
          var curPlot = d3.select(this);

          xScale.rangeBands([0, width]);

          var orient = (yAxisOrientation === 'right') ? 1 : -1;

          var lineFun = d3.svg.line()
            .x(function(d, i) {
              return xScale(xScale.domain()[i]);
            })
            .y(function(d) {
              return yScale(d);
            })
            .interpolate('linear');

          var line = curPlot.selectAll('path.timeseries').data([data]);
          line.enter()
            .append('path')
            .attr('class', 'timeseries')
            .attr('fill', 'none')
            .attr('stroke', lineColor);
          line
            .transition()
            .duration(5)
            .ease('linear')
            .attr('d', lineFun);

          var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient(yAxisOrientation)
            .ticks(3)
            .tickValues([d3.min(yScale.domain()), 0, d3.max(yScale.domain())])
            .tickSize(0, 0, 0);
          var yAxisG = curPlot.selectAll('g.axis#y').data([{}]);

          yAxisG.enter()
            .append('g')
            .attr('class', 'axis')
            .attr('id', 'y')
            .attr('transform', 'translate(' + (yAxisOrientation === 'right' ? width : 0) + ',0)')
            .append('text')
            .attr('x', orient * height / 2)
            .attr('dy', -2.5 + 'em')
            .attr('transform', 'rotate(' + (orient * 90) + ')')
            .attr('text-anchor', 'middle')
            .text(yLabel);
          yAxisG.call(yAxis);

          var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(3)
            .tickValues([d3.min(xScale.domain()), 0, d3.max(xScale.domain())])
            .tickSize(0, 0, 0);
          var xAxisG = curPlot.selectAll('g.axis#x').data([{}]);
          xAxisG.enter()
            .append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + height + ')')
            .attr('id', 'x')
            .append('text')
            .attr('x', xScale(0))
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dy', 3 + 'em')
            .text(xLabel);
          xAxisG.call(xAxis);

          var zeroG = curPlot.selectAll('g.zeroLine').data([
            [
              [0, height],
            ],
          ]);
          zeroG.enter()
            .append('g')
            .attr('class', 'zeroLine');
          var zeroLine = zeroG.selectAll('path').data(function(d) {
            return d;
          });

          zeroLine.enter()
            .append('path');
          zeroLine
            .attr('d', d3.svg.line()
              .x(xScale(0))
              .y(function(d) {
                return d;
              })
              .interpolate('linear'))
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .style('opacity', 0.7);

          var heatmapG = curPlot.selectAll('g.heatmapX').data(data);
          heatmapG.enter()
            .append('g')
            .attr('transform', function(d, i) {
              return 'translate(' + xScale(xScale.domain()[i]) + ', 0)';
            })
            .attr('class', 'heatmapX');
          heatmapG.exit()
            .remove();
          var heatmapRect = heatmapG.selectAll('rect').data(function(d) {
            return d;
          });

          heatmapRect.enter()
            .append('rect')
            .attr('opacity', 1e-6)
            .attr('height', height)
            .attr('width', xScale.rangeBand())
            .style('fill', 'white');
          heatmapRect
            .on('mouseover', rectMouseOver)
            .on('click', rectMouseClick);
          heatmapRect.exit()
            .remove();
        });

      }

      chart.xScale = function(scale) {
        if (!arguments.length) return xScale;
        xScale = scale;
        return chart;
      };

      chart.yScale = function(scale) {
        if (!arguments.length) return yScale;
        yScale = scale;
        return chart;
      };

      chart.rectMouseOver = function(fun) {
        if (!arguments.length) return rectMouseOver;
        rectMouseOver = fun;
        return chart;
      };

      chart.rectMouseClick = function(fun) {
        if (!arguments.length) return rectMouseClick;
        rectMouseClick = fun;
        return chart;
      };

      chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
      };

      chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
      };

      chart.yLabel = function(value) {
        if (!arguments.length) return yLabel;
        yLabel = value;
        return chart;
      };

      chart.xLabel = function(value) {
        if (!arguments.length) return xLabel;
        xLabel = value;
        return chart;
      };

      chart.yAxisOrientation = function(value) {
        if (!arguments.length) return yAxisOrientation;
        yAxisOrientation = value;
        return chart;
      };

      chart.lineColor = function(value) {
        if (!arguments.length) return lineColor;
        lineColor = value;
        return chart;
      };

      return chart;

    }

    function subjectLoad() {
      subjectDropdown = d3.select('#SubjectDropdown');
      subjectDropdown.selectAll('li')
        .on('click', function() {

          subjectDropdown.selectAll('button')
            .text(this.id)
            .append('span')
            .attr('class', 'caret');
          curSubject = this.id;
          curCh1 = '';
          curCh2 = '';
          loadChannelData();
        });
    }

    function edgeStatTypeLoad() {
      edgeStatTypeDropdown = d3.select('#EdgeStatTypeDropdown');
      edgeStatTypeDropdown.selectAll('li')
        .on('click', function() {
          edgeStatTypeDropdown.selectAll('button')
            .text(d3.select(this).select('a').html())
            .append('span')
            .attr('class', 'caret');
          edgeStatID = this.id;

          isFreq = edgeInfo
            .filter(function(e) {
              return e.edgeStatID === edgeStatID;
            })[0]
            .isFreq;
          curFreqInd = isFreq ? curFreqInd : 0;
          freqSlider.property('value', fAx[curFreqInd]);
          freqSliderText.text(fAx[curFreqInd] + ' Hz');

          loadEdges();
        });
    }

    function edgeFilterLoad() {
      edgeFilterDropdown = d3.select('#EdgeFilterDropdown');
      edgeFilterDropdown.selectAll('li')
        .on('click', function() {
          edgeFilterDropdown.selectAll('button')
            .text(this.id)
            .append('span')
            .attr('class', 'caret');
          edgeFilter = this.id;
          drawNetwork();
        });
    }

    function networkViewLoad() {
      var networkViewRadio = d3.select('#NetworkViewPanel');
      networkViewRadio.selectAll('input')
        .on('click', function() {
          var radioValue = this.value;
          networkViewRadio.selectAll('input')
            .property('checked', false);
          d3.select(this).property('checked', true);
          networkView = radioValue;
          drawNetwork();
        });
    }

    function playButtonStart() {
      var playButton = d3.select('#playButton');
      playButton.on('click', function() {

        d3.select('#playButton').text('Stop');
        stopAnimation = !stopAnimation;
        var intervalID = setInterval(function() {
          if (curTimeInd < timeMaxStepInd && stopAnimation === false) {
            curTimeInd++;
            updateTimeSlider.call({
              value: tAx[curTimeInd],
            });
          } else {
            d3.select('#playButton').text('Start');
            stopAnimation = true;
            clearInterval(intervalID);
          }
        }, 100);
      });
    }

    function resetButton() {
      var resetButton = d3.select('#resetButton');
      resetButton.on('click', function() {
        curTimeInd = 0;
        stopAnimation = true;
        updateTimeSlider.call({
          value: tAx[curTimeInd],
        });
      });
    }

    function updateTimeSlider() {
      curTimeInd = tAx.indexOf(+this.value);
      timeSlider.property('value', tAx[curTimeInd]);
      timeSliderText.text(tAx[curTimeInd] + ' ms');
      if (!this.noUpdate) drawNetwork();
    }

    function updateFreqSlider() {
      curFreqInd = isFreq ? fAx.indexOf(+this.value) : 0;
      freqSlider.property('value', fAx[curFreqInd]);
      freqSliderText.text(fAx[curFreqInd] + ' Hz');

      if (!this.noUpdate) drawNetwork();

      if (isFreq & !this.noUpdate) drawTimeSlice();
    }

    function rectMouseOver(d, freqInd, timeInd) {
      // Mouse click can freeze visualization in place
      if (mouseFlag) {
        curFreqInd = isFreq ? freqInd : 0;
        curTimeInd = timeInd;

        updateTimeSlider.call({
          value: tAx[curTimeInd],
          noUpdate: true,
        });
        updateFreqSlider.call({
          value: fAx[curFreqInd],
        });
      };
    }

    function rectMouseClick() {
      mouseFlag = !mouseFlag;
      if (!mouseFlag) {
        svgNetworkMap.append('text')
          .attr('x', networkWidth)
          .attr('y', networkHeight)
          .attr('text-anchor', 'end')
          .attr('id', 'HOLD')
          .text('HOLD');
        force.stop();
      } else {
        svgNetworkMap.select('text#HOLD').remove();
        force.start();
      }
    }

    function converterEngine(input) { // fn BLOB => Binary => Base64 ?
      var uInt8Array = new Uint8Array(input);
      var i = uInt8Array.length;
      var biStr = []; //new Array(i);
      while (i--) {
        biStr[i] = String.fromCharCode(uInt8Array[i]);
      }

      var base64 = window.btoa(biStr.join(''));
      return base64;
    };

    function getImageBase64(url, callback) {
      var xhr = new XMLHttpRequest(url);
      var img64;
      xhr.open('GET', url, true); // url is the url of a PNG/JPG image.
      xhr.responseType = 'arraybuffer';
      xhr.callback = callback;
      xhr.onload = function() {
        img64 = converterEngine(this.response); // convert BLOB to base64
        this.callback(null, img64); // callback : err, data
      };

      xhr.onerror = function() {
        callback('B64 ERROR', null);
      };

      xhr.send();
    };

    function copyObject(obj) {
      var newObj = {};
      for (var key in obj) {
        // Copy all the fields
        newObj[key] = obj[key];
      }

      return newObj;
    }
  }
})();
