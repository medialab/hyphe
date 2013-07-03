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

#webentitieslist_container{
    cursor: pointer;
}

#webentity_preview iframe{
    width: 100%;
    height: 600px;
}

#status_buttons_div .btn{
    margin-right: 5px;
}

.cited-list{
    max-height: 110px;
    overflow-y: auto;
}

#pages-list{
    max-height: 180px;
    overflow-y: auto;
}

.citing_index{
    width: 30px;
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

        </div>
        
        <div class="container-fluid">

            <div class="row-fluid">
                <div class="span12">
                    <h1>Classify discovered web entities</h1>
                    <p class="text-info">
                        Explore the discovered web entities the most cited, browse them and crawl them or refuse them. 
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row-fluid">
                <div id="loading_proxy">
                    <div class="progress progress-striped active">
                        <div class="bar" style="width: 100%;">Loading and parsing... May take a minute or two.</div>
                    </div>
                </div>
                <div id="loading_achieved" style="display:none">
                <div class="span5">
                        <h5>Select a discovered web entity</h5>
                        <div id="webentitieslist_container">
                            <table class="table table-condensed table-hover">
                                <thead>
                                    <tr>
                                        <th>Cited</th>
                                        <th>Web Entity</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody id="webentities_list">
                                </tbody>
                            </table>
                        </div>
                        <div id="webentitieslist_footer"></div>
                    </div>
                    <div class="span7">
                        <div class="row-fluid">
                            <div class="span6">
                                <div id="webentity_summary"></div>
                                <br/>
                                <div id="webentity_neighbors"></div>
                            </div>
                            <div class="span6">
                                <br/>
                                <br/>
                                <div id="webentity_pages"></div>
                            </div>
                        </div>
                        <hr/>
                        <div id="webentity_preview"></div>
                    </div>
                </div>
            </div>
        </div>

            <!-- <div class="row">
                <div class="span8">
                    <h3>Preview</h3>
                    <div id="sigmaButtons"></div>
                    <div id="sigmaContainer"><span class="muted">[sigma loading]</span></div>
                </div>
                <div class="span4">
                    <h3>Download</h3>
                    <div id='download'/>
                </div>
            </div> -->

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- libs specifically needed here -->
        <script src="js/libs/jquery.md5.js"></script>
        <script src="js/libs/chroma.js"></script>
        <script src="js/libs/sigma.min.js"></script>
        <script src="js/libs/sigma.forceatlas2.js"></script>
        <script src="js/libs/json_graph_api.js"></script>

        <!-- Page-specific js packages -->
        <script src="js/_page_webentities_exploreDiscovered_modules.js"></script>
        <script src="js/_page_webentities_exploreDiscovered.js"></script>

    </body>
</html>
