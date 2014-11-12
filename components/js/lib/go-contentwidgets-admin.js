if ( 'undefined' === typeof go_contentwidgets_admin ) {
	var go_contentwidgets_admin = {
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
	go_contentwidgets_admin.init = function() {
		this.$sidebar = $( '#' + this.sidebar_id );
		this.inject_fields();

		// when preferences are changed, save them in the local preference object
		$( document ).on( 'change', '.go-contentwidgets-fields .layout-preference', function() {
			go_contentwidgets_admin.update_local_preferences( $( this ) );
		});

		// watch all ajax completions and if it is a completion of "save-widget", refresh the fields.
		$( document ).ajaxComplete( function( event, jqxhr, ajax_options ) {
			var data = decodeURIComponent( ajax_options.data );
			if ( ! data.match( /\&action\=save\-widget\&/ ) ) {
				return;
			}

			go_contentwidgets_admin.refresh_fields();
		});

		$( '#go-contentwidgets-injections' ).dblclick( function() {
			$( '#go-contentwidgets-suppress-ads-container' ).fadeIn( 'slow' );
		});
	};

	/**
	 * clears out content widget preference fields from DOM and re-adds them
	 */
	go_contentwidgets_admin.refresh_fields = function() {
		this.$sidebar.find( '.go-contentwidgets-fields' ).remove();
		this.inject_fields();
	};

	/**
	 * updates the layout preferences for the given widget
	 */
	go_contentwidgets_admin.update_local_preferences = function( $el ) {
		var $widget = $el.closest( '.widget' );
		var widget_id = $widget.attr( 'id' ).replace( /widget-[0-9]+_/, '' );

		if ( 'undefined' === typeof go_contentwidgets_admin.layout_preferences[ widget_id ] ) {
			go_contentwidgets_admin.layout_preferences[ widget_id ] = {};
		}//end if

		if ( $el.is( '.location' ) ) {
			go_contentwidgets_admin.layout_preferences[ widget_id ].location = $el.val();
		} else {
			go_contentwidgets_admin.layout_preferences[ widget_id ].direction = $el.val();
		}//end else
	};

	/**
	 * injects preference select box and auto-selects the current preference for the widget
	 */
	go_contentwidgets_admin.inject_fields = function() {
		var $fields_template = $(
			'<div class="go-contentwidgets-fields">' +
				'<p class="go-contentwidgets-location-container">' +
					'<label>' +
						'Horizontal placement preference:' +
					'</label>' +
					'<select class="layout-preference location widefat">' +
						'<option value="any">No preference</option>' +
						'<option value="full">Full width</option>' +
						'<option value="left">Left</option>' +
						'<option value="right">Right</option>' +
					'</select>' +
				'</p>' +
				'<p class="go-contentwidgets-direction-container">' +
					'<label>' +
						'Insert from the ' +
					'</label>' +
					'<select class="layout-preference direction widefat">' +
						'<option value="">Top</option>' +
						'<option value="bottom">Bottom</option>' +
					'</select>' +
				'</p>' +
			'</div>'
		);

		this.$sidebar.find( '.widget' ).each( function() {
			var $widget = $( this );
			var widget_id = $widget.attr( 'id' ).replace( /widget-[0-9]+_/, '' );
			var $fields = $fields_template.clone();

			var $location_container = $fields.find( '.go-contentwidgets-location-container' );
			var $direction_container = $fields.find( '.go-contentwidgets-direction-container' );

			$location_container.find( 'label' ).attr( 'for', 'go-contentwidgets_' + widget_id + '_location' );
			$location_container.find( 'select' ).attr( 'name', 'go-contentwidgets[' + widget_id + '][location]' ).attr( 'id', 'go-contentwidgets_' + widget_id + '_location' );

			$direction_container.find( 'label' ).attr( 'for', 'go-contentwidgets_' + widget_id + '_direction' );
			$direction_container.find( 'select' ).attr( 'name', 'go-contentwidgets[' + widget_id + '][direction]' ).attr( 'id', 'go-contentwidgets_' + widget_id + '_direction' );

			$widget.find( '.widget-content' ).append( $fields );

			if ( 'undefined' !== typeof go_contentwidgets_admin.layout_preferences[ widget_id ] ) {
				if ( 'undefined' !== typeof go_contentwidgets_admin.layout_preferences[ widget_id ].location ) {
					$fields.find( '.layout-preference.location' ).val( go_contentwidgets_admin.layout_preferences[ widget_id ].location );
				}//end if

				if ( 'undefined' !== typeof go_contentwidgets_admin.layout_preferences[ widget_id ].direction ) {
					$fields.find( '.layout-preference.direction' ).val( go_contentwidgets_admin.layout_preferences[ widget_id ].direction );
				}//end if
			}//end if
		});
	};

	$( function() {
		go_contentwidgets_admin.init();
	});
})( jQuery );
