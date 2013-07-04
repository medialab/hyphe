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
#tablepreview{
    margin-bottom: 50px;
}

.urlContainer{
    overflow-y: hidden;
}

/* --------------------------
   Data preview table
   -------------------------- */
#dataPreview{
  width: 100%;
  height: 250px;
  border: 1px solid #EAEAEA;
  overflow:scroll;
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

<?php // include("includes/header.php"); ?>

            <div class="row">
                <div class="span12">
                    <h1>CSV Diagnostic</h1>
                    <p class="text-info">
                        Give a CSV table containing URLs and get their status in the corpus: web entity, crawled pages...
                        You can then export a modified CSV or work on the web entities that need it.
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span12">
                    <h3>Load CSV file</h3>
                    <p class="text-info">
                        It has to be <strong><a href='http://en.wikipedia.org/wiki/Comma-separated_values' target='_blank'>comma-separated</a></strong> and the first row must be dedicated to <strong>column names</strong>.
                    </p>
                    <div id="csvloader"><span class="muted">file uploader</span></div>
                    <div id="tablepreview"></div>
                    <div id="columnselector"></div>
                    <div id="diagnostic"></div>
                </div>
            </div>
            <div class="row">
                <div class="span12">
                    
                </div>
            </div>
            
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/jquery.md5.js"></script>

        <!-- Page-specific js packages -->
        <script src="js/_page_csv_diagnostic.js"></script>

    </body>
</html>
