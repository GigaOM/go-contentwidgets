if ( 'undefined' === typeof go_content_widgets ) {
	var go_content_widgets = {
		layout_preferences: {}
	};
}//end id

(function( $ ) {
	'use strict';

	go_content_widgets.last = Date.now();
	go_content_widgets.current = Date.now();

	go_content_widgets.log = function( text ) {
		go_content_widgets.current = Date.now();
		console.info( text, go_content_widgets.current - go_content_widgets.last );
		go_content_widgets.last = go_content_widgets.current;
	};

	go_content_widgets.init = function( auto_inject ) {
		go_content_widgets.log( 'begin init' );
		this.shortest_widget_height = 10000;
		this.tallest_widget_height = 0;
		this.insert = [];
		this.inventory = {
			blackouts: [],
			gaps: []
		};
		this.non_blockers = [
			'blockquote',
			'h1,h2,h3,h4,h5,h6'
		];

		go_content_widgets.log( 'finding key elements' );
		this.$body = $( '#body' ).find( '.post section.body.entry-content' );
		this.$content = this.$body.find( '> div' );
		this.$widgets = $( '#hidden-sidebar > div' );
		this.$first_element = this.$content.find( ':first' );
		this.$images = this.$content.find( 'img' );
		go_content_widgets.log( 'finished finding key elements' );

		go_content_widgets.log( 'finding image' );
		this.$images.each( function() {
			var $img = $( this );

			if ( $img.attr( 'width' ) < $img.closest( '.entry-content' ).width() ) {
				$img.css( 'height', $img.attr( 'height' ) + 'px' );
			} else {
				$img.css( 'height', 'auto' );
			}//end else
		});
		go_content_widgets.log( 'completed finding image' );

		go_content_widgets.log( 'collecting widgets' );
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

			if ( widget.height < go_content_widgets.shortest_widget_height ) {
				go_content_widgets.shortest_widget_height = widget.height;
			}//end if

			if ( widget.height > go_content_widgets.tallest_widget_height ) {
				go_content_widgets.tallest_widget_height = widget.height;
			}//end if

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
		go_content_widgets.log( 'finished collecting widgets' );

		go_content_widgets.log( 'begin auto inject' );
		this.auto_inject();
		go_content_widgets.log( 'end auto inject' );
		this.$content.find( '.layout-box-thing' ).remove();
		$( '#body' ).addClass( 'rendered' );
		go_content_widgets.current = Date.now();
		console.info( 'Took this long:', go_content_widgets.current - go_content_widgets.start );
	};

	/**
	 * auto injects items in order
	 */
	go_content_widgets.auto_inject = function() {
		for ( var i = 0, length = go_content_widgets.insert.length; i < length; i++ ) {
			go_content_widgets.log( 'begin calc' );
			go_content_widgets.calc();
			go_content_widgets.log( 'end calc/begin inject' );
			go_content_widgets.inject_item( go_content_widgets.insert[ i ] );
			go_content_widgets.log( 'end inject' );
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
		} else if( 'solo-gap' === type ) {
			$el.append( $overlay );
		} else {
			$el.after( $overlay );
		}// end else

		return $overlay;
	};

	go_content_widgets.reset = function() {
		this.$content.find( '.layout-box-thing' ).remove();
		this.inventory = {
			blackouts: [],
			gaps: []
		};
	};

	go_content_widgets.calc = function() {
		go_content_widgets.log( 'begin reset' );
		this.reset();
		go_content_widgets.log( 'end reset/begin identify blackouts' );
		this.identify_blackouts();
		go_content_widgets.log( 'end identify blackouts/begin identify gaps' );
		this.identify_gaps();
		go_content_widgets.log( 'end identify gaps' );
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
			$overlay = this.overlay( this.$content, start, this.$content.outerHeight(), 'solo-gap' );
			gap = this.attributes( $overlay );
			gap.$overlay = $overlay;
			gap.$first_el = this.$first_element;

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

					$overlay = this.overlay( blackout.$overlay, start, gap_height, 'gap' );
					gap = this.attributes( $overlay );

					// if the gap height isn't tall enough for our shortest widget, don't bother looking for an injection point
					if ( gap.height > this.shortest_widget_height ) {
						gap.$overlay = $overlay;
						gap.$first_el = [];

						if ( 0 === start ) {
							gap.$first_el = this.$first_element;
						}//end if
						else {
							var tmp = this.attributes( previous_blackout.$overlay.next() );

							go_content_widgets.log( 'start measuring thing' );

							// find an element below the blackout
							while ( tmp.start < previous_blackout.end ) {
								tmp = this.attributes( tmp.$el.next() );
							}// end while
							go_content_widgets.log( 'stop measuring thing' );

							if ( tmp.start >= previous_blackout.end && tmp.end <= blackout.start ) {
								gap.$first_el = tmp.$el;
							}//end if
						}//end else

						if ( gap.$first_el.length ) {
							if ( gap.height > this.shortest_widget_height ) {
								this.inventory.gaps.push( gap );
							}//end if
						}//end if
					}//end if
				}//end if

				start = blackout.end;
				previous_blackout = blackout;
			}//end for

			if ( previous_blackout.end < this.$content.outerHeight() ) {
				// find the last gap below the final blackout
				$overlay = this.overlay( previous_blackout.$overlay, start, ( this.$content.outerHeight() - start ), 'last-gap' );
				gap = this.attributes( $overlay );
				// if the gap height isn't tall enough for our shortest widget, don't bother doing more stuff with it
				if ( gap.height > this.shortest_widget_height ) {
					gap.$overlay = $overlay;
					gap.$first_el = gap.$overlay.next();

					// check that the element we found is below the blackout
					// @note: slight fear that this could cause an infinite loop
					while ( gap.$first_el.length && gap.$first_el.position() && gap.$first_el.position().top < previous_blackout.end ) {
						gap.$first_el = gap.$first_el.next();
					}// end while

					// make sure the gap has an element in it, if not, it can't be counted
					if ( gap.$first_el.length && gap.$first_el.position() ) {
						this.inventory.gaps.push( gap );
					}//end if
				}//end if
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

	var check = false, is_relative = true;

	go_content_widgets.element_from_point = function( x, y ) {
		if ( ! document.elementFromPoint ) {
			return null;
		}//end if

		if ( ! check ) {
			var sl;

			if ( ( sl = $( document ).scrollTop() ) > 0 ) {
				is_relative = ( document.elementFromPoint( 0, sl + $( window ).height() -1 ) === null );
			} else if ( ( sl = $( document ).scrollLeft() ) > 0 ) {
				is_relative = ( document.elementFromPoint( sl + $( window ).width() -1, 0 ) === null );
			}//end else if

			check = ( sl > 0 );
		}//end if

		if ( ! is_relative ) {
			x += $( document ).scrollLeft();
			y += $( document ).scrollTop();
		}//end if

		return document.elementFromPoint( x, y );
	};

	$( function() {
		go_content_widgets.start = Date.now();
		go_content_widgets.last = go_content_widgets.start;
		go_content_widgets.log( 'before calling init' );
		go_content_widgets.init();
	});
})( jQuery );
