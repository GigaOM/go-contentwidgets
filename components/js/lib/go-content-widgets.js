var go_content_widgets = {
	insert: [],
	inventory: {
		p: [],
		blackouts: [],
		gaps: [],
		spaces: []
	},
	layout_strategy: {},
	non_blockers: [ 'blockquote', 'h1,h2,h3,h4,h5,h6' ]
};

(function( $ ) {
	'use strict';

	go_content_widgets.init = function( auto_inject ) {
		this.$body = $( '.post section.body.entry-content' );
		this.$content = this.$body.find( '> div' );
		this.$alignleft = this.$content.find( '.alignleft' );
		this.$alignright = this.$content.find( '.alignright' );
		this.$widgets = $( '#sidebar > div' );

		// @TODO: the following CSS rules should be ported to the base theme
		this.$body.css( 'overflow', 'visible' );
		this.$content.css( 'position', 'relative' );
		this.$alignleft.css( 'margin-left', '-112px' );
		this.$alignright.css( 'margin-right', '-172px' );
		this.$alignleft.css( 'border-right', '1.25rem solid #fff' );
		this.$alignleft.css( 'border-left', '1.25rem solid #fff' );

		$( 'body' ).addClass( 'go-content-widgets' );

		this.$widgets.each( function() {
			var id = $( this ).attr( 'id' );

			$( this ).addClass( 'layout-box-insert' ); // @todo, this may not be needed long term, but for now it makes the CSS easier
			$( this ).addClass( 'layout-box-insert-right' );

			go_content_widgets.insert.push( {
				name: id,
				$el: $( this ),
				height: parseInt( $( this ).outerHeight( true ) * 0.9, 10 )
			} );
		} );

		// @TODO: pull these from the sidebar widget area
		/*
		this.insert.adb = {
			name: 'Ad 300x250 B',
			$el: this.generate_box( {
				name: 'Ad 300x250 B',
				html_id: 'adB',
				element_id: 'adb',
				height: '266px',
				color: 'red',
				location: 'right'
			} ),
			height: 260 // set to the required height, not the actual height
		};
		*/

		this.css = '<style class="layout-box-css">' +
			'.go-content-widgets #body {' +
				'float: none;' +
				'left: -48px;' +
				'margin: 0 auto;' +
				'position: relative;' +
			'}' +
			'.go-content-widgets .post {' +
				'width: 624px;' +
			'}' +
			'.go-content-widgets .entry-content {' +
				'font-size: 1.125rem;' +
				'line-height: 26px;' +
			'}' +
			'.go-content-widgets .entry-content p {' +
				'margin-bottom: 24px;' +
			'}' +
			'.go-content-widgets #sidebar {' +
				'opacity: 0.075;' +
				'position: absolute;' +
				'right: 0;' +
				'top: 0;' +
			'}' +
			'.layout-box-thing {' +
				'position: absolute;' +
				'width: 100%;' +
			'}' +
			'.layout-box-thing div {' +
				'bottom: 0;' +
				'color: white;' +
				'font-size: 1.5rem;' +
				'max-height: 3em;' +
				'left: 0;' +
				'line-height: 1.5em;' +
				'margin: auto;' +
				'position: absolute;' +
				'right: 0;' +
				'text-align: center;' +
				'top: 0;' +
			'}' +
			 '.layout-box-insert div {' +
			 	'text-align: center;' +
			 	'margin-top: 1em;' +
			 	'font-size: 1.5em;' +
			 	'color: white' +
			 '}' +
			'.layout-box-insert {' +
				'margin-bottom: 1rem;' +
				'width:300px;' +
			'}' +
			'.layout-box-insert.layout-box-insert-right {' +
				'float: right;' +
				'margin-left: 1.5rem;' +
				'margin-right: -172px;' +
			'}' +
			'.layout-box-insert.layout-box-insert-left {' +
				'float: left;' +
				'margin-left: -112px;' +
				'margin-right: 1.5rem;' +
			'}' +
			'.inject-point {' +
				'background: green;' +
			'}' +
		'</style>';

		$( '.layout-box-thing, .layout-box-css, .layout-box-insert' ).remove();
		this.$content.before( this.css );

		this.calc();
		this.auto_inject();
	};

	// @TODO: remove this function once we are pulling from the widget area for elements
	go_content_widgets.generate_box = function( args ) {
		return $( '<div id="' + args.html_id + '" data-element="' + args.element_id + '" class="layout-box-insert layout-box-insert-' + args.location + '" style="height:' + args.height + ';background:' + args.color + '"><div>' + args.name + '</div></div>' );
	};

	/**
	 * auto injects items in order
	 */
	go_content_widgets.auto_inject = function() {
		for ( var key in go_content_widgets.insert ) {
			go_content_widgets.inject_item( go_content_widgets.insert[ key ] );
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
		var margin_bottom = $el.css( 'margin-bottom' );

		margin_top = parseInt( margin_top.replace( 'px', '' ), 10 );
		margin_bottom = parseInt( margin_bottom.replace( 'px', '' ), 10 );

		var top = parseInt( $el.position().top, 10 );
		var height = parseInt( $el.outerHeight( true ), 10 );
		top -= margin_top;
		var end = top + height;

		var data = {
			$el: $el,
			start: top,
			end: end,
			height: height,
			margin_top: margin_top,
			margin_bottom: margin_bottom
		};

		return data;
	};

	go_content_widgets.overlay = function( $el, start, height, color, type, additional_text ) {
		additional_text = typeof additional_text !== 'undefined' ? '<br/>' + additional_text : '';

		var $overlay = $( '<div class="layout-box-thing ' + type + '" style="background: ' + color + ';top:' + start + 'px;height:' + height + 'px;"><div>' + height + 'px tall' + additional_text + '</div></div>' );
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
		$( '.layout-box-thing' ).remove();
		this.inventory = {
			p: [],
			blackouts: [],
			gaps: [],
			spaces: []
		};
		$( '.inject-point' ).removeClass( 'inject-point' );
	};

	go_content_widgets.calc = function() {
		this.reset();

		// find things (not sure what we are using this for)
		this.$content.find( '> p, > ol, > ul' ).each( function() {
			var $el = $( this );
			var attr = go_content_widgets.attributes( $el );
			go_content_widgets.inventory.p.push( attr );
		});

		this.identify_blackouts();

		this.identify_gaps();
	};

	go_content_widgets.identify_blackouts = function() {
		// find top level blackouts
		this.$content.find( '> *:visible:not(p):not(ol):not(ul):not(script)' ).each( function() {
			var $el = $( this );

			for ( var i in this.non_blockers ) {
				if ( $el.is( this.non_blockers[ i ] ) ) {
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
		for ( var i in this.inventory.blackouts ) {
			var blackout = this.inventory.blackouts[ i ];
			blackout.ref = go_content_widgets.get_element_type( blackout.$el );
			if ( blackout.is_child ) {
				blackout.$overlay = this.overlay( blackout.$el.closest( 'p' ), blackout.start, blackout.height, 'rgba( 0, 0, 0, 0.5 )', 'blackout', blackout.ref );
			}// end if
			else {
				blackout.$overlay = this.overlay( blackout.$el, blackout.start, blackout.height, 'rgba( 0, 0, 0, 0.5 )', 'blackout', blackout.ref );
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
			for ( i in this.inventory.blackouts ) {
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

			// execute common code on gaps
			for ( i in this.inventory.gaps ) {
				gap = this.inventory.gaps[ i ];

				gap.$first_el.addClass( 'inject-point' );
			}
		}//end else
	};

	go_content_widgets.inject_item = function( item ) {
		var $element = null;

		for ( var i in this.inventory.gaps ) {
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
			//console.info( 'Failed to inject ' + item.name );
			return false;
		}// end if

		//console.info( 'successfully injected ' + item.name + ' into a ' + $element[0].outerHTML );

		var injected = $element.before( item.$el );

		$( document ).trigger( 'gigaom-layout-test-injected', {
			injected: item
		} );

		return injected;
	};

	go_content_widgets.get_tag_ref = function( $el ) {
		var ref = $el.prop( 'tagName' ).toLowerCase();

		var id = $el.attr( 'id' );
		if ( id ) {
			ref += '#' + id;
		}//end if

		var classes = $el.attr( 'class' );
		if ( classes ) {
			ref += '.' + classes.replace(/ /g, '.' );
		}//end if

		return ref;
	};

	go_content_widgets.get_element_type = function( $el ) {
		var alignment;
		var id;
		var tagname;
		var classes;

		if ( $el.is( '.pullquote' ) ) {
			return 'pullquote';
		}//end if

		id = $el.attr( 'id' );

		if ( id && id.match( /attachment_/g ) ) {
			alignment = '';
			if ( $el.is( '.aligncenter' ) ) {
				alignment = 'centered';
			}//end if
			else if ( $el.is( '.alignleft' ) ) {
				alignment = 'left';
			}//end else if
			else if ( $el.is( '.alignright' ) ) {
				alignment = 'right';
			}//end else if
			return 'attachment ' + alignment;
		}//end if

		if ( $el.is( '.layout-box-insert' ) ) {
			return id;
		}//end if

		tagname = $el.prop( 'tagName' ).toLowerCase();
		if ( tagname.match( /^h[0-9]$/ ) ) {
			return 'heading';
		}//end if

		if ( 'iframe' === tagname ) {
			return 'iframe';
		}//end if
		if ( 'blockquote' === tagname ) {
			return 'blockquote';
		}//end if
		if ( 'img' === tagname ) {
			alignment = '';
			if ( $el.is( '.aligncenter' ) ) {
				alignment = 'centered';
			}//end if
			else if ( $el.is( '.alignleft' ) ) {
				alignment = 'left';
			}//end else if
			else if ( $el.is( '.alignright' ) ) {
				alignment = 'right';
			}//end else if

			return 'image ' + alignment;
		}//end if

		classes = '.' + $el.prop( 'class' ).replace( / /g, '.' );
		if ( classes.match( /\.embed-/g ) ) {
			return 'embed';
		}//end if

		return go_content_widgets.get_tag_ref( $el );
	};

	$( function() {
		go_content_widgets.init();
	});
})( jQuery );
