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
                    <h1>Reset</h1>
                    <p class="text-error">
                        Reset is <strong>permanent</strong>. Clicking on this button is <strong>definitive</strong>. You will delete all memory content and stop all crawl jobs. No undo.
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span12">
                    <a id="reinitialize_all" class="btn btn-danger"><i class="icon-off icon-white"></i> Reset all</a>
                    <br/>
                    <br/>
                    <span id="result_message"></span>
                </div>
            </div>
                
            
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/jquery.md5.js"></script>

        <!-- Page-specific js packages -->
        <script src="js/_page_reset.js"></script>

    </body>
</html>
