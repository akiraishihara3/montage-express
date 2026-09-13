window.SITE_DATA = {
  seasonLabel: '37th',
  themeName: 'Micro Values',
  themeNameDisplay: 'Micro\nValues',
  themeTagline: '小さな価値の積み重ねが、新しい豊かさをつくる。',
  eventDateLabel: '2027.02.24 WED - 02.26 FRI',
  eventDateShort: 'FEB 24—26, 2027',
  venueName: 'Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F',
  venueNameShort: 'Hamamatsucho-Kan 4F / Tokyo',
  venueAddress: '〒105-7501 東京都港区海岸1-7-1',
  heroThemeKicker: '2027 THEME',
  conceptTitle: 'Micro\nValues',
  conceptLead: '昨今、限られた資源、資産、時間、繋がりや機会が改めて明確化されてきました。これまで当たり前に存在していたものの価値が、今あらためて明確になってきているからこそ、限られたものをどう組み合わせ、どう活かし、新しい価値へと変えていくのか。その視点が、これまで以上に重要になってきています。',
  conceptBody: '高価なものを買うという選択肢から豊かになる、満足度があがるものへ。人に見せつけるものではなく、自分にとって特別なものを選ぶ時代となりました。「高価なものを所有すること＝豊かさ」から、「満足度を高めるものを選ぶこと＝豊かさ」。そのようなモノを通して新しい豊かさをMONTAGEは提案してまいります。',
  conceptCtaLabel: 'CONCEPTを詳しく見る',
  contactLead: '出展・来場・取材など、MONTAGEに関するお問い合わせはこちらから。',
  heroPrimaryImage: 'assets/micro-values-header.webp',
  heroPrimaryImagePosition: 'center center',
  themeVisual: 'assets/micro-values-header.webp',
  originalHeroAssetPath: 'assets/micro-values-header.png',

  primaryActionLabel: 'EXHIBITOR ENTRY',
  primaryActionUrl: '#exhibit',
  primaryActionStatus: 'EXHIBITORS NOW OPEN',
  quickAccessLead: '目的からすぐに探す',
  quickAccess: [
    {
      label: 'VISIT',
      jp: '来場する',
      description: '開催日程・会場・アクセスなど、次回開催情報を見る',
      url: '#visit'
    },
    {
      label: 'EXHIBIT',
      jp: '出展する',
      description: '37th MONTAGE 出展情報・募集概要を見る',
      url: '#exhibit'
    },
    {
      label: 'ONLINE',
      jp: 'オンライン展示会',
      description: '会場の展示プロダクトをオンラインでも見る',
      url: 'https://howdi-exhibition.com/'
    }
  ],

  schedule: [
    { date: '2.24 WED', time: '10:00 A.M - 7:00 P.M' },
    { date: '2.25 THU', time: '10:00 A.M - 7:00 P.M' },
    { date: '2.26 FRI', time: '10:00 A.M - 4:00 P.M' }
  ]
};

/* Load schedule motion after the main deferred script has rendered the schedule cards. */
window.addEventListener('DOMContentLoaded', () => {
  const motionScript = document.createElement('script');
  motionScript.src = 'schedule-motion.js?v=20260913-1';
  document.body.appendChild(motionScript);
}, { once: true });
