if ( 'undefined' === typeof go_content_widgets_admin ) {
	var go_content_widgets_admin = {
		// @TODO: set this via wp_localize_script
		sidebar_id: 'gigaom-single-sidebar'
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
			var $fields = $(
				'<div class="go-content-widgets-fields">' +
					'<p>' +
						'<label for="go-content-widgets_' + $widget.attr( 'id' ) + '">' +
							'Placement preference:' +
						'</label>' +
						'<select name="go-content-widgets[' + $widget.attr('id') +']" id="go-content-widgets_' + $widget.attr( 'id' ) + '">' +
							'<option value="any">No preference</option>' +
							'<option value="full">Full width</option>' +
							'<option value="left">Left</option>' +
							'<option value="right">Right</option>' +
						'</select>' +
					'</p>' +
				'</div>'
			);

			// @TODO: apply current widget settings

			$widget.find( '.widget-content' ).append( $fields );
		});
	};

	$( function() {
		go_content_widgets_admin.init();
	});
})( jQuery );
