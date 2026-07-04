// 世界杯历史荣誉数据：历史 16 强（按夺冠次数 + 近年战绩排序），
// 含历届冠军次数、夺冠年份，以及最近 4 届世界杯（2010–2022）的名次。
// 名次 tier 代码见下方 TIER_ORDER / i18n 的 history.tier.*。
//
// recent 项：[年份, tier]。tier 取值：
//   C=冠军 RU=亚军 3=季军 4=殿军 QF=八强 R16=十六强 GS=小组赛 DNQ=未参赛
// code 与 src/data/worldcup.js 的球队代码一致，便于「点击球队」跳转到球队详情。

export const WC_HONORS = [
  { code: 'BRA', cn: '巴西', en: 'Brazil', flag: '🇧🇷', titles: 5, titleYears: [1958, 1962, 1970, 1994, 2002], recent: [['2022', 'QF'], ['2018', 'QF'], ['2014', '4'], ['2010', 'QF']] },
  { code: 'GER', cn: '德国', en: 'Germany', flag: '🇩🇪', titles: 4, titleYears: [1954, 1974, 1990, 2014], recent: [['2022', 'GS'], ['2018', 'GS'], ['2014', 'C'], ['2010', '3']] },
  { code: 'ITA', cn: '意大利', en: 'Italy', flag: '🇮🇹', titles: 4, titleYears: [1934, 1938, 1982, 2006], recent: [['2022', 'DNQ'], ['2018', 'DNQ'], ['2014', 'GS'], ['2010', 'GS']] },
  { code: 'ARG', cn: '阿根廷', en: 'Argentina', flag: '🇦🇷', titles: 3, titleYears: [1978, 1986, 2022], recent: [['2022', 'C'], ['2018', 'R16'], ['2014', 'RU'], ['2010', 'QF']] },
  { code: 'FRA', cn: '法国', en: 'France', flag: '🇫🇷', titles: 2, titleYears: [1998, 2018], recent: [['2022', 'RU'], ['2018', 'C'], ['2014', 'QF'], ['2010', 'GS']] },
  { code: 'URU', cn: '乌拉圭', en: 'Uruguay', flag: '🇺🇾', titles: 2, titleYears: [1930, 1950], recent: [['2022', 'GS'], ['2018', 'QF'], ['2014', 'R16'], ['2010', '4']] },
  { code: 'ENG', cn: '英格兰', en: 'England', flag: '🏴', titles: 1, titleYears: [1966], recent: [['2022', 'QF'], ['2018', '4'], ['2014', 'GS'], ['2010', 'R16']] },
  { code: 'ESP', cn: '西班牙', en: 'Spain', flag: '🇪🇸', titles: 1, titleYears: [2010], recent: [['2022', 'R16'], ['2018', 'R16'], ['2014', 'GS'], ['2010', 'C']] },
  { code: 'NED', cn: '荷兰', en: 'Netherlands', flag: '🇳🇱', titles: 0, titleYears: [], recent: [['2022', 'QF'], ['2018', 'DNQ'], ['2014', '3'], ['2010', 'RU']] },
  { code: 'POR', cn: '葡萄牙', en: 'Portugal', flag: '🇵🇹', titles: 0, titleYears: [], recent: [['2022', 'QF'], ['2018', 'R16'], ['2014', 'GS'], ['2010', 'R16']] },
  { code: 'CRO', cn: '克罗地亚', en: 'Croatia', flag: '🇭🇷', titles: 0, titleYears: [], recent: [['2022', '3'], ['2018', 'RU'], ['2014', 'GS'], ['2010', 'DNQ']] },
  { code: 'BEL', cn: '比利时', en: 'Belgium', flag: '🇧🇪', titles: 0, titleYears: [], recent: [['2022', 'GS'], ['2018', '3'], ['2014', 'QF'], ['2010', 'DNQ']] },
  { code: 'MEX', cn: '墨西哥', en: 'Mexico', flag: '🇲🇽', titles: 0, titleYears: [], recent: [['2022', 'GS'], ['2018', 'R16'], ['2014', 'R16'], ['2010', 'R16']] },
  { code: 'COL', cn: '哥伦比亚', en: 'Colombia', flag: '🇨🇴', titles: 0, titleYears: [], recent: [['2022', 'DNQ'], ['2018', 'R16'], ['2014', 'QF'], ['2010', 'DNQ']] },
  { code: 'SUI', cn: '瑞士', en: 'Switzerland', flag: '🇨🇭', titles: 0, titleYears: [], recent: [['2022', 'R16'], ['2018', 'R16'], ['2014', 'R16'], ['2010', 'GS']] },
  { code: 'USA', cn: '美国', en: 'United States', flag: '🇺🇸', titles: 0, titleYears: [], recent: [['2022', 'R16'], ['2018', 'DNQ'], ['2014', 'R16'], ['2010', 'R16']] }
]

// 名次配色：冠/亚/季/殿用奖牌色，八强/十六强中性，小组赛/未参赛淡化。
export const TIER_STYLE = {
  C: { color: '#06231b', bg: '#ffd166' },   // 冠军：金
  RU: { color: '#1a1a1a', bg: '#cfd6dd' },   // 亚军：银
  3: { color: '#fff', bg: '#cd7f32' },       // 季军：铜
  4: { color: '#fff', bg: '#a55' },          // 殿军
  QF: { color: 'var(--text)', bg: 'var(--bg-soft)' },
  R16: { color: 'var(--text-dim)', bg: 'var(--bg-soft)' },
  GS: { color: 'var(--text-mute)', bg: 'transparent' },
  DNQ: { color: 'var(--text-mute)', bg: 'transparent' }
}

// 按 code（或中文名兜底）查历史荣誉，供「点击球队」展示。
export function honorsOf(code, cn) {
  if (!code && !cn) return null
  return (
    WC_HONORS.find((h) => h.code === code) ||
    (cn ? WC_HONORS.find((h) => cn.includes(h.cn)) : null) ||
    null
  )
}
