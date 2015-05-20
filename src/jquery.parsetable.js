/**
 * The jQuery core object
 * @external jQuery
 * @see {@link http://api.jquery.com/jQuery/}
 */

/**
 * The jQuery plugin namespace.
 * @external "jQuery.fn"
 * @name "jQuery.fn"
 * @memberof external jQuery
 * @see {@link http://learn.jquery.com/plugins/|jQuery Plugins}
 */

/** @namespace ParseTablePlugin */

/**
 * Anonymous jQuery plugin wrapper function
 * @function ParseTablePlugin~parseTablePluginWrapper
 * @param {external:jQuery} $ jQuery core object
 * @param {Window} window window object
 * @param {HTMLElement} document document object
 * @param {undefined} undefined used to have ethalon of undefined
 */
;(function ( $, window, document, undefined ) {

    'use strict';
    /**
     * @constant {string}
     * @default
     */
    var pluginName = 'parseTable';

    /**
     * @callback ParseTablePlugin~onSuccess Called when user chooses one of parsed tables and 
     * confirms, that this is data, that he likes
     * @param {Array.<Array.<string|number>>} data Array of rows, each row is array of 
     * cell values - either strings or numbers. Newlines are always single \n.
     */

    /**
     * @callback ParseTablePlugin~onCancel Called when user cancels ParseTable dialog
     */
    
    /**
     * @callback ParseTablePlugin~onPostProcess Called after table is parsed and before 
     * result is shown to user for confirmation. You can handle this callback and modify 
     * data on the fly. 
     * @param {Array.<Array.<Array.<string|number>>>} data Array of found tables, each table is 
     * array of rows, each row is array of cell values - either strings or numbers. 
     * Newlines are always single \n.
     * @returns {Array.<Array.<Array.<string|number>>>} same as data argument
     */

    /**
     * @class ParseTablePlugin~Settings
     */
    var defaults = {
        /**
         * Text for dialog header
         * @member {string} ParseTablePlugin~Settings#pasteHeader
         * @default 'Paste your table here'
         */
        pasteHeader: 'Paste your table here',
        /**
         * Text for textarea placeholder
         * @member {string} ParseTablePlugin~Settings#pasteLabel
         * @default 'Paste table here (Ctrl-V)'
         */
        pasteLabel: 'Paste table here (Ctrl-V)',
        /**
         * Text for hint under the textarea
         * @member {string} ParseTablePlugin~Settings#pasteHint
         * @default 'You can paste mixed data with several tables, just do Ctrl-A Ctrl-C Ctrl-V from your document'
         */
        pasteHint: 'You can paste mixed data with several tables, just do Ctrl-A Ctrl-C Ctrl-V from your document',
        /**
         * Text for message, that is shown if pasted content is not a table
         * @member {string} ParseTablePlugin~Settings#pasteError
         * @default 'This contents does not look like a table'
         */
        pasteError: 'This contents does not look like a table',
        /**
         * Text for Ok button on dialog with textarea. This button is rarely used, because
         * dialog submits immediately after table is pasted, but still this button
         * is there for better UX - user should understand the outcome.
         * @member {string} ParseTablePlugin~Settings#pasteOk
         * @default 'Ok'
         */
        pasteOk: 'Ok',
        /**
         * Text for Cancel button on dialog with textarea.
         * @member {string} ParseTablePlugin~Settings#pasteCancel
         * @default 'Cancel'
         */
        pasteCancel: 'Cancel',
        /**
         * Text for confirmation dialog in case if only one table was found.
         * @member {string} ParseTablePlugin~Settings#confirmHeaderSingle
         * @default 'Confirm, that information is good'
         */
        confirmHeaderSingle: 'Confirm, that information is good',
        /**
         * Text for for confirmation dialog in case if several tables were found.
         * @member {string} ParseTablePlugin~Settings#confirmHeaderMultiple
         * @default 'Choose one of found tables'
         */
        confirmHeaderMultiple: 'Choose one of found tables',
        /**
         * Text for hint on confirmation dialog in case if only one table was found
         * @member {string} ParseTablePlugin~Settings#confirmLabelSingle
         * @default 'Following information was found, check it and confirm:'
         */
        confirmLabelSingle: 'Following information was found, check it and confirm:',
        /**
         * Text for hint on confirmation dialog in case if several tables were found
         * @member {string} ParseTablePlugin~Settings#confirmLabelMultiple
         * @default 'Following information was found, choose correct one, check it and confirm:'
         */
        confirmLabelMultiple: 'Following information was found, choose correct one, check it and confirm:',
        /**
         * Text for confirmation button on confirmation dialog. This button will appear once for
         * each found table.
         * @member {string} ParseTablePlugin~Settings#confirmOk
         * @default 'Use this information'
         */
        confirmOk: 'Use this information',
        /**
         * Text for Cancel button on confirmation dialog.
         * @member {string} ParseTablePlugin~Settings#confirmCancel
         * @default 'Cancel'
         */
        confirmCancel: 'Cancel',
        /**
         * Text for "progress" dialog, that will appear, if parsing takes long time
         * @member {string} ParseTablePlugin~Settings#wait
         * @default 'Please wait...'
         */
        wait: 'Please wait...',
        /**
         * Callback for successful action - when user finally clicks "Use this information" button
         * This property should be overriden (otherwise plugin is rather useless)
         * @member {ParseTablePlugin~onSuccess} ParseTablePlugin~Settings#success
         * @default alert('override me');
         */
        success: function(){
            alert('override me');
        },
        /**
         * Callback for cancel action. This property is optional. You will sometimes
         * need this callback when you track user behaviour - when user closes pasteTable dialog
         * @member {ParseTablePlugin~onCancel} ParseTablePlugin~Settings#cancel
         * @default does nothing
         */
        cancel: function(){},
        /**
         * Optional callback, can be used to process data after table was parsed and before
         * it is shown to user.
         * @member {ParseTablePlugin~onPostProcess} ParseTablePlugin~Settings#postProcess
         * @default return data;
         */
        postProcess: function(data){
            return data;
        },
        /**
         * Whether to open dialog immediately after page loads.
         * @member {boolean} ParseTablePlugin~Settings#openOnPageLoad
         * @default false
         */
        openOnPageLoad: false,
        /**
         * Allow new lines in result data. If set to false, then newlines will be replaced with 
         * single space char
         * @member {boolean} ParseTablePlugin~Settings#allowNewLines
         * @default true
         */
        allowNewLines: true
    };

    /**
     * @class ParseTablePlugin~Plugin
     */
    function Plugin ( element, options ) {
            this.element = element;
            this.settings = $.extend( {}, defaults, options );
            this._defaults = defaults;
            this._name = pluginName;
            this.init();
    }

    $.extend(Plugin.prototype, {
        /**
         * Adds click event handler to target element -- to call 
         * ParseTablePlugin~Plugin#showPasteDialog
         * If {@link ParseTablePlugin~Settings#openOnPageLoad} is set to true 
         * then adds another handler on $(document).ready -- same action
         * @function ParseTablePlugin~Plugin#init
         */
        init: function () {
            var plugin = this;
            $(this.element).click(function(){
                plugin.showPasteDialog();
                return false;
            });
            if (plugin.settings.openOnPageLoad){
                var element = this.element;
                $(document).ready(function(){
                    if ($(element).is(':visible')){
                        plugin.showPasteDialog();
                    }
                });
            }
        },
        /**
         * Shows paste dialog (dialog with textarea)
         * @function ParseTablePlugin~Plugin#showPasteDialog
         * @param {string} [content] Some HTML content to show in textarea 
         * This is used when user clicks "Cancel" button on confirmation
         * dialog, or when table can not be parsed
         * @param {string} [message] Text for red message on paste dialog (error message)
         */
        showPasteDialog: function (content, message) {
            var plugin = this;
            // initialize dialog
            var dialog = $('<div><div></div><span style="color: red;"></span><div style="margin-bottom: -50px; height: 50px; width: 100%; text-align: center; font-size: 2em; opacity: 0.3;"></div><iframe style="width: 100%"></iframe><div style="text-align: center;"><span></span><br/><input type="button" name="ok" value=""/><input type="button" name="cancel" value=""/></div></div>');
            dialog.dialog({
                title: plugin.settings.pasteHeader,
                modal: true,
                minWidth: Math.max(600, Math.round($(window).width()*0.7)),
                // call cancel callback
                close: function() { plugin.settings.cancel(); },
                // jQueryUI has some fixed overlay z-index. This function traverses through
                // elements looking for topmost z-index and puts our dialog's z-index a bit
                // higher
                open: function(){plugin.fixOverlayZindex(dialog);},
            });
            dialog.find('div ~ span ~ div:first').text(plugin.settings.pasteLabel);
            dialog.find('div:last > span').text(plugin.settings.pasteHint);
            var iframe = dialog.find('iframe')[0];
            var doc;
            if (iframe.contentDocument) {
                doc = iframe.contentDocument;
            } else if (iframe.contentWindow) {
                doc = iframe.contentWindow.document;
            } else if (iframe.document) {
                doc = iframe.document;
            }
            // create CONTENTEDITABLE iframe
            doc.write ('<body style="margin: 0; padding: 0;" CONTENTEDITABLE>');
            if (null != content){
                doc.body.innerHTML = content;
                dialog.find('span').after('<a href="#" style="opacity: 0;">debug</a>');
                dialog.find('a').click(function(){
                    dialog.find('a').after('<br/>Debug information:<br/>Base64 of HTML:<br/><input type="text" onclick="this.select()" name="debug_base64" style="width: 100%" readonly="readonly"/><br/>HTML:<br/><textarea onclick="this.select()" name="debug_html" style="width: 100%; height: 150px;" readonly="readonly"></textarea>');
                                dialog.find('input[name="debug_base64"]').val(btoa(content));
                                dialog.find('textarea[name="debug_html"]').val(content);
                });

            }
            if (null != message){
                dialog.find('span').text(message);
            }
            // handle Cancel button - close dialog. Settings#cancel callback will be 
            // called by jQueryUI due to close property of dialog settings
            dialog
                .find('input[name="cancel"]')
                .val(plugin.settings.pasteCancel)
                .click(function(){
                    dialog.dialog('close');
                });
            // handle Ok button - proceed to parsing table
            dialog
                .find('input[name="ok"]')
                .val(plugin.settings.pasteOk)
                .click(function(){
                    plugin.parseTable(doc.body.innerHTML, dialog);
                });
            // used to track user behaviour on a dirty checking basis
            var previousContents = doc.body.innerHTML;
            // focus and select content right away to make it possible use
            // Ctrl-V without extra clicks
            doc.body.focus();
            doc.execCommand('selectAll', false, null);
            // track Esc button and close dialog when Esc is pressed
            var trackEsc = false;
            doc.body.onkeydown = function(e){
                if ((e.keyCode === 27) && !e.altKey && !e.ctrlKey && !e.shiftKey){
                    if (dialog.is(':visible')){
                        trackEsc = true;
                    }
                }
            };
            doc.body.onkeyup = function(e){
                // Esc handler
                if ((e.keyCode === 27) && !e.altKey && !e.ctrlKey && !e.shiftKey && trackEsc){
                    dialog.dialog('close');
                    trackEsc = false;
                } else {
                    trackEsc = false;
                }
                // dirty check on content. If content changes - proceed to parseTable
                if (doc.body.innerHTML !== previousContents)
                {
                    previousContents = doc.body.innerHTML;
                    plugin.parseTable(previousContents, dialog);
                }

            };
        },
        /**
         * Parses table using ParseTablePlugin~Plugin#parseHTMLTable function and shows confirmation dialog
         * @function ParseTablePlugin~Plugin#parseTable
         * @param {string} contents HTML of WYSIWYG CONTENTEDITABLE iframe
         * @param {Dialog} dialog existing dialog.
         */
        parseTable: function(contents, dialog){
            var plugin = this;
            // remove cancel callback from existing dialog and close it.
            dialog.dialog('option', 'close', null);
            dialog.dialog('close');
            // configure another dialog - wait dialog (showing "Please wait..." message)
            var parsedDialog = $('<div><span></span></div>');
            parsedDialog.dialog({
                title: plugin.settings.wait,
                modal: true,
                minWidth: Math.max(600, Math.round($(window).width()*0.7)),
                // on close - show paste dialog again
                close: function(){
                    plugin.showPasteDialog(contents);
                },
                // on open - perform parse
                open: function(){
                    plugin.fixOverlayZindex(parsedDialog);
                    // let UI render "Please wait..." dialog properly
                    setTimeout(function(){
                        // parse data
                        var rawResult = plugin.parseHTMLTable(contents);
                        // call postProcess callback
                        var result = plugin.settings.postProcess(rawResult);
                        // counts found tables
                        /** @type {integer} */
                        var count = 0;
                        if (false !== result) { // parse was successful
                            var tableIndex,
                                rowIndex,
                                colIndex,
                                lineIndex,
                                lines,
                                cell,
                                i;
                            // enumerate results
                            for (tableIndex in result){
                                // no data here
                                if (result[tableIndex].length === 0) {
                                    continue;
                                }
                                count ++;
                                var div = $('<div/>').appendTo(parsedDialog);
                                // prepare table block for confirmation dialog
                                var table = $('<table class="table table-bordered"/>').appendTo(div);
                                $('<div style="text-align: center;"><input type="button" name="ok" value=""/><input type="button" name="cancel" value=""/></div>').appendTo(div);
                                div.find('input[name="ok"]').val(plugin.settings.confirmOk);
                                div.find('input[name="cancel"]').val(plugin.settings.confirmCancel);
                                div.find('input[name="ok"]').attr('data-tableindex', tableIndex);
                                var tbody = $('<tbody/>').appendTo(table);
                                var maxCells = 0;
                                // enumerate rows and find widest row
                                for (rowIndex in result[tableIndex]){
                                    maxCells = Math.max(maxCells, result[tableIndex][rowIndex].length);
                                }
                                // create table
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
                            // depending on number of found tables - use appropriate texts from settings
                            parsedDialog.find('span').text((count <= 1) ?
                                plugin.settings.confirmLabelSingle :
                                plugin.settings.confirmLabelMultiple
                            );
                            parsedDialog.find('span').after('<a href="#" style="opacity: 0">debug</a>');
                            // debug information - create hidden <a> tag, which shows all the info
                            parsedDialog.find('a').click(function(){
                                parsedDialog.find('span').after('<br/>Debug information:<br/>Base64 of HTML:<br/><input type="text" onclick="this.select()" name="debug_base64" style="width: 100%" readonly="readonly"/><br/>HTML:<br/><textarea onclick="this.select()" name="debug_html" style="width: 100%; height: 150px;" readonly="readonly"></textarea><br/>Parsed JSON:<br/><textarea onclick="this.select()" name="debug_parsedjson" style="width: 100%; height: 150px;" readonly="readonly"></textarea><br/>Post processed JSON:<br/><textarea onclick="this.select()" name="debug_ppjson" style="width: 100%; height: 150px;" readonly="readonly"></textarea><br/>Cleaned (final) JSON:<br/><textarea onclick="this.select()" name="debug_cleanedjson" style="width: 100%; height: 150px;" readonly="readonly"></textarea>');
                                parsedDialog.find('input[name="debug_base64"]').val(btoa(contents));
                                parsedDialog.find('textarea[name="debug_html"]').val(contents);
                                parsedDialog.find('textarea[name="debug_parsedjson"]').val(JSON.stringify(rawResult, null, '  '));
                                parsedDialog.find('textarea[name="debug_ppjson"]').val(JSON.stringify(rawResult, null, '  '));
                               
 parsedDialog.find('textarea[name="debug_cleanedjson"]').val(JSON.stringify(rawResult, null, '  '));
                                return false;
                            });
                            // configure rest of confirmation dialog
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
                        // if no tables were found - go back and show error
                        if (0 === count){
                            // clear close callback - we'll show paste dialog ourselves
                            parsedDialog.dialog('option', 'close', null);
                            parsedDialog.dialog('close');
                            plugin.showPasteDialog(contents, plugin.settings.pasteError);

                        }
                    }, 0);
                }
            });
        },
        /** 
         * Parses HTML looking for <table> and cleaning all the formatting rubbish
         * @function ParseTablePlugin~Plugin#parseHTMLTable
         * @param {string} content HTML as pasted to WYSIWYG CONTENTEDITABLE iframe
         * @returns {Array.<Array.<Array.<string|number>>>} array of found tables, each
         * table is array of found rows, each row is array of cell values - either
         * string or number
         */
        parseHTMLTable: function(content) {
            /** @type {Array.<HTMLString>} */
            var sourceTables = [];
            /** @type {Array.<HTMLString>} */
            var sourceRows = [];
            /** @type {Array.<HTMLString>} */
            var sourceCells = [];
            /** @type {Array.<Array.<Array.<string|number>>>} */
            var result = [];
            /** @type {Array.<Array.<string|number>>} */
            var resultTable = [];
            /** @type {Array.<string|number>} */
            var resultRow = [];
            // false if there are no cells, otherwise rightmost cell index 
            /** @type {boolean|number} */
            var nonEmpty = false;
            /** @type {number} */
            var sourceTableIndex;
            /** @type {number} */
            var sourceRowIndex;
            /** @type {number} */
            var sourceCellIndex;
            if (/<table[^>]*>([\s\S]*)<\/table>/igm.test(content)) {
                sourceTables = content.split(/<\/table>/i);
                for (sourceTableIndex = 0; sourceTableIndex < sourceTables.length; sourceTableIndex++){
                    resultTable = [];
                    sourceTables[sourceTableIndex] = sourceTables[sourceTableIndex].replace(/[\n\r]+/g, '');
                    sourceTables[sourceTableIndex] = sourceTables[sourceTableIndex].replace(/^.*[<]table[^>]*[>]/igm,'');
                    sourceTables[sourceTableIndex] = sourceTables[sourceTableIndex].replace(/[<]\/table[>].*$/igm,'');
                    sourceRows = [];
                    if (/<tr[^>]*>([\s\S]*)<\/tr>/igm.test(sourceTables[sourceTableIndex])) {
                        sourceRows = sourceTables[sourceTableIndex].split(/<\/tr>/i);
                        for (sourceRowIndex = 0; sourceRowIndex < sourceRows.length; sourceRowIndex++) {
                            resultRow = [];
                            nonEmpty = false;
                            sourceCells = [];
                            sourceRows[sourceRowIndex] = sourceRows[sourceRowIndex].replace(/<tbody[^>]*>/igm,'');
                            sourceRows[sourceRowIndex] = sourceRows[sourceRowIndex].replace(/<\/tbody>/igm,'');
                            sourceRows[sourceRowIndex] = sourceRows[sourceRowIndex].replace(/<tr[^>]*>/igm,'');
                            sourceRows[sourceRowIndex] = sourceRows[sourceRowIndex].replace(/<\/tr>/igm,'');
                            if (/<td[^>]*>([\s\S]*)<\/td>/igm.test(sourceRows[sourceRowIndex])) {
                                sourceCells = sourceRows[sourceRowIndex].split(/<\/td>/i);
                                for (sourceCellIndex = 0; sourceCellIndex < sourceCells.length; sourceCellIndex++) {
                                    sourceCells[sourceCellIndex] = sourceCells[sourceCellIndex]
                                        .replace(/<\?xml[^>]*[>]/ig, '')
                                        .replace(/<\/?st1[:][^>]+[>]/g, '')
                                        .replace(/<td[^>]*>\s*/igm,'')
                                        .replace(/\s+$/igm,'')
                                        .replace(/<\/td>/igm,'')
                                        .replace(/line<\?[^\/>]*\/>/igm,'')
                                        .replace(/<p[^>]*>/igm,'\n')
                                        .replace(/<\/p>/igm,'')
                                        .replace(/<span[^>]*>/igm,'')
                                        .replace(/<\/span>/igm,'')
                                        .replace(/<o[^>]*>/igm,'')
                                        .replace(/<\/o[^>]*>/igm,'')
                                        .replace(/&nbsp[;]/g,' ')
                                        .replace(/<br\/?>/g,'\n')
                                        .replace(/[\r]/g, '')
                                        .replace(/^\n+/, '')
                                        .replace(/\n+$/, '')
                                        .replace(/\n[\n \t]*\n/g, '\n')
                                        .replace(/\n\s+/g, '\n')
                                        .replace(/[ \t]+/g, ' ')
                                        .replace(/^\s+/g, '')
                                        .replace(/<colgroup[ >](.*<\/colgroup>)?[ \r\n]*/g, '')
                                        .replace(/<col(([ ]?[>])|([ ][^>]+[>]))[ \r\n]*/g, '')
                                        .replace(/<font[^>]*>/g, '')
                                        .replace(/<\/font>/g, '')
                                        .replace(/<b( [^>]+)?>/g, '')
                                        .replace(/<\/b>/g, '')
                                        .replace(/<strong>/g, '')
                                        .replace(/<\/strong>/g, '')
                                        .replace(/&amp;/g, '&')
                                        .replace(/^\s+/g, '')
                                        .replace(/\s+$/g, '')
                                        ;
                                    // replace newlines with space
                                    if (!this.settings.allowNewLines){
                                        sourceCells[sourceCellIndex] = sourceCells[sourceCellIndex]
                                            .replace(/[\n]+/g, ' ');
                                    }
                                    // add cell to result row
                                    resultRow.push(sourceCells[sourceCellIndex]);
                                    // change nonEmpty flag
                                    if (sourceCells[sourceCellIndex].length > 0) {
                                        nonEmpty = sourceCellIndex;
                                    }
                                }
                            }
                            // push nonempty rows
                            if (nonEmpty !== false) {
                                while (resultRow.length > (nonEmpty + 1)) {
                                    resultRow.pop();
                                }
                                resultTable.push(resultRow);
                            }
                        }
                    }
                    // push nonempty tables to result array
                    if (resultTable.length > 0) {
                        result.push(resultTable);
                    }
                }
            } else if (/(<br\/?>|<div>)/igm.test(content)) {
                var rows;
                content = content
                    .replace(/<span[^>]*>/igm, '')
                    .replace(/<\/span>/igm, '');
                if (/(<br\/?>)/igm.test(content)) {
                    rows = content.split(/<br\/?>/);
                } else {
                    rows = content.replace(/<div>/igm, '').split(/<\/div\/?>/);
                }
                var rowIndex;
                var row;
                var cellIndex;
                var cells;
                var cell;
                for (rowIndex = 0 ; rowIndex < rows.length ; rowIndex ++){
                    row = rows[rowIndex].replace(/[\n\r]/, '');
                    row = row.replace(/(&nbsp;| )+/g, '\t');
                    cells = row.split(/[\t]/);
                    resultRow = [];
                    for (cellIndex = 0; cellIndex < cells.length; cellIndex ++){
                        cell = cells[cellIndex];
                        if (cell.length > 0) {
                            resultRow.push(cell);
                        }
                    }
                    if (resultRow.length > 0) {
                        resultTable.push(resultRow);
                    }
                }
                if (resultTable.length > 0) {
                    return [resultTable];
                } else {
                    return false;
                }
            } else {
                return false;
            }
            return result;
        },
        /**
         * Walks through parent elements looking for max z-index.
         * Then sets z-index of dialog argument to be at the top of all parents.
         * @function ParseTablePlugin~Plugin#fixOverlayZindex
         * @param {Dialog} dialog
         */
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

    /**
     * @function external:"jQuery.fn".parseTable
     * @global
     * @name "jQuery.fn.parseTable"
     * @param {ParseTablePlugin~Settings} options
     * @returns {external:jQuery}
     */
    $.fn[ pluginName ] = function ( options ) {
            return this.each(function() {
                    if ( !$.data( this, 'plugin_' + pluginName ) ) {
                            $.data( this, 'plugin_' + pluginName, new Plugin( this, options ) );
                    }
            });
    };

})( jQuery, window, document );
