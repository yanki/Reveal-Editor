// Example of polygons
// http://gmaps-samples-v3.googlecode.com/svn/trunk/poly/poly_edit.html

var map;
var markers = [];
var path = [];
var polygon = [];

var deleteNode = function(building, index)
{
  marker = markers[building][index];
  if ( confirm('Delete marker #' + marker.bldg + '?') ) {
    marker.setMap(null);
    path[marker.bldg].removeAt(index);
    markers[marker.bldg].splice(index, 1);
  }
}

var addNode = function(node)
{
  var marker = new google.maps.Marker({
    position  : new google.maps.LatLng(node['lat'],node['lng']),
    draggable : true,
    map       : map
  });

  marker.bldg = node['bldg'];

  markers[marker.bldg].push(marker);
  path[marker.bldg].push(marker.getPosition());

  google.maps.event.addListener(marker, 'click', function()
  {
    for ( var i = 0, n = markers[marker.bldg].length; i < n && markers[marker.bldg][i] != marker; ++i );

    var contentString = 
      '<p>Marker #' + marker.bldg + '</p>' +
      '<p>' + marker.getPosition() + '</p>' +
      '<p><button onClick="deleteNode(' + marker.bldg + ',' + i + ')">Delete</button></p>';

    var infoWindow = new google.maps.InfoWindow({
      content: contentString
    });

    infoWindow.open(map, marker);
  });

  google.maps.event.addListener(marker, 'dragend', function()
  {
    for ( var i = 0, n = markers[marker.bldg].length; i < n && markers[marker.bldg][i] != marker; ++i );
    path[marker.bldg].setAt(i, marker.getPosition());
  });

}

var initMarkers = function(buildings)
{
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

  console.log('Fetching buildings list...');
  $.ajax({
    url     :'get_buildings.php',
    success : function(buildings)
              {
                initMarkers(buildings);
                console.log('Done');
              },
    error   : function(jqXHR, textStatus, errorThrown)
              {
                alert('Error fetching buildings list');
                console.log('Error: ' + errorThrown);
              },
  });
});

