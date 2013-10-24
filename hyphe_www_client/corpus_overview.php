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
            .block{
                background-color: #EEE;
                padding: 20px;
                height: 200px;
                margin-bottom: 30px;
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

            <div class="row">
                <div class="span4">
                    <div class="block">
                        "Paste your addresses"
                    </div>
                </div>
                <div class="span8">
                    <div class="block">
                        Solve issues related to web entities definition
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="span8">
                    <div class="block">
                        Network visualization
                    </div>
                </div>
                <div class="span4">
                    <div class="block">
                        Network viz settings (filtering...)
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

        <!-- Page-specific js packages -->
        <script src="js/_page_corpus_overview_modules.js"></script>
        <script src="js/_page_corpus_overview.js"></script>

    </body>
</html>
