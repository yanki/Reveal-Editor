<?php

/* Estimate landmark elevations by averaging the elevations of all their nodes
 * Node elevations are obtained from the Google Maps Elevation API
 * https://developers.google.com/maps/documentation/elevation/
 */

if ( php_sapi_name() != 'cli' )
{
  echo "This program is ended to be run from the command line.\n";
  die;
}

include('../../db_connect.php');

echo "Selecting landmarks/nodes without elevation data...\n";

// Get all landmarks that are missing elevation data
$landmarks_result = $db->query("SELECT * FROM landmarks WHERE elevation = 0");

$nodes_query = $db->prepare("SELECT * FROM landmark_nodes WHERE landmark = :landmark");

$queries = array();
$nodes = array();
$landmarks = array();

// Form Google Maps Elevation API queries for all selected landmarks
foreach ( $landmarks_result as $landmark )
{
  $landmarks[ $landmark['id'] ] = $landmark['name'];

  // Get all nodes for the current landmark
  $nodes_query->execute(array(':landmark' => $landmark['id']));
  foreach ( $nodes_query->fetchAll() as $node )
  {
    // Store the nodes this way so that the id can be easily determined from the result returned by the Google Maps Elevation API,
    // which only includes elevation and location for each point queried
    $nodes[ $landmark['id'] ][ $node['lat'].','.$node['lng'] ] = $node['id'];
  }
  // Form the query
  $queries[ $landmark['id'] ] = 'http://maps.googleapis.com/maps/api/elevation/json?locations=' . implode('|',array_keys($nodes[$landmark['id']])) . '&sensor=false';
}

echo "Done\n\n";

$update_elevation_query = $db->prepare('UPDATE landmarks SET elevation = :elevation WHERE id = :id');

// Execute those queries and average the elevations of all the landmark's nodes to get a single elevation for the landmark
foreach ( $queries as $landmark_id => $query )
{
  // Setup cURL request
  $curl = curl_init();
  curl_setopt($curl, CURLOPT_URL, $query); // set url for cURL
  curl_setopt($curl, CURLOPT_RETURNTRANSFER, true); // on success, return the result from curl_exec

  echo "Executing query for '" . $landmarks[$landmark_id] . "'...\n";
  
  // Execute cURL and convert result to associative array
  $result = curl_exec($curl);
  $result = json_decode($result,true);

  if ( $result['status'] == 'OK' )
  {
    $elevations = array();

    foreach ( $result['results'] as $node )
    {
      // Determine which node this is
      $location = $node['location']['lat'].','.$node['location']['lng'];
      $node_id = $nodes[ $landmark_id ][ $location ];

      $elevations[] = $node['elevation'];
    }

    // Average elevation for all nodes belonging to this landmark
    $average_elevation = array_sum($elevations) / count($elevations);

    $update_elevation_query->execute(array(':id' => $landmark_id, ':elevation' => $average_elevation));
    echo "Elevation set to " . $average_elevation . "\n\n";
    
  }
  else
  {
    echo "Query failed.\n\n";
  }

}

?>
