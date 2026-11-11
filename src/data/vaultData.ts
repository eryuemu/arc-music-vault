import { Album } from '../types';

export const LOCAL_ARCHIVE: Album[] = [
  {
    id: 'dance-dance-dance',
    catalogNumber: 'CAT. VS-2012-02',
    title: 'Dance Dance Dance',
    subtitle: '洛天依共鸣系列官方二专',
    artist: '洛天依 / Vanguard Sound',
    releaseDate: '2012 年 12 月',
    publisher: '上海禾念',
    studio: 'Vanguard Sound 工作室',
    artwork: '/albums/dance_dance_dance/1794111081103.jpeg',
    aspectRatio: 'portrait',
    dimensions: '849 × 1200',
    description:
      '2012 年 12 月发售的洛天依官方电子舞曲专辑，由 Vanguard Sound 团队制作。曲目以 Trance、Glitch、House 风格为主，收录 cnsouka、yychan、Haloweak、G.K 等创作者的作品。',
    credits: [
      { label: '制作工作室', value: 'Vanguard Sound' },
      { label: '发行企划', value: '上海禾念信息科技有限公司' },
      { label: '发售节点', value: 'Comicup 11 (2012-12)' },
      { label: '音源规格', value: 'AAC-LC 44.1kHz (Stream Copy)' },
      { label: '曲目收录', value: '7 首分轨 + CUE 索引' }
    ],
    tracks: [
      {
        id: 'track-01',
        trackNumber: 1,
        title: '三原色',
        artist: 'cnsouka feat. 洛天依',
        composer: 'cnsouka',
        duration: '04:36',
        audioUrl: '/albums/dance_dance_dance/01. cnsouka feat. 洛天依 - 三原色.m4a'
      },
      {
        id: 'track-02',
        trackNumber: 2,
        title: 'Pinocchio',
        artist: 'yychan, Vanguard Sound feat. 洛天依',
        composer: 'CoyDe (yychan)',
        duration: '05:24',
        audioUrl: '/albums/dance_dance_dance/02. yychan, Vanguard Sound feat. 洛天依 - Pinocchio.m4a'
      },
      {
        id: 'track-03',
        trackNumber: 3,
        title: 'Wonderful Pain',
        artist: 'Haloweak, Vanguard Sound feat. 洛天依',
        composer: 'Haloweak',
        duration: '05:48',
        audioUrl: '/albums/dance_dance_dance/03. Haloweak, Vanguard Sound feat. 洛天依 - Wonderful Pain.m4a'
      },
      {
        id: 'track-04',
        trackNumber: 4,
        title: 'miRage',
        artist: 'G.K feat. 洛天依',
        composer: 'G.K',
        duration: '05:13',
        audioUrl: '/albums/dance_dance_dance/04. G.K feat. 洛天依 - miRage.m4a'
      },
      {
        id: 'track-05',
        trackNumber: 5,
        title: 'Shout for life',
        artist: 'yychan feat. 洛天依',
        composer: 'CoyDe (yychan)',
        duration: '07:05',
        audioUrl: '/albums/dance_dance_dance/05. yychan feat. 洛天依 - Shout for life.m4a'
      },
      {
        id: 'track-06',
        trackNumber: 6,
        title: 'Evolution',
        artist: 'Haloweak feat. 洛天依',
        composer: 'Haloweak',
        duration: '05:13',
        audioUrl: '/albums/dance_dance_dance/06. Haloweak feat. 洛天依 - Evolution.m4a'
      },
      {
        id: 'track-07',
        trackNumber: 7,
        title: 'Glitcher',
        artist: 'G.K feat. 洛天依',
        composer: 'G.K',
        duration: '05:44',
        audioUrl: '/albums/dance_dance_dance/07. G.K feat. 洛天依 - Glitcher.m4a'
      }
    ]
  },
  {
    id: 'stardust-tumi',
    catalogNumber: 'CAT. QD-2026-01',
    title: '荼蘼',
    subtitle: '『星尘Stardust』创作专辑收录曲',
    artist: '星尘 / Evalia-爱娃',
    releaseDate: '2026 年 11 月',
    publisher: '北京平行四界 (Beijing Photek)',
    studio: '平行四界 Quadimension',
    artwork: '/albums/stardust_chami/cover.jpg',
    videoUrl: '/albums/stardust_chami/星尘 - 荼蘼 (原版PV).mp4',
    aspectRatio: 'landscape',
    dimensions: '1920 × 1080',
    description:
      '收录于全新原创专辑『星尘Stardust』。由 Evalia-爱娃 作词/作编曲，Creuzer 调校，Hanasa 绘制曲绘，青色箐 影像制作。',
    credits: [
      { label: '作编曲 / 作词', value: 'Evalia-爱娃' },
      { label: '演唱歌姬', value: '星尘 (VOCALOID 4)' },
      { label: '声库调校', value: 'Creuzer' },
      { label: '原画曲绘', value: 'Hanasa' },
      { label: 'PV 影像制作', value: '青色箐' },
      { label: '出品企划', value: '北京平行四界科技有限公司' }
    ],
    tracks: [
      {
        id: 'tumi-01',
        trackNumber: 1,
        title: '荼蘼',
        artist: '星尘',
        composer: 'Evalia-爱娃',
        duration: '02:50',
        audioUrl: '/albums/stardust_chami/星尘 - 荼蘼.m4a'
      }
    ]
  },
  {
    id: 'luo-jinlinjia',
    catalogNumber: 'CAT. VS-2025-GOLD',
    title: '金鳞甲',
    subtitle: '洛天依 AI 重调版 · Vsinger 激励计划',
    artist: '洛天依 / 鬼面P',
    releaseDate: '2025 年 1 月',
    publisher: 'Vsinger',
    studio: 'Vsinger 创作激励计划',
    artwork: '/albums/luo_jinlinjia/cover.jpg',
    videoUrl: '/albums/luo_jinlinjia/洛天依 - 金鳞甲 (原版PV).mp4',
    aspectRatio: 'landscape',
    dimensions: '1518 × 900',
    description:
      '“我自有我去看留无怕，同天地斗法”。眸子千作曲制作，温荼作词，鬼面P精心重调，戏曲融合流行民乐的震撼国风佳作。',
    credits: [
      { label: '演唱歌姬', value: '洛天依 (AI)' },
      { label: '调校制作', value: '鬼面P' },
      { label: '作词 / 作曲', value: '温荼 / 眸子千' },
      { label: '编曲 / 吉他', value: '薛涛' },
      { label: '二胡 / 贝斯', value: '李超 / 吴海涛' },
      { label: '原画曲绘', value: 'ringo果 / YrK / 猫犬一号机 / 才不二' },
      { label: 'PV 影像制作', value: '像素山海' }
    ],
    tracks: [
      {
        id: 'jinlinjia-01',
        trackNumber: 1,
        title: '金鳞甲 (AI重调版)',
        artist: '洛天依',
        composer: '眸子千',
        duration: '03:44',
        audioUrl: '/albums/luo_jinlinjia/洛天依 - 金鳞甲.m4a'
      }
    ]
  }
];
