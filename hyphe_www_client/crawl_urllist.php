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
/* Specific styles */
.urlrow:hover{
    background-color: #FFE;
}
.startUrl .editable{
    word-wrap: break-word;
    color: #333;
    border-bottom: dashed 1px #cef;
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
                    <h1>Crawl from a list of URLs</h1>
                    <p class="text-info">
                        Doubi doubi dou baaa
                    </p>
                    <hr>
                </div>
            </div>

            <div style="min-height: 400px">
                <div class="row" id="panel_howtostart">
                    <div class="span4">
                        <textarea rows="10" class="span4" id="urlsList" placeholder="Paste a list of URLs"></textarea>
                    </div>
                    <div class="span8">
                        <h4>How to start ?</h4>
                        <p class="text-info">
                            <i class="icon-hand-left"></i>
                            Paste a list of URLs and push the button to <strong>find the web entities</strong>.
                            <br/>
                            You can also paste a bunch of text, we will try to get the URLs from it.
                        </p>
                        <a id="button_findWebentities"></a>
                    </div>
                </div>
                <div class="row">
                    <div class="span12" id="panel_urllist" style="display:none;">
                        <div class="row">
                            <div class="span4">
                                <h4>URLs extracted</h4>
                            </div>
                            <div class="span1">
                                
                            </div>
                            <div class="span6">
                                <h4>Web entities</h4>
                            </div>
                        </div>
                        <div id="urllist"></div>
                    </div>
                </div>
            </div>
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom_v2.php"); ?>

        <!-- Page-specific js package -->
        <script src="js/_page_crawl_urllist_modules.js"></script>
        <script src="js/_page_crawl_urllist.js"></script>

    </body>
</html>