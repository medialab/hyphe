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
                    <h1>Welcome to Hyphe</h1>
                    <p class="text-info">
                        Hyphe does not manage different corpora or users at the moment. All the data is stored as a single corpus summarized here. 
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span4">
                    <h2>Status</h2>
                    <div id="summary"></div>
                </div>
                <div class="span4">
                    <h2>Explore</h2>
                    <p>
                        <ul>
                            <li><a href="webentities_list.php">List of web entities</a></li>
                            <li><a href="webentities_network.php">Network of web entities</a></li>
                        </ul>
                    </p>
                </div>
                <div class="span4">
                    <h2>Work</h2>
                    <p>
                        <ul>
                            <li><a href="crawl.php">Crawl</a></li>
                            <li><a href="crawl_urllist.php">Crawl by a list of URLs</a></li>
                            <li><a href="webentities_exploreDiscovered.php">Explore discovered web entities</a></li>
                        </ul>
                        <ul>
                            <li><a href="reset.php">Reset all</a></li>
                        </ul>
                    </p>
                </div>
            </div>
            
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/jquery.md5.js"></script>

        <!-- Page-specific js packages -->
        <script src="js/_page_index_modules.js"></script>
        <script src="js/_page_index.js"></script>

    </body>
</html>
