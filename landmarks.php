<?php

header('Cache-control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

function haversineDistance($lat1, $lng1, $lat2, $lng2)
{
  $earth_radius = 6371000; // meters
  $d_lat = deg2rad($lat2 - $lat1);
  $d_lng = deg2rad($lng2 - $lng1);
  $lat1 = deg2rad($lat1);
  $lat2 = deg2rad($lat2);

  $a = sin($d_lat/2) * sin($d_lat/2) + sin($d_lng/2) * sin($d_lng/2) * cos($lat1) * cos($lat2);
  $c = 2 * atan2(sqrt($a), sqrt(1-$a));

  $distance = $earth_radius * $c;

  return $distance;
}

function landmarksList($center_lat, $center_lng, $distance_limit, $excludes = array())
{ 

  include_once('../../db_connect.php');

  $landmarks = array();

  $select_landmarks = $db->query("SELECT * FROM landmarks");
  foreach ( $select_landmarks->fetchAll() as $landmark )
  {
    $landmarks[ $landmark['id'] ] = 
      array('name' => $landmark['name'],
            'type' => $landmark['type'],
            'ele'  => $landmark['elevation'],
            'hgt'  => $landmark['height'],
            'nds'  => array());
  }

  $select_nodes = $db->query("SELECT * FROM landmark_nodes");
  foreach ( $select_nodes->fetchAll() as $node )
  {
    array_push(
      $landmarks[ $node['landmark'] ]['nds'],
      array('id'   => $node['id'],
            'lm' => $node['landmark'],
            'lat'  => $node['lat'],
            'lng'  => $node['lng']));
  }
  
  // Remove landmarks that are out of range or have been specifically excluded
  foreach ( $landmarks as $id => $landmark )
  {
    $in_range = false;
    foreach ( $landmark['nds'] as $node )
    {
      if ( haversineDistance($node['lat'], $node['lng'], $center_lat, $center_lng) < $distance_limit )
      {
        $in_range = true;
        break;
      }
    }
    if ( ! $in_range || in_array($id, $excludes) )
      unset($landmarks[$id]);  
  }

  return $landmarks;
}

// Set default values for coordinate and distance limit if none are given
$center_lat = ( ! isset($_GET['lat']) || ! is_numeric($_GET['lat']) ) ? 0 : $_GET['lat'];
$center_lng = ( ! isset($_GET['lng']) || ! is_numeric($_GET['lng']) ) ? 0 : $_GET['lng'];
$distance_limit = ( ! isset($_GET['d']) || ! is_numeric($_GET['d']) ) ? INF : $_GET['d'];

if ( isset($_GET['exclude']) )
  echo json_encode(landmarksList($center_lat,$center_lng,$distance_limit,explode(',',$_GET['exclude'])));
else
  echo json_encode(landmarksList($center_lat,$center_lng,$distance_limit));

