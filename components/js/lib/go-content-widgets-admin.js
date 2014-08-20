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

		// when preferences are changed, save them in the local preference object
		$( document ).on( 'change', '.go-content-widgets-fields .layout-preference', function() {
			var $el = $( this );
			var $widget = $el.closest( '.widget' );

			if ( 'undefined' === typeof go_content_widgets_admin.layout_preferences[ $widget.attr( 'id' ) ] ) {
				go_content_widgets_admin.layout_preferences[ $widget.attr( 'id' ) ] = {};
			}//end if

			if ( $el.is( '.location' ) ) {
				go_content_widgets_admin.layout_preferences[ $widget.attr( 'id' ) ].location = $el.val();
			} else {
				go_content_widgets_admin.layout_preferences[ $widget.attr( 'id' ) ].direction = $el.val();
			}//end else
		});

		// watch all ajax completions and if it is a completion of "save-widget", refresh the fields.
		$( document ).ajaxComplete( function( event, jqxhr, ajax_options ) {
			var data = decodeURIComponent( ajax_options.data );
			if ( ! data.match( /\&action\=save\-widget\&/ ) ) {
				return;
			}

			go_content_widgets_admin.refresh_fields();
		});
	};

	/**
	 * clears out content widget preference fields from DOM and re-adds them
	 */
	go_content_widgets_admin.refresh_fields = function() {
		this.$sidebar.find( '.go-content-widgets-fields' ).remove();
		this.inject_fields();
	};

	/**
	 * injects preference select box and auto-selects the current preference for the widget
	 */
	go_content_widgets_admin.inject_fields = function() {
		this.$sidebar.find( '.widget' ).each( function() {
			var $widget = $( this );
			var widget_id = $widget.attr( 'id' );
			var $fields = $(
				'<div class="go-content-widgets-fields">' +
					'<p>' +
						'<label for="go-content-widgets_' + widget_id + '_location">' +
							'Horizontal placement preference:' +
						'</label>' +
						'<select class="layout-preference location widefat" name="go-content-widgets[' + widget_id +'][location]" id="go-content-widgets_' + widget_id + '_location">' +
							'<option value="any">No preference</option>' +
							'<option value="full">Full width</option>' +
							'<option value="left">Left</option>' +
							'<option value="right">Right</option>' +
						'</select>' +
					'</p>' +
					'<p>' +
						'<label for="go-content-widgets_' + widget_id + '_direction">' +
							'Insert from the ' +
						'</label>' +
						'<select class="layout-preference direction widefat" name="go-content-widgets[' + widget_id +'][direction]" id="go-content-widgets_' + widget_id + '_direction">' +
							'<option value="">top</option>' +
							'<option value="bottom">bottom</option>' +
						'</select>' +
					'</p>' +
				'</div>'
			);

			if ( 'undefined' !== typeof go_content_widgets_admin.layout_preferences[ widget_id ] ) {
				if ( 'undefined' !== typeof go_content_widgets_admin.layout_preferences[ widget_id ].location ) {
					$fields.find( '.layout-preference.location' ).val( go_content_widgets_admin.layout_preferences[ widget_id ].location );
				}//end if

				if ( 'undefined' !== typeof go_content_widgets_admin.layout_preferences[ widget_id ].direction ) {
					$fields.find( '.layout-preference.direction' ).val( go_content_widgets_admin.layout_preferences[ widget_id ].direction );
				}//end if
			}//end if

			$widget.find( '.widget-content' ).append( $fields );
		});
	};

	$( function() {
		go_content_widgets_admin.init();
	});
})( jQuery );
