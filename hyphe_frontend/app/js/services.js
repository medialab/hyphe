'use strict';

/* Services */


angular.module('hyphe.services', []).
  value('version', '0.1').
  factory('FileLoader', ['$window', function(win){
  	return function(){
      this.read = function(file, settings){
        this.reader = new FileReader()

        // Settings
        if(settings.onerror === undefined)
          this.reader.onerror = this.errorHandler
        else
          this.reader.onerror = settings.onerror

        if(settings.onprogress === undefined)
          this.reader.onprogress = function(evt) {
            console.log('file loader: progress ', evt)
          }
        else
          this.reader.onprogress = settings.onprogress

        if(settings.onabort === undefined)
          this.reader.onabort = function(e) {
            alert('File read cancelled')
          }
        else
          this.reader.onabort = settings.onabort

        if(settings.onloadstart === undefined)
          this.reader.onloadstart = function(evt) {
            console.log('file loader: Load start ', evt)
          }
        else
          this.reader.onloadstart = settings.onloadstart

        if(settings.onload === undefined)
          this.reader.onload = function(evt) {
            console.log('file loader: Loading complete ', evt)
          }
        else
          this.reader.onload = settings.onload
        
        this.reader.readAsText(file)
      }

      this.abortRead = function(){
          this.reader.abort()
      }

      this.reader = undefined
      
      this.errorHandler = function(evt){
        var target = evt.target || evt.srcElement
        switch(target.error.code) {
          case target.error.NOT_FOUND_ERR:
            alert('File Not Found!')
            break
          case target.error.NOT_READABLE_ERR:
            alert('File is not readable')
            break
          case target.error.ABORT_ERR:
            break // noop
          default:
            alert('An error occurred reading this file.');
        }
      }
    }
  }]).
  factory('glossary', [function(){
    return function(term){
      return term
    }
  }]).
  factory('store', [function(){
  	var savedData = {}
    
    // FOR DEV - TO REMOVE
    savedData.parsedUrls = [["Nom du site","Lien URL","Clé pour crawl","Orientation politique","Thèmes & enjeux","Personnalités","Acteurs","A conserver","A archiver","Description du site","Mots-clés","Mots-clés en anglais","Élection 2012","Page d'accueil ou Page spécifique","Propriété intellectuelle","Dewey","Langue","Pays","Aire géo","Type de site","Niveau","Cadist","Sélectionné par","Commentaire"," Crawl manuel requis"],["24heuresactu","http://24heuresactu.com/","1","droite","vie politique:campagne électorale ; économie:économie ; société:société","","média","O","","Site d'actualité de tendance droite \"populaire\". Souverainiste, très critique sur la gauche et les écologistes, il ne ménage pas non plus des ministres comme Frédéric Mitterrand.","Société ; vie politique ; économie ; vie sociale","Society ; politics ; economics ; social issues","O","Page d'accueil","24 heures actu","070 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["365 mots. Ni plus ni moins","http://www.365mots.com/","2","gauche","vie politique:campagne électorale ; économie:finances publiques ; économie:crise financière ; europe:europe ; emploi:emploi","","individu","O","","Blog de Custin d'Astrée, cadre financier, intéressé autant par le libéralisme que par le socialisme. Il s'est posé comme contrainte de rédiger des billets de 365 mots, \"ni plus, ni moins\"","Société ; Vie politique ; Libéralisme ; Socialisme ; France","Politics ; Society ; Liberalism ; Socialism ; France","O","Page d'accueil","Custin d'Astrée","324 ; 944","fre","FR","Europe (UE)","13","11","1","DG","Le blog a l'air d'être squatté par un concours de tweets ...",""],["60 millions de consommateurs","http://www.60millions-mag.com/","3","sans orientation","économie:économie ; environnement:environnement ; politique sociale:santé ; société:société ; vie politique:citoyenneté","","média","O","","Site officiel du magazine \"60 millions de consommateurs\". Actualités, Guide d'achats, Vos droits, Témoignez !","Consommation ; droit ; pouvoir d'achat ; alimentation : mode de vie ; santé ; environnement ; France","","O","Page d'accueil","60 millions-mag.com","330 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["80 propositions","http://www.80propositions.fr/","","gauche","économie:économie ; économie:finances publiques ; éducation:éducation ; emploi:emploi ; politique sociale:politique sociale ; justice:justice ; numérique:numérique ; europe:europe","patrick weil","individu","N","O","Site présentant les 80 propositions du livre dirigé par Patrick Weil \"80 propositions qui ne coûtent pas 80 milliards\". \"Si la gauche revient au pouvoir en mai 2012, elle trouvera les caisses de la France vides. Sera ce une raison pour ne rien faire?\"","Vie politique ; politique économique ; politique sociale ; fiscalité ; Institutions politiques ; éducation ; justice ; immigration ; numérique","","O","Page d'accueil","80 propositions.fr ; Patrick Weil","324 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["A contrario","http://www.acontrario.net/","4","gauche","politique sociale:santé ; société:discriminations ; vie politique:citoyenneté ; emploi:conditions de travail","","individu","O","","Blog de Gaëlle-Marie Zimmermann portant sur les violences et les discriminations sexistes et aussi sur la sexualité féminine. ","Société ; femmes ; violence ; discriminations ; sexualité ; genre ; prostitution ; travail des femmes ; France ","","O","Page d'accueil","A contrario","300 ; 944","fre","FR","Europe (UE)","13","11","1","DG","",""],["A perdre la raison","http://perdre-la-raison.blogspot.com/","5","extrême-gauche","vie politique:vie politique ; vie politique:campagne électorale ","jean-luc mélenchon","individu","O","","Blog de Meclalex, observateur engagé de la vie politique.","Vie politique ; Citoyen ; France ","Politics ; Citizen ; France","O","Page d'accueil","Melclalex","324 ; 944","fre","FR","Europe (UE)","13","11","1","DG","","oui"],["ACLEFEU ","http://www.aclefeu.org/","","gauche","vie politique:citoyenneté ; société:discriminations ; société:banlieues ","","association","N","O","L’Association collectif liberté égalité fraternité ensemble unis (ACLEFEU) a pour objet de transmettre la parole des habitants des quartiers auprès des institutions en organisant des rencontres citoyennes dans toute le France, en mettant en place des coordinations locales, en recueillant et regroupant par thématiques les revendications et propositions de la population et en veillant à leur prise en compte par les pouvoirs politiques.","Citoyen ; quartiers défavorisés ; discrimination ; diversité ; politique sociale ; banlieue ; France ; élections ; 2012","","O","Page spécifique","ACLEFEU ","300 ; 944","fre","FR","Europe (UE)","13","11","1","DG","",""],["ACRIMED - Action critique Médias","http://www.acrimed.org/","6","sans orientation","culture et communication:culture et communication ","","association","O","","L'association ACRIMED, née du mouvement social de 1995 s'est constituée comme un observatoire des médias. Elle réunit des journalistes et salariés des médias, des chercheurs et universitaires, des acteurs du mouvement social et des « usagers » des médias. Elle cherche à mettre en commun savoirs professionnels, savoirs théoriques et savoirs militants au service d’une critique indépendante, radicale et intransigeante. Information, médias, journalismes, ressources.\n","Médias ; journalisme ; Critique ; Citoyen ; France","Media ; Journalism ; Citizen ; France","O","Page d'accueil","Acrimed","070 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["Act Up Paris","http://www.actupparis.org/","7","sans orientation","société:discriminations ; politique sociale:santé","","association","O","","L'Association Act Up a été fondée à New York en 1987. Act Up-Paris a été créée en 1989. C’est une association de lutte contre le sida. Issue de la communauté homosexuelle, elle rassemble des personnes séropositives, des militantEs concernéEs par la maladie, des hommes, des femmes, trans’, lesbienne, gai, bi, hétéro, pour qui le sida n’est pas une fatalité. ","Association ; Citoyen ; SIDA ; Homosexuels ; Enjeux ; France","Association ; Citizen ; AIDS ; Homosexuals ; Issues ; France","O","Page d'accueil","Act Up Paris","360 ; 944","fre","FR","Europe ; Méditerranée (Région)","10","11","1","DG","",""],["Acteurs publics","http://www.acteurspublics.com/","8","sans orientation","vie politique:campagne électorale ; culture et communication:culture et communication ; éducation:éducation","nicolas sarkozy ; éva joly ; marine le pen","média","O","","Réforme de l’État, fonction publique, conflits d’intérêts, collectivités locales, hôpitaux… Acteurs publics a épluché les programmes des six principaux candidats à l’Élysée.","élection 2012 ; France ; culture ; éducation","","O","Page spécifique","Acteurs publics","944 ; 330","fre","FR","Europe (UE)","13","11","1","OD","",""],["Actu-environnement","http://www.actu-environnement.com/","9","sans orientation \n","environnement:développement durable ; économie:entreprise ","","média","O","","Actualité professionnelle du secteur de l'environnement","Politique de l'environnement ; Economie de l'environnement ; Santé ; Risques ; Enjeux ; France","Environmental Policy ; Environmental Economics ; Health ; Risks ; Issues ; France","O","Page d'accueil","Actu-Environnement","333 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["Actuchomage.org : l'emploi et le chômage en débat","http://www.actuchomage.org/","10","sans orientation","emploi:emploi ; politique sociale:politique sociale","","association","O","","Site de l'association APNÉE, Alternatives Pour une Nouvelle Économie de l'Emploi, association qui a pour objet d'ouvrir de nouveaux champs d'expression et d'initiatives pour les chômeurs qui veulent s'informer, échanger et entreprendre. Cette structure indépendante n'a pas de couleur politique marquée - ses initiateurs venants de divers horizons -, ce qui en fait toute sa richesse. La pluralité d'opinions émises est la garante du fonctionnement démocratique de cette assemblée de bons vouloirs bénévoles. ","Politique sociale ; emploi ; chômage ; organisation du travail ; formation professionnelle ; temps de travail ; économie politique ; France ; Élections ; 2012","","O","Page d'accueil","Actuchomage.org ","331 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["AFEV - Association de la Fondation étudiante pour la ville","http://www.afev.fr","11","gauche","société:banlieues ; société:inégalité sociale ; éducation:éducation ; société:jeunesse","","association","O","","Créée en 1991 par trois étudiants, l’Afev (Association de la fondation étudiante pour la ville) est née de l’envie de lutter contre les inégalités dans les quartiers populaires, et de créer un lien entre deux jeunesses qui ne se rencontraient pas ou peu : les enfants et jeunes en difficulté scolaire ou sociale, et les étudiants. Appel \"Pour un pacte national contre l'échec scolaire\" (voir le site)","inégalité sociale ; justice sociale ; quartiers défavorisés ; éducation ; soutien scolaire ; jeunesse ; élections ; 2012","","O","Page d'accueil","AFEV","370 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["Affaires étrangères : le blog de Vincent Jauvert","http://globe.blogs.nouvelobs.com/","12","gauche","relations internationales:relations internationales","","individu","O","","Blog du journaliste du Nouvel Observateur Vincent Jauvert. Traite de la politique étrangère de la France et des relations internationales.","Vie politique ; Politique étrangère ; Relations internationales ; France","Politics ; Foreign Policy ; International Relations ; France","O","Page spécifique","Nouvel Obs ; Vincent Jauvert","327 ; 944","fre","FR","Europe (UE)","13","11","1","DG","",""],["Affaires stratégiques","http://pascalbonifaceaffairesstrategiques.blogs.nouvelobs.com/","13","gauche","relations internationales:relations internationales","pascal boniface","individu","O","","Blog de Pascal Boniface au Nouvel Observateur. Suivi et analyse de l'actualité internationale et stratégique. ","Actualités ; Relations internationales ; Géopolitique","News ; International Affairs ; Geopolitics","O","Page spécifique","Le Nouvel Observateur","327","fre","FR","Europe (UE)","13","11","1","DG","",""],["Affronter la Crise: Austérité ou Solidarité : EuroMemorandum 2010-2011/European Economists for an Alternative Economic Policy in Europe - EuroMemo Group","http://www2.euromemorandum.eu/uploads/euromemorandum_2010_2011_francais.pdf","","gauche","économie:crise financière ; politique sociale:politique sociale ; europe:europe","","think tank","N","O","Cet Euromemorandum a été élaboré à partir des discussions menées lors du 16ème workshop sur la politique économique alternative en Europe, organisé par le Groupe Euromemo du 24 au 26 septembre 2010, à Rethymnon, en Grèce. Il est basé sur les contributions écrites de Wilfried Altzinger, Stephanie Blankenburg, Hermann Bömer, Trevor Evans, John Grahl, Maria Karamessini, Jeremy Leaman, Dominique Plihon, Gunter Quaisser, David Vetterli, Diana Wehlau et Frieder Otto Wolf.","Politique économique ; alternative ; crise financière ; Union européenne ; think tank","","O","Page spécifique","EuroMemo.eu","330 ; 940","fre","ZZ","Europe (UE)","14","10","1","DG","",""],["Agence de l'Environnement et de la Maîtrise de l'Energie - ADEME","http://www2.ademe.fr","14","sans orientation","énergie:énergie ; environnement:environnement ; environnement:développement durable","","institution","O","","Etablissement public à caractère industriel et commercial, placé sous la tutelle conjointe des ministères en charge de l'Écologie, du Développement durable, des Transports et du Logement, de l'Enseignement Supérieur et de la Recherche et de l'Économie, des Finances et de l'Industrie. Elle participe à la mise en oeuvre des politiques publiques dans les domaines\n de l'environnement, de l'énergie et du développement durable. ","Politique de l'environnement ; politique énergétique ; développement durable ; consommation ; France ","","O","Page d'accueil","ADEME","333 ; 944","fre","FR","Europe (UE)","10","11","1","DG","","oui"],["Agence des droits fondamentaux de l'Union européenne","http://fra.europa.eu/fraWebsite/home/home_en.htm","15","sans orientation \n","société:droits de l'homme ; europe:europe","","association","O","","European Union Agency for Fundamental Rights. Créée à Vienne par le règlement (CE) n° 168/2007 du 15 février 2007.Collecte des données, mène des recherches et produit des analyses sur les droits fondamentaux\ndans les pays de l’UE ","Droits de l'homme ; Démocratie ; ","Human rights ; Democracy","O","Page spécifique","European Union Agency for Fundamental Rights","323","eng","ZZ","Europe (UE)","10","11","1","ZM","",""],["Agence nationale pour l'amélioration des conditions de travail - ANACT","http://www.anact.fr/","16","sans orientation","emploi:conditions de travail ; économie:entreprise","","institution","O","","L'Anact est un établissement sous tutelle du Ministère en charge du travail. Elle s'appuie sur 26 associations régionales (ARACT), structures de droit privé, administrées de manière paritaire et financées par l'Etat (ANACT-DIRECCTE) et les Régions.","Conditions de travail ; CHSCT ; entreprises ; souffrance au travail ; relations industrielles ; temps de travail ; organisation du travail ; France","","O","Page d'accueil","ANACT","331 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["Agora","http://agora.hypotheses.org/","17","sans orientation","éducation:enseignement supérieur et recherche ; emploi:emploi ; société:jeunesse","","université/centre de recherche","O","","Plateforme de carnets de recherche en sciences humaines et sociales. Portail de ressources électroniques \"Openedition\", Revues.org ; Calenda (calendrier des sciences sociales) ; Hypothèses.org (carnets et blogs de recherche) ; Lettre & alertes ; Freemium (programme innovant pour le libre accès à l'édition scientifique).","Sciences sociales ; Philosophie ; Société ; Débat public ; France","Social sciences ; Philosophy ; Society ; Public Debate ; France","O","Page spécifique","CLEO","300 ; 944","fre","FR","Europe (UE)","10","10","1","DG","Pas MAJ depuis 25/02/12",""],["Agoravox - le média citoyen","http://www.agoravox.fr/","18","gauche","","","média","O","","Média citoyen et participatif : actualités politiques, enquêtes participatives","Médias ; Vie politique ; Citoyen ; Participation ; France","Media ; News ; Politics ; Partcipation ; France","O","Page d'accueil","Fondation Agoravox","324 ; 070","fre","FR","Europe (UE)","10","11","0","DG","Le projet des questions sur les élections n'a jamais commencé ...",""],["AIDES","http://www.aides.org/","19","sans orientation","politique sociale:santé ; société:discriminations ; vie politique:citoyenneté","","association","O","","Créée en 1984 et reconnue d'utilité publique en 1990, AIDES est la première association française de lutte contre le sida.","Association ; SIDA ; Santé publique ; Discriminations ; France ","","O","Page d'accueil","AIDES","360 ; 944","fre","FR","Europe (UE)","10","11","1","DG","",""],["Alain Godard","http://alternatives-economiques.fr/blogs/godard/","20","sans orientation","économie:finances publiques ; emploi:emploi ; énergie:nucléaire ; environnement:développement durable","","individu","O","","Blog d'Alain Godard, agronome et chercheur, qui a longtemps fait partie des instances dirigeantes de Rhône-Poulenc, puis du Groupe Aventis. En désaccord avec la stratégie du Groupe, il quitte Aventis en 2001 et s'installe comme viticulteur dans le Sud de la France. Conseil de plusieurs PME en biotechnologie végétale, il intervient en tant que \"passeur d'expériences\" pour quelques grands groupes internationaux.","Economie politique ; Agronomie ; Politique agricole ; Biotechnologie ; France ; Europe","Political economy ; Agricultural policy ; Biotechnology ; France ; Europe","O","Page spécifique","Alternatives économiques","333 ; 944","fre","ZZ","Europe (UE)","13","11","1","DG","","oui"],["Alain Lamassoure","http://www.alainlamassoure.eu/","21","droite","vie politique:vie politique ; europe:europe ; économie:finances publiques ; sécurité et défense:sécurité et défense","alain lamassoure","individu","O","","Député européen (UMP et groupe PPE), président de la Commission des budgets du Parlement européen, conseiller régional d'Aquitaine, Secrétaire général de la Convention démocrate.","vie politique ; finances publiques ; Union européenne ; élu ; UMP; Aquitaine ; élections ; France ; 2012","","O","Page d'accueil","Alain Lamassoure","324 ; 940","fre","FR","Europe (UE)","13","11","1","DG","",""],["Alain Lipietz","http://lipietz.net/","","écologie politique","environnement:environnement ; économie:économie ; europe:europe","nicolas hulot ; alain lipietz","parti politique ; europe écologie -les verts","O","","Site d'Alain Lipietz, député européen (Verts, France).","Vie politique ; Elus ; France ; Europe ; Ecologie politique ; Enjeux ; Elections","Politics ; France ; Europe ; Environmental Policy ; Green movement ; Issues ; Elections","O","Page d'accueil","Alain Lipietz","324 ; 944 ; 333","fre","FR","Europe (UE)","10","11","1","ZM","",""],["Alain Vidalies","http://www.parti-socialiste.fr/l-equipe/alain-vidalies","22","gauche","emploi:emploi ; politique sociale:politique\nsociale ; vie politique:campagne électorale","Alain Vidalies","parti politique","O","","Page du site du PS consacré à Alain Vidalies, Ministre délégué auprès du Premier ministre, chargé des Relations avec le Parlement","","","","Page spécifique","PS","324 ; 944","fre","FR","Europe (UE)","12","11","1","ZM","",""],["Alicia Clashs","http://aliciabx.blogspot.fr/","23","extrême-droite","vie politique:vie politique ; vie politique:campagne\nélectorale ; société:société","marine le pen","individu","O","","Blog sur l'actualité politique, sur des thèmes de société, entre autres","société ; vie politique ; campagne électorale ; élection présidentielle ; France ; 2012","","O","Page spécifique","","320 ; 944","fre","FR","Europe (UE)","13","11","1","ZM","",""],["Alliance centriste","http://www.alliancecentriste.fr","24","centre","économie:économie ; europe:europe ; éducation:éducation ; administration publique:administration publique ; économie:finances publiques","jean arthuis ; françois bayrou","parti politique","O","","L'activité de l'association et du parti. Le fonctionnement, les statuts. L'ambition de l'Alliance Centriste est de refonder la famille centriste rassemblée et indépendante comme force\n de propositions et d'action sur l'échiquier politique.","Partis politiques ; Centre ; France","Politics ; Centre ; France","O","Page d'accueil"," Rassembler Les Centristes","324 ; 944","fre","FR","Europe (UE)","12","11","1","JCJ (OD)","","oui"],["Alliance des Démocrates et des Libéraux pour l'Europe -","http://www.alde.eu/fr/","25","centre","société:société ; environnement:développement durable ; europe:europe","","parti politique","O","","Site du Groupe de l'Alliance des Démocrates et des Libéraux pour l'Europe au Parlement européen","Partis politiques ; Vie politique ; Europe","Politics ; Centre ; European Union","O","Page d'accueil","Groupe de l'Alliance des Démocrates et des Libéraux pour l'Europe au Parlement européen","324","mul","ZZ","Europe (UE)","12","11","1","ZM","",""],["Alliance des Jeunes centristes","http://lajc.centristesblog.fr/","26","centre","société:jeunesse ; éducation:éducation ; vie politique:vie politique ; europe:europe","françois bayrou ; jean arthuis","parti politique","O","","Blog de l'Alliance des Jeunes Centristes, mouvement des jeunes de l'Alliance centriste dont l'objectif est de refonder la famille centriste rassemblée et indépendante comme force de propositions et d'action sur l'échiquier politique.\n","Vie politique ; Élection présidentielle ; 2012 ; Jeunesse ; France","Politics ; President Election ; 2012 ; Youth ; France","O","Page d'accueil","Alliance des Jeunes Centristes ","324 ; 944","fre","FR","France","12","11","1","ZM","",""],["Alliance écologique indépendante : au delà de la gauche et de la droite, lécologie indépendante","http://www.alliance-ecologiste-independante.fr/","27","écologie politique","environnement:développement durable ; europe:europe ; énergie:nucléaire","jean-marc governatori","parti politique ","O","","Mouvement politique laïc, indépendant de toute organisation philosophique, politique, religieuse ou spirituelle. Respect des êtres vivants, des personnes, des biens et des écosystèmes. \"Nous voulons faire émerger les idées écologistes comme modèle politique, et dépasser la résignation en montrant les solutions existantes, simples, saines et économiques.\"","écologie politique ; citoyen ; politique économique ; fiscalité ; énergie ; Elections ; 2012 ; France","","O","Page d'accueil","Alliance écologiste indépendante","324 ; 944","fre","FR","Europe (UE)","10","11","1","DG","","oui"],["Alliance géostratégique","http://alliancegeostrategique.org/","28","sans orientation","relations internationales:relations internationales","","association","O","","Plateforme de blogs francophones (14 auteurs) consacrée aux questions de géostatégie (géopolitique + stratégie). Ces échanges ont pour objectif la construction d'une pensée géostratégique francophone","Géopolitique ; Stratégie ; Relations internationales ; Conflits ; France ; Francophonie","Geopolitics ; Strategy ; International Relations ; Conflicts ; France ; French Speaking countries","O","Page d'accueil","Alliance géostratégique","327 ; ","fre","ZZ","","10","9","1","DG","",""],["Alliance Progressiste des Socialistes et Démocrates","http://www.socialistsanddemocrats.eu/gpes/index.jsp","29","gauche","politique sociale:politique sociale ; économie:économie ; société:immigration ; europe:europe ; relations internationales:relations internationales","catherine trautmann","parti politique","O","","Site du Groupe de l'Alliance Progressiste des Socialistes et Démocrates. L' Alliance progressiste des socialistes et démocrates au Parlement européen succède à l'ancien groupe du Parti socialiste européen","Partis politiques ; Vie politique ; Europe ; ","Politics ; Left ; European Union","O","Page d'accueil","Groupe de l'Alliance Progressiste des Socialistes et Démocrates","324","mul","ZZ","Europe UE)","12","11","1","ZM","",""],["Alliance Républicaine, Ecologiste et Sociale","http://alliance-pour-une-france-juste.fr/","","centre","europe:europe ; vie politique:citoyenneté","","parti politique","N","O","Alliance des partis Gauche Moderne , Parti Radical, Convention Démocrate, Nouveau Centre","Vie politique ; Primaires ; Élection présidentielle ; 2012 ; France ","Politics ; Primary ; President Election ; 2012 ; France","O","Page d'accueil","ARES (Alliance Républicaine, Ecologiste et Sociale)","324","fre","FR","","10","11","1","ZM","Dernière MAJ 09/11",""],["Allons enfants !","http://www.allons-enfants.org/","30","droite","éducation:éducation ; société:jeunesse","rama yade","think tank","O","","Think tank présidé par Rama Yade et consacré aux jeunes","Vie politique ; France ; Jeunesse ; Centre ; Enjeux ; Elections","Politics; France ; Youth ; Centre ; Issues ; Elections\n\n\n","O","Page d'accueil","Allons enfants !","324","fr","FR","FR","12","11","1","ZM\n","",""],["Alsace d'abord","http://www.alsacedabord.org/","31","extrême-droite","vie politique:identité nationale ; société:immigration ; europe:europe","","parti politique","O","","Parti politique régionaliste européen et identitaire en région Alsace","régionalisme ; alsace ; identité nationale ; immigration ; europe","","O","Page d'accueil","Alsace d'abord","305 ; 940","fre","FR","Europe (UE)","13","11","1","DG","",""],["Alter Oueb.fr","http://www.alter-oueb.fr/\n","32","gauche","vie politique:vie politique ; politique sociale:politique sociale ; numérique:numérique","","individu","O","","Blog \"alter\" d'un citoyen engagé qui commente l'actualité politique et sociale française. ","Vie politique ; Société ; Gauche ; Élections ; 2012 ; France ","Politics ; Society ; Left ; Elections ; 2012 ; France","O","Page d'accueil","Alter Oueb.fr","324 ; 944","fre","FR","Europe (UE)","13","11","1","DG","Fait partie des \"Left blogs\"",""],["Altermondes","http://www.altermondes.org/","1010","","","","média","O","","Site de la Revue trimestrielle de solidarité internationale","altermondialisme ; développement durable ; droits de l'homme","","","","","","","","","","","","","",""],["Alternative Libérale","http://www.alternative-liberale.fr/index.php/","33","droite","vie politique:vie politique ; économie:économie ; politique sociale:politique sociale","louis-marie bachelot ; didier salavert","parti politique","O","","Site d' Alternative Libérale. \"Nous proposons une réforme radiicale de l’Etat et des systèmes sociaux, une refonte complète du fonctionnement de nos institutions, une nouvelle donne pour l’emploi et l’intégration. Pour ces réformes nous avons une seule boussole : le passage d’une société de surveillance et d’assistance généralisée à une société de responsabilité et de liberté. Le recours à la voie des réformes libérales est la meilleure chance pour notre pays\". \n \n \n \n \n ","Vie politique ; France ; Europe","Politics, France ; Europe","O","Page d'accueil","Alternative Libérale","324 ; 944","fre","FR","France ; Europe","12","11","1","ZM","","oui"],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","Doublon",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","Le blog ne fonctionne plus ...",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","","","","","","","","",""],["","","","","","","","","","","","","","","","","fre","FR","Europe (UE)","12","11","1","ZM","La page spécifique est encore en ligne. Mais le site principal a pour adresse : http://www.fnars.org/",""],[""]]
    savedData.parsedUrls_type = 'table'
    savedData.parsedUrls_settings = {urlColId: 1}

    function set(key, data){
      savedData[key] = data
    }
    function get(key){
      return savedData[key]
    }
    function remove(key){
      return delete savedData[key]
    }

    return {
      set: set
      ,get: get
      ,remove: remove
    }
  }]).
  factory('Parser', [function(){
  	return function(){
  		var ns = this

  		ns.parseCSV = function(data){
        return ns.CSVToArray(data, ',')
      }

      ns.parseSCSV = function(data){
  			return ns.CSVToArray(data, ';')
  		}

  		ns.parseTSV = function(data){
  			return ns.CSVToArray(data, '\t')
  		}

  		// ref: http://stackoverflow.com/a/1293163/2343
	    // This will parse a delimited string into an array of
	    // arrays. The default delimiter is the comma, but this
	    // can be overriden in the second argument.
	    ns.CSVToArray = function( strData, strDelimiter ){
        // Check to see if the delimiter is defined. If not,
        // then default to comma.
        strDelimiter = (strDelimiter || ",");

        // Create a regular expression to parse the CSV values.
        var objPattern = new RegExp(
          (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
          ),
          "gi"
        )

        // Create an array to hold our data. Give the array
        // a default empty first row.
        var arrData = [[]]

        // Create an array to hold our individual pattern
        // matching groups.
        var arrMatches = null

        // Keep looping over the regular expression matches
        // until we can no longer find a match.
        while (arrMatches = objPattern.exec( strData )){

          // Get the delimiter that was found.
          var strMatchedDelimiter = arrMatches[ 1 ]

          // Check to see if the given delimiter has a length
          // (is not the start of string) and if it matches
          // field delimiter. If id does not, then we know
          // that this delimiter is a row delimiter.
          if (
            strMatchedDelimiter.length &&
            strMatchedDelimiter !== strDelimiter
            ){

            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push( [] )

          }

          var strMatchedValue

          // Now that we have our delimiter out of the way,
          // let's check to see which kind of value we
          // captured (quoted or unquoted).
          if (arrMatches[ 2 ]){

            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
              )

          } else {

            // We found a non-quoted value.
            strMatchedValue = arrMatches[ 3 ]

          }

          // Now that we have our value string, let's add
          // it to the data array.
          arrData[ arrData.length - 1 ].push( strMatchedValue )
        }

        // Return the parsed data.
        return( arrData )
	    }
  	}
  }]).
  factory('extractWebEntities', ['extractCases', 'URL_validate', function(extractCases, URL_validate){
    return function(text){
      var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
        ,raw_urls = text.match(re) || []
        ,urls = raw_urls
          .filter(function(expression){
              return URL_validate(expression)
            })
          .map(function(url){
              if(url.indexOf('http')!=0)
                return 'http://'+url
              return url
            })
      return extractCases(urls)
    }
  }]).
  factory('extractCases', [function(){
    return function(data_array, elementAccessor){
      if(elementAccessor === undefined)
      elementAccessor = function(x){return x}
      
      var temp_result = data_array.map(function(d){
        return {id:elementAccessor(d), content:d}
      }).sort(function(a, b) {
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      })
        
      // Merge Doubles
      var result = []
      for (var i = 0; i < temp_result.length; i++) {
        if (i==0 || temp_result[i - 1].id != temp_result[i].id) {
          result.push(temp_result[i].content)
        }
      }
      
      return result
    }
  }]).
  factory('URL_validate', [function(){
    return function(url){
      var urlregex = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/
      return urlregex.test(url)
    }
  }]).
  factory('droppableTextArea', [function(){
    return function(droppableTextArea, $scope, callback){
      //============== DRAG & DROP =============
      // adapted from http://jsfiddle.net/danielzen/utp7j/

      // init event handlers
      function dragEnterLeave(evt) {
        evt.stopPropagation()
        evt.preventDefault()
        $scope.$apply(function(){
          $scope.dropClass = 'over'
        })
      }
      droppableTextArea.addEventListener("dragenter", dragEnterLeave, false)
      droppableTextArea.addEventListener("dragleave", dragEnterLeave, false)
      droppableTextArea.addEventListener("dragover", function(evt) {
        evt.stopPropagation()
        evt.preventDefault()
        var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0
        $scope.$apply(function(){
          $scope.dropClass = ok ? 'over' : 'over-error'
        })
      }, false)
      droppableTextArea.addEventListener("drop", function(evt) {
        // console.log('drop evt:', JSON.parse(JSON.stringify(evt.dataTransfer)))
        evt.stopPropagation()
        evt.preventDefault()
        $scope.$apply(function(){
          $scope.dropClass = 'over'
        })
        var files = evt.dataTransfer.files
        if (files.length == 1) {
          $scope.$apply(function(){
            callback(files[0])
            $scope.dropClass = ''
          })
        }
      }, false)
    }
  }]);