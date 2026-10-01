import React, { useState, useEffect } from 'react';
import hqImg from '@/src/assets/images/fimf_headquarters_building_1790335956733.jpg';
import huddleImg from '@/src/assets/images/team_huddle_elephants_1790335968616.jpg';
import refereeImg from '@/src/assets/images/referee_training_session_1790335992555.jpg';
import {
  FileText,
  Users,
  Award,
  Download,
  CheckCircle,
  Eye,
  Star,
  Target,
  ArrowRight,
  Shield,
  Phone,
  Mail,
  Globe2,
  Trophy,
  CalendarDays,
  Landmark,
  ScrollText,
  Handshake,
  MapPin,
  Flag,
  Medal,
  History,
} from 'lucide-react';

interface LaFimfViewProps {
  onOpenClubSpace?: () => void;
  onNavigateContact?: () => void;
  /** Onglet institutionnel à ouvrir au montage (navigation profonde depuis le menu) */
  initialTab?: string;
}

type SubTab =
  | 'presentation'
  | 'mission'
  | 'organisation'
  | 'dirigeants'
  | 'palmares'
  | 'echeances'
  | 'documents'
  | 'affiliation'
  | 'arbitrage'
  | 'partenaires'
  | 'contacts';

export const LaFimfView: React.FC<LaFimfViewProps> = ({ onOpenClubSpace, onNavigateContact, initialTab }) => {
  const [activeTab, setActiveTab] = useState<SubTab>(
    (initialTab as SubTab) ?? 'presentation'
  );

  // Synchronise l'onglet si une navigation profonde arrive pendant que la page est ouverte
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab as SubTab);
  }, [initialTab]);

  const sidebarItems: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'presentation', label: 'Présentation & Historique', icon: <History className="w-4 h-4" /> },
    { id: 'mission', label: 'Objectifs & Vision', icon: <Target className="w-4 h-4" /> },
    { id: 'organisation', label: 'Organisation fédérale', icon: <Users className="w-4 h-4" /> },
    { id: 'dirigeants', label: 'Dirigeants & Autorités', icon: <Landmark className="w-4 h-4" /> },
    { id: 'palmares', label: 'Palmarès international', icon: <Trophy className="w-4 h-4" /> },
    { id: 'echeances', label: 'Échéances 2026-2027', icon: <CalendarDays className="w-4 h-4" /> },
    { id: 'documents', label: 'Statuts & Règlements', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'affiliation', label: 'Affiliation des clubs', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'arbitrage', label: 'Arbitrage', icon: <Award className="w-4 h-4" /> },
    { id: 'partenaires', label: 'Partenaires', icon: <Handshake className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts officiels', icon: <Phone className="w-4 h-4" /> },
  ];

  // ─────────────────────────────────────────────────────────────
  // Données officielles — Dossier Technique Mini Football 2026
  // ─────────────────────────────────────────────────────────────

  const OBJECTIFS_FEDERAUX = [
    {
      title: 'Développement & promotion',
      desc: "Assurer par tous moyens le développement, la promotion et le contrôle du sport d'association de Mini Football sous toutes ses formes.",
    },
    {
      title: 'Pratique nationale',
      desc: "Encourager la pratique de ce sport à l'échelle nationale, dans un esprit de fair-play.",
    },
    {
      title: 'Compétitions nationales',
      desc: 'Organiser les compétitions de Mini Football sur le territoire national.',
    },
    {
      title: 'Coordination des clubs',
      desc: "Coordonner les activités des clubs fédérés et s'assurer que leur fonctionnement, aux plans administratif et juridique, est conforme aux lois et règlements en vigueur.",
    },
    {
      title: 'Équipes nationales',
      desc: 'Constituer et gérer les équipes nationales de Mini Football.',
    },
    {
      title: 'Réglementation & licences',
      desc: "Assurer la réglementation du sport d'association de Mini Football par l'établissement de tous les règlements techniques et la délivrance des licences d'appartenance à un club.",
    },
    {
      title: 'Formation',
      desc: "Organiser et contrôler la qualité de la formation dans le domaine du mini football, notamment par des cours, des conférences, des stages et des examens.",
    },
    {
      title: 'Représentation internationale',
      desc: "Représenter auprès des organisations mondiales, continentales ou régionales de Mini Football l'ensemble des clubs affiliés.",
    },
    {
      title: 'Relations sportives internationales',
      desc: "Gérer les relations sportives internationales en matière de Mini Football et défendre les intérêts du Mini-Foot ivoirien.",
    },
  ];

  const ORGANES_FEDERAUX = [
    { code: 'AG', name: 'Assemblée Générale', desc: "Instance souveraine regroupant l'ensemble des membres, garante des orientations statutaires.", icon: <Users className="w-5 h-5" /> },
    { code: 'CE', name: 'Comité Exécutif', desc: 'Organe de direction assurant la gestion quotidienne et l\'exécution des décisions de l\'AG.', icon: <Shield className="w-5 h-5" /> },
    { code: 'CC', name: 'Commissariat aux Comptes', desc: 'Contrôle de la régularité et de la sincérité des comptes de la Fédération.', icon: <FileText className="w-5 h-5" /> },
    { code: 'CP', name: 'Commissions Permanentes', desc: 'Commissions spécialisées : compétitions, arbitrage, discipline, formation, médecine.', icon: <Target className="w-5 h-5" /> },
    { code: 'L', name: 'Les Ligues', desc: 'Relais régionaux de la Fédération pour l\'animation et le développement de la discipline.', icon: <Flag className="w-5 h-5" /> },
    { code: 'D', name: 'Les Districts', desc: 'Structures départementales de proximité au service des clubs affiliés.', icon: <MapPin className="w-5 h-5" /> },
  ];

  const CATEGORIES_MEMBRES = [
    {
      name: 'Les Membres Actifs',
      desc: "Clubs et associations sportives affiliés participant pleinement à la vie fédérale et aux compétitions officielles.",
    },
    {
      name: "Les Groupements d'Intérêts du Mini Football",
      desc: "Associations de joueurs, d'entraîneurs, d'arbitres et de centres de formation rattachées à la Fédération.",
    },
    {
      name: 'Les Membres d\'Honneur',
      desc: "Personnalités distinguées pour leur contribution exceptionnelle au développement du Mini Football ivoirien.",
    },
  ];

  const PALMARES = [
    {
      year: '2017',
      title: 'Premiers pas internationaux',
      items: [
        'Tournoi International des Champions — Gammarth (Tunisie), 08–15 mars',
        'Coupe du Monde (2e édition) — Nabeul (Tunisie), 06–15 octobre',
      ],
      highlight: false,
    },
    {
      year: '2018 – 2019',
      title: 'Championne d\u2019Afrique',
      items: [
        '1ère Coupe d\u2019Afrique de Mini-Foot — Tripoli (Libye), 05–12 mai 2018 : la Côte d\u2019Ivoire sacrée Championne d\u2019Afrique',
        'Trophée Fair-Play : Cissé Koua Ibrahim (meilleur gardien) & Beugré Yago Eugène (meilleur coach)',
        'Match amical Tunisie vs Côte d\u2019Ivoire — Tunis, 16 février 2019',
      ],
      highlight: true,
    },
    {
      year: '2021',
      title: 'Médaille de bronze continentale',
      items: [
        '2e CAN de Mini Football — Ibadan (Nigeria), 07–18 juillet : médaille de bronze',
      ],
      highlight: false,
    },
    {
      year: '2023',
      title: 'Qualification historique au Mondial',
      items: [
        'Qualification historique pour la Coupe du Monde — Émirats Arabes Unis (Ras Al-Khaimah, octobre)',
      ],
      highlight: false,
    },
    {
      year: '2025',
      title: 'Confirmations sur la scène continentale',
      items: [
        'CAN de Mini Football — Derna (Libye), 12–26 juillet : 5e place sur 16 nations',
        'Participation à la Continental Cup (World Mini Football Federation)',
      ],
      highlight: false,
    },
    {
      year: '2027',
      title: 'Triple ambition : CAN, Mondial & Union Ouest-Africaine',
      items: [
        'Qualifiée pour la CAN — Conakry (Guinée), 09–24 janvier',
        'Qualifiée pour la Coupe du Monde — République Tchèque, octobre',
        'Tournoi de l\u2019Union des Pays Ouest-Africains de Mini Football : Burkina Faso, Guinée, Bénin, Ghana, Sénégal, Mali, Mauritanie, Togo, Nigeria, Guinée-Bissau, Gambie, Niger + la Côte d\u2019Ivoire (pays hôte)',
      ],
      highlight: true,
    },
  ];

  const AUTORITES = [
    {
      role: 'Président de la FIMF',
      name: 'M. Yéo Haméd',
      desc: "Membre fondateur et exécutif de la Confédération Africaine de Mini Football (AMC), membre de plein droit de la World Mini Football (WMF).",
      initials: 'YH',
      accent: 'bg-[#006039]',
    },
    {
      role: 'Ministre des Sports',
      name: 'M. Adjé Silas Metch',
      desc: "Tutelle du mouvement sportif national, aux côtés de la Fédération.",
      initials: 'AM',
      accent: 'bg-slate-900',
    },
    {
      role: "Ministre de la Promotion de la Jeunesse, de l'Insertion Professionnelle et du Service Civique",
      name: 'M. Mamadou Touré',
      desc: "Porte-parole adjoint du gouvernement.",
      initials: 'MT',
      accent: 'bg-slate-900',
    },
    {
      role: 'Président de la World Mini Football (WMF)',
      name: 'M. Filip Juda',
      desc: "Instance mondiale de la discipline dont la FIMF est membre de plein droit.",
      initials: 'FJ',
      accent: 'bg-slate-700',
    },
    {
      role: "Président de la Confédération Africaine de Mini Football (AMC) & Vice-Président WMF",
      name: 'M. Achraf Ben Salah',
      desc: "Organisateur de l'AMC Champions League et de la CAN de Mini Football.",
      initials: 'AB',
      accent: 'bg-slate-700',
    },
  ];

  const ECHEANCES = [
    {
      badge: 'Amical International',
      title: 'Côte d\u2019Ivoire vs Liban',
      date: 'Dimanche 20 décembre 2026',
      color: 'border-l-[#ea580c]',
      chip: 'bg-orange-50 text-orange-900 border-orange-200',
      icon: <Handshake className="w-5 h-5" />,
      paragraphs: [
        "Dans le cadre de la promotion de la paix et de la fraternité à travers le sport, la FIMF organise une rencontre amicale unique entre l'Équipe de Côte d'Ivoire et celle de la communauté libanaise résidant en Côte d'Ivoire, en préparation de la CAN de Mini-Foot.",
        "Cette initiative citoyenne est soutenue par le Ministère de la Solidarité et de la Cohésion Sociale. À l'issue du match, une sélection de 2 à 4 joueurs talentueux d'origine ivoiro-libanaise pourra être intégrée à l'Équipe Nationale en vue de la Coupe d'Afrique des Nations.",
      ],
      goals: [
        "Encourager l'harmonie entre les différentes communautés vivant en Côte d'Ivoire par l'intermédiaire du sport.",
        "Découvrir et mettre en avant les jeunes talents ivoiro-libanais dans une perspective nationale.",
      ],
    },
    {
      badge: 'Coupe d\u2019Afrique des Nations',
      title: 'CAN Mini Football — Guinée 2027',
      date: '09 – 24 janvier 2027 • Conakry',
      color: 'border-l-[#006039]',
      chip: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: <Flag className="w-5 h-5" />,
      paragraphs: [
        "La Côte d'Ivoire est qualifiée pour la CAN de Mini Football qui se tiendra à Conakry (Guinée) du 09 au 24 janvier 2027.",
        "Finaliste victorieuse de la première édition en 2018 à Tripoli, la sélection nationale y défendra son statut de grande nation africaine de la discipline.",
      ],
      goals: [
        'Reproduire l\u2019exploit de 2018 et viser un second titre continental.',
        'Fédérer la nation autour des Éléphants du Mini Football.',
      ],
    },
    {
      badge: 'Coupe du Monde',
      title: 'Coupe du Monde Mini Football — République Tchèque',
      date: 'Octobre 2027',
      color: 'border-l-slate-900',
      chip: 'bg-slate-100 text-slate-900 border-slate-300',
      icon: <Globe2 className="w-5 h-5" />,
      paragraphs: [
        "Après la qualification historique de 2023 aux Émirats Arabes Unis, la Côte d'Ivoire est de nouveau qualifiée pour la Coupe du Monde de Mini Football, programmée en République Tchèque en octobre 2027.",
      ],
      goals: [
        'Inscrire durablement la Côte d\u2019Ivoire parmi l\u2019élite mondiale de la discipline.',
        'Valoriser le vivier national issu du Championnat FIMF.',
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-[#004724] text-white">
        <div className="absolute inset-0 opacity-25">
          <img
            src={hqImg}
            alt="Siège de la FIMF"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight">
            LA FIMF
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base md:text-lg max-w-2xl mt-2 font-medium">
            Fédération Ivoirienne de Mini Football — fondée en janvier 2017. Promouvoir le Mini Football en Côte d'Ivoire.
          </p>
        </div>
      </section>

      {/* 2. MAIN LAYOUT: SIDEBAR + CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Vertical Sub-menu (3 cols) */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Menu Institutionnel
              </span>
            </div>
            <nav className="divide-y divide-slate-100">
              {sidebarItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-orange-50/80 text-[#ea580c] border-l-4 border-[#ea580c]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-[#ea580c]' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {isActive ? '●' : '+'}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Content Area (9 cols) */}
          <div className="lg:col-span-9 space-y-8">
            {/* ─────────────── PRÉSENTATION & HISTORIQUE ─────────────── */}
            {activeTab === 'presentation' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-black text-[#006039] uppercase tracking-wider">
                        <Star className="w-3 h-3" /> Fondée en janvier 2017
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                        La Fédération Ivoirienne de Mini Football
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        Née en janvier 2017 d'une passion commune pour le ballon rond, la Fédération Ivoirienne de Mini Football (FIMF) est bien plus qu'une simple association sportive : c'est une grande famille où l'on vient apprendre le jeu, le vivre intensément et tisser des liens solides entre amis, entre quartiers, entre générations.
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        Notre mission est simple : faire découvrir le Mini Football au plus grand nombre, l'organiser avec cœur et rassembler autour de lui des hommes et des femmes qui partagent la même flamme. La FIMF structure la discipline, forme les encadreurs et arbitres, homologue les terrains synthétiques aux normes et prépare les sélections nationales pour faire rayonner la Côte d'Ivoire sur les scènes africaine et mondiale.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => setActiveTab('mission')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-lg transition-colors uppercase tracking-wider"
                        >
                          <span>NOS OBJECTIFS</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-5">
                      <div className="relative rounded-lg overflow-hidden shadow-sm aspect-4/3 bg-slate-900">
                        <img
                          src={huddleImg}
                          alt="Équipe FIMF"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Le Mini Football, c'est quoi ? */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mb-4">
                    Le Mini Football, c'est quoi exactement ?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-5">
                    Imaginez un terrain de gazon synthétique compact et électrique où chaque seconde compte. Deux équipes de six joueurs s'affrontent — un gardien et cinq guerriers de terrain — dans un ballet de passes, de dribbles et d'émotions.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                      { value: '50 × 30 m', label: 'Dimensions du terrain' },
                      { value: '6 joueurs', label: 'Par équipe sur le terrain' },
                      { value: '2 × 25 min', label: 'Durée des mi-temps' },
                      { value: '2 × 5 min', label: 'Prolongations puis tirs au but' },
                    ].map((s, i) => (
                      <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                        <p className="font-black text-[#006039] text-sm sm:text-base">{s.value}</p>
                        <p className="text-[10px] font-bold uppercase text-slate-500 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    Et quand le score reste bloqué, le cœur bat encore plus fort : deux mi-temps de prolongation de 5 minutes chacune, avant le spectacle des tirs au but. Du jeu pur, de la fraternité et une ferveur qui réunit — transcendant les barrières sociales, cimentant les liens communautaires et cultivant chez chaque pratiquant ce sentiment profond d'appartenance à une « seconde famille ».
                  </p>
                </div>

                {/* Historique */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 sm:p-8">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#006039]" />
                    Historique de la création
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                    Vecteur privilégié de l'épanouissement physique et psychologique, le sport est unanimement consacré par la communauté scientifique comme un pilier fondamental de la santé publique. Au-delà de sa dimension athlétique, les activités physiques et sportives s'érigent en véritables instruments d'éducation, de culture et d'inclusion : elles jouent un rôle déterminant dans la lutte contre l'exclusion, la réduction des disparités socio-culturelles et le renforcement de l'unité nationale.
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    En Côte d'Ivoire, le Mini Football connaît aujourd'hui une ascension fulgurante, portée par l'engagement visionnaire et le travail acharné de la FIMF. Plus qu'une simple compétition, le Mini Football est un puissant catalyseur de cohésion. C'est cette synergie entre excellence sportive et solidarité humaine qui définit l'ADN de la FIMF, faisant du Mini Football le nouveau terrain de toutes les fraternités en Côte d'Ivoire.
                  </p>
                </div>
              </div>
            )}

            {/* ─────────────── OBJECTIFS & VISION ─────────────── */}
            {activeTab === 'mission' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Objectifs de la Fédération</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Les missions officielles confiées à la FIMF, telles que définies dans ses textes fondateurs :
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {OBJECTIFS_FEDERAUX.map((obj, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="shrink-0 w-7 h-7 rounded-full bg-[#006039] text-white text-[11px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs uppercase">{obj.title}</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{obj.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center mb-3">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm uppercase mb-1">Notre Mission</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Faire découvrir le Mini Football au plus grand nombre, l'organiser avec cœur et rassembler autour de lui toutes les générations.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center mb-3">
                      <Eye className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm uppercase mb-1">Notre Vision</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Promouvoir le Mini Football en Côte d'Ivoire et faire de la discipline une référence continentale et mondiale.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs hover:shadow transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#006039] flex items-center justify-center mb-3">
                      <Star className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-900 text-sm uppercase mb-1">Nos Valeurs</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Fair-play, discipline, excellence, solidarité, inclusion et fraternité — l'ADN de la FIMF.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── ORGANISATION ─────────────── */}
            {activeTab === 'organisation' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Organes de la Fédération</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      La FIMF s'appuie sur une structure administrative et technique moderne et transparente :
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ORGANES_FEDERAUX.map((org, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-[#006039] text-white flex items-center justify-center">
                          {org.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#ea580c] block">{org.code}</span>
                          <h4 className="font-bold text-slate-900 text-xs mt-0.5">{org.name}</h4>
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{org.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Catégories de membres</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      La Fédération Ivoirienne de Mini Football est composée de trois catégories de membres :
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {CATEGORIES_MEMBRES.map((cat, idx) => (
                      <div key={idx} className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                        <span className="font-black text-emerald-800 text-xs uppercase">Catégorie {idx + 1}</span>
                        <h4 className="font-bold text-slate-900 text-xs mt-1">{cat.name}</h4>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{cat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── DIRIGEANTS & AUTORITÉS ─────────────── */}
            {activeTab === 'dirigeants' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Dirigeants & Autorités</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Les personnalités qui portent le Mini Football ivoirien, aux niveaux national et international :
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {AUTORITES.map((dir, idx) => (
                    <div key={idx} className="p-5 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-4">
                      <div className={`w-12 h-12 shrink-0 rounded-full ${dir.accent} text-white flex items-center justify-center font-black text-sm`}>
                        {dir.initials}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#ea580c] uppercase block leading-snug">{dir.role}</span>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">{dir.name}</h4>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{dir.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─────────────── PALMARÈS ─────────────── */}
            {activeTab === 'palmares' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Notre Palmarès International</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Depuis 2017, les Éléphants du Mini Football ont fait de la Côte d'Ivoire une nation majeure de la discipline.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[180px] p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <Trophy className="w-6 h-6 text-[#006039] mx-auto" />
                    <p className="font-black text-emerald-900 text-lg mt-1">1</p>
                    <p className="text-[10px] font-bold uppercase text-emerald-800">Titre continental (CAN 2018)</p>
                  </div>
                  <div className="flex-1 min-w-[180px] p-4 rounded-lg bg-orange-50 border border-orange-200 text-center">
                    <Medal className="w-6 h-6 text-[#ea580c] mx-auto" />
                    <p className="font-black text-orange-900 text-lg mt-1">1</p>
                    <p className="text-[10px] font-bold uppercase text-orange-800">Médaille de bronze (2021)</p>
                  </div>
                  <div className="flex-1 min-w-[180px] p-4 rounded-lg bg-slate-100 border border-slate-300 text-center">
                    <Globe2 className="w-6 h-6 text-slate-900 mx-auto" />
                    <p className="font-black text-slate-900 text-lg mt-1">2</p>
                    <p className="text-[10px] font-bold uppercase text-slate-700">Qualifications au Mondial (2023, 2027)</p>
                  </div>
                </div>

                {/* Frise chronologique */}
                <div className="relative space-y-5 pl-6 border-l-4 border-slate-200 ml-2">
                  {PALMARES.map((entry, idx) => (
                    <div key={idx} className="relative">
                      <span
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full ring-4 ring-white ${
                          entry.highlight ? 'bg-[#ea580c]' : 'bg-[#006039]'
                        }`}
                      />
                      <div
                        className={`p-4 rounded-lg border ${
                          entry.highlight
                            ? 'bg-orange-50/60 border-orange-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                            {entry.year}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs uppercase">{entry.title}</h4>
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {entry.items.map((item, i) => (
                            <li key={i} className="text-[11px] text-slate-700 leading-relaxed flex items-start gap-1.5">
                              <span className="text-[#ea580c] mt-0.5 shrink-0">▸</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─────────────── ÉCHÉANCES 2026-2027 ─────────────── */}
            {activeTab === 'echeances' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Grandes Échéances 2026 – 2027</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    La feuille de route stratégique de la Fédération pour faire rayonner la Côte d'Ivoire :
                  </p>
                </div>

                {ECHEANCES.map((e, idx) => (
                  <div key={idx} className={`bg-white rounded-xl border border-slate-200 shadow-2xs p-6 border-l-4 ${e.color}`}>
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${e.chip}`}>
                        {e.badge}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                        <CalendarDays className="w-3.5 h-3.5" /> {e.date}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <span className="text-[#006039]">{e.icon}</span>
                      {e.title}
                    </h3>
                    <div className="mt-3 space-y-2.5">
                      {e.paragraphs.map((p, i) => (
                        <p key={i} className="text-xs sm:text-sm text-slate-700 leading-relaxed">{p}</p>
                      ))}
                    </div>
                    <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] font-black uppercase text-[#ea580c] mb-1.5">Objectifs</p>
                      <ul className="space-y-1">
                        {e.goals.map((g, i) => (
                          <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-[#006039] mt-0.5 shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─────────────── STATUTS & RÈGLEMENTS ─────────────── */}
            {activeTab === 'documents' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Statuts et Règlements Fédéraux</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Les textes fondamentaux régissant l'activité sportive et administrative de la FIMF :
                    </p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: 'Statuts officiels de la FIMF', size: '2.4 Mo' },
                      { title: 'Règlement général du Championnat National de Mini Football', size: '1.8 Mo' },
                      { title: 'Code disciplinaire et barème des sanctions', size: '1.2 Mo' },
                      { title: "Lois du Jeu du Mini Football (6 contre 6, standard WMF)", size: '3.1 Mo' },
                    ].map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#006039]" />
                          <span className="font-bold text-slate-800">{doc.title}</span>
                        </div>
                        <button
                          onClick={() => alert(`Téléchargement de ${doc.title} démarré.`)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF ({doc.size})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Documents et Formulaires Officiels</h2>
                  <div className="space-y-3">
                    {[
                      { title: "Bordereau de demande de licence joueur", desc: "Document requis pour l'enregistrement officiel" },
                      { title: 'Feuille de match officielle FIMF (format A4)', desc: 'À remplir par les capitaines et délégués' },
                      { title: "Cahier des charges pour l'homologation d'un terrain synthétique", desc: 'Critères techniques et dimensionnels' },
                      { title: "Certificat médical d'aptitude à la pratique du mini football", desc: 'Valide pour une saison sportive' },
                    ].map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{doc.title}</p>
                          <p className="text-[11px] text-slate-500">{doc.desc}</p>
                        </div>
                        <button
                          onClick={() => alert(`Téléchargement de ${doc.title} démarré.`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded font-bold"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── AFFILIATION ─────────────── */}
            {activeTab === 'affiliation' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Procédure d'Affiliation d'un Club</h2>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1">
                    Toute association sportive, club de quartier ou entreprise désireuse de rejoindre les compétitions fédérales officielles doit compléter la procédure d'affiliation et devenir membre actif de la FIMF.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="font-black text-emerald-800 text-sm">Étape 1</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1">Dépôt du dossier</h4>
                    <p className="text-[11px] text-slate-600 mt-1">Statuts déposés en préfecture, récépissé et liste du bureau exécutif.</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="font-black text-emerald-800 text-sm">Étape 2</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1">Visite technique</h4>
                    <p className="text-[11px] text-slate-600 mt-1">Inspection de conformité de l'aire de jeu d'entraînement ou de match.</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="font-black text-emerald-800 text-sm">Étape 3</span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1">Délivrance de l'attestation</h4>
                    <p className="text-[11px] text-slate-600 mt-1">Attribution du matricule fédéral, des licences et accès à l'Espace Club en ligne.</p>
                  </div>
                </div>
                <div className="pt-2 flex justify-start">
                  <button
                    onClick={onOpenClubSpace}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold rounded-lg transition-colors uppercase"
                  >
                    <span>Lancer une demande d'affiliation en ligne</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ─────────────── ARBITRAGE ─────────────── */}
            {activeTab === 'arbitrage' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                <h2 className="text-xl font-black text-slate-900 uppercase">Formation & Arbitrage</h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 space-y-3 text-xs sm:text-sm text-slate-700">
                    <p>
                      La FIMF organise et contrôle la qualité de la formation dans le domaine du mini football, notamment par des cours, des conférences, des stages et des examens. La formation des arbitres garantit une application uniforme des lois du jeu : gestion des arrêts de jeu, distance des murs, expulsion temporaire et respect du fair-play.
                    </p>
                    <p>
                      Chaque saison, des stages de mise à niveau sont organisés pour les arbitres officiels désignés pour les compétitions nationales, sous l'égide des Commissions Permanentes de la Fédération.
                    </p>
                  </div>
                  <div className="md:col-span-5">
                    <img
                      src={refereeImg}
                      alt="Formation des arbitres"
                      className="rounded-lg shadow-sm w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── PARTENAIRES ─────────────── */}
            {activeTab === 'partenaires' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase">Instances Nationales & Internationales</h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      La FIMF est membre de plein droit de la World Mini Football (WMF), membre fondateur et exécutif de la Confédération Africaine de Mini Football (AMC), et œuvre sous la tutelle des ministères ivoiriens en charge du sport et de la jeunesse.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { name: 'World Mini Football (WMF)', role: 'Membre de plein droit' },
                      { name: 'Confédération Africaine de Mini Football (AMC)', role: 'Membre fondateur & exécutif' },
                      { name: 'Ministère des Sports', role: 'Tutelle nationale' },
                      { name: "Ministère de la Promotion de la Jeunesse et de l'Insertion Professionnelle", role: 'Soutien institutionnel' },
                      { name: 'Ministère de la Solidarité et de la Cohésion Sociale', role: 'Initiative citoyenne' },
                    ].map((inst, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-center min-h-24">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Institution</span>
                        <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">{inst.name}</span>
                        <span className="text-[10px] font-semibold text-[#ea580c] mt-1 uppercase">{inst.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                  <h2 className="text-xl font-black text-slate-900 uppercase">Nos Partenaires</h2>
                  <p className="text-xs sm:text-sm text-slate-600">
                    Des partenaires publics et privés engagés pour la jeunesse et le sport ivoirien :
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['LONACI', "Orange Côte d'Ivoire", 'SOTRA', 'CIE', 'SODECI', 'FIF', 'Union des Pays Ouest-Africains de Mini Football', 'Collectivités locales'].map((p, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center flex flex-col items-center justify-center h-24">
                        <span className="text-xs font-black text-slate-400">PARTENAIRE</span>
                        <span className="text-xs font-bold text-slate-800 mt-1 leading-snug">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── CONTACTS OFFICIELS ─────────────── */}
            {activeTab === 'contacts' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase">Siège Fédéral & Coordonnées Officielles</h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Contactez le secrétariat de la Fédération Ivoirienne de Mini Football :
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 uppercase block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#006039]" /> Siège Social
                    </span>
                    <p className="text-slate-600 font-semibold">Cocody Deux Plateaux Vallons</p>
                    <p className="text-slate-500">Abidjan, Côte d'Ivoire</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 uppercase block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#006039]" /> Téléphones
                    </span>
                    <a href="tel:+2252722413594" className="text-slate-700 font-semibold hover:text-[#006039] block">(+225) 27 22 41 35 94</a>
                    <a href="tel:+2250708563536" className="text-slate-700 font-semibold hover:text-[#006039] block">(+225) 07 08 56 35 36</a>
                    <a href="tel:+2250555155490" className="text-slate-700 font-semibold hover:text-[#006039] block">(+225) 05 551 554 90</a>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 sm:col-span-2">
                    <span className="font-bold text-slate-900 uppercase block flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#006039]" /> Emails & Site Web
                    </span>
                    <a href="mailto:fimf.infos@gmail.com" className="text-[#006039] font-semibold hover:underline block">fimf.infos@gmail.com</a>
                    <a href="mailto:info@federationminifootci.com" className="text-[#006039] font-semibold hover:underline block">info@federationminifootci.com</a>
                    <a href="https://federationminifootci.com" target="_blank" rel="noreferrer" className="text-[#ea580c] font-semibold hover:underline block">
                      federationminifootci.com ↗
                    </a>
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={onNavigateContact}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006039] hover:bg-[#004724] text-white text-xs font-bold rounded-lg transition-colors uppercase"
                  >
                    <span>Accéder au formulaire de contact</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
