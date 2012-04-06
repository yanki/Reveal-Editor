<?php

header('Cache-control: no-cache, must-revalidate');
header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
header('Content-type: application/json');

function buildingsList()
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

  return $buildings;
}

echo json_encode(buildingsList());

