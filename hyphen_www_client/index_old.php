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

        <div class="navbar navbar-inverse navbar-fixed-top">
            <div class="navbar-inner">
                <div class="container">
                    <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                    </a>
                    <a class="brand" href="#">Hyphen</a>
                    <div class="nav-collapse collapse">
                        <ul class="nav">
                            <!--<li class="active"><a href="#">Gaga</a></li>-->
                            <li><a href="#x">xxx</a></li>
                            <!--
                            <li class="dropdown">
                                <a href="#" class="dropdown-toggle" data-toggle="dropdown">Dropdown <b class="caret"></b></a>
                                <ul class="dropdown-menu">
                                    <li><a href="#">Action</a></li>
                                    <li><a href="#">Another action</a></li>
                                    <li><a href="#">Something else here</a></li>
                                    <li class="divider"></li>
                                    <li class="nav-header">Nav header</li>
                                    <li><a href="#">Separated link</a></li>
                                    <li><a href="#">One more separated link</a></li>
                                </ul>
                            </li>
                            -->
                        </ul>

                       <div class="minilogo pull-right">
                            <a href="http://medialab.sciences-po.fr"><img src="res/mini-tools.png"/></a>
                            <a href="http://tools.medialab.sciences-po.fr"><img src="res/mini-sp.png"/></a>
                        </div>

                        <!-- <form class="navbar-form pull-right">
                            <input class="span2" type="text" placeholder="Email">
                            <input class="span2" type="password" placeholder="Password">
                            <button type="submit" class="btn">Sign in</button>
                        </form>
                         -->
                    </div><!--/.nav-collapse -->
                </div>
            </div>
        </div>




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
                    <h2>1. Corpus management</h2>
                    <p>
                        <a class="btn"><i class="icon-refresh"></i> Refresh</a>
                        <a id="reinitialize_all" class="btn btn-warning"><i class="icon-off icon-white"></i> Reset all</a>
                        <a id="page_add" class="btn btn-primary"><i class="icon-plus icon-white"></i> Add page (test)</a>
                    </p>
                    <p>
                        <ul>
                            <li><span class="content_webEntityCount">?</span> web entities</li>
                        </ul>
                    </p>
                </div>
            </div>



            <div class="row">
                <div class="span12">
                    <h2>2. Web entities table</h2>
                </div>
            </div>



            <div class="row">
                <div class="span12">
                    <h2>3. Crawl</h2>
                </div>
            </div>
            <div class="row">
                <div class="span4">
                    <h4>Pages to reference</h4>
                    <p class="text-info">
                        Paste pages to create web entities
                    </p>
                    <textarea id="" placeholder="Blabla" class="span4" rows="4" ></textarea>
                </div>
                <div class="span4">
                    <h4>Crawl settings</h4>
                    <p class="text-info">
                        Add web entities to crawl, set the depth and lauch a crawl. You can add web entities from the list above.
                    </p>
                    <textarea id="" placeholder="Blabla" class="span4" rows="4" ></textarea>
                </div>
                <div class="span4">
                    <h4>Current jobs</h4>
                    <p class="text-info">
                        Monitor the current crawl jobs on the server
                    </p>
                    <p>
                        <a id="crawljobs_refresh" class="btn"><i class="icon-refresh"></i> Refresh</a>
                    </p>
                    <textarea id="jobs_textarea" placeholder="Refresh to see jobs" class="span4" rows="8" ></textarea>
                </div>
            </div>


            
            <div class="row">
                <div class="span12">
                    <h2>4. Web entity browser</h2>
                </div>
            </div>
            <div class="row">
                <div class="span4">
                    <div class="webentities_selector_container">
                        <a style="width:100%;" id="webentities_selector"> </a>
                    </div>
                </div>
                <div class="span8">
                    <ul class="weBrowserPath breadcrumb">
                        <li><span class="divider">/</span></li>
                    </ul>
                </div>
            </div>
            <div class="row">
                <div class="span12 weBrowser">
                </div>
            </div>

        </div>

        <?php include("includes/footer.php"); ?>

        <?php include("includes/codebottom.php"); ?>

        <!-- Page-specific js package -->
        <script src="js/_page_index_old.js"></script>

    </body>
</html>
