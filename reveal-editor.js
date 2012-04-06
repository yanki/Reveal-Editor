// Example of polygons
// http://gmaps-samples-v3.googlecode.com/svn/trunk/poly/poly_edit.html

var map;
var markers = [];
var path = [];
var polygon = [];

var addNode = function(node)
{
  var marker = new google.maps.Marker({
    position  : new google.maps.LatLng(node['lat'],node['lng']),
    draggable : true,
    map       : map
  });

  var buildingId = node['bldg'];

  marker.bldg = buildingId;

  markers[buildingId].push(marker);

  path[buildingId].push(marker.getPosition());

  google.maps.event.addListener(marker, 'click', function()
  {
    marker.setMap(null);
    for ( var i = 0, n = markers[marker.bldg].length; i < n && markers[marker.bldg][i] != marker; ++i );
    path[marker.bldg].removeAt(i);
    markers[marker.bldg].splice(i, 1);
  });

  google.maps.event.addListener(marker, 'dragend', function()
  {
    for ( var i = 0, n = markers[marker.bldg].length; i < n && markers[marker.bldg][i] != marker; ++i );
    path[marker.bldg].setAt(i, marker.getPosition());
  });

}

var initMarkers = function()
{
  console.log('Retrieving buildings...');
  //$.get('get_buildings.php', function( buildings )
  $.ajax({
    url: 'get_buildings.php',
    success: function(buildings) {
      Object.keys(buildings).forEach(function(bldgId)
      {
        markers[bldgId] = [];
        path[bldgId] = new google.maps.MVCArray;

        var building = buildings[bldgId];
        Object.keys(building['nds']).forEach(function(nodeId)
        {
          var node = building['nds'][nodeId];
          addNode(node);
        });

        polygon[bldgId] = new google.maps.Polygon({
          strokeWeight : 2,
          fillColor    : '#ff0000'
        });
        polygon[bldgId].setPaths(new google.maps.MVCArray([ path[bldgId] ]));
        polygon[bldgId].setMap(map);
      });
      console.log('Done');
    },
    error: function(jqXHR, textStatus, errorThrown) {
      alert('Error: ' + errorThrown);
    }
  });
}

$(document).ready(function()
{
  var centerPoint = new google.maps.LatLng(34.67700, -82.83655);

  var options = {
    zoom: 18,
    center: centerPoint,
    draggableCursor: 'default',
    mapTypeId: google.maps.MapTypeId.HYBRID
  };

  map = new google.maps.Map(document.getElementById('map-canvas'), options);

  initMarkers();
});

