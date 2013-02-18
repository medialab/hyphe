<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Hyphen</title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width">

        <link rel="stylesheet" href="css/bootstrap.min.css">
        <style>
        </style>
        <link rel="stylesheet" href="css/bootstrap-responsive.min.css">
        <link rel="stylesheet" href="css/bootstrap-editable.css">
        <link rel="stylesheet" href="css/select2.css">
        <link rel="stylesheet" href="css/jquery.dataTables.css">
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
                        <a href="index.php"><img title="Hyphen" src="res/header.png"/></a>
                    </div>
                    <!-- <div class="title">
                        hyphen
                    </div> -->
                </div>
                <div class="span5">
                    <div class="abstract">
                        <p><strong>Prototype monitoring.</strong> A test user experience and client-side monitoring application for Hyphen alpha.</p>
                    </div>
                </div>
            </div>





            <div class="row">
                <div class="span12">
                    <h1 id="pageTitle">Edit web entity <span class="muted">(loading)</span></h1>
                    <p class="text-info">
                        Manage and edit a given web entity
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span12">
                    <h3>Identity</h3>
                </div>
            </div>
            <div class="row">
                <div class="span3">
                    <p>Name</p>
                    <p>Home page</p>
                </div>
                <div class="span3">
                    <p class="muted">creation_date</p>
                    <p class="muted">last_modification_date</p>
                    <p class="muted">identifier</p>
                </div>
                <div class="span3">
                    <p>Status (discovered/blabla/blabla)</p>
                </div>
                <div class="span3">
                    <p>lru_prefixes</p>
                </div>
                
            </div>

            <div class="row">
                <div class="span8">
                    <h3>Tags</h3>
                    <!-- <div id="tags_user"></div> -->
                    <div id="tags_USER"></div>
                </div>
                <div class="span4">
                    <h3>Technical tags</h3>
                    <div id="tags_technical"></div>
                </div>
            </div>

            <div class="row">
                <div class="span12">
                    <h3>Crawl</h3>
                </div>
            </div>
            <div class="row">
                <div class="span6">
                    <p>Crawl status</p>
                    <p>Indexing status</p>
                    <p>startpages</p>
                </div>
            </div>
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom_v2.php"); ?>

        <!-- Page-specific js package -->
        <script src="js/_page_webentity_edit.js"></script>

    </body>
</html>
