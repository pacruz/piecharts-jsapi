import Map = require('esri/Map');
import MapView = require('esri/views/MapView');
import FeatureLayer = require('esri/layers/FeatureLayer');
import FeatureLayerView = require('esri/views/layers/FeatureLayerView');
import watchUtils = require('esri/core/watchUtils');
import { Chart } from 'chart.js';

// Initialization of the Feature layer, and definition of what should be visible in the pop-up
let points = new FeatureLayer({
  url:
    'https://services.arcgis.com/gaVYtevi9moVMgCz/arcgis/rest/services/PieChartPoints_View/FeatureServer/0',
  outFields: ['class', 'num_a', 'num_b', 'num_c'],
  popupTemplate: {
    title: 'Sample of Pie Chart pop-up',
    content: [
      {
        type: 'fields',
        fieldInfos: [
          {
            fieldName: 'num_a',
            label: 'Number of A',
            visible: true
          },
          {
            fieldName: 'num_b',
            label: 'Number of B',
            visible: true
          },
          {
            fieldName: 'num_c',
            label: 'Number of C',
            visible: true
          }
        ]
      },
      {
        type: 'media',
        mediaInfos: [
          {
            title: 'Count by type of category',
            type: 'pie-chart',
            caption: '',
            value: {
              fields: ['num_a', 'num_b', 'num_c'],
              normalizeField: null
            }
          }
        ]
      }
    ]
  }
});

let map = new Map({
  basemap: 'gray',
  layers: [points]
});

let view = new MapView({
  container: 'viewDiv',
  map: map,
  zoom: 13,
  center: {
    spatialReference: { wkid: 4326 },
    x: -120.3667670883747,
    y: 37.757109556035545
  },
  popup: {
    dockEnabled: true,
    dockOptions: {
      buttonEnabled: false,
      breakpoint: false
    }
  }
});

// basic example of chart.js as external charting capability.  Can be swapped out for something else.
let chartCanvas = document.createElement('canvas');
chartCanvas.className = 'chart__container';
let chartConfig = {
  type: 'pie',
  options: {
    responsive: true,
    title: {
      display: true,
      text: 'Based on current map extent'
    }
  },
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [
      {
        label: 'Number of Each Item',
        data: [],
        backgroundColor: [
          'rgba(255,0,0,0.2)',
          'rgba(0,255,0,0.2)',
          'rgba(0,0,255,0.2)'
        ],
        borderColor: [
          'rgba(255,255,255,1)',
          'rgba(255,255,255,1)',
          'rgba(255,255,255,1)'
        ],
        borderWidth: 1
      }
    ]
  }
};

let chart = new Chart(chartCanvas, chartConfig);

// Watching for map extent changes, but waiting until map is stationary (after user stops moving)
// Then update chart based on currently visible features.
let updateChart = function() {
  view.whenLayerView(points).then((layerView: FeatureLayerView) => {
    watchUtils.whenFalseOnce(layerView, 'updating', function(val) {
      layerView
        .queryFeatures({
          geometry: view.extent,
          returnGeometry: false,
          outFields: ['*']
        })
        .then(results => {
          let features = results.features;
          var a = 0;
          let b = 0;
          let c = 0;

          for (var i = 0; i < features.length; i++) {
            let result = features[i];
            a += result.attributes['num_a'];
            b += result.attributes['num_b'];
            c += result.attributes['num_c'];
          }

          chart.data.datasets.forEach(dataset => {
            dataset.data = [];
            dataset.data.push(a);
            dataset.data.push(b);
            dataset.data.push(c);
          });
          chart.update();
        });
    });
  });
};

watchUtils.whenTrue(view, 'stationary', () => {
  if (view.extent) {
    updateChart();
  }
});

let chartContainer = document.createElement('div');
chartContainer.className = 'chart__container';
chartContainer.appendChild(chartCanvas);
view.ui.add(chartContainer, 'bottom-right');
