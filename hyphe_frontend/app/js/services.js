'use strict';

/* Services */

angular.module('hyphe.services', [])

  .factory('FileLoader', ['$window', function(win){
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
  }])
  
  .factory('glossary', [function(){
    return function(term){
      // TODO
      return term
    }
  }])

  .factory('store', [function(){
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
  }])

  .factory('Parser', [function(){
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
  }])

  .factory('extractURLs', ['utils', function(utils){
    return function(text){
      var re = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig
        ,raw_urls = text.match(re) || []
        ,urls = raw_urls
          .filter(function(expression){
              return utils.URL_validate(expression)
            })
          .map(function(url){
              if(url.indexOf('http')!=0)
                return 'http://'+url
              return url
            })
      return utils.extractCases(urls)
    }
  }])

  .factory('droppableTextArea', [function(){
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
  }])

  .factory('utils', [function(){
    var ns = {} // Namespace
    ns.reEncode = function(uri){
      try {
        return encodeURI(decodeURI(uri))
      } catch(e) {
        console.log("ERROR reEncoding url", uri)
        return uri
      }
    }

    ns.reEncodeComponent = function(uri){
      try {
        return encodeURIComponent(decodeURIComponent(uri))
      } catch(e) {
        console.log("ERROR reEncoding url components", uri)
        return uri
      }
    }

    ns.LRU_reEncode = function(lru){
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      if(json_lru["path"])
        json_lru["path"] = json_lru["path"].map(function(p){
          return p = ns.reEncodeComponent(p)
        })
      if(json_lru["fragment"])
        json_lru["fragment"] = ns.reEncodeComponent(json_lru["fragment"])
      return ns.JSON_LRU_to_LRU(json_lru)
    }

    ns.URL_reEncode = function(url){
      return ns.LRU_to_URL(ns.LRU_reEncode(ns.URL_to_LRU(url)))
    }

    ns.URL_to_LRU = function(url){
      var json_lru = ns.URL_to_JSON_LRU(url)
      if(json_lru === undefined)
        return ''
      return ns.JSON_LRU_to_LRU(json_lru)
    }

    ns.JSON_LRU_to_LRU = function(json_lru){
      var lru = "s:" + json_lru.scheme + "|"
      if(json_lru.port)
        lru += "t:" + json_lru.port + "|"
      json_lru.host.forEach(function(h){lru += "h:" + h + "|";})
      json_lru["path"].forEach(function(p){lru += "p:" + p + "|";})
      if(json_lru.query)
        lru += "q:" + json_lru.query + "|"
      if(json_lru.fragment)
        lru += "f:" + json_lru.fragment + "|"
      return lru
    }

    ns.URL_to_JSON_LRU = function(URL){
      var LRU,
      regex = /^([^:\/?#]+):(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/
      
      if (URL.match(regex)) { 
        var scheme = RegExp.$1,
        authority = RegExp.$2,
        path = RegExp.$3,
        query = RegExp.$4,
        fragment = RegExp.$5
        if (scheme.match(/https?/) && authority.match(/^(?:([^:]+)(?::([^@]+))?\@)?([^\s:]+)(?::(\d+))?$/)) {
          var user = RegExp.$1,
          password = RegExp.$2,
          host = RegExp.$3,
          port = RegExp.$4
          
          host = host.toLowerCase().split(/\./)
          
          LRU = {
            "scheme": scheme.toLowerCase(),
            "host": host.reverse(),
            // "path": path.split(/\//).filter(function(pathToken){return pathToken.length}),   
            "path": path.split(/\//).filter(function(pathToken, i){return i>0}),   
          }
          if(port)
            LRU.port = port
          if(query)
            LRU.query = query
          if(fragment)
            LRU.fragment = fragment
        }
      }
      return LRU;
    }

    ns.LRU_to_URL = function(lru){
      return ns.JSON_LRU_to_URL(ns.LRU_to_JSON_LRU(lru)); 
    }

    ns.LRU_to_JSON_LRU = function(lru){
      var lru_array = lru.replace(/\|$/, '').split("|"),
      json_lru = {host:[], path:[]}
      lru_array.forEach(function(stem){
        var type = stem.substr(0, 1)
        name = stem.substr(2, stem.length - 2)
        if(type=="s"){
          json_lru.scheme = name.toLowerCase()
        } else if(type=="t"){
          json_lru.port = name
        } else if(type=="h"){
          json_lru.host.push(name.toLowerCase())
        } else if(type=="p"){
          json_lru.path.push(name)
        } else if(type=="q"){
          json_lru.query = name
        } else if(type=="f"){
          json_lru.fragment = name
        }
      })
      return json_lru
    }

    ns.JSON_LRU_to_URL = function(json_lru){
      var scheme    = "",
      hosts   = "",
      port    = "",
      path    = "",
      query   = "",
      fragment  = ""
      
      if(json_lru.scheme != undefined && json_lru.scheme.length>0)
        scheme = json_lru.scheme+"://"
      else
        scheme = "http://"
      
      if(json_lru.host != undefined && json_lru.host.length>0){
        json_lru.host.forEach(function(h){
          hosts = "."+h+hosts
        })
        hosts = hosts.substr(1, hosts.length)
      }
      
      if(json_lru.path != undefined && json_lru.path.length>0)
        json_lru.path.forEach(function(p){
          path = path+"/"+p
        })
      
      if(json_lru.query != undefined && json_lru.query.length>0)
        query = "?"+json_lru.query
      
      if(json_lru.fragment != undefined && json_lru.fragment.length>0)
        fragment = "#"+json_lru.fragment
      
      if(json_lru.port != undefined && json_lru.port!="80")
        port = ":"+json_lru.port

      return scheme+port+hosts+path+query+fragment
    }

    ns.URL_to_pretty_LRU = function(url){
      return ns.JSON_LRU_to_pretty_LRU(ns.URL_to_JSON_LRU(url))
    }

    ns.LRU_to_pretty_LRU = function(lru){
      return ns.JSON_LRU_to_pretty_LRU(ns.LRU_to_JSON_LRU(url))
    }

    ns.JSON_LRU_to_pretty_LRU = function(json_lru){
      var pretty_lru = []
      pretty_lru.push(json_lru.scheme)
      json_lru.host.forEach(function(stem, i){
        switch(i){
          case 0:
            pretty_lru.push('.'+explicit(stem))
            break
          case 1:
            pretty_lru.push(explicit(stem))
            break
          default:
            pretty_lru.push(explicit(stem)+'.')
            break
        }
      })
      json_lru.path.forEach(function(stem){
        pretty_lru.push('/'+explicit(stem))
      })
      if(json_lru.query)
        pretty_lru.push('?'+explicit(stem))
      if(json_lru.fragment)
        pretty_lru.push('#'+explicit(stem))

      function explicit(stem){
        return stem.replace(/[\n\r]/gi, '<line break>')
          .replace(/^$/gi, '<empty>')
          .replace(/^ $/, '<space>')
          .replace(/(  +)/, ' <spaces> ')
      }

      return pretty_lru
    }

    ns.URL_remove_http = function(url) {
      return url.replace(/^http:\/\//, '')
    }

    ns.URL_fix = function(url){
      // Trim
      url = $.trim(url)

      if(url == '')
        return ''
      var protocolSplit = url.split('://')
      if(protocolSplit.length == 1 || (protocolSplit.length > 1 && protocolSplit[0].length > 10)){
        url = 'http://'+url
      }
      
      // Strip the last slash if there are only three slashes in the URL
      if(url.match(/\//g).length == 3){
        url = url.replace(/\/$/, '')
      }


      return url
    }

    ns.URL_stripLastSlash = function(url){
      // Trim
      url = $.trim(url)

      url = url.replace(/\/$/, '')

      return url
    }

    ns.LRU_prefix_fix = function(lru_prefix){
      var split = lru_prefix.replace(/\|$/, '').split('|')
      ,lastStem = split[split.length-1]
      ,lastStemSplit = lastStem.split(':')
      if(lastStemSplit.length>1 && lastStemSplit[1]=='')
        split.pop()
      return split.join('|') + '|'
    }

    ns.LRU_validate = function(lru){
      var lruregex = /^s:[^\|]+\|(h:[a-zA-Z0-9\-]+\|){2}/
      return lruregex.test(lru)
    }

    ns.URL_validate = function(url){
      var urlregex = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/
      return urlregex.test(url)
    }

    ns.LRU_getTLD = function(lru){
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      ,host_split = json_lru.host.slice(0)
      ,tlds = ns.getTLDLists()

      function getLongestMatchingTLDSplit(tld_candidate_split){
        var longestMatchingTLD_split = []
        tlds.rules.forEach(function(tld){
          var tld_split = tld.split('.').reverse()
          ,match_flag = true
          ,i

          for(i in tld_split){
            if(tld_candidate_split.length < i){
              match_flag = false
              break
            }
            if(tld_split[i] != tld_candidate_split[i]){
              if(tld_split[i] != '*'){
                match_flag = false
                break
              }
            }
          }

          if(match_flag && tld_split.length > longestMatchingTLD_split.length){
            var actualTLDCandidate = host_split.slice(0, tld_split.length)
            longestMatchingTLD_split = tld_split
          }
        })
        if(longestMatchingTLD_split.length == 0){
          console.log('No tld matching for', lru)
          return []
        }
        // Check the longest matching tld is not an exception
        var actualTLDCandidate = host_split.slice(0, longestMatchingTLD_split.length)
        ,matchingExceptions = tlds.exceptions.filter(function(tld){
          var tld_split = tld.split('.').reverse()
          ,match_flag = true

          for(i in tld_split){
            if(actualTLDCandidate.length < i){
              match_flag = false
              break
            }
            if(tld_split[i] != actualTLDCandidate[i]){
              match_flag = false
              break
            }
          }
          return match_flag
        })
        if(matchingExceptions.length != 0){
          // console.log('TLD is an exception', longestMatchingTLD_split)
          longestMatchingTLD_split.pop()
        }
        return longestMatchingTLD_split
      }

      var longestMatchingTLD = getLongestMatchingTLDSplit(host_split, [])
      return host_split.slice(0, longestMatchingTLD.length).reverse().join('.')
    }

    // Previously: ns.getPrefixCandidates
    ns.LRU_variations = function(lru, settings){
      if(lru === undefined)
        return []
      var candidates = []
      ,tld_length = Utils.LRU_getTLD(lru).split('.').length
      ,lru_a = lru.split('|')
      ,lru_json = Utils.LRU_to_JSON_LRU(lru)
      ,settings = settings || {}
      
      // Settings content and defaults
      settings.wwwlessVariations  = settings.wwwlessVariations || false
      settings.wwwVariations      = settings.wwwVariations || false
      settings.httpVariations     = settings.httpVariations || false
      settings.httpsVariations    = settings.httpsVariations || false
      if(settings.smallerVariations === undefined){settings.smallerVariations = true}
    
      candidates.push(lru)
      if(lru_a.length>2+tld_length && settings.smallerVariations){
        for(length = lru_a.length-1; length>=2+tld_length; length--){
          var candidate = lru_a.filter(function(stem, i){
            return i < length
          }).join('|') + '|'
          candidates.push(candidate)
        }
      }
      if(settings.wwwlessVariations && lru_json.host[lru_json.host.length - 1] == 'www'){
        var wwwlessVariation_json = lru_json.slice()
        wwwlessVariation_json.host.pop()
        var wwwlessVariation = ns.JSON_LRU_to_LRU(wwwlessVariation_json)
        candidates = candidates.concat(ns.getPrefixCandidates(wwwlessVariation, {
          wwwlessVariations: false
          ,wwwVariations: false
          ,httpVariations: settings.httpVariations
          ,httpsVariations: settings.httpsVariations
          ,smallerVariations: settings.smallerVariations
        }))
      }
      if(settings.wwwVariations && lru_json.host[lru_json.host.length - 1] != 'www'){
        var wwwVariation_json = lru_json.slice()
        wwwVariation_json.host.push('www')
        var wwwVariation = ns.JSON_LRU_to_LRU(wwwVariation_json)
        candidates = candidates.concat(ns.getPrefixCandidates(wwwVariation, {
          wwwlessVariations: false
          ,wwwVariations: false
          ,smallerVariations: settings.smallerVariations
          ,httpVariations: settings.httpVariations
          ,httpsVariations: settings.httpsVariations
        }))
      }
      if(settings.httpsVariations && lru_json.scheme == 'http'){
        var httpsVariation_json = lru_json.slice()
        httpsVariation_json.scheme = 'https'
        var httpsVariation = ns.JSON_LRU_to_LRU(httpsVariation_json)
        candidates = candidates.concat(ns.getPrefixCandidates(httpsVariation, {
          wwwlessVariations: settings.wwwlessVariations
          ,wwwVariations: settings.wwwVariations
          ,smallerVariations: settings.smallerVariations
          ,httpVariations: false
          ,httpsVariations: false
        }))
      
      }
      if(settings.httpVariations && lru_json.scheme == 'https'){
        var httpVariation_json = lru_json.slice()
        httpVariation_json.scheme = 'http'
        var httpVariation = ns.JSON_LRU_to_LRU(httpVariation_json)
        candidates = candidates.concat(ns.getPrefixCandidates(httpVariation, {
          wwwlessVariations: settings.wwwlessVariations
          ,wwwVariations: settings.wwwVariations
          ,smallerVariations: settings.smallerVariations
          ,httpVariations: false
          ,httpsVariations: false
        }))
      }
      return ns.extractCases(candidates).reverse()
    }

    ns.nameURL = function(url){
      var json_lru = ns.URL_to_JSON_LRU(url)
      ,name = json_lru.host
        .filter(function(d){return d != 'www'})
        .map(function(d,i){if(i==1){return ns.toProperCase(d)} return d})
        .reverse()
        .join('.')
      if(json_lru.path.length == 1 && json_lru.path[0].trim().length>0){
        name += ' /' + json_lru.path[0]
      } else if(json_lru.path.length > 1) {
        name += ' /' + json_lru.path[0] + '/...'
      }
      return name
    }

    // Test functions
    ns.LRU_test_hasNoPath = function(lru, settings){
      settings = settings || {}
      if(settings.strict === undefined)
        settings.strict = true
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      if(settings.strict){
        return json_lru.path.length == 0
      } else {
        if(json_lru.path.length == 0){
          return true
        } else if(json_lru.path.length == 0){
          return json_lru.path[0] == ''
        } else {
          return false
        }
      }
    }

    ns.LRU_test_hasNoSubdomain = function(lru, settings){
      settings = settings || {}
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      ,host_array = json_lru.host.slice(0)
      // Truncate host
      host_array.pop()
      var truncatedHost = host_array.reverse().join('.')
      // There was no subdomain if the removed part was the domain and thus the truncated host is just a tld
      return ns.TLD_isValid(truncatedHost)
    }

    ns.LRU_test_isNonsectionPage = function(lru, settings){
      settings = settings || {}
      var json_lru = ns.LRU_to_JSON_LRU(lru)
      return (json_lru.fragment && json_lru.fragment != '')
      || (json_lru.query !== undefined)
      || (
        json_lru.path.length > 0
        && json_lru.path.pop().indexOf('.') >= 0
        )
    }

    // TLD
    ns.tld_lists = undefined
    ns.getTLDLists = function(){
      // Retrieve the list only if it is the first time it's needed
      if(ns.tld_lists === undefined)
        ns.tld_lists = ns.buildTLDLists()
      return ns.tld_lists
    }
    ns.buildTLDLists = function(){
      var list_text
      $.ajax({
        url:"res/tld_list.txt"
        ,success: function(result) {
          list_text = result
        }
        ,async: false
      })
      var lines = list_text.match(/[^\r\n]+/g)
      ,list =  lines
        .filter(function(l){
            return l.length > 0
            && l.indexOf('//') != 0
          })
        .map(function(l){
            var split = l.split(' ')
            return split[0] || ''
          })
      var tld_lists = {
        rules: list
        .filter(function(l){return l.substr(0,1) != '!'})
        ,exceptions: list
        .filter(function(l){return l.substr(0,1) == '!'})
        .map(function(l){return l.substr(1, l.length-1)})
      }
      return tld_lists
    }

    ns.TLD_isValid = function(tld_candidate){
      var tlds = ns.getTLDLists()
      ,tld_candidate_split = tld_candidate.split('.')
      ,matchingTLDs = tlds.rules.filter(function(tld){
        var tld_split = tld.split('.')
        ,match_flag = true

        for(i in tld_candidate_split){
          if(tld_split.length < i){
            match_flag = false
            break
          }
          if(tld_split[i] != tld_candidate_split[i]){
            if(tld_split[i] != '*'){
              match_flag = false
              break
            }
          }
        }

        return match_flag
      })
      // Check for exceptions
      var matchingExceptions = tlds.exceptions.filter(function(tld){
        var tld_split = tld.split('.')
        ,match_flag = true

        for(i in tld_candidate_split){
          if(tld_split.length < i){
            match_flag = false
            break
          }
          if(tld_split[i] != tld_candidate_split[i]){
            match_flag = false
            break
          }
        }

        return match_flag
      })
      return matchingTLDs.length > 0 && matchingExceptions.length == 0
    }

    // Misc

    ns.htmlEncode = function(value){
      return $('<div/>').text(value).html()
    }

    ns.htmlDecode = function(value){
      return $('<div/>').html(value).text()
    }

    ns.checkforInteger = function(value) {
      if (parseInt(value) != value)
        return false
      else
        return true
    }

    ns.checkforPrice = function(value) {
      if (isNaN(parseFloat(value)))
        return false
      else
        return true
    }

    ns.prettyDate = function(date){
      // Code adapted from http://webdesign.onyou.ch/2010/08/04/javascript-time-ago-pretty-date/
      var time_formats = [
        [60, 'just now', 'just now'],                 // 60
        [120, '1 minute ago', '1 minute from now'],   // 60*2
        [3600, 'minutes', 60],                        // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'],      // 60*60*2
        [86400, 'hours', 3600],                       // 60*60*24, 60*60
        [172800, 'yesterday', 'tomorrow'],            // 60*60*24*2
        [604800, 'days', 86400],                      // 60*60*24*7, 60*60*24
        [1209600, 'last week', 'next week'],          // 60*60*24*7*4*2
        [2419200, 'weeks', 604800],                   // 60*60*24*7*4, 60*60*24*7
        [4838400, 'last month', 'next month'],        // 60*60*24*7*4*2
        [29030400, 'months', 2419200],                // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'last year', 'next year'],         // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400],              // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'last century', 'next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000]        // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
      ]
      ,seconds = (new Date() - date) / 1000
      ,token = 'ago'
      ,list_choice = 1
      if (seconds < 0) {
        seconds = Math.abs(seconds)
        token = 'from now'
        list_choice = 2
      }
      var i = 0, format
      while (format = time_formats[i++]){
        if (seconds < format[0]) {
          if (typeof(format[2]) == 'string'){
            return format[list_choice]
          } else {
            return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token
          }
        }
      }
      return date
    }

    ns.toProperCase = function(str){
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    // Sort array and remove doubles
    ns.extractCases = function(data_array, elementAccessor){
      if(elementAccessor === undefined)
        elementAccessor = function(x){return x}
      
      var temp_result = data_array
        .map(function(d){
            return {id:elementAccessor(d), content:d}
          })
        .sort(function(a, b) {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
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

    return ns

    /*
    NB: If you have the use of utils in console, use this line:
    utils = angular.element(document.body).injector().get('utils')
    */
  }])