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

        <link rel="stylesheet" href="css/select2.css">
        <link rel="stylesheet" href="css/main.css">

        <style>
            .block {
                background-color: #EEE;
                padding: 20px;
                height: 200px;
                margin-bottom: 30px;
            }

            #addWebentitiesRow{
                overflow: hidden;
                height: 200px;
                margin-bottom: 30px;
            }

            #networkSettings{
                height: 350px;
                margin-bottom: 30px;
            }

            /* sigma */
            .sigma-parent {
                position: relative;

                /* from http://www.colorzilla.com/gradient-editor/ */
                background: rgb(248,248,248); /* Old browsers */
                background: -moz-linear-gradient(top, rgba(248,248,248,1) 0%, rgba(255,255,255,1) 100%); /* FF3.6+ */
                background: -webkit-gradient(linear, left top, left bottom, color-stop(0%,rgba(248,248,248,1)), color-stop(100%,rgba(255,255,255,1))); /* Chrome,Safari4+ */
                background: -webkit-linear-gradient(top, rgba(248,248,248,1) 0%,rgba(255,255,255,1) 100%); /* Chrome10+,Safari5.1+ */
                background: -o-linear-gradient(top, rgba(248,248,248,1) 0%,rgba(255,255,255,1) 100%); /* Opera 11.10+ */
                background: -ms-linear-gradient(top, rgba(248,248,248,1) 0%,rgba(255,255,255,1) 100%); /* IE10+ */
                background: linear-gradient(to bottom, rgba(248,248,248,1) 0%,rgba(255,255,255,1) 100%); /* W3C */
                filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='#f8f8f8', endColorstr='#ffffff',GradientType=0 ); /* IE6-9 */

                border: 1px solid #e3e3e3;
                -webkit-border-radius: 4px;
                -moz-border-radius: 4px;
                border-radius: 4px;
                -webkit-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
                -moz-box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);
                box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05);

                margin-bottom: 30px;
                height: 350px;
            }

            .sigma-expand {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
            }

            .sigma-overlay {
                position: absolute;
                width: 100%;
            }

            .sigma-messages {
                padding-left: 5px;
                padding-top: 3px;
            }
        </style>

        <script src="js/libs/modernizr-2.6.1-respond-1.1.0.min.js"></script>
    </head>
    <body>
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an outdated browser. <a href="http://browsehappy.com/">Upgrade your browser today</a> or <a href="http://www.google.com/chromeframe/?redirect=true">install Google Chrome Frame</a> to better experience this site.</p>
        <![endif]-->

        

<?php include("includes/navbar.php"); ?>

        <div class="container">

<?php include("includes/header.php"); ?>

            <div class="row">
                <div class="span12">
                    <h1>Corpus Overview</h1>
                    <p class="text-info">
                        An easy way to start and grow your corpus 
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row" id='addWebentitiesRow'>
                <div id="urlsPastePanel">
                    <div class="span4">
                        <div id="addWebentitiesPasteArea">
                            <h4>Add web entities</h4>
                            <textarea rows="7" class="span4" id="urlsList" placeholder="Paste a list of URLs"></textarea>
                        </div>
                    </div>
                    <div class="span8">
                        <br/>
                        <br/>
                        <br/>
                        <p class="text-info">
                            <i class="icon-hand-left"></i>
                            Paste URLs to create new web entities
                            <br/>
                            <span class="muted">You can also paste a bunch of text, we will try to identify the URLs</span>
                        </p>
                        <button class="btn btn-primary" id="addWebentitiesDiagnostic_findButton">Find web entities</button>
                    </div>
                </div>
                <div id="urlsDiagnosticPanel">
                    <div class="span12">
                        [URLs Diagnostic]
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="span8">
                    <div id="networkContainer">
                    </div>
                </div>
                <div class="span4">
                    <div id="networkSettings">
                        <span class="muted">[ Network viz settings (filtering...) ]</span>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="span4">
                    <div class="block">
                        To be crawled
                    </div>
                </div>
                <div class="span4">
                    <div class="block">
                        Pending and running crawl jobs
                    </div>
                </div>
                <div class="span4">
                    <div class="block">
                        Web entities suggestion (prospection)
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="span12">
                    <div class="block">
                        Corpus as a list (refining and qualifying)
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="span12">
                    <div class="block">
                        Export
                    </div>
                </div>
            </div>
            
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/jquery.md5.js"></script>
        <script src="js/libs/chroma.js"></script>
        <script src="js/libs/sigma.min.js"></script>
        <script src="js/libs/sigma.forceatlas2.js"></script>
        <script src="js/libs/json_graph_api.js"></script>
        <!-- Page-specific js packages -->
        <script src="js/_page_corpus_overview_modules.js"></script>
        <script src="js/_page_corpus_overview.js"></script>

    </body>
</html>
