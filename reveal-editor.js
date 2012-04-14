// Example of polygons
// http://gmaps-samples-v3.googlecode.com/svn/trunk/poly/poly_edit.html

var map;
var markers = [];
var path = [];
var polygon = [];

var deleteNode = function(landmark, index)
{
  marker = markers[landmark][index];
  if ( confirm('Delete marker #' + marker.landmark + '?') ) {
    marker.setMap(null);
    path[marker.landmark].removeAt(index);
    markers[marker.landmark].splice(index, 1);
  }
}

var addNode = function(node)
{
  var marker = new google.maps.Marker({
    position  : new google.maps.LatLng(node['lat'],node['lng']),
    draggable : true,
    map       : map
  });

  marker.landmark = node['lm'];

  markers[marker.landmark].push(marker);
  path[marker.landmark].push(marker.getPosition());

  google.maps.event.addListener(marker, 'click', function()
  {
    for ( var i = 0, n = markers[marker.landmark].length; i < n && markers[marker.landmark][i] != marker; ++i );

    var contentString = 
      '<p>Marker #' + marker.landmark + '</p>' +
      '<p>' + marker.getPosition() + '</p>' +
      '<p><button onClick="deleteNode(' + marker.landmark + ',' + i + ')">Delete</button></p>';

    var infoWindow = new google.maps.InfoWindow({
      content: contentString
    });

    infoWindow.open(map, marker);
  });

  google.maps.event.addListener(marker, 'dragend', function()
  {
    for ( var i = 0, n = markers[marker.landmark].length; i < n && markers[marker.landmark][i] != marker; ++i );
    path[marker.landmark].setAt(i, marker.getPosition());
  });

}

var initMarkers = function(landmarks)
{
  Object.keys(landmarks).forEach(function(landmarkId)
  {
    markers[landmarkId] = [];
    path[landmarkId] = new google.maps.MVCArray;

    var landmark = landmarks[landmarkId];
    Object.keys(landmark['nds']).forEach(function(nodeId)
    {
      var node = landmark['nds'][nodeId];
      addNode(node);
    });

    polygon[landmarkId] = new google.maps.Polygon({
      strokeWeight : 2,
      fillColor    : '#ff0000'
    });
    polygon[landmarkId].setPaths(new google.maps.MVCArray([ path[landmarkId] ]));
    polygon[landmarkId].setMap(map);
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

  console.log('Fetching landmarks...');
  $.ajax({
    url     :'landmarks.php',
    success : function(landmarks)
              {
                initMarkers(landmarks);
                console.log('Done');
              },
    error   : function(jqXHR, textStatus, errorThrown)
              {
                alert('Error fetching landmarks list');
                console.log('Error: ' + errorThrown);
              },
  });
});

