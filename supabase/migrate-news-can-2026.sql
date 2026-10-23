-- =====================================================================
-- FIMF — Publication des actualités WMF / CAN 2027 (octobre 2026)
-- + mise à jour de la slide « CAN » du carrousel d'accueil (hero-2)
--
-- Ré-exécutable : chaque ligne est un upsert sur la clé primaire (`id`).
-- Relancer le script remet le texte éditorial de référence (il écrase
-- donc une modification faite depuis le dashboard admin sur ces ids).
--
-- Exécution :
--   SBP=<token> node supabase/run-sql.mjs supabase/migrate-news-can-2026.sql
-- (ou copier-coller dans le SQL Editor de Supabase)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ACTUALITÉS — nouveau module de règles, tirage au sort, AG de l'AMC
-- ---------------------------------------------------------------------
insert into public.news_articles
  (id, title, category, date_str, timestamp, read_time, image, excerpt, content, tags, author)
values
  (
    'news-11',
    'Règles du jeu 2026 : ce que la WMF change, et ce que la FIMF prépare',
    'Formation',
    '22 Oct. 2026',
    '2026-10-22',
    '4 min',
    'referee_training_session_1790335992555.jpg',
    'Gestion des rencontres, sécurité des joueurs, secteur des gardiens, penalties et tirs au but : la WMF publie le résumé des mises à jour 2026 des Lois du jeu. La FIMF en fera un module de formation pour ses officiels.',
    $j$[
      "La World Minifootball Federation (WMF) a rendu public son document « Règles du jeu 2026 – Résumé des mises à jour », qui recense les amendements adoptés pour la saison à venir. Le texte, relayé par la Confédération Africaine de Minifootball (AMC), touche aussi bien la conduite d'une rencontre que la protection des joueurs.",
      "Plusieurs familles de règles sont concernées : la gestion des matchs et du temps de jeu, la sécurité des joueurs, la communication tactique depuis le banc, le jeu des gardiens, la procédure de penalty, les fautes cumulées ainsi que le déroulement des tirs au but. Autant de situations qui pèsent directement sur le résultat d'une rencontre de mini-football.",
      "Pour la Côte d'Ivoire, l'enjeu est double. Les arbitres engagés dans le Championnat National et dans les tournois régionaux devront maîtriser ces évolutions dès l'entame de la saison, tandis que les entraîneurs devront adapter des consignes parfois construites sur l'ancienne lecture du règlement.",
      "La FIMF annonce qu'elle s'appuiera sur ce document pour actualiser son programme de formation : un module dédié sera intégré aux prochaines sessions d'homologation des arbitres et aux briefings d'avant-compétition destinés aux encadreurs des clubs affiliés.",
      "Ces dispositions s'appliqueront également à la Coupe d'Afrique des Nations de Minifootball, Guinée 2027, où la Côte d'Ivoire défendra ses chances. Une raison supplémentaire de ne pas attendre le coup d'envoi du championnat pour se mettre à jour.",
      "Le résumé officiel est consultable, page par page, auprès de la Confédération Africaine de Minifootball. La FIMF invite chaque club à en faire une lecture collective avant les prochains week-ends de compétition, et ses arbitres à signaler leurs questions à la Commission Centrale des Arbitres."
    ]$j$::jsonb,
    $j$["Règles du jeu", "WMF", "Arbitrage", "Formation"]$j$::jsonb,
    'Commission Centrale des Arbitres'
  ),
  (
    'news-12',
    'CAN Minifootball 2027 : les Éléphants avec le Tchad, le Mali et le Soudan du Sud',
    'Sélections',
    '20 Oct. 2026',
    '2026-10-20',
    '4 min',
    'championship_trophy_gold_1790335980246.jpg',
    'Conakry a accueilli le tirage au sort de la 5e Coupe d''Afrique de Minifootball, première édition à 24 nations. La Côte d''Ivoire évoluera dans le groupe D.',
    $j$[
      "La capitale guinéenne a vécu une soirée historique : la Confédération Africaine de Minifootball (AMC) y a procédé au tirage au sort de la 5e Coupe d'Afrique de Minifootball, programmée du 09 au 24 janvier 2027. Pour la première fois de son histoire, la compétition réunira 24 nations africaines.",
      "Placée dans le groupe D, la Côte d'Ivoire retrouvera le Tchad, le Mali et le Soudan du Sud. Un tirage sans opposition a priori inaccessible, mais qui impose aux Éléphants d'aborder chaque rencontre avec le même sérieux : réparties en six groupes de quatre, les équipes disposent de très peu de marge avant la phase à élimination directe.",
      "Les groupes : A — Guinée, Cameroun, Bénin, Tanzanie ; B — Libye, Afrique du Sud, RD Congo, Kenya ; C — Mauritanie, Nigeria, Ouganda, Gambie ; D — Côte d'Ivoire, Tchad, Mali, Soudan du Sud ; E — Ghana, Burkina Faso, Maroc, Sierra Leone ; F — Sénégal, Soudan, Maurice, complété par une wild card.",
      "Championne d'Afrique en 2018 à Tripoli et médaillée de bronze en 2021 à Ibadan, la sélection ivoirienne arrive en Guinée avec un statut de favori régional à assumer. Le staff technique disposera des prochaines semaines pour affiner la préparation, entre regroupements à Abidjan et rencontres amicales de haut niveau.",
      "La cérémonie a réuni les représentants des fédérations nationales, les dirigeants de la WMF, les membres du comité exécutif de l'AMC ainsi que plusieurs personnalités sportives guinéennes. Elle confirme la capacité de la Guinée à organiser un rendez-vous continental de cette envergure, à quelques mois d'une candidature affichée pour la Coupe du Monde de Minifootball 2029.",
      "Pour la FIMF, l'objectif reste inchangé : aller chercher un second titre continental et faire vivre l'expérience de la CAN au plus grand nombre. Le vivier demeure le Championnat National, vitrine de la discipline et rampe de lancement des Éléphants."
    ]$j$::jsonb,
    $j$["Éléphants", "CAN 2027", "Tirage au sort", "Conakry"]$j$::jsonb,
    'Cellule Média Éléphants'
  ),
  (
    'news-13',
    'Assemblée générale de l''AMC : les rapports 2025-2026 adoptés à l''unanimité',
    'Institutionnel',
    '18 Oct. 2026',
    '2026-10-18',
    '4 min',
    'fimf_headquarters_building_1790335956733.jpg',
    'Réunies à Conakry, les fédérations africaines de minifootball ont validé les rapports moral et financier de la saison 2025-2026 et tracé la route vers la CAN Guinée 2027.',
    $j$[
      "En marge du tirage au sort de la CAN 2027, la Confédération Africaine de Minifootball (AMC) a tenu son Assemblée Générale Ordinaire à Conakry, en présence des représentants des fédérations nationales membres et des membres de son comité exécutif.",
      "Au terme d'un examen approfondi des points inscrits à l'ordre du jour, les délégués ont adopté à l'unanimité le rapport moral et le rapport financier de la saison 2025-2026. Un vote consensuel, présenté comme le signe d'une confiance renouvelée dans la conduite de la Confédération.",
      "Le rapport moral revient sur une saison dense : organisation de la CAN 2025 en Libye, lancement de la première Ligue des Champions africaine — compétition dans laquelle le champion ivoirien dispose d'une place directe —, adhésion de l'AMC à l'Union des Confédérations Sportives Africaines (UCSA), montée en puissance des programmes de formation d'arbitres et d'entraîneurs, création de la plateforme numérique AMC CONNECT et refonte du site officiel de la Confédération.",
      "Sur le plan financier, l'assemblée a souligné une gestion rigoureuse des ressources et une stabilité maintenue malgré un calendrier particulièrement chargé : compétitions, missions officielles, projets numériques et partenariats stratégiques.",
      "Les fédérations ont réaffirmé leur engagement autour du plan stratégique continental : préparation de la CAN Guinée 2027, développement du minifootball féminin, accélération de la transformation numérique et renforcement de la présence de la discipline sur l'ensemble du continent.",
      "Ces orientations concernent directement la Côte d'Ivoire. La FIMF y trouve un cadre pour aligner son Championnat National, la formation de ses officiels et le développement de la pratique féminine sur les priorités africaines, avec un relais naturel : la CAN de Conakry, en janvier 2027."
    ]$j$::jsonb,
    $j$["AMC", "Gouvernance", "Assemblée Générale", "Conakry"]$j$::jsonb,
    'Secrétariat Général FIMF'
  )
