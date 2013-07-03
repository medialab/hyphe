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
                    <h1>Welcome to Hyphe</h1>
                    <p class="text-info">
                        Hyphe does not manage different corpora or users at the moment. All the data is stored as a single corpus summarized here. 
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span4">
                    <h3>Status</h3>
                    <div id="summary"></div>
                </div>
                <div class="span4">
                    <h3>Tasks</h3>
                    <p>
                        <ol>
                            <li><a href="crawl.php">Crawl</a></li>
                            <li><a href="webentities_exploreDiscovered.php">Classify discovered web entities</a></li>
                            <li><span class="muted">Qualify</a></li>
                            <li><a href="webentities_network.php">Network of web entities</a></li>
                        </ol>
                    </p>
                </div>
                <div class="span4">
                    <h3>Monitoring</h3>
                    <p>
                        <ul>
                            <li><a href="webentities_list.php">List of web entities</a></li>
                        </ul>
                    </p>
                    <br/>
                    <h3>Administration</h3>
                    <p>
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
