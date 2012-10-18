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
            body {
                padding-top: 60px;
                padding-bottom: 40px;
            }

            /* Specific styles */
            #startPagesContainer{
                border: 1px solid #DDD;
                height: 150px;
                overflow-y: scroll;
            }

        </style>
        <link rel="stylesheet" href="css/bootstrap-responsive.min.css">
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
                    <h1>New crawl</h1>
                    <p class="text-info">
                        Create a crawl job dedicated to a web entity. You can crawl an existing or a new web entity.
                        <br/>
                        It is necessary to specify one or more <span class="info_tooltip info_start_pages">start pages</span> 
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
                        <input style="width:278px;" type="text" placeholder="Paste URL to declare web entity">
                        <button class="btn" type="button">Declare</button>
                    </div>
                </div>
                <div class="span4">
                    <h3>2. Start pages</h3>
                    <p class="text-info">
                        Check that the start pages are valid
                    </p>
                    <div id="startPagesContainer">
                        <table class="table table-hover table-condensed">
                            <tr>
                                <td><small>http://x.com</small></td>
                                <td><button class="close">&times;</button></td>
                            </tr>
<!--                             <tr>
                                <td><small>http://www.medialab.sciences-po.fr/2012/index.html</small></td>
                                <td><button class="close">&times;</button></td>
                            </tr>
 -->                        </table>
                        <!-- <p>
                            <span class="muted">Choose a web entity</span>
                        </p> -->
                    </div>
                    <p>
                        <div class="input-append">
                            <input style="width:232px;" type="text" placeholder="Paste URL to declare start page">
                            <button class="btn" type="button">New start page</button>
                        </div>
                    </p>
                </div>
                <div class="span4">
                    <h3>3. Settings</h3>
                    <p class="text-info">
                        The maximum depth sets the quantity of pages to harvest
                    </p>
                    <p>
                        <label>Maximum depth</label>
                        <input type="text" id="depth" placeholder="Depth" value="2"/>
                    </p><p>
                        <button class="btn btn-primary disabled">Launch crawl</button>
                    </p>
                </div>
            </div>
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- Page-specific js package -->
        <script src="js/_page_crawl_new.js"></script>

    </body>
</html>