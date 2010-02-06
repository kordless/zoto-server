<?
require_once "magpierss-0.72/rss_fetch.inc";
require_once "magpierss-0.72/rss_utils.inc";

if(!$_GET['username']){
	$username = 'community';
} else {
	$username = $_GET['username'];
}
if($_GET['search']){
	$ssq = "SSQ." . $_GET['search'];
}
if($_GET['album']){
	$ssq = "ALB." . $_GET['album'];
}
if(!$_GET['key']){
	$_GET['key'] = "00000";
}
if(!$_GET['num_items']){
	$num_items = 10;
}else{
	$num_items = $_GET['num_items'];
}

$feed = "http://www.zoto.com/" . $username . "/feeds/rss/" . $ssq;
$rss = fetch_rss($feed);

if($rss){
	$items = array_slice($rss->items, 0, $num_items);
	$image_string = 'var images_'.$_GET['key'].' = new Array(';
	$link_string = 'var links_'.$_GET['key'].' = new Array(';
	foreach ( $items as $item ) {
		$matches = Array();
		preg_match("/img\/[0-9x]+\/([a-z0-9\-]+)\.jpg/", $item['description'], $matches);
		$image_string .= ' "' . $matches[1] . '",'; 
		$item['link'] = preg_replace("/http:\/\/([a-z][-a-z0-9]+)".BASE_URI."\/user\/image_detail/", "http://www".BASE_URI."/user/\\1/image_detail", $item['link']);
		$link_string .= ' "' . $item['link'] . '",';
	}
	$image_string = preg_replace("/,$/", "", $image_string);
	$link_string = preg_replace("/,$/", "", $link_string);
	print $image_string . '); ';
	print $link_string . '); ';
} else {
	echo magpie_error();
}
?>
