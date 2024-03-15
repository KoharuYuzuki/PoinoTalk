import { $ } from 'bun'

const urls = [
  'https://gitpkg.now.sh/KoharuYuzuki/dummy-modules/aws-sdk?main',
  'https://gitpkg.now.sh/KoharuYuzuki/dummy-modules/child_process?main',
  'https://gitpkg.now.sh/KoharuYuzuki/dummy-modules/mock-aws-s3?main',
  'https://gitpkg.now.sh/KoharuYuzuki/dummy-modules/module?main',
  'https://gitpkg.now.sh/KoharuYuzuki/dummy-modules/nock?main'
]

for (let i = 0; i < urls.length; i++) {
  await $`bun add "${urls[i]}"`
}
