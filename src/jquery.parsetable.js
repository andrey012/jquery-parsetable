;(function ( $, window, document, undefined ) {

	"use strict";
		// Create the defaults once
		var pluginName = 'parseTable';
        var defaults = {
            pasteHeader: 'Paste your table here',
            pasteLabel: 'Paste table here (Ctrl-V)',
            pasteError: 'This contents does not look like a table',
            pasteOk: 'Ok',
            pasteCancel: 'Cancel',
            confirmHeader: 'Confirm, that information is good',
            confirmLabel: 'Following information was found:',
            confirmOk: 'Use this information',
            confirmCancel: 'Cancel',
            success: function(){alert('override me')},
            cancel: function(){}, // override me if you want to handle this event
		};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.element = element;
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				this.init();
		}

		// Avoid Plugin.prototype conflicts
		$.extend(Plugin.prototype, {
				init: function () {
                    var plugin = this;
                    $(this.element).click(function(){
                        plugin.showPasteDialog();
                        return false;
                    });
				},
				showPasteDialog: function (content, message) {
                    var plugin = this;
                    var dialog = $('<div><span style="color: red;"></span><iframe style="width: 100%"></iframe><div style="text-align: center;"><input type="button" name="ok" value="Ok"/><input type="button" name="cancel" value="Cancel"/></div></div>');
                    dialog.dialog({
                        modal: true,
                        minWidth: Math.max(600, Math.round($(window).width()*0.7)),
                        close: plugin.settings.cancel,
                        open: function(){plugin.fixOverlayZindex(dialog);},
                    });
                    var iframe = dialog.find('iframe')[0];
                    var doc;
                    if (iframe.contentDocument) doc = iframe.contentDocument;
                    else if (iframe.contentWindow) doc = iframe.contentWindow.document;
                    else if (iframe.document) doc = iframe.document;
                    doc.write ("<body style=\"margin: 0; padding: 0;\" CONTENTEDITABLE>Paste table here (Ctrl-V)</body>");
                    if (null != content){
                        doc.body.innerHTML = content;
                    }
                    if (null != message){
                        dialog.find('span').text(message);
                    }
                    dialog.find('input[name="cancel"]').click(function(){dialog.dialog('close');});
                    dialog.find('input[name="ok"]').click(function(){
                        plugin.parseTable(doc.body.innerHTML, dialog);
                    });
                    var previousContents = doc.body.innerHTML;
                    doc.body.focus();
                    doc.execCommand('selectAll', false, null);
                    var trackEsc = false;
                    doc.body.onkeydown = function(e){
                        if ((e.keyCode === 27) && !e.altKey && !e.ctrlKey && !e.shiftKey){
							trackEsc = true;
                        }
                    }
                    doc.body.onkeyup = function(e){
                        if ((e.keyCode === 27) && !e.altKey && !e.ctrlKey && !e.shiftKey && trackEsc){
                            dialog.dialog('close');
                        } else {
                        	trackEsc = false;
                        }
                        if (doc.body.innerHTML != previousContents)
                        {
                            previousContents = doc.body.innerHTML;
                            plugin.parseTable(previousContents, dialog);
                        }

                    };
				},
                parseTable: function(contents, dialog){
                    var plugin = this;
                    dialog.dialog('option', 'close', null);
                    dialog.dialog('close');
                    var parsedDialog = $('<div><table class="table table-bordered"><tbody></tbody></table><div style="text-align: center;"><input type="button" name="ok" value="Ok"/><input type="button" name="cancel" value="Cancel"/></div></div>');
                    var result = plugin.copyClipboardToArray(contents);
                    if (false === result){
                        this.showPasteDialog(contents, 'This contents does not look like a table');
                    } else {
                        var rowIndex;
                        var colIndex;
                        for (rowIndex in result){
                            var tr = $('<tr/>').appendTo(parsedDialog.find('tbody'));
                            for (colIndex in result[rowIndex]){
                                var td = $('<td/>').appendTo(tr);
                                td.text(result[rowIndex][colIndex]);
                            }
                        }
                        parsedDialog.dialog({
                            modal: true,
                            minWidth: Math.max(600, Math.round($(window).width()*0.7)),
                            close: function(){ plugin.showPasteDialog(contents); },
                            open: function(){plugin.fixOverlayZindex(parsedDialog);},
                        });
                        parsedDialog.find('input[name="ok"]').click(function(){
                            parsedDialog.dialog('option', 'close', null);
                            parsedDialog.dialog('close');
                            plugin.settings.success(result);
                        });
                        parsedDialog.find('input[name="cancel"]').click(function(){
                            parsedDialog.dialog('close');
                        });
                    }
                },
                copyClipboardToArray: function(content) {
                    var array1 = new Array();
                    var array2 = new Array();
                    var array3 = new Array();
                    var result = new Array();
                    var resultRow;
                    var nonEmpty;
                    var i;
                    var j;
                    var k;
                    if (/<table[^>]*>([\s\S]*)<\/table>/igm.test(content)) {
                        array1 = content.split(/<\/table>/i);

                        // we'll parse only first table

                        i = 0
                        array1[i] = array1[i].replace(/[\n\r]+/g, '');
                        array1[i] = array1[i].replace(/^.*[<]table[^>]*[>]/igm,'');
                        array1[i] = array1[i].replace(/[<]\/table[>].*$/igm,'');
                        array3 = [];
                        if (/<tr[^>]*>([\s\S]*)<\/tr>/igm.test(array1[i])) {
                            array3 = array1[i].split(/<\/tr>/i);
                            for (j = 0; j < array3.length; j++) {
                                resultRow = [];
                                nonEmpty = false;
                                array2 = [];
                                array3[j] = array3[j].replace(/<tbody[^>]*>/igm,'');
                                array3[j] = array3[j].replace(/<\/tbody>/igm,'');
                                array3[j] = array3[j].replace(/<tr[^>]*>/igm,'');
                                array3[j] = array3[j].replace(/<\/tr>/igm,'');
                                if (/<td[^>]*>([\s\S]*)<\/td>/igm.test(array3[j])) {
                                    array2 = array3[j].split(/<\/td>/i);
                                    for (k = 0; k < array2.length; k++) {
                                        array2[k] = array2[k].replace(/<\?xml[^>]*[>]/ig, '');
                                        array2[k] = array2[k].replace(/<\/?st1[:][^>]+[>]/g, '');
                                        array2[k] = array2[k].replace(/<td[^>]*>\s*/igm,'');
                                        array2[k] = array2[k].replace(/\s+$/igm,'');
                                        array2[k] = array2[k].replace(/<\/td>/igm,'');
                                        array2[k] = array2[k].replace(/line<\?[^\/>]*\/>/igm,'');
                                        array2[k] = array2[k].replace(/<p[^>]*>/igm,'\n');
                                        array2[k] = array2[k].replace(/<\/p>/igm,'');
                                        array2[k] = array2[k].replace(/<span[^>]*>/igm,'');
                                        array2[k] = array2[k].replace(/<\/span>/igm,'');
                                        array2[k] = array2[k].replace(/<o[^>]*>/igm,'');
                                        array2[k] = array2[k].replace(/<\/o[^>]*>/igm,'');
                                        array2[k] = array2[k].replace(/&nbsp[;]/g,' ');
                                        array2[k] = array2[k].replace(/<br\/?>/g,'\n');
                                        array2[k] = array2[k].replace(/[\r]/g, '');
                                        array2[k] = array2[k].replace(/^\n+/, '');
                                        array2[k] = array2[k].replace(/\n+$/, '');
                                        array2[k] = array2[k].replace(/\n[\n \t]*\n/g, '\n');
                                        array2[k] = array2[k].replace(/\n\s+/g, '\n');
                                        //array2[k] = array2[k].replace(/[\n]+/g, ' '); // uncomment this line to strip newlines inside cells at all
                                        array2[k] = array2[k].replace(/[ \t]+/g, ' ');
                                        array2[k] = array2[k].replace(/^\s+/g, '');
                                        array2[k] = array2[k].replace(/<colgroup[ >].*<\/colgroup>[ \r\n]*/g, '');
                                        array2[k] = array2[k].replace(/&amp;/g, '&');
                                        resultRow.push(array2[k]);
                                        if (array2[k].length > 0) nonEmpty = k;
                                    }
                                }
                                if (nonEmpty) {
                                    while (resultRow.length > (nonEmpty + 1)) {
                                        resultRow.pop();
                                    }
                                    result.push(resultRow);
                                }
                            }
                        }
                    } else {
                        return false;
                    }
                    return result;
                },
                fixOverlayZindex: function(dialog){
                    var max = 100;
                    var val;
                    $(this.element).parents().each(function(i,el){
                        val = parseInt($(el).css('z-index'));
                        if (val > max) max = val;
                    });
                    $('.ui-widget-overlay').css('z-index', max+1);
                    dialog.parent().css('z-index', max+2);
                },
        });

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				return this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}
				});
		};

})( jQuery, window, document );
