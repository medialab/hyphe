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
.table.table-editable tr th{
    width: 120px;
}
.table.table-tags tr th{
    width: 250px;
}
.occasionalSpacer{  /* We just need to add some air to this page*/
    margin-top: 50px;
}

/*Content tree*/
#contentTreeContainer{
    height: 300px;
}
#contentTree{
    width: 10000px;
}
#contentTree td{
    padding: 0px;
    vertical-align: top;
}
#contentTree .itemContainer{
    border-right: 1px solid #EEE;
    /*background-color: #F3F3F3;*/
}
#contentTree .item{
    padding-left: 2px;
    padding-right: 3px;
    margin-left: 2px;
    margin-bottom: 1px;
    background-color: #EEE;
}
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
                        Edit this web entity. Click on the underlined fields to edit them.
                    </p>
                    <hr>
                </div>
            </div>

            <div class="row">
                <div class="span7">
                    <h3>Identity</h3>
                    <table class="table table-editable">
                        <tr>
                            <th>Name</th>
                            <td><a id="name">...</a></td>
                        </tr><tr>
                            <th>Home page</th>
                            <td><a id="homepage">...</a></td>
                        </tr><tr>
                            <th>ID</th>
                            <td><span class="muted" id="id">...</span></td>
                        </tr><tr>
                            <th></th>
                            <td><span id="dates">...</span></td>
                        </tr>
                    </table>
                    <div class="occasionalSpacer"></div>
                    <h3>Status in the corpus</h3>
                    <table class="table table-editable">
                        <tr>
                            <th>Status</th>
                            <td><a id="status">...</a></td>
                        </tr><tr>
                            <th>Last crawl</th>
                            <td><span id="crawl">...</span></td>
                        </tr>
                    </table>
                </div>
                <div class="span5">
                    <h3>URL Prefixes</h3>
                    <p class="text-info">
                        The web entity is defined by these prefixes
                    </p>
                    <table id="lru_prefixes" class="table">
                    </table>
                </div>
            </div>
            <div class="row">
                <div class="span12">
                    <div class="occasionalSpacer"></div>
                    <h3>Description</h3>
                    <table class="table table-editable table-tags">
                        <thead><tr><th>Category</th><td>Tags</td></tr></thead>
                        <tbody id="tags_User"></tbody>
                    </table>
                </div>
            </div>
            <div class="row">
                <div class="span12">
                    <div class="occasionalSpacer"></div>
                    <h3>Content</h3>
                    <div id="contentTreeContainer" style="overflow: scroll">
                        <div id="contentTree">

                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="span12">
                    <div class="occasionalSpacer"></div>
                    <h3 class="muted">Technical information</h3>
                    <div class="muted" id="tags_Other"></div>
                </div>
            </div>
        </div>

<?php include("includes/footer.php"); ?>

<?php include("includes/codebottom_v2.php"); ?>

        <!-- Page-specific js package -->
        <script src="js/_page_webentity_edit.js"></script>

    </body>
</html>
