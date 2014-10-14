<?php

class GO_ContentWidgets
{
	public $id_base = 'go-contentwidgets';
	public $sidebar_id = 'go-contentwidgets-injections';
	private $admin;
	private $script_config;
	private $layout_preferences;

	/**
	 * constructor
	 */
	public function __construct()
	{
		add_action( 'init', array( $this, 'init' ) );
		add_action( 'after_setup_theme', array( $this, 'after_setup_theme' ) );

		if ( is_admin() )
		{
			$this->admin();
		}//end if
	}//end __construct

	/**
	 * hooked to the init action
	 */
	public function init()
	{
		wp_register_script(
			$this->id_base,
			plugins_url( 'js/lib/go-contentwidgets.js', __FILE__ ),
			array( 'jquery' ),
			$this->script_config( 'version' ),
			TRUE
		);

		// @todo this should only happen on `is_single`, but it was giving me trouble so I I'm moving on...
		add_action( 'wp_enqueue_scripts', array( $this, 'wp_enqueue_scripts' ) );
	}//end init

	/**
	 * hooked to the WordPress after_setup_theme action
	 */
	public function after_setup_theme()
	{
		register_sidebar( array(
			'name' => 'Content Widget Injections',
			'id' => $this->sidebar_id,
			'description' => 'This is the sidebar content area that will contain widgets to inject in the content.',
			'class' => 'sidebar-widget-area widget-area',
			'before_widget' => '<div id="%1$s" class="widget clearfix %2$s">',
			'after_widget' => '</div>',
			'before_title' => '<header class="widget-title">',
			'after_title' => '</header>',
		) );
	}//end after_setup_theme

	/**
	 * script config
	 */
	public function script_config( $key = NULL )
	{
		if ( ! $this->script_config )
		{
			$this->script_config = apply_filters( 'go_config', array( 'version' => 1 ), 'go-script-version' );
		}//end if

		if ( $key )
		{
			return isset( $this->script_config[ $key ] ) ? $this->script_config[ $key ] : NULL;
		}//end if

		return $this->script_config;
	}//end script_config

	/**
	 * admin object accessor method
	 */
	public function admin()
	{
		if ( ! $this->admin )
		{
			require_once __DIR__ . '/class-go-contentwidgets-admin.php';
			$this->admin = new GO_ContentWidgets_Admin;
		}//end if

		return $this->admin;
	}//end admin

	public function wp_enqueue_scripts()
	{
		$data = array(
			'layout_preferences' => $this->layout_preferences(),
		);
		wp_localize_script( $this->id_base, 'go_contentwidgets', $data );

		wp_enqueue_script( $this->id_base );
	}//end wp_enqueue_scripts

	/**
	 * returns the widget layout preferences for the site
	 */
	public function layout_preferences()
	{
		if ( ! $this->layout_preferences )
		{
			$this->layout_preferences = get_option( $this->id_base . '-layout-preferences', array() );
		}//end if

		return $this->layout_preferences;
	}//end layout_preferences
}//end class

function go_contentwidgets()
{
	global $go_contentwidgets;

	if ( ! $go_contentwidgets )
	{
		$go_contentwidgets = new GO_ContentWidgets;
	}//end if

	return $go_contentwidgets;
}//end go_contentwidgets
