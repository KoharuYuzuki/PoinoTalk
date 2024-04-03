import { version, license, thirdPartyNotices, qa } from './macros' with { type: 'macro' }

export default {
  appName: 'PoinoTalk',
  version: version() as unknown as string,
  license: license() as unknown as string,
  licenseQAUrl: 'https://github.com/KoharuYuzuki/PoinoTalkLicence?tab=readme-ov-file#qa',
  thirdPartyNotices: thirdPartyNotices() as unknown as string,
  qa: qa() as unknown as string,
  qaUrl: 'https://github.com/KoharuYuzuki/PoinoTalk/blob/main/Q&A.txt',
  openjlabelDictDirURL: 'https://cdn.jsdelivr.net/gh/KoharuYuzuki/koharuyuzuki.github.io/poinotalk/dict/open_jtalk_dic_utf_8-1.11/',
  mlModelsDirURL: 'https://cdn.jsdelivr.net/gh/KoharuYuzuki/koharuyuzuki.github.io/poinotalk/model/v1.2.0/',
  mlModelOptions: {
    slidingWinLen:   3,
    f0ModelBaseFreq: 400,
    f0NormMax:       1000
  }
}
