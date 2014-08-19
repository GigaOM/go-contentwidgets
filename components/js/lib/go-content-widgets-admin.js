if ( 'undefined' === typeof go_content_widgets_admin ) {
	var go_content_widgets_admin = {
		// this ultimately gets set via wp_localize_script, set it to a dummy value as a default
		sidebar_id: 'this-should-be-set-via-wp-localize-script',
		layout_preferences: {}
	};
}//end if

( function( $ ) {
	'use strict';

	/**
	 * initialize all the things
	 */
	go_content_widgets_admin.init = function() {
		this.$sidebar = $( '#' + this.sidebar_id );
		this.inject_fields();
	};

	go_content_widgets_admin.inject_fields = function() {
		this.$sidebar.find( '.widget' ).each( function() {
			var $widget = $( this );
			var widget_id = $widget.attr( 'id' );
			var $fields = $(
				'<div class="go-content-widgets-fields">' +
					'<p>' +
						'<label for="go-content-widgets_' + widget_id + '">' +
							'Placement preference:' +
						'</label>' +
						'<select class="layout-preference widefat" name="go-content-widgets[' + widget_id +']" id="go-content-widgets_' + widget_id + '">' +
							'<option value="any">No preference</option>' +
							'<option value="full">Full width</option>' +
							'<option value="left">Left</option>' +
							'<option value="right">Right</option>' +
						'</select>' +
					'</p>' +
				'</div>'
			);

			if ( 'undefined' !== typeof go_content_widgets_admin.layout_preferences[ widget_id ] ) {
				$fields.find( '.layout-preference' ).val( go_content_widgets_admin.layout_preferences[ widget_id ] );
			}//end if

			$widget.find( '.widget-content' ).append( $fields );
		});
	};

	$( function() {
		go_content_widgets_admin.init();
	});
})( jQuery );
