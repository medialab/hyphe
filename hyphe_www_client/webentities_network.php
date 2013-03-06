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

        <link rel="stylesheet" href="css/bootstrap.min.css">
        <style>

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

    margin-bottom: 20px;
    height: 400px;
}

.sigma-expand {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

#sigmaButtons{
    padding-bottom: 4px;
    padding-top: 4px;
}

        </style>
        <link rel="stylesheet" href="css/bootstrap-responsive.min.css">
        <link rel="stylesheet" href="css/bootstrap-editable.css">
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

            <!-- Main hero unit for a primary marketing message or call to action -->
            <div class="splash-unit row">
                <div class="span7">
                    <div class="image">
                        <a href="index.php"><img title="Hyphe" src="res/header.png"/></a>
                    </div>
                </div>
                <div class="span5">
                    <div class="abstract">
                        <p><strong>Prototype monitoring.</strong> A test user experience and client-side monitoring application for Hyphe alpha.</p>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="span12">
                    <h1>Network of webentities</h1>
                    <p class="text-info">
                        Do shit n' stuff
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span8">
                    <h3>Preview</h3>
                    <div id="sigmaButtons"><span class="muted">[sigma buttons loading]</span></div>
                    <div id="sigmaContainer"><span class="muted">[sigma loading]</span></div>
                </div>
                <div class="span4">
                    <h3>Download</h3>
                    <div id='download'/>
                </div>
            </div>
            
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom_v2.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/sigma.min.js"></script>
        <script src="js/libs/sigma.forceatlas2.js"></script>
        <script src="js/libs/json_graph_api.js"></script>

        <!-- Page-specific js packages -->
        <script src="js/_page_webentities_network_modules.js"></script>
        <script src="js/_page_webentities_network.js"></script>

    </body>
</html>
