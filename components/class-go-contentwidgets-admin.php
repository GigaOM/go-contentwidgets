<?php

class GO_ContentWidgets_Admin
{
	public $id_base = 'go-contentwidgets';

	/**
	 * constructor
	 */
	public function __construct()
	{
		add_action( 'admin_init', array( $this, 'admin_init' ) );
		add_action( 'sidebar_admin_setup', array( $this, 'sidebar_admin_setup' ) );
		add_action( 'go_waterfall_options_meta_box', array( $this, 'go_waterfall_options_meta_box' ) );
		add_action( 'save_post', array( $this, 'save_post' ) );
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
		$js_min = ( defined( 'GO_DEV' ) && GO_DEV ) ? 'lib' : 'min';

		wp_register_script(
			go_contentwidgets()->id_base . '-admin',
			plugins_url( 'js/' . $js_min . '/go-contentwidgets-admin.js', __FILE__ ),
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
		if ( 'widgets.php' !== $current_page && 'post.php' !== $current_page )
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

	/**
	 * meta box for controlling injectable units
	 */
	public function go_waterfall_options_meta_box( $post )
	{
		global $post;

		$post_meta = get_post_meta( $post->ID, 'go-contentwidgets', TRUE );

		$suppress = array(
			'suppress-house-ctas' => 'Suppress house CTAs',
			'suppress-ads' => 'Suppress ads (this removes ads from the whole page!)',
		);

		wp_nonce_field( 'go-contentwidgets-save', '_go_contentwidgets_save_nonce' );

		?>
		<h4 id="go-contentwidgets-injections">Content injections</h4>
		<?php

		foreach ( $suppress as $item => $label )
		{
			if ( ! isset( $post_meta[ $item ] ) )
			{
				$post_meta[ $item ] = FALSE;
			}//end if

			$style = '';
			if ( 'suppress-ads' == $item && ! $post_meta[ $item ] )
			{
				$style = 'display: none;';
			}//end if

			?>
			<p id="go-contentwidgets-<?php echo esc_attr( $item ); ?>-container" style="<?php echo esc_attr( $style ); ?>">
				<label for="<?php echo esc_attr( $this->get_field_id( $item ) ); ?>">
					<input type="checkbox" name="<?php echo esc_attr( $this->get_field_name( $item ) ); ?>" id="<?php echo esc_attr( $this->get_field_id( $item ) ); ?>" value="1" <?php checked( TRUE, $post_meta[ $item ] ); ?>/>
					<?php echo esc_html( $label ); ?>
				</label>
			</p>
			<?php
		}//end foreach
	} // END go_waterfall_options_meta_box

	/**
	 * Helper function for generating consistent field names
	 *
	 * @param $name string slug name for the field
	 */
	private function get_field_name( $name )
	{
		return "{$this->id_base}[{$name}]";
	}// end get_field_name

	/**
	 * Helper function for generating consistent field ids
	 *
	 * @param $name string slug name for the field
	 */
	private function get_field_id( $name )
	{
		return $this->id_base . '-' . $name;
	}// end get_field_id

	/**
	 * hooked to the save_post action
	 */
	public function save_post( $post_id )
	{
		if ( ! isset( $_POST['_go_contentwidgets_save_nonce'] ) || ! wp_verify_nonce( $_POST['_go_contentwidgets_save_nonce'], 'go-contentwidgets-save' ) )
		{
			return;
		}//end if

		$post = get_post( $post_id );

		// Check that this isn't an autosave
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE )
		{
			return;
		}//end if

		// Check post type
		if ( 'post' != $post->post_type )
		{
			return;
		}//end if

		// Don't run on post revisions (almost always happens just before the real post is saved)
		if ( wp_is_post_revision( $post->ID ) )
		{
			return;
		}//end if

		// Check the permissions
		if ( ! current_user_can( 'edit_post', $post->ID  ) )
		{
			return;
		}//end if

		$this->update_post_meta( $post->ID, $_POST );
	}// end save_post

	/**
	 * handles the updating of post meta
	 */
	public function update_post_meta( $post_id, $post_data )
	{
		$save_meta = array(
			'suppress-house-ctas' => FALSE,
			'suppress-ads' => FALSE,
		);

		foreach ( $save_meta as $item => $default )
		{
			if ( isset( $post_data[ $this->id_base ][ $item ] ) )
			{
				$save_meta[ $item ] = $post_data[ $this->id_base ][ $item ] ? TRUE : FALSE;
			}//end if
		}//end foreach

		update_post_meta( $post_id, 'go-contentwidgets', $save_meta );
	}// end update_post_meta
}//end class
