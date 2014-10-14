<?php

class GO_ContentWidgets_Admin
{
	/**
	 * constructor
	 */
	public function __construct()
	{
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'sidebar_admin_setup', array( $this, 'sidebar_admin_setup' ) );
	}//end __construct

	/**
	 * hooked to WordPress admin_init action
	 */
	public function admin_init()
	{
		$this->register_resources();

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
	}// end admin_init

	/**
	 * registers script and style resources
	 */
	private function register_resources()
	{
		wp_register_script(
			go_contentwidgets()->id_base . '-admin',
			plugins_url( 'js/lib/go-contentwidgets-admin.js', __FILE__ ),
			array( 'jquery' ),
			go_contentwidgets()->script_config( 'version' ),
			TRUE
		);
	}//end register_resources

	/**
	 * hooked to the admin_enqueue_scripts action
	 */
	public function admin_enqueue_scripts( $current_page )
	{
		if ( 'widgets.php' !== $current_page )
		{
			return;
		}//end if

		$data = array(
			'sidebar_id' => go_contentwidgets()->sidebar_id,
			'layout_preferences' => get_option( go_contentwidgets()->id_base . '-layout-preferences' ),
		);

		wp_localize_script( go_contentwidgets()->id_base . '-admin', 'go_contentwidgets_admin', $data );
		wp_enqueue_script( go_contentwidgets()->id_base . '-admin' );
	}//end admin_enqueue_scripts

	/**
	 * hook to sidebar_admin_setup to capture go-contentwidgets vars posted to the ajax end point
	 */
	public function sidebar_admin_setup()
	{
		global $sidebars_widgets;

		if (
			empty( $_POST['go-contentwidgets'] )
			|| ! is_array( $_POST['go-contentwidgets'] )
			|| empty( $_POST['sidebar'] )
		)
		{
			return;
		}//end if

		$sidebar = $_POST['sidebar'];

		$widget_preferences = go_contentwidgets()->layout_preferences();

		// add new/updated preferences to the widget preferences
		foreach ( $_POST['go-contentwidgets'] as $key => $preference )
		{
			$key = preg_replace( '/^widget(-[0-9]*)?_/', '', $key );
			$widget_preferences[ $key ] = $preference;
		}//end foreach

		// get rid of elements that don't exist in the sidebar anymore
		foreach ( $widget_preferences as $widget => $preference )
		{
			if ( ! in_array( $widget, $sidebars_widgets[ $sidebar ] ) && ! in_array( $widget, $_POST['go-contentwidgets'] ) )
			{
				unset( $widget_preferences[ $widget ] );
			}//end if
		}//end foreach

		update_option( go_contentwidgets()->id_base . '-layout-preferences', $widget_preferences );

		unset( $_POST['go-contentwidgets'] );
	}//end sidebar_admin_setup
}//end class
