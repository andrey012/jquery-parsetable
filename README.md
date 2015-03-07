# jQuery Parse Table Plugin [![Build Status](https://secure.travis-ci.org/andrey012/jquery-parsetable.svg?branch=master)](https://travis-ci.org/andrey012/jquery-parsetable)

This is simple jQuery plugin, which handles capturing and parsing copy-pasted data from spreadsheet and text editors, pasted into the contenteditable iframe.

It requires jQuery, jQuery UI and at the moment is styled using table style from Bootstrap.

Simplicity of integration was main goal:

```
<a id="test" href="#">test link</a>
<script>
    jQuery("#test").parseTable({
        success: function(data){
            alert(data);
        },
        cancel: function(){
            alert('cancelled');
        },
    });
</script>
```

```data``` is 2-dimentional array with lines and cells of parsed data.


Each of the editors has its own style and HTML formatting, so if it happens, that your data is not parsed  correctly - try to cut out raw HTML of pasted data, add pair of files to demo/data folder and create pull request.
