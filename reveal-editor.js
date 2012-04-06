// Example of polygons
// http://gmaps-samples-v3.googlecode.com/svn/trunk/poly/poly_edit.html

var map;
var markers = [];
var path = [];
var polygon = [];

var addNode = function(node)
{
  var marker = new google.maps.Marker({
    position : new google.maps.LatLng(node['lat'],node['lng']),
    map      : map
  });

  markers[node['bldg']].push(marker);

  path[node['bldg']].push(marker.getPosition());
}

var initMarkers = function()
{
  console.log('Retrieving buildings...');
  $.get('get_buildings.php', function( buildings )
  {
    console.log(buildings);

    Object.keys(buildings).forEach(function(bldgId)
    {
      markers[bldgId] = [];
      path[bldgId] = new google.maps.MVCArray;

      var building = buildings[bldgId];
      console.log(building);
      Object.keys(building['nds']).forEach(function(nodeId)
      {
        var node = building['nds'][nodeId];
        console.log(node['lat'] + ',' + node['lng']);
        addNode(node);
      });

      polygon[bldgId] = new google.maps.Polygon({
        strokeWeight : 2,
        fillColor    : '#ff0000'
      });
      polygon[bldgId].setPaths(new google.maps.MVCArray([ path[bldgId] ]));
      polygon[bldgId].setMap(map);
        
    });
  });
}

$(document).ready(function()
{
  /*var baseIcon = new google.maps.MarkerImage(
    'red-dot.png',
    new google.maps.Size(12,12),
    new google.maps.Point(0,0),
    new google.maps.Point(6,6)
  );*/

  var centerPoint = new google.maps.LatLng(34.67700, -82.83655);

  var options = {
    zoom: 18,
    center: centerPoint,
    draggableCursor: 'default',
    mapTypeId: google.maps.MapTypeId.HYBRID
  };

  map = new google.maps.Map($('#map-canvas').get(0), options);

  initMarkers();
});

