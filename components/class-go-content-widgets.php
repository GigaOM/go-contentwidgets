<?php

class GO_Content_Widgets
{
}//end class

function go_content_widgets()
{
	global $go_content_widgets;

	if ( $go_content_widgets )
	{
		$go_content_widgets = new GO_Content_Widgets;
	}//end if

	return $go_content_widgets;
}//end go_content_widgets