on conflict (id) do update set
  title      = excluded.title,
  category   = excluded.category,
  date_str   = excluded.date_str,
  timestamp  = excluded.timestamp,
  read_time  = excluded.read_time,
  image      = excluded.image,
  excerpt    = excluded.excerpt,
  content    = excluded.content,
  tags       = excluded.tags,
  author     = excluded.author;

-- ---------------------------------------------------------------------
-- 2. CARROUSEL D'ACCUEIL — la slide CAN renvoie vers le tirage au sort
--
-- La table `hero_slides` est créée par `hero-slides.sql`. Si elle n'existe
-- pas encore, la section est ignorée (le front affiche alors ses slides par
-- défaut, déjà mises à jour) et le script n'échoue pas : sans ce garde-fou,
-- une seule erreur annulerait aussi la publication des actualités, toutes
-- les instructions étant exécutées dans la même transaction.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.hero_slides') is null then
    raise notice 'hero_slides absente : appliquer supabase/hero-slides.sql, puis rejouer ce script';
    return;
  end if;

  insert into public.hero_slides
    (id, title, highlight, subtitle, image, cta_label, cta_page,
     cta_secondary_label, cta_secondary_page, sort_order, active)
  values
    (
      'hero-2',
      'CAN MINI FOOTBALL',
      'TIRAGE CONNU',
      'Les Éléphants héritent du groupe D avec le Tchad, le Mali et le Soudan du Sud. Rendez-vous à Conakry du 09 au 24 janvier 2027.',
      'team_huddle_elephants_1790335968616.jpg',
      'TOUS LES GROUPES',
      'competitions',
      'LIRE L''ACTUALITÉ',
      'actualites',
      2,
      true
    )
  on conflict (id) do update set
    title                = excluded.title,
    highlight            = excluded.highlight,
    subtitle             = excluded.subtitle,
    image                = excluded.image,
    cta_label            = excluded.cta_label,
    cta_page             = excluded.cta_page,
    cta_secondary_label  = excluded.cta_secondary_label,
    cta_secondary_page   = excluded.cta_secondary_page,
    sort_order           = excluded.sort_order,
    active               = excluded.active;
end $$;
