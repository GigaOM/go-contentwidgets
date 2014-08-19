<?php

class GO_Content_Widgets_Admin
{
	/**
	 * constructor
	 */
	public function __construct()
	{
		add_action( 'current_screen', array( $this, 'current_screen' ) );
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
	public function current_screen()
	{
		$screen = get_current_screen();

		$this->register_resources();

		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );
	}//end current_screen

	/**
	 * hooked to the admin_enqueue_scripts action
	 */
	public function admin_enqueue_scripts()
	{
		wp_enqueue_script( go_content_widgets()->id_base . '-admin' );
	}//end admin_enqueue_scripts
}//end class
