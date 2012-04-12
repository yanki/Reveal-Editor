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

function buildingsList($center_lat, $center_lng, $distance_limit)
{ 

  include_once('db_connect.php');

  $buildings = array();

  $select_buildings = $db->query("SELECT * FROM buildings");
  foreach ( $select_buildings->fetchAll() as $building )
  {
    $buildings[ $building['id'] ] = 
      array('name' => $building['name'],
            'type' => $building['type'],
            'ele'  => $building['elevation'],
            'hgt'  => $building['height'],
            'nds'  => array());
  }

  $select_nodes = $db->query("SELECT * FROM building_nodes");
  foreach ( $select_nodes->fetchAll() as $node )
  {
    array_push(
      $buildings[ $node['building'] ]['nds'],
      array('id'   => $node['id'],
            'bldg' => $node['building'],
            'lat'  => $node['lat'],
            'lng'  => $node['lng']));
  }
  
  // Remove buildings that are out of range
  foreach ( $buildings as $id => $building )
  {
    $in_range = false;
    foreach ( $building['nds'] as $node )
    {
      if ( haversineDistance($node['lat'], $node['lng'], $center_lat, $center_lng) < $distance_limit )
      {
        $in_range = true;
        break;
      }
    }
    if ( ! $in_range )
      unset($buildings[$id]);  
  }

  return $buildings;
}

// Set default values for coordinate and distance limit if none are given
$center_lat = ( ! isset($_GET['lat']) || ! is_numeric($_GET['lat']) ) ? 0 : $_GET['lat'];
$center_lng = ( ! isset($_GET['lng']) || ! is_numeric($_GET['lng']) ) ? 0 : $_GET['lng'];
$distance_limit = ( ! isset($_GET['d']) || ! is_numeric($_GET['d']) ) ? INF : $_GET['d'];

echo json_encode(buildingsList($center_lat,$center_lng,$distance_limit));

