<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Hyphe</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width">

<?php include("includes/codetop.php"); ?>

        <style>
            /* Specific styles */
            #startPagesContainer{
                border: 1px solid #DDD;
                height: 150px;
                overflow-y: scroll;
            }

            #webEntities_prefixes_info{
                margin-top: 30px;
            }

            .startPage_tr i{
                margin-left: 5px;
            }

        </style>

        <link rel="stylesheet" href="css/select2.css">
        <link rel="stylesheet" href="css/main.css">

        <script src="js/libs/modernizr-2.6.1-respond-1.1.0.min.js"></script>
    </head>
    <body>
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an outdated browser. <a href="http://browsehappy.com/">Upgrade your browser today</a> or <a href="http://www.google.com/chromeframe/?redirect=true">install Google Chrome Frame</a> to better experience this site.</p>
        <![endif]-->



<?php include("includes/navbar.php"); ?>


        <div class="container">

<?php // include("includes/header.php"); ?>

            <div class="row">
                <div class="span12">
                    <h1>Crawl <span data-text-content="webentity_name">a new web entity</span></h1>
                    <p class="text-info">
                        Create a crawl job dedicated to a web entity. You can crawl an existing or a new web entity.
                        <br/>
                        It is necessary to specify one or more start pages
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span4">
                    <h3>1. Web entity</h3>
                    <p class="text-info">
                        Pick or declare the web entity to crawl
                    </p>
                    <p>
                        <a style="width:100%;" id="webentities_selector"></a>
                    </p>
                    <p>or</p>
                    <div class="input-append">
                        <input type="text" id="urlField" placeholder="Paste URL to declare web entity">
                        <button class="btn" id="webEntityByURL_button" type="button">Declare</button>
                    </div>
                    <div id="webEntities_prefixes_info">
                        <p><strong>Prefixes - </strong><span data-text-content="webentity_name">This web entity</span> is defined by these URLs:</p>
                        <table id="webEntities_prefixes" class="table table-condensed">
                        </table>
                    </div>
                </div>
                <div class="span4">
                    <h3>2. Start pages</h3>
                    <p class="text-info">
                        Check that the start pages are valid
                    </p>
                    <div id="startPagesContainer">
                        <table id="startPagesTable" class="table table-hover table-condensed">
                            <tr><td><span class="muted">Choose a web entity</span></td></tr>
                        </table>
                    </div>
                    <p>
                        <div class="input-append">
                            <input disabled type="text" id="startPages_urlInput" placeholder="Paste URL">
                            <button class="btn disabled" id="startPages_add" type="button">Add start page</button>
                        </div>
                    </p>
                    <div id="startPages_messages"></div>
                </div>
                <div class="span4">
                    <h3>3. Settings</h3>
                    <p class="text-info">
                        The maximum depth sets the quantity of pages to harvest
                    </p>
                    <p>
                        <label>Maximum depth</label>
                        <input type="text" id="depth" placeholder="Depth" value="1"/>
                    </p>
                    <hr/>
                    <p>
                        <input style="margin-bottom: 5px" type="checkbox" id="phantom"/>
                        <label style="display:inline">Phantom crawl (more efficient but drastically slower)</label>
                    </p>
                    <p>
                        <button class="btn btn-block" id="launchButton"></button>
                    </p>
                    <div id="crawlLaunch_messages"></div>
                </div>
            </div>
        </div>

        <!-- Modal -->
        <div id="modal_resolveInvalidLRU" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                <h3 id="myModalLabel">URL not in the web entity</h3>
                <p class="text-info">You may want to add a new prefix</p>
            </div>
            <div class="modal-body">
                <p><strong>Add one of these prefixes?</strong></p>
                <div class="list-prefix-suggestions"></div>
                <br/>
                <br/>
                <p>
                    <strong class="text-info"/>Help</strong> - The URL that you propose is not in the web entity, but you may add a prefix to fix this.
                    Adding a prefix allows to deal with web entities that cover different domain names, like "google.com" and "google.fr".
                    If a prefix already belongs to another web entity, they will be merged.
                </p>
            </div>
            <div class="modal-footer">
                <button class="btn" data-dismiss="modal" aria-hidden="true">Do not add prefix</button>
                <button class="btn btn-primary" id="button-add-prefix">Add prefix</button>
            </div>
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/jquery.md5.js"></script>

        <!-- Page-specific js package -->
        <script src="js/_page_crawl_new_modules.js"></script>
        <script src="js/_page_crawl_new.js"></script>

    </body>
</html>
