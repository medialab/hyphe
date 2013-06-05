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
        <link rel="stylesheet" href="css/bootstrap-responsive.min.css">
        <link rel="stylesheet" href="css/select2.css">
        <link rel="stylesheet" href="css/jquery.dataTables.css">
        <link rel="stylesheet" href="css/main.css">
        <style>
td ul.unstyled{
    margin-bottom: 0px;
}

div.table_name{
    width: 350px;
}
div.table_status{
    width: 90px;
}
div.table_prefix{
    width: 220px;
}
.table_prefixtext{
    font-size:11px;
    word-wrap: break-word;
}
.table_prefixlink{
    opacity: 0.4;
}
.table_prefixlink:hover{
    opacity: 1;
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

            <!-- Main hero unit for a primary marketing message or call to action -->
            <div class="splash-unit row">
                <div class="span7">
                    <div class="image">
                        <a href="index.php"><img title="Hyphe" src="res/header.png"/></a>
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
                    <h1>Web entities: list</h1>
                    <p class="text-info">
                        Browse web entities as a data table. You can filter by status in the search box: "status:in".
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span12">
                    <div id="loading_proxy">
                        <div class="progress progress-striped active">
                            <div class="bar" style="width: 100%;">Loading and parsing... May take a minute or two.</div>
                        </div>
                    </div>
                    <div id="loading_achieved" style="display:none">
                        <table id="webEntities_table" cellpadding="0" cellspacing="0" border="0" class="table table-striped table-hover dataTable">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Prefixes</th>
                                    <th>Created</th>
                                    <th>Modified</th>
                                    <th><span  class="pull-right">Actions</span></th>
                                    <th>id (hidden)</th>
                                    <th>Creation unformatted (hidden)</th>
                                    <th>Last modification unformatted (hidden)</th>
                                    <th>Searchable (hidden)</th>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                    <p>
                        <button class="btn" id="webEntities_download"></button>
                        <!-- <button class="btn" id="webEntities_download"><i class="icon-download"></i> Download as JSON</button> -->
                    </p>
                </div>
            </div>
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom.php"); ?>

        <!-- Page-specific js package -->
        <script src="js/libs/jquery.dataTables.js"></script>
        <script src="js/_page_webentities_list_modules.js"></script>
        <script src="js/_page_webentities_list.js"></script>

    </body>
</html>
