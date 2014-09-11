/*
"Mashmon" is a JavaScript helper for creating simple HTML mashup pages.
Copyright (C) 2010, Vytautas Krakauskas

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

//Default settings
var default_elements=3;
var default_speed="normal";
var default_interval=0; //0 = disabled

// Reload the object
function reload(obj) {
		if (!obj.hasClass("static")) {
			if (obj.hasClass("snippet")) {
				snippet(obj)
			} else {
				obj.find('.snippet').each(function() {
					snippet(this);
				});
				obj.find("img").each(function() {
					// Add a timestamp to force the reload
					var origin = $(this).data("src");
					if (!! origin) {
						this.src=origin+"#"+$.now();
					}
				});
			}
		}
}

// Does a single sliding action on an object
function slide(obj)
{
	var elements=$(obj).data("elements")?parseInt($(obj).data("elements")):default_elements;
	var speed=$(obj).data("speed")?$(obj).data("speed"):default_speed;
	var prop = $(obj).hasClass("vertical") ? "height" : "width";
	var action = {};

	//hide the first child and then move it to the end
	action[prop]="hide";
	$(obj).children(".element:first").animate(action, speed, function() {
		$(this).appendTo($(this).parent());
	});

	//show last element and then reload a next one
	action[prop]="show";
	$(obj).children(".element:eq("+elements+")").animate(action, speed, function()	{
		reload($(this).next(".element"));
	});
}

// Does a single fading action on an object
function fade(obj)
{
	var speed=$(obj).data("speed")?$(obj).data("speed"):default_speed;

	// hide first element and move it to the end
	var child = $(obj).children(".element:first");
	child.fadeOut(speed, function() { $(this).appendTo($(this).parent()); });

	// show next element
	var next = child.next(".element");
	next.fadeIn(speed, function() {
		reload($(this).next(".element"));
	});
}

// http://domain/dir part of http://domain/dir/file
function dirname(path)
{
	return path.match(/(.*)\/.*?$/)[1];
}

// http://domain part of http://domain/dir/file
function domainname(path)
{
	return path.match(/^(\w+:\/\/[\w-.]+)\/.*$/)[1];
}

//replace the base part in a src attribute
function changeSrcBase(obj, src)
{
	base=dirname(document.URL);
	if (obj.src.search(base) != -1)
		//full baseURI, means path is relative
		obj.src=obj.src.replace(base, dirname(src));
	else
		//if full baseURI was not found, maybe an absolute path was specified for the element (e.g. src="/something")
		obj.src=obj.src.replace(domainname(obj.src), domainname(src));
}

//replace the base part in a href attibute
function changeHrefBase(obj, src)
{
	base=dirname(document.URL);
	if (obj.href.search(base) != -1)
		//full baseURI, means path is relative
		obj.href=obj.href.replace(base, dirname(src));
	else
		//if full baseURI was not found, maybe an absolute path was specified for the element (e.g. href="/something")
		obj.href=obj.href.replace(domainname(obj.href), domainname(src));
}

//handle snuppet objects
function snippet(obj)
{
	var src=$(obj).data("src");
	var proxy=$(obj).data("proxy");
	//if proxy is used, replace domain with it (for cross domain requests)
	var url=proxy?proxy+src.replace(domainname(src), ""):src;
	$.get(
		url,
		$.proxy
		(
			function(data)
			{
				//filter elements from page
				var filter=$(this).data("filter");
				if (filter)
					var obj=$("<div>"+data+"</div>").find(filter);
				else
					var obj=$("<div>"+data+"</div>");

				//return original baseURIs of images and links if a proxy was used
				if (proxy)
				{
					obj.parent().find("img").each(function(){ changeSrcBase(this, src) });
					obj.parent().find("a").each(function(){ changeHrefBase(this, src) });
				}

				$(this).html(obj);
			},
			$(obj)
		)
	)
}

// Initial calls
$(function()
{
	//Activate slides
	$(".slide").each(function()
	{
		//Initial hide
		var elements=$(this).data("elements")?parseInt($(this).data("elements")):default_elements;
		$(this).children(".element:gt("+(elements-1)+")").hide();

		//Activate intervals
		function interval_context(context)
		{
			var interval=$(context).data("interval")?$(context).data("interval"):default_interval;
			if (interval>0)
				setInterval(function() {
					if ($(context).is(":visible")) slide(context);
				}, interval*1000);
		}
		new interval_context(this);

		//Save original image src
		if (!$(this).hasClass("static"))
			$(this).find("img").each(function() { $(this).data("src", this.src); });
	});

	//Activate fades
	$(".fade").each(function()
	{
		//fix elements positions
		$(this).css({'position': 'relative'});
		$(this).children(".element").each(function() { $(this).css({'position': 'absolute', 'top': '0', 'left': '0'}); });

		//Initial hide
		$(this).children(".element:gt(0)").hide();

		//Activate intervals
		function interval_context(context)
		{
			var interval=$(context).data("interval")?$(context).data("interval"):default_interval;
			if (interval>0)
				setInterval(function() {
					if ($(context).is(":visible")) fade(context);
				}, interval*1000);
		}
		new interval_context(this);

		//Save original image src
		if (!$(this).hasClass("static"))
			$(this).find("img").each(function() { $(this).data("src", this.src); });
	});

	//Activate snippets
	$(".snippet").each(function()
	{
		snippet(this);
		function interval_context(context) {
			var interval=$(context).data("interval")?$(context).data("interval"):default_interval;
			if (interval>0)
				setInterval(function() { snippet(context) }, interval*1000);
		};
		new interval_context(this);
	});
});
