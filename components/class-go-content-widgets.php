<?php

class GO_Content_Widgets
{
	public function __construct()
	{
		add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_scripts' ) );
	}//end __construct

	public function wp_enqueue_scripts()
	{
		$script_config = apply_filters( 'go_config', array( 'version' => 1 ), 'go-script-version' );
		wp_register_script( 'go-content-widgets', plugins_url( 'js/go-content-widgets.js', __FILE__ ), array(), $script_config['version'], TRUE );
		wp_enqueue_script( 'go-content-widgets' );
	}//end wp_enqueue_scripts
}//end class

function go_content_widgets()
{
	global $go_content_widgets;

	if ( $go_content_widgets )
	{
		$go_content_widgets = new GO_Content_Widgets;
	}//end if

	return $go_content_widgets;
}//end go_content_widgets
