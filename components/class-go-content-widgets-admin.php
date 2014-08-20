<?php

class GO_Content_Widgets_Admin
{
	/**
	 * constructor
	 */
	public function __construct()
	{
		add_action( 'current_screen', array( $this, 'current_screen' ) );
		add_action( 'sidebar_admin_setup', array( $this, 'sidebar_admin_setup' ) );
	}//end __construct

	/**
	 * registers script and style resources
	 */
	private function register_resources()
	{
		wp_register_script(
			go_content_widgets()->id_base . '-admin',
			plugins_url( 'js/lib/go-content-widgets-admin.js', __FILE__ ),
			array( 'jquery' ),
			go_content_widgets()->script_config( 'version' ),
			TRUE
		);
	}//end register_resources

	/**
	 * hooked to the current_screen action
	 */
	public function current_screen( $screen )
	{
		$this->register_resources();

		if ( 'widgets' != $screen->base )
		{
			return;
		}//end if

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
	}//end current_screen

	/**
	 * hooked to the admin_enqueue_scripts action
	 */
	public function admin_enqueue_scripts()
	{
		$data = array(
			'sidebar_id' => 'gigaom-single-sidebar',
			'layout_preferences' => get_option( go_content_widgets()->id_base . '-layout-preferences' ),
		);

		wp_localize_script( go_content_widgets()->id_base . '-admin', 'go_content_widgets_admin', $data );
		wp_enqueue_script( go_content_widgets()->id_base . '-admin' );
	}//end admin_enqueue_scripts

	/**
	 * hook to sidebar_admin_setup to capture go-content-widgets vars posted to the ajax end point
	 */
	public function sidebar_admin_setup()
	{
		global $sidebars_widgets;

		if (
			empty( $_POST['go-content-widgets'] )
			|| ! is_array( $_POST['go-content-widgets'] )
			|| empty( $_POST['sidebar'] )
		)
		{
			return;
		}//end if

		$sidebar = $_POST['sidebar'];

		$widget_preferences = go_content_widgets()->layout_preferences();

		// add new/updated preferences to the widget preferences
		foreach ( $_POST['go-content-widgets'] as $key => $preference )
		{
			$key = preg_replace( '/^widget(-[0-9]*)?_/', '', $key );
			$widget_preferences[ $key ] = $preference;
		}//end foreach

		// get rid of elements that don't exist in the sidebar anymore
		foreach ( $widget_preferences as $widget => $preference )
		{
			if ( ! in_array( $widget, $sidebars_widgets[ $sidebar ] ) && ! in_array( $widget, $_POST['go-content-widgets'] ) )
			{
				unset( $widget_preferences[ $widget ] );
			}//end if
		}//end foreach

		update_option( go_content_widgets()->id_base . '-layout-preferences', $widget_preferences );

		unset( $_POST['go-content-widgets'] );
	}//end sidebar_admin_setup
}//end class
