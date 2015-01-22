if ( 'undefined' === typeof go_contentwidgets ) {
	var go_contentwidgets = {
		layout_preferences: {},
		single_use_gap_per_pass: false
	};
}//end id

(function( $ ) {
	'use strict';

	go_contentwidgets.full_inject_complete = false;
	go_contentwidgets.current = Date.now();
	// set up blackout selectors. NOTE: blockquotes are not blackouts except when they are tweet-embeds
	go_contentwidgets.blackout_selector = '> *:not(p,blockquote:not(.twitter-tweet),h1,h2,h3,h4,h5,h6,ol,ul,script,address)';

	go_contentwidgets.log = function( text ) {
		go_contentwidgets.current = Date.now();
		//console.info( text, go_contentwidgets.current - go_contentwidgets.last );
		go_contentwidgets.last = go_contentwidgets.current;
	};

	go_contentwidgets.events = function() {
		// compatibility with bcms wijax widgets
		$( document ).on( 'wijax-loaded', function( event, widget_id ) {
			var $widget = $( document.getElementById( widget_id ) );
			if ( $widget.closest( '#hidden-sidebar' ).length > 0 ) {
				go_contentwidgets.single_widget_inject( $widget );
			}//end if
		} );

		// watch for resizes and re-inject all the things
		$( document ).on( 'go-resize', function( e, states ) {
			if ( 'full' === states.to ) {
				go_contentwidgets.unbookmark_ads();

				if ( false === go_contentwidgets.full_inject_complete ) {
					go_contentwidgets.auto_inject();
				}//end if
			} else {
				var $ad_b_bookmark = $( document.getElementById( 'ad-b-bookmark' ) );

				if ( $ad_b_bookmark.length ) {
					return;
				}//end if

				go_contentwidgets.inject_small();
			}//end else
		});
	};

	go_contentwidgets.init = function() {
		this.loading = true;

		this.start = Date.now();
		this.last = this.start;
		this.log( 'begin init' );

		this.shortest_widget_height = 10000;
		this.tallest_widget_height = 0;
		this.insert = [];
		this.inventory = {
			blackouts: [],
			gaps: []
		};

		this.$body = $( document.getElementById( 'body' ) );
		this.$content = this.$body.find( '.post section.body.entry-content > div' );

		this.$first_element = this.$content.find( ':first' );
		this.$images = this.$content.find( 'img' );

		this.$ad_b = $( document.getElementById( 'ad-b' ) );
		this.$ad_c = $( document.getElementById( 'ad-c' ) );

		this.$post = this.$content.closest( '.post' );

		this.suppress_house_ctas = this.$post.hasClass( 'suppress-house-ctas' );
		this.suppress_ads = this.$post.hasClass( 'suppress-ads' );

		$( '.alignleft' ).each( function() {
			var $el = $( this );
			var $el_to_wrap = $();

			if ( $el.closest( '.aligncenter' ).length
				// handle images with captions that are aligned left and already wrapped
			    || $el.parents( '.alignleft' ).length ) {
				return;
			}//end if

			if ( $el.closest( 'picture' ).length ) {
				$el_to_wrap = $el.closest( 'picture' );
			} else {
				$el_to_wrap = $el;
			}//end else

			$el_to_wrap.wrap( '<div class="go-contentwidgets-align-container go-contentwidgets-alignleft"/>' );
			$el.css( 'height', 'auto' );
		});

		$( '.alignright' ).each( function() {
			var $el = $( this );
			var $el_to_wrap = $();

			if ( $el.closest( '.aligncenter' ).length
				// handle images with captions that are aligned right and already wrapped
			    || $el.parents( '.alignright' ).length ) {
				return;
			}//end if

			if ( $el.closest( 'picture' ).length ) {
				$el_to_wrap = $el.closest( 'picture' );
			} else {
				$el_to_wrap = $el;
			}//end else

			$el_to_wrap.wrap( '<div class="go-contentwidgets-align-container go-contentwidgets-alignright"/>' );
			$el.css( 'height', 'auto' );
		});

		this.collect_widgets();

		// we do the standard auto_inject for 960px and greater
		if ( $( 'body' ).outerWidth() >= 960 ) {
			this.auto_inject();
		} else {
			this.inject_small();
		}//end else

		this.$content.find( '.layout-box-thing' ).remove();
		this.$body.addClass( 'rendered' );
		go_contentwidgets.current = Date.now();

		$( document ).trigger( 'go-contentwidgets-complete' );
		this.loading = false;
	};

	/**
	 * inject ads b and c into the content of a post
	 */
	go_contentwidgets.inject_small = function() {
		if ( this.suppress_ads ) {
			return;
		}//end if

		var $stuff = $( '.entry-content > .container > *:not(.layout-box-insert,.go-contentwidgets-spacer,.bookmarked-widget)' );
		var $ad_b_container = this.$ad_b.closest( '.widget-go-ads' );
		var $ad_c_container = this.$ad_c.closest( '.widget-go-ads' );

		$ad_b_container.removeClass( 'small-inject' );
		$ad_c_container.removeClass( 'small-inject' );

		var $ad_b_bookmark = $( '<span id="ad-b-bookmark"/>' );
		var $ad_c_bookmark = $( '<span id="ad-c-bookmark"/>' );

		$ad_b_container.before( $ad_b_bookmark );
		$ad_c_container.before( $ad_c_bookmark );

		var insert_after = 0;

		// try to find a spot that isn't right next to a floated element
		$stuff.each( function() {
			var $el = $( this );

			if ( $el.find( '.go-contentwidgets-alignright,.go-contentwidgets-alignleft' ).length ) {
				insert_after++;
			}//end if
		});

		var inject_location = insert_after;

		// if we have more than 2 elements in the post, inject after the first safe spot
		if ( $stuff.length >= 3 ) {
			inject_location += 1;

			// make sure we haven't gone too far
			if ( $stuff.length < inject_location ) {
				inject_location--;
			}//end if
		}//end if

		// We can't inject if the immediately previous element or two elements previous are aligned elements
		if (
			$stuff.eq( inject_location ).prev().find( '.go-contentwidgets-aligright,.go-contentwidgets-alignleft' ).length
			|| $stuff.eq( inject_location ).prev().prev().find( '.go-contentwidgets-aligright,.go-contentwidgets-alignleft' ).length
		) {
			inject_location++;
		}//end if

		// if our inject_location is less than the length of stuff, we still have an injection point
		if ( inject_location < $stuff.length ) {
			$stuff.eq( inject_location ).after( $ad_b_container );
			$ad_b_container.addClass( 'small-inject' );
		}//end if

		$( '.post-page-tags > .sorted_tags' ).after( $ad_c_container );
		$ad_c_container.addClass( 'small-inject' );
	};

	/**
	 * place ads b and c back where they belong
	 */
	go_contentwidgets.unbookmark_ads = function() {
		var $ad_b_bookmark = $( document.getElementById( 'ad-b-bookmark' ) );
		var $ad_c_bookmark = $( document.getElementById( 'ad-c-bookmark' ) );

		if ( $ad_b_bookmark.length ) {
			$ad_b_bookmark.replaceWith( this.$ad_b.closest( '.widget-go-ads' ) );
		}

		if ( $ad_c_bookmark.length ) {
			$ad_c_bookmark.replaceWith( this.$ad_c.closest( '.widget-go-ads' ) );
		}
	};

	go_contentwidgets.collect_widgets = function() {
		go_contentwidgets.log( 'collecting widgets' );

		var not = '.widget_wijax';

		if ( this.suppress_house_ctas ) {
			not += ',.go-thisorthat-widget';
		}

		if ( this.suppress_ads ) {
			$( '.widget-go-ads' ).remove();
		}

		this.$widgets = $( document.getElementById( 'hidden-sidebar' ) ).find( '> div:not( ' + not + ' )' );
		this.$widgets.each( function() {
			var $el = $( this );

			go_contentwidgets.add_widget( $el );
		} );
		go_contentwidgets.log( 'finished collecting widgets' );
	};

	go_contentwidgets.add_widget = function( $widget ) {
		var widget_id = $widget.attr( 'id' );

		$widget.addClass( 'layout-box-insert' ); // @todo, this may not be needed long term, but for now it makes the CSS easier

		var widget = {
			name: widget_id,
			$el: $widget,
			height: parseInt( $widget.outerHeight( true ), 10 ) + 16, // reported height of the element and about 16px for some buffer
			location: 'right',
			preferbottom: false
		};

		if ( widget.height < this.shortest_widget_height ) {
			this.shortest_widget_height = widget.height;
		}//end if

		if ( widget.height > this.tallest_widget_height ) {
			this.tallest_widget_height = widget.height;
		}//end if

		if ( 'undefined' !== typeof this.layout_preferences[ widget_id ] ) {
			if (
				'undefined' !== typeof this.layout_preferences[ widget_id ].direction
				&& 'bottom' === this.layout_preferences[ widget_id ].direction
			) {
				widget.preferbottom = true;
			}//end if

			if (
				'undefined' !== typeof this.layout_preferences[ widget_id ].location
				&& 'any' !== this.layout_preferences[ widget_id ].location
			) {
				widget.location = this.layout_preferences[ widget_id ].location;
			}//end if
		}//end if

		if ( widget.location ) {
			$widget.addClass( 'layout-box-insert-'.concat( widget.location ) );
		}//end if

		this.insert.push( widget );
		return( widget );
	};

	go_contentwidgets.single_widget_inject = function( $widget ) {
		if ( this.loading ) {
			// sleep here and try again since other injections are actively happening.
			setTimeout( function() {
				go_contentwidgets.single_widget_inject( $widget );
			}, 10 );
		}//end if

		this.loading = true;

		this.reset();

		// identify all the normal blackouts and gaps
		this.identify_blackouts();

		// blackout everything from the bottom of the current viewport and up!
		var scroll_bottom = $( window ).scrollTop() + $( window ).height();
		var content_scroll_top = this.$content.offset().top;

		var end = scroll_bottom - content_scroll_top;

		var blackout = {
			$el: this.$first_element,
			start: 0,
			end: end,
			height: end
		};

		var new_blackouts = [ blackout ];
		for ( var i in this.inventory.blackouts ) {
			if ( this.inventory.blackouts[ i ].end > blackout.end ) {
				 new_blackouts.push( this.inventory.blackouts[ i ] );

				 if ( blackout.end > this.inventory.blackouts[ i ].start ) {
					blackout.end = this.inventory.blackouts[ i ].start;
					blackout.height = blackout.end;
				}//end if
			}
		}//end for
		this.inventory.blackouts = new_blackouts;

		this.identify_gaps();

		var injectable = this.add_widget( $widget );
		this.inject_item( injectable );

		this.loading = false;
	};

	/**
	 * auto injects items in order
	 */
	go_contentwidgets.auto_inject = function() {
		// before doing a full auto inject, all images need to have their heights set
		this.$images.each( function() {
			var $img = $( this );

			var style = $img.attr( 'style' );

			// if there are legacy floats or clears, we need to toss them out
			if ( 'undefined' !== typeof style && style ) {
				if ( style.match( /float/ ) ) {
					style = style.replace( /float\:[ \t]*(right|left);?/, '' );
				}//end if

				if ( style.match( /clear/ ) ) {
					style = style.replace( /clear\:[ \t]*(right|left|both);?/, '' );
				}//end if

				$img.attr( 'style', style );
			}

			if ( $img.attr( 'width' ) < $img.closest( '.entry-content' ).width() ) {
				var height = $img.attr( 'height' );

				// only set the height from the attribute if there is one
				if ( 'undefined' !== typeof height && height ) {
					$img.css( 'height', $img.attr( 'height' ).concat( 'px' ) );
				}//end if
			} else {
				$img.css( 'height', 'auto' );
			}//end else
		});

		for ( var i = 0, length = go_contentwidgets.insert.length; i < length; i++ ) {
			go_contentwidgets.calc();
			go_contentwidgets.inject_item( go_contentwidgets.insert[ i ] );
		}// end foreach

		// manual heights were added to all images to enable proper insertion. Let's remove the manual heights
		// so our CSS will work as expected
		this.$images.css( 'height', '' );

		// now that we've inserted everything, let's balance the items out
		var $injected = go_contentwidgets.$content.find( '.layout-box-insert' );
		$injected.each( function( i ) {
			var $el = $( this );

			if ( 0 === i ) {
				return;
			}//end if

			var sibling_selector = go_contentwidgets.blackout_selector.replace( '> ', '' );

			// add two classes to look for at the end of the selector
			sibling_selector = sibling_selector.replace( /\)$/, ',span,a,.go-contentwidgets-spacer,.layout-box-thing)' );

			// find the previous and next blocking elements
			var $maybe_prev = $el.prevAll( '*' );
			var $maybe_next = $el.nextAll( '*' );

			var $prev = $();
			var $next = $();

			// we need to manually build the prev collection because sometimes we have blockers as children of other non-blocking elements (p, ul, ol)
			$maybe_prev.each( function() {
				var $current = $( this );
				if ( $current.is( sibling_selector ) ) {
					$prev = $prev.add( $current );
				} else {
					if ( $current.is( 'p,ul,ol,blockquote' ) ) {
						$prev = $prev.add( $current.find( sibling_selector ) );
					}//end if
				}//end else
			});

			// we need to manually build the next collection because sometimes we have blockers as children of other non-blocking elements (p, ul, ol)
			$maybe_next.each( function() {
				var $current = $( this );
				if ( $current.is( sibling_selector ) ) {
					$next = $next.add( $current );
				} else {
					if ( $current.is( 'p,ul,ol,blockquote' ) ) {
						$next = $next.add( $current.find( sibling_selector ) );
					}//end if
				}//end else
			});

			// if there is a previous and a next, let's try to balance the element
			if ( ! $prev.length ) {
				return;
			}//end if

			// reverse the prev collection so the first element is the closet to the injectable
			$prev = $( $prev.get().reverse() );

			var el_height = parseInt( $el.outerHeight( true ), 10 );
			var above = $el.get( 0 ).offsetTop - ( $prev.get( 0 ).offsetTop + parseInt( $prev.outerHeight( true ), 10 ) );
			var below;

			if ( $next.length ) {
				// if there are more blockers after this one, compute the distance that is shiftable based on the next item
				below = $next.get( 0 ).offsetTop - ( $el.get( 0 ).offsetTop + el_height );
			} else {
				// if this is the last item in the post, then use the bottom of the post to compute the shiftable distance
				below = parseInt( go_contentwidgets.$content.outerHeight( true ), 10 ) - ( $el.get( 0 ).offsetTop + el_height );
			}//end else

			// if there is less space above the injected item than there is below, attempt to even that out a bit
			if ( above < below ) {
				// the distance should be the space above the injectable plus the space above divided by 2 MINUS the space above
				go_contentwidgets.adjust_down( $el, ( ( above + below ) / 2 ) - above );
			}
		});

		this.full_inject_complete = true;
	};

	/**
	 * get measurement attributes for a given element
	 *
	 * @param $el jQuery element to measure
	 * @return object with measurement attributes
	 */
	go_contentwidgets.attributes = function( $el ) {
		var start;
		var margin_top = $el.css( 'margin-top' );

		margin_top = parseInt( margin_top.replace( 'px', '' ), 10 );

		// if we're looking at an item in the list, we need to get the offset of the li, not the item itself
		var $closest_li = $el.closest( 'li' );
		if ( $closest_li.length ) {
			start = $closest_li.get( 0 ).offsetTop;
		} else {
			// otherwise, just get the offset value of the element
			start = $el.get( 0 ).offsetTop;
		}//end else

		start -= margin_top;

		var height = parseInt( $el.outerHeight( true ), 10 );
		var end = start + height;

		var data = {
			$el: $el,
			start: start,
			end: end,
			height: height
		};

		return data;
	};

	go_contentwidgets.overlay = function( $el, start, height, type ) {
		var $overlay = $( '<div class="layout-box-thing" style="top:' + start + 'px;height:' + height + 'px;"></div>' );

		if ( 'gap' === type ) {
			$el.before( $overlay );
		} else if( 'solo-gap' === type ) {
			$el.append( $overlay );
		} else {
			$el.after( $overlay );
		}// end else

		return $overlay;
	};

	go_contentwidgets.reset = function() {
		this.$content.find( '.layout-box-thing, .go-contentwidgets-spacer' ).remove();
		this.inventory = {
			blackouts: [],
			gaps: []
		};
	};

	go_contentwidgets.calc = function() {
		go_contentwidgets.log( 'begin calc and reset' );
		this.reset();
		go_contentwidgets.log( 'end reset/begin identify blackouts' );
		this.identify_blackouts();
		go_contentwidgets.log( 'end identify blackouts/begin identify gaps' );
		this.identify_gaps();
		go_contentwidgets.log( 'end identify gaps and calc' );
	};

	go_contentwidgets.identify_blackouts = function() {

		go_contentwidgets.log( 'before find :visible' );
		// find top level blackouts
		// since :visible isn't native CSS, following the jQuery recommendation of running it after a pure CSS selector
		this.$content.find( this.blackout_selector ).filter( ':visible' ).each( function() {
			var $el = $( this );
			var attr = go_contentwidgets.attributes( $el );
			go_contentwidgets.inventory.blackouts.push( attr );
		});

		go_contentwidgets.log( 'after find :visible / before find children' );
		// find child blackouts
		this.$content.find( '> p *, > ol *, > ul *' ).filter( 'img,iframe,.layout-box-insert' ).each( function() {
			var $el = $( this );
			var attr = go_contentwidgets.attributes( $el );
			// since this is a child, after we've calculated the blackout grab its parent p
			attr.$el = $el.closest( 'p,li' );
			go_contentwidgets.inventory.blackouts.push( attr );
		});

		this.inventory.blackouts.sort( this.sort_by_start );

		go_contentwidgets.log( 'after find children / before blackout overlay generation' );
	};

	/**
	 * sorting function used only by identify_blackouts
	 */
	go_contentwidgets.sort_by_start = function( a, b ) {
		var a_start = a.start;
		var b_start = b.start;
		return ( ( a_start < b_start ) ? -1 : ( ( a_start > b_start ) ? 1 : 0 ) );
	};

	go_contentwidgets.adjust_down = function( $injectable, distance ) {
		var alignment_class = 'layout-box-insert-right';

		distance = Math.round( distance / 27 ) * 27;

		if ( ! $injectable.hasClass( alignment_class ) ) {
			alignment_class = 'layout-box-insert-left';
		}//end if

		$injectable.before( $( '<div class="go-contentwidgets-spacer '+ alignment_class + '" style="height:' + distance +'px"/>' ) );
	};

	go_contentwidgets.identify_gaps = function() {
		var start = 0;
		var gap;
		var i;
		var gap_height;
		var length;
		var first_el_start;

		if ( 0 === this.inventory.blackouts.length ) {
			gap = {};
			gap.$overlay = this.overlay( this.$content, start, this.$content.outerHeight(), 'solo-gap' );
			gap.$first_el = this.$first_element;

			this.inventory.gaps.push( gap );
		}//end if
		else {
			var previous_blackout = null;
			var tmp;
			for ( i = 0, length = this.inventory.blackouts.length; i < length; i++ ) {
				var blackout = this.inventory.blackouts[ i ];

				if ( blackout.start > start ) {
					gap_height = blackout.start - start;

					// if the gap height isn't tall enough for our shortest widget, don't bother with it
					if ( 0 === gap_height || gap_height < this.shortest_widget_height ) {
						// check if the there was a previous blackout and if it was a right insert, if so, rebalance
						if ( null !== previous_blackout && previous_blackout.$el.hasClass( 'layout-box-insert' ) ) {
							// only gap adjust right aligned elements or left aligned elements if the next element is not a left gap blocker
							if (
								previous_blackout.$el.hasClass( 'layout-box-insert-right' )
								|| ! this.left_blocker_in_gap( previous_blackout.$el.next(), blackout.start )
							) {
								this.adjust_down( previous_blackout.$el, gap_height / 2 );

								// if the blackout has been adjusted down, recalculate the start/end
								blackout.start = blackout.$el.position().top;
								blackout.end = blackout.start + blackout.height;
							}//end if
						}//end if

						start = blackout.end;
						previous_blackout = blackout;
						continue;
					}//end if

					gap = {};
					gap.$overlay = this.overlay( blackout.$el, start, gap_height, 'gap' );
					gap.$first_el = [];
					gap.height = gap_height;

					if ( 0 === start ) {
						tmp = this.attributes( this.$first_element );

						if ( tmp.end <= blackout.start ) {
							gap.$first_el = this.$first_element;
						}//end if
					}//end if
					else {
						tmp = this.attributes( previous_blackout.$el.next() );

						// as we attempt to find an element below the blackout, we'll need to track
						// how we're looping over list items and ol/uls
						var jumping_out_of_list = false;

						// find an element below the blackout
						while ( tmp.start < previous_blackout.end ) {
							// assume we aren't jumping out of a list
							jumping_out_of_list = false;

							// if the current item is the last li, we need to jump back out of the list
							if ( tmp.$el.is( 'li' ) && ! tmp.$el.next().length ) {
								tmp.$el = tmp.$el.closest( 'ol,ul' );
								jumping_out_of_list = true;
							}//end if

							tmp.$el = tmp.$el.next();

							// if the current element is an ol/ul, we need to traverse INTO the list. Unless, of course, we just jumped out of one.
							if ( tmp.$el.is( 'ul,ol' ) && ! jumping_out_of_list ) {
								tmp.$el = tmp.$el.find( 'li:first' );
							}//end if

							if ( tmp.$el.is( '.layout-box-thing' ) ) {
								continue;
							}//end if

							if ( ! tmp.$el.length ) {
								break;
							}//end if

							tmp = this.attributes( tmp.$el );
						}// end while

						if ( tmp.start >= previous_blackout.end && tmp.end < blackout.start ) {
							gap.$first_el = tmp.$el;
						}//end if
					}//end else

					if ( gap.$first_el.length ) {

						if ( 'undefined' !== typeof previous_blackout && previous_blackout ) {
							first_el_start = gap.$first_el.position().top;

							// make sure the height is calculated correctly starting from the first injectable area
							gap.height = gap.height - ( first_el_start - previous_blackout.end );
							gap.start = first_el_start;
						}//end if

						// if there isn't enough room for the shortest widget, don't add the gap
						if ( gap.height > this.shortest_widget_height ) {
							this.inventory.gaps.push( gap );
						}//end if
					}//end if
				}//end if

				start = blackout.end;
				previous_blackout = blackout;
			}//end for

			if ( previous_blackout && previous_blackout.end < this.$content.outerHeight() ) {
				gap_height = this.$content.outerHeight() - previous_blackout.end;
				// find the last gap below the final blackout

				// if the gap height isn't tall enough for our shortest widget, don't bother doing more stuff with it
				if ( gap_height > this.shortest_widget_height ) {
					gap = {};
					gap.$overlay = this.overlay( previous_blackout.$el, start, ( this.$content.outerHeight() - start ), 'last-gap' );
					gap.$first_el = gap.$overlay.next();
					gap.height = gap_height;

					// check that the element we found is below the blackout
					// @note: slight fear that this could cause an infinite loop
					while ( gap.$first_el.length && 'undefined' !== typeof gap.$first_el.get( 0 ).offsetTop && gap.$first_el.get( 0 ).offsetTop < previous_blackout.end ) {
						gap.$first_el = gap.$first_el.next();
					}// end while

					// make sure the gap has an element in it, if not, it can't be counted
					if ( gap.$first_el.length && gap.$first_el.get( 0 ).offsetTop ) {
						first_el_start = gap.$first_el.position().top;

						// make sure the height is calculated correctly starting from the first injectable area
						gap.height = gap.height - ( first_el_start - previous_blackout.end );
						gap.start = first_el_start;

						// if there isn't enough room for the shortest widget, don't add the gap
						if ( gap.height > this.shortest_widget_height ) {
							this.inventory.gaps.push( gap );
						}//end if
					}//end if
				}//end if
			}//end if
		}//end else
	};

	go_contentwidgets.inject_item = function( injectable ) {
		var i;
		var length = 0;
		var $injection_point = null;
		var gap = null;
		var injection_gap = null;
		var $tmp;
		go_contentwidgets.log( 'injecting injectable' );

		var total_gap_height = 0;
		var tallest_gap = null;

		// let's pregame the gaps. We're finding the height of all gaps that could hold widgets
		// as well as finding the tallest gap
		for ( i = 0, length = this.inventory.gaps.length; i < length; i++ ) {
			gap = this.inventory.gaps[ i ];
			var gap_height = gap.$overlay.outerHeight();
			if ( gap_height < this.shortest_widget_height ) {
				continue;
			}//end if

			// is this gap the tallest one that we've found so far?
			if (
				null === tallest_gap
				|| gap_height > this.inventory.gaps[ tallest_gap ].$overlay.outerHeight()
			) {
				tallest_gap = i;
			}//end else if

			total_gap_height += gap_height;
		}//end for

		// find a place to inject the injectable
		for ( i = 0, length = this.inventory.gaps.length; i < length; i++ ) {
			gap = this.attributes( this.inventory.gaps[ i ].$overlay );
			gap.$overlay = this.inventory.gaps[ i ].$overlay;
			gap.$first_el = this.inventory.gaps[ i ].$first_el;

			// if we are inserting the tallest widget, let's stick it in the biggest gap
			if ( injectable.height === this.tallest_widget_height ) {
				if ( i !== tallest_gap ) {
					continue;
				}//end if
			}//end if

			if ( gap.height > injectable.height ) {
				$injection_point = gap.$first_el;

				// let's find all widgets that aren't the one we're injecting (which is the first one)
				var $remaining = $( document.getElementById( 'hidden-sidebar' ) ).find( '> div:not(.widget_wijax)' ).filter( ':not(:first-child)' );
				var remaining_height = 0;

				// find the height of all those widgets
				$remaining.each( function() {
					remaining_height += $( this ).outerHeight();
				});

				// let's store off the next injection point because we'll probably need it
				var $next = $injection_point.next();

				// external_height holds the total gap height that isn't the gap we're in
				var external_height = total_gap_height - gap.height;

				// let's find how much vertical height we need inside THIS gap, which is the height of remaining injectables minus
				// the height outside of this gap
				var room_needed_inside_gap = remaining_height - external_height;

				// if there is more height outside of this gap than there are combined pixels on the remaining injectables, then
				// room_needed_inside_gap is negative. Which means we need 0 pixels in height for other widgets.
				if ( room_needed_inside_gap <= 0 ) {
					room_needed_inside_gap = 0;
				}//end if

				// while we're able to shift the element down, let's do so
				while (
					// if we're in the first gap, let's not shift down
					gap.start > 0
					// is there enough space to shift the injectable down and still inject other widgets?
					&& ( gap.height - injectable.height > room_needed_inside_gap )
					// IS there as next space?
					&& $next.length
					// Is the space at the top of the gap smaller than the "free" space at the bottom of the gap?
					&& ( $next.position().top - gap.start ) < ( gap.end - $next.position().top - room_needed_inside_gap )
				) {
					// Yup! move the injection point
					$injection_point = $next;
					$next = $injection_point.next();
				}//end while

				if ( injectable.preferbottom ) {
					// find the last injection_point in the gap where injectable will fit
					var next_injection_point = this.attributes( $injection_point );
					while ( next_injection_point.end <= gap.end && ( gap.end - next_injection_point.start ) > injectable.height ) {
						$injection_point = next_injection_point.$el;

						// we need to make sure we aren't selecting a blackout overlay
						$tmp = $injection_point.next( ':not(.layout-box-thing)' );

						// if there's nothing else to select, then we're done searching for an injection point
						if ( ! $tmp.length ) {
							break;
						}//end if

						next_injection_point = this.attributes( $tmp );
					}// end while
					injection_gap = gap;
				}//end if
				else {
					injection_gap = gap;
					break;
				}//end else
			}//end if
		}//end for

		if ( ! $injection_point ) {
			// Failed to inject
			return false;
		}// end if

		if ( $injection_point.is( 'li' ) ) {
			$injection_point.before( '<li class="injection-list-item"/>' );
			$injection_point.prev().append( injectable.$el );
		} else {
			$injection_point.before( injectable.$el );
		}//end else

		// if the injectable is the first element in the story, make sure it is on the right no matter what
		if (
			injectable.$el.hasClass( 'layout-box-insert-left' )
			&& (
				! injectable.$el.position().top
				|| ! injectable.$el.prev().length
			)
		) {
			injectable.$el.removeClass( 'layout-box-insert-left' ).addClass( 'layout-box-insert-right' );
		}//end if

		// determine if the left injection overlaps an element that should push it to the right
		// this is not super efficient, but we will be doing this rarely, so it's probably ok?

		if ( injectable.$el.hasClass( 'layout-box-insert-left' ) ) {
			var injectable_attrs = this.attributes( injectable.$el );

			var end = injection_gap.end < injectable_attrs.end ? injection_gap.end : injectable_attrs.end;

			if ( this.left_blocker_in_gap( $injection_point, end ) ) {
				injectable.$el.removeClass( 'layout-box-insert-left' ).addClass( 'layout-box-insert-right' );
			}//end if
		}//end if

		$( document ).trigger( 'go-contentwidgets-injected', {
			injected: injectable
		} );

		go_contentwidgets.log( 'end injecting injectable' );
	};

	go_contentwidgets.left_blocker_in_gap = function( $el, end ) {
		var tag;
		var injection_point = this.attributes( $el );

		var left_blockers = [
			'OL',
			'UL',
			'LI',
			'BLOCKQUOTE'
		];

		while ( injection_point.end <= end && injection_point.start < end ) {
			tag = injection_point.$el.prop( 'tagName' );

			if ( -1 !== $.inArray( tag, left_blockers ) ) {
				return true;
			}//end if

			injection_point = this.attributes( injection_point.$el.next() );
		}// end while

		tag = injection_point.$el.prop( 'tagName' );

		if ( -1 !== $.inArray( tag, left_blockers ) ) {
			return true;
		}//end if

		return false;
	};

	$( function() {
		go_contentwidgets.init();
		go_contentwidgets.events();
	});
})( jQuery );
