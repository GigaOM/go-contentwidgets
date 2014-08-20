if ( 'undefined' === typeof go_content_widgets ) {
	var go_content_widgets = {
		layout_preferences: {}
	};
}//end id

(function( $ ) {
	'use strict';

	go_content_widgets.init = function( auto_inject ) {
		this.insert = [];
		this.inventory = {
			p: [],
			blackouts: [],
			gaps: [],
			spaces: []
		};
		this.non_blockers = [
			'blockquote',
			'h1,h2,h3,h4,h5,h6'
		];

		this.$body = $( '#body' ).find( '.post section.body.entry-content' );
		this.$content = this.$body.find( '> div' );
		this.$widgets = $( '#hidden-sidebar > div' );

		this.$content.find( 'img' ).each( function() {
			var $img = $( this );

			if ( $img.attr( 'width' ) < $img.closest( '.entry-content' ).width() ) {
				$img.css( 'height', $img.attr( 'height' ) + 'px' );
			} else {
				$img.css( 'height', 'auto' );
			}//end else
		});

		this.$widgets.each( function() {
			var widget_id = $( this ).attr( 'id' );

			$( this ).addClass( 'layout-box-insert' ); // @todo, this may not be needed long term, but for now it makes the CSS easier

			var widget = {
				name: widget_id,
				$el: $( this ),
				height: parseInt( $( this ).outerHeight( true ) * 0.9, 10 ),
				location: 'right',
				preferbottom: false
			};

			if ( 'undefined' !== typeof go_content_widgets.layout_preferences[ widget_id ] ) {
				if (
					'undefined' !== typeof go_content_widgets.layout_preferences[ widget_id ].direction
					&& 'bottom' === go_content_widgets.layout_preferences[ widget_id ].direction
				) {
					widget.preferbottom = true;
				}//end if

				if (
					'undefined' !== typeof go_content_widgets.layout_preferences[ widget_id ].location
					&& 'any' !== go_content_widgets.layout_preferences[ widget_id ].location
				) {
					widget.location = go_content_widgets.layout_preferences[ widget_id ].location;
				}//end if
			}//end if

			if ( widget.location ) {
				$( this ).addClass( 'layout-box-insert-' + widget.location );
			}//end if

			go_content_widgets.insert.push( widget );
		} );

		this.calc();
		this.auto_inject();
		// @TODO: this removes the overlays. We need to keep it but we have to remove the styles that color them. Disabling for testing/debugging
		this.$content.find( '.layout-box-thing' ).remove();
		var d = new Date();
		console.log( d, d.getMilliseconds() );
		$( '#body' ).addClass( 'rendered' );
	};

	/**
	 * auto injects items in order
	 */
	go_content_widgets.auto_inject = function() {
		for ( var i = 0, length = go_content_widgets.insert.length; i < length; i++ ) {
			go_content_widgets.inject_item( go_content_widgets.insert[ i ] );
			go_content_widgets.calc();
		}// end foreach
	};

	/**
	 * get measurement attributes for a given element
	 *
	 * @param $el jQuery element to measure
	 * @return object with measurement attributes
	 */
	go_content_widgets.attributes = function( $el ) {
		var margin_top = $el.css( 'margin-top' );

		margin_top = parseInt( margin_top.replace( 'px', '' ), 10 );

		var top = parseInt( $el.position().top, 10 );
		var height = parseInt( $el.outerHeight( true ), 10 );
		top -= margin_top;
		var end = top + height;

		var data = {
			$el: $el,
			start: top,
			end: end,
			height: height
		};

		return data;
	};

	go_content_widgets.overlay = function( $el, start, height, type ) {
		var $overlay = $( '<div class="layout-box-thing ' + type + '" style="top:' + start + 'px;height:' + height + 'px;"></div>' );
		if ( 'gap' === type ) {
			$el.before( $overlay );
		}//end if
		else if( 'solo-gap' === type ) {
			$el.append( $overlay );
		}//end if
		else {
			$el.after( $overlay );
		}// end else

		return $overlay;
	};

	go_content_widgets.reset = function() {
		this.$content.find( '.layout-box-thing' ).remove();
		this.inventory = {
			p: [],
			blackouts: [],
			gaps: [],
			spaces: []
		};
	};

	go_content_widgets.calc = function() {
		this.reset();
		this.identify_blackouts();
		this.identify_gaps();
	};

	go_content_widgets.identify_blackouts = function() {
		// find top level blackouts
		this.$content.find( '> *:visible:not(p):not(ol):not(ul):not(script):not(address)' ).each( function() {
			var $el = $( this );

			for ( var i = 0, length = go_content_widgets.non_blockers.length; i < length; i++ ) {
				if ( $el.is( go_content_widgets.non_blockers[ i ] ) ) {
					return;
				}//end if
			}//end for

			var attr = go_content_widgets.attributes( $el );
			attr.is_child = false;
			go_content_widgets.inventory.blackouts.push( attr );
		});

		// find child blackouts
		this.$content.find( '> p *' ).each( function() {
			var $el = $( this );
			if ( ! $el.is( 'img' ) && ! $el.is( 'iframe' ) && ! $el.is( '.layout-box-insert' ) ) {
				return;
			}//end if

			var attr = go_content_widgets.attributes( $el );
			attr.is_child = true;
			go_content_widgets.inventory.blackouts.push( attr );
		});

		// draw the blackout overlays
		for ( var i = 0, length = this.inventory.blackouts.length; i < length; i++ ) {
			var blackout = this.inventory.blackouts[ i ];
			if ( blackout.is_child ) {
				blackout.$overlay = this.overlay( blackout.$el.closest( 'p' ), blackout.start, blackout.height, 'blackout' );
			}// end if
			else {
				blackout.$overlay = this.overlay( blackout.$el, blackout.start, blackout.height, 'blackout' );
			}// end else
		}//end for

		this.inventory.blackouts.sort( this.sort_by_start );
	};

	/**
	 * sorting function used only by identify_blackouts
	 */
	go_content_widgets.sort_by_start = function( a, b ) {
		var a_start = a.start;
		var b_start = b.start;
		return ( ( a_start < b_start ) ? -1 : ( ( a_start > b_start ) ? 1 : 0 ) );
	};

	go_content_widgets.identify_gaps = function() {
		var start = 0;
		var gap;
		var $overlay;
		var i;

		if ( 0 === this.inventory.blackouts.length ) {
			$overlay = this.overlay( this.$content, start, this.$content.outerHeight(), 'rgba( 0, 255, 0, 0.5 )', 'solo-gap' );
			gap = this.attributes( $overlay );
			gap.$overlay = $overlay;
			gap.$first_el = this.$content.find( ':first' );

			this.inventory.gaps.push( gap );
		}//end if
		else {
			var previous_blackout = null;
			for ( var i = 0, length = this.inventory.blackouts.length; i < length; i++ ) {
				var blackout = this.inventory.blackouts[ i ];

				if ( blackout.start > start ) {
					var gap_height = blackout.start - start;
					if ( 0 === gap_height ) {
						continue;
					}//end if

					$overlay = this.overlay( blackout.$overlay, start, gap_height, 'rgba( 0, 255, 0, 0.5 )', 'gap' );
					gap = this.attributes( $overlay );
					gap.$overlay = $overlay;

					if ( 0 === start ) {
						gap.$first_el = this.$content.find( ':first' );
					}//end if
					else {
						var tmp = this.attributes( previous_blackout.$overlay.next() );

						// find an element below the blackout
						while ( tmp.start < previous_blackout.end ) {
							tmp = this.attributes( tmp.$el.next() );
						}// end while

						if ( tmp.start >= previous_blackout.end && tmp.end <= blackout.start ) {
							gap.$first_el = tmp.$el;
						}//end if
						else {
							// console.info( "failed to find an injection point - " + gap.height );
							// console.log( tmp.start + " > " + previous_blackout.end + " && " + tmp.end + " < " + blackout.start );
						}
					}//end else

					if ( gap.$first_el ) {
						this.inventory.gaps.push( gap );
					}//end if
					else {
						// should we hide the gap overlay if there is no injection point?
						this.inventory.spaces.push( gap );
					}
				}//end if

				start = blackout.end;
				previous_blackout = blackout;
			}//end for

			if ( previous_blackout.end < this.$content.outerHeight() ) {
				// find the last gap below the final blackout
				$overlay = this.overlay( previous_blackout.$overlay, start, ( this.$content.outerHeight() - start ), 'rgba( 0, 255, 0, 0.5 )', 'last-gap' );
				gap = this.attributes( $overlay );
				gap.$overlay = $overlay;
				gap.$first_el = gap.$overlay.next();

				// check that the element we found is below the blackout
				// @note: slight fear that this could cause an infinite loop
				while ( gap.$first_el && gap.$first_el.position() && gap.$first_el.position().top < previous_blackout.end ) {
					gap.$first_el = gap.$first_el.next();
				}// end while

				// make sure the gap has an element in it, if not, it can't be counted
				if ( gap.$first_el && gap.$first_el.position() ) {
					this.inventory.gaps.push( gap );
				}//end if
				else {
					// should we hide gaps with no injection point?
					//gap.$overlay.remove();
				}
			}//end if
		}//end else
	};

	go_content_widgets.inject_item = function( item ) {
		var $element = null;

		for ( var i = 0, length = this.inventory.gaps.length; i < length; i++ ) {
			var gap = this.inventory.gaps[ i ];
			if ( gap.height > item.height ) {
				$element = gap.$first_el;

				if ( item.preferbottom ) {
					// find the last element in the gap where item will fit
					var next_element = this.attributes( $element );
					while ( next_element.end <= gap.end && ( gap.end - next_element.start ) > item.height ) {
						//console.info( next_element.end + "<=" + gap.end + " && ( " + gap.end + " - " + next_element.start + " ) > " + item.height );
						$element = next_element.$el;
						next_element = this.attributes( $element.next() );
					}// end while
				}//end if
				else {
					break;
				}//end else
			}//end if
		}//end for

		if ( ! $element ) {
			// Failed to inject
			return false;
		}// end if

		$element.before( item.$el );
	};

	$( function() {
		var d = new Date();
		console.log( d, d.getMilliseconds() );
		// If we call the init function outright, SOMETHING is causing the calculation to fail miserably. We believe it is a repaint problem
		// but we're not sure. setTimeout's lowest value is 4ms, but we're pretending it is 1ms.
		setTimeout( function() {
			go_content_widgets.init();
		}, 1 );
	});
})( jQuery );
