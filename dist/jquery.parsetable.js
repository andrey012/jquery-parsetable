/*
 *  jquery-parsetable - v0.0.8
 *  A jQuery plugin for capturing and parsing table data by copy-paste from text and spreadsheet editors directly to the form on web page.
 *  https://github.com/andrey012/jquery-parsetable.git
 *
 *  Made by Andrey Grinenko
 *  Under MIT License
 */
;(function ( $, window, document, undefined ) {

    'use strict';
        // Create the defaults once
        var pluginName = 'parseTable';
        var defaults = {
            pasteHeader: 'Paste your table here',
            pasteLabel: 'Paste table here (Ctrl-V)',
            pasteError: 'This contents does not look like a table',
            pasteOk: 'Ok',
            pasteCancel: 'Cancel',
            confirmHeaderSingle: 'Confirm, that information is good',
            confirmHeaderMultiple: 'Choose one of found tables',
            confirmLabelSingle: 'Following information was found, check it and confirm:',
            confirmLabelMultiple: 'Following information was found, choose correct one, check it and confirm:',
            confirmOk: 'Use this information',
            confirmCancel: 'Cancel',
            wait: 'Wait...',
            success: function(){
                alert('override me');
            },
            cancel: function(){}, // override me if you want to handle this event
            postProcess: function(data){
                return data;
            }
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
                    var dialog = $('<div><div></div><span style="color: red;"></span><iframe style="width: 100%"></iframe><div style="text-align: center;"><input type="button" name="ok" value=""/><input type="button" name="cancel" value=""/></div></div>');
                    dialog.dialog({
                        title: plugin.settings.pasteHeader,
                        modal: true,
                        minWidth: Math.max(600, Math.round($(window).width()*0.7)),
                        close: plugin.settings.cancel,
                        open: function(){plugin.fixOverlayZindex(dialog);},
                    });
                    var iframe = dialog.find('iframe')[0];
                    var doc;
                    if (iframe.contentDocument) {
                        doc = iframe.contentDocument;
                    } else if (iframe.contentWindow) {
                        doc = iframe.contentWindow.document;
                    } else if (iframe.document) {
                        doc = iframe.document;
                    }
                    doc.write ('<body style="margin: 0; padding: 0;" CONTENTEDITABLE>');
                    if (null != content){
                        doc.body.innerHTML = content;
                    } else {
                        doc.body.innerHTML = plugin.settings.pasteLabel;
                    }
                    if (null != message){
                        dialog.find('span').text(message);
                    }
                    dialog
                        .find('input[name="cancel"]')
                        .val(plugin.settings.pasteCancel)
                        .click(function(){
                            dialog.dialog('close');
                        });
                    dialog
                        .find('input[name="ok"]')
                        .val(plugin.settings.pasteOk)
                        .click(function(){
                            plugin.parseTable(doc.body.innerHTML, dialog);
                        });
                    var previousContents = doc.body.innerHTML;
                    doc.body.focus();
                    doc.execCommand('selectAll', false, null);
                    var trackEsc = false;
                    doc.body.onkeydown = function(e){
                        if ((e.keyCode === 27) && !e.altKey && !e.ctrlKey && !e.shiftKey){
                            if (dialog.is(':visible')){
                                trackEsc = true;
                            }
                        }
                    };
                    doc.body.onkeyup = function(e){
                        if ((e.keyCode === 27) && !e.altKey && !e.ctrlKey && !e.shiftKey && trackEsc){
                            dialog.dialog('close');
                            trackEsc = false;
                        } else {
                            trackEsc = false;
                        }
                        if (doc.body.innerHTML !== previousContents)
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
                    var parsedDialog = $('<div><span></span></div>');
                    parsedDialog.dialog({
                        title: plugin.settings.wait,
                        modal: true,
                        minWidth: Math.max(600, Math.round($(window).width()*0.7)),
                        close: function(){ 
                            plugin.showPasteDialog(contents); 
                        },
                        open: function(){
                            plugin.fixOverlayZindex(parsedDialog);
                            setTimeout(function(){
                                var result = plugin.copyClipboardToArray(contents);
                                result = plugin.settings.postProcess(result);
                                if (false === result){
                                    parsedDialog.dialog('option', 'close', null);
                                    parsedDialog.dialog('close');
                                    plugin.showPasteDialog(contents, plugin.settings.pasteError);
                                } else {
                                    var tableIndex;
                                    var rowIndex;
                                    var colIndex;
                                    var lineIndex;
                                    var lines;
                                    var cell;
                                    var count = 0;
                                    var i;
                                    for (tableIndex in result){
                                        if (result[tableIndex].length === 0) {
                                            continue;
                                        }
                                        count ++;
                                        var div = $('<div/>').appendTo(parsedDialog);
                                        var table = $('<table class="table table-bordered"/>').appendTo(div);
                                        $('<div style="text-align: center;"><input type="button" name="ok" value=""/><input type="button" name="cancel" value=""/></div>').appendTo(div);
                                        div.find('input[name="ok"]').val(plugin.settings.confirmOk);
                                        div.find('input[name="cancel"]').val(plugin.settings.confirmCancel);
                                        div.find('input[name="ok"]').attr('data-tableindex', tableIndex);
                                        var tbody = $('<tbody/>').appendTo(table);
                                        var maxCells = 0;
                                        for (rowIndex in result[tableIndex]){
                                            maxCells = Math.max(maxCells, result[tableIndex][rowIndex].length);
                                        }
                                        for (rowIndex in result[tableIndex]){
                                            var tr = $('<tr/>').appendTo(tbody);
                                            for (i = result[tableIndex][rowIndex].length; i < maxCells; i++){
                                                result[tableIndex][rowIndex].push('');
                                            }
                                            for (colIndex in result[tableIndex][rowIndex]){
                                                var td = $('<td/>').appendTo(tr);
                                                cell = result[tableIndex][rowIndex][colIndex];
                                                if ('undefined' === typeof cell) {
                                                    cell = '';
                                                }
                                                if ('string' !== typeof cell) {
                                                    cell = '' + cell;
                                                }
                                                result[tableIndex][rowIndex][colIndex] = cell;
                                                lines = cell.split('\n');
                                                for (lineIndex in lines){
                                                    $('<p/>').appendTo(td).text(lines[lineIndex]);
                                                }
                                            }
                                        }
                                    }
                                    parsedDialog.find('span').text((count <= 1) ?
                                        plugin.settings.confirmLabelSingle :
                                        plugin.settings.confirmLabelMultiple
                                    );
                                    parsedDialog.dialog('option', 'title', 
                                        (count <= 1) ?
                                            plugin.settings.confirmHeaderSingle :
                                            plugin.settings.confirmHeaderMultiple
                                    );
                                    parsedDialog.find('input[name="ok"]').click(function(){
                                        parsedDialog.dialog('option', 'close', null);
                                        parsedDialog.dialog('close');
                                        plugin.settings.success(result[this.getAttribute('data-tableindex')]);
                                    });
                                    parsedDialog.find('input[name="cancel"]').click(function(){
                                        parsedDialog.dialog('close');
                                    });
                                    parsedDialog.find('input[name="ok"]').each(function(i,el){
                                        el.scrollIntoView();
                                        return false;
                                    });
                                }
                            }, 0);
                        }
                    });
                },
                copyClipboardToArray: function(content) {
                    var array1 = [];
                    var array2 = [];
                    var array3 = [];
                    var result = [];
                    var resultTable;
                    var resultRow;
                    var nonEmpty;
                    var i;
                    var j;
                    var k;
                    if (/<table[^>]*>([\s\S]*)<\/table>/igm.test(content)) {
                        array1 = content.split(/<\/table>/i);
                        for (i = 0; i < array1.length; i++){
                            resultTable = [];
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
                                            array2[k] = array2[k].replace(/<font[^>]*>/g, '');
                                            array2[k] = array2[k].replace(/<\/font>/g, '');
                                            array2[k] = array2[k].replace(/<b>/g, '');
                                            array2[k] = array2[k].replace(/<\/b>/g, '');
                                            array2[k] = array2[k].replace(/<strong>/g, '');
                                            array2[k] = array2[k].replace(/<\/strong>/g, '');
                                            array2[k] = array2[k].replace(/&amp;/g, '&');
                                            resultRow.push(array2[k]);
                                            if (array2[k].length > 0) {
                                                nonEmpty = k;
                                            }
                                        }
                                    }
                                    if (nonEmpty !== false) {
                                        while (resultRow.length > (nonEmpty + 1)) {
                                            resultRow.pop();
                                        }
                                        resultTable.push(resultRow);
                                    }
                                }
                            }
                            result.push(resultTable);
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
                        if (val > max) {
                            max = val;
                        }
                    });
                    $('.ui-widget-overlay').css('z-index', max+1);
                    dialog.parent().css('z-index', max+2);
                },
        });

        // A really lightweight plugin wrapper around the constructor,
        // preventing against multiple instantiations
        $.fn[ pluginName ] = function ( options ) {
                return this.each(function() {
                        if ( !$.data( this, 'plugin_' + pluginName ) ) {
                                $.data( this, 'plugin_' + pluginName, new Plugin( this, options ) );
                        }
                });
        };

})( jQuery, window, document );
